import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface ApiStackProps extends cdk.StackProps {
  vpcId: string;
  database: rds.DatabaseInstance;
  dbSecurityGroup: ec2.SecurityGroup;
  certificateArn: string;
  hostedZoneId: string;
  domainName: string;
}

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Import existing VPC
    const vpc = ec2.Vpc.fromLookup(this, 'ExistingVPC', {
      vpcId: props.vpcId,
    });

    // Import certificate
    const certificate = acm.Certificate.fromCertificateArn(
      this,
      'Certificate',
      props.certificateArn
    );

    // Import hosted zone
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      'HostedZone',
      {
        hostedZoneId: props.hostedZoneId,
        zoneName: props.domainName.split('.').slice(-2).join('.'),
      }
    );

    // Reference existing ECR Repository for API
    const apiRepository = ecr.Repository.fromRepositoryName(
      this,
      'ApiRepository',
      'blizzint-api'
    );

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'ApiCluster', {
      vpc,
      clusterName: 'blizzint-api-cluster',
      containerInsights: true,
    });

    // Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'ApiTaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.X86_64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    // Reference JWT secret - execution role permissions will be auto-granted when used in container
    const jwtSecret = secretsmanager.Secret.fromSecretCompleteArn(
      this,
      'JWTSecretRef',
      'arn:aws:secretsmanager:us-east-1:620743043986:secret:/blizzint/api/jwt-secret-z2y9Jp'
    );

    // Grant access to SSM parameters
    const ssmPolicy = new cdk.aws_iam.PolicyStatement({
      actions: ['ssm:GetParameter', 'ssm:GetParameters'],
      resources: [
        `arn:aws:ssm:${this.region}:${this.account}:parameter/blizzint/*`,
      ],
    });
    taskDefinition.taskRole.addToPrincipalPolicy(ssmPolicy);

    // CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'ApiLogGroup', {
      logGroupName: '/ecs/blizzint-api',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Container Definition
    const container = taskDefinition.addContainer('ApiContainer', {
      containerName: 'blizzint-api',
      image: ecs.ContainerImage.fromEcrRepository(apiRepository, 'latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'api',
        logGroup,
      }),
      environment: {
        NODE_ENV: 'production',
        PORT: '3001',
        DB_NAME: 'blizzint',
      },
      secrets: {
        DB_HOST: ecs.Secret.fromSsmParameter(
          ssm.StringParameter.fromStringParameterName(
            this,
            'DBEndpoint',
            '/blizzint/db/endpoint'
          )
        ),
        DB_PORT: ecs.Secret.fromSsmParameter(
          ssm.StringParameter.fromStringParameterName(
            this,
            'DBPort',
            '/blizzint/db/port'
          )
        ),
        DB_USER: ecs.Secret.fromSecretsManager(props.database.secret!, 'username'),
        DB_PASSWORD: ecs.Secret.fromSecretsManager(props.database.secret!, 'password'),
        JWT_SECRET: ecs.Secret.fromSecretsManager(jwtSecret),
      },
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:3001/health || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    container.addPortMappings({
      containerPort: 3001,
      protocol: ecs.Protocol.TCP,
    });

    // Security group for ECS service
    const ecsSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      'ECSSecurityGroup',
      cdk.Fn.importValue('BlizzIntECSSecurityGroupId')
    );

    // ALB Security Group
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for BlizzInt API ALB',
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    // Allow ALB to reach ECS tasks
    ecsSecurityGroup.connections.allowFrom(
      albSecurityGroup,
      ec2.Port.tcp(3001),
      'Allow ALB to reach ECS tasks'
    );

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ApiALB', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // HTTPS Listener
    const httpsListener = alb.addListener('HttpsListener', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [certificate],
      defaultAction: elbv2.ListenerAction.fixedResponse(404, {
        contentType: 'text/plain',
        messageBody: 'Not Found',
      }),
    });

    // HTTP Listener (redirect to HTTPS)
    alb.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: 'HTTPS',
        port: '443',
        permanent: true,
      }),
    });

    // Fargate Service
    const service = new ecs.FargateService(this, 'ApiService', {
      cluster,
      taskDefinition,
      desiredCount: 1,
      securityGroups: [ecsSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      assignPublicIp: false,
      healthCheckGracePeriod: cdk.Duration.seconds(60),
    });

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'ApiTargetGroup', {
      vpc,
      port: 3001,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    // Attach service to target group
    service.attachToApplicationTargetGroup(targetGroup);

    // Add target group to HTTPS listener
    httpsListener.addTargetGroups('ApiTargetGroup', {
      targetGroups: [targetGroup],
    });

    // Route53 A Record
    new route53.ARecord(this, 'ApiARecord', {
      zone: hostedZone,
      recordName: props.domainName,
      target: route53.RecordTarget.fromAlias(
        new route53targets.LoadBalancerTarget(alb)
      ),
    });

    // Auto Scaling
    const scaling = service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 4,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiRepositoryUri', {
      value: apiRepository.repositoryUri,
      description: 'ECR repository URI for API',
      exportName: 'BlizzIntApiRepositoryUri',
    });

    new cdk.CfnOutput(this, 'ApiRepositoryName', {
      value: apiRepository.repositoryName,
      description: 'ECR repository name for API',
      exportName: 'BlizzIntApiRepositoryName',
    });

    new cdk.CfnOutput(this, 'ApiLoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'DNS name of the API load balancer',
    });

    new cdk.CfnOutput(this, 'ApiDomainName', {
      value: `https://${props.domainName}`,
      description: 'API domain name',
    });

    new cdk.CfnOutput(this, 'EcsClusterName', {
      value: cluster.clusterName,
      description: 'ECS cluster name',
      exportName: 'BlizzIntEcsClusterName',
    });

    new cdk.CfnOutput(this, 'EcsServiceName', {
      value: service.serviceName,
      description: 'ECS service name',
      exportName: 'BlizzIntEcsServiceName',
    });
  }
}

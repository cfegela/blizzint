import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

interface DatabaseStackProps extends cdk.StackProps {
  vpcId: string;
}

export class DatabaseStack extends cdk.Stack {
  public readonly database: rds.DatabaseInstance;
  public readonly dbSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // Import existing VPC
    const vpc = ec2.Vpc.fromLookup(this, 'ExistingVPC', {
      vpcId: props.vpcId,
    });

    // Security group for RDS
    this.dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc,
      description: 'Security group for BlizzInt RDS PostgreSQL database',
      allowAllOutbound: true,
    });

    // Security group for ECS tasks to access DB
    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'ECSSecurityGroup', {
      vpc,
      description: 'Security group for ECS tasks accessing the database',
      allowAllOutbound: true,
    });

    // Allow ECS tasks to connect to RDS
    this.dbSecurityGroup.addIngressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow ECS tasks to connect to PostgreSQL'
    );

    // Create DB subnet group using private subnets
    const subnetGroup = new rds.SubnetGroup(this, 'DBSubnetGroup', {
      vpc,
      description: 'Subnet group for BlizzInt RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // RDS PostgreSQL instance
    // Note: PostGIS extension will be enabled by the application on startup
    this.database = new rds.DatabaseInstance(this, 'PostgresDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      subnetGroup,
      securityGroups: [this.dbSecurityGroup],
      databaseName: 'blizzint',
      credentials: rds.Credentials.fromGeneratedSecret('blizzint_admin', {
        secretName: '/blizzint/db/credentials',
      }),
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageType: rds.StorageType.GP3,
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
      deletionProtection: false,
      enablePerformanceInsights: true,
      cloudwatchLogsExports: ['postgresql', 'upgrade'],
      publiclyAccessible: false,
    });

    // Store database endpoint in SSM Parameter Store
    new ssm.StringParameter(this, 'DBEndpointParameter', {
      parameterName: '/blizzint/db/endpoint',
      stringValue: this.database.dbInstanceEndpointAddress,
      description: 'BlizzInt RDS database endpoint',
    });

    new ssm.StringParameter(this, 'DBPortParameter', {
      parameterName: '/blizzint/db/port',
      stringValue: this.database.dbInstanceEndpointPort,
      description: 'BlizzInt RDS database port',
    });

    new ssm.StringParameter(this, 'DBNameParameter', {
      parameterName: '/blizzint/db/name',
      stringValue: 'blizzint',
      description: 'BlizzInt database name',
    });

    // Export security group ID for ECS tasks
    new ssm.StringParameter(this, 'ECSSecurityGroupParameter', {
      parameterName: '/blizzint/ecs/security-group-id',
      stringValue: ecsSecurityGroup.securityGroupId,
      description: 'Security group ID for ECS tasks',
    });

    // Outputs
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.dbInstanceEndpointAddress,
      description: 'RDS database endpoint',
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: this.database.secret?.secretArn || 'N/A',
      description: 'ARN of the database credentials secret',
    });

    new cdk.CfnOutput(this, 'ECSSecurityGroupId', {
      value: ecsSecurityGroup.securityGroupId,
      description: 'Security group ID for ECS tasks',
      exportName: 'BlizzIntECSSecurityGroupId',
    });
  }
}

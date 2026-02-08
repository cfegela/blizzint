# BlizzInt AWS Infrastructure

This directory contains AWS CDK infrastructure code for the BlizzInt application.

## Architecture

- **API**: Hosted in ECS Fargate with Application Load Balancer at `api.blizzint.app`
- **Frontend**: React app built and deployed to S3, served via CloudFront at `demo.blizzint.app`
- **Database**: RDS PostgreSQL 16 with PostGIS extension
- **Secrets**: SSM Parameter Store for configuration

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Node.js 20+** and npm
3. **AWS CDK CLI**: `npm install -g aws-cdk`
4. **Docker** for building container images

## Initial Setup

### 1. Bootstrap CDK (First time only)

```bash
cd infrastructure
npm install
cdk bootstrap aws://620743043986/us-east-1
```

### 2. Create Required SSM Parameters

Before deploying, create the JWT secret in Parameter Store:

```bash
aws ssm put-parameter \
  --name /blizzint/api/jwt-secret \
  --value "your-secure-jwt-secret-here" \
  --type SecureString \
  --region us-east-1
```

### 3. Deploy Infrastructure

Deploy all stacks:

```bash
cdk deploy --all
```

Or deploy individually:

```bash
cdk deploy BlizzIntDatabaseStack
cdk deploy BlizzIntApiStack
cdk deploy BlizzIntFrontendStack
```

### 4. Enable PostGIS Extension

The PostGIS extension will be automatically enabled when the API container starts up for the first time.

Alternatively, you can enable it manually by connecting to the database:

```bash
# Get database credentials from Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id /blizzint/db/credentials \
  --region us-east-1 --query SecretString --output text

# Connect to the database and run:
# CREATE EXTENSION IF NOT EXISTS postgis;
```

### 5. Build and Push Docker Images

#### API Image

```bash
# Get ECR repository URI
ECR_URI=$(aws cloudformation describe-stacks \
  --stack-name BlizzIntApiStack \
  --query "Stacks[0].Outputs[?OutputKey=='ApiRepositoryUri'].OutputValue" \
  --output text \
  --region us-east-1)

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $ECR_URI

# Build and push
cd ../server
docker build -f Dockerfile.prod -t $ECR_URI:latest .
docker push $ECR_URI:latest
```

#### Force ECS Service Update

After pushing the first image:

```bash
# Get service name
SERVICE_NAME=$(aws ecs list-services \
  --cluster blizzint-api-cluster \
  --region us-east-1 \
  --query 'serviceArns[0]' \
  --output text | awk -F'/' '{print $NF}')

# Force new deployment
aws ecs update-service \
  --cluster blizzint-api-cluster \
  --service $SERVICE_NAME \
  --force-new-deployment \
  --region us-east-1
```

### 6. Deploy Frontend

```bash
# Get bucket name and CloudFront distribution ID
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name BlizzIntFrontendStack \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
  --output text \
  --region us-east-1)

DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name BlizzIntFrontendStack \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
  --output text \
  --region us-east-1)

# Build frontend
cd ../client
REACT_APP_API_URL=https://api.blizzint.app \
REACT_APP_MAPBOX_TOKEN=your-mapbox-token \
npm install && npm run build

# Deploy to S3
aws s3 sync build/ s3://$BUCKET_NAME/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

## GitHub Actions Deployment

### Setup

1. **Create OIDC Provider in AWS** (one-time setup):

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

2. **Create IAM Role for GitHub Actions**:

First, update the trust policy with your GitHub repository:

```bash
# Create trust policy (save as trust-policy.json)
cat > trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::620743043986:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR-GITHUB-USERNAME/blizzint:*"
        }
      }
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name GitHubActionsBlizzIntRole \
  --assume-role-policy-document file://trust-policy.json

# Attach policies
aws iam attach-role-policy \
  --role-name GitHubActionsBlizzIntRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser

aws iam attach-role-policy \
  --role-name GitHubActionsBlizzIntRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonECS_FullAccess

aws iam attach-role-policy \
  --role-name GitHubActionsBlizzIntRole \
  --policy-arn arn:aws:iam::aws:policy/CloudFrontFullAccess

aws iam attach-role-policy \
  --role-name GitHubActionsBlizzIntRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

aws iam attach-role-policy \
  --role-name GitHubActionsBlizzIntRole \
  --policy-arn arn:aws:iam::aws:policy/CloudFormationReadOnlyAccess
```

3. **Add GitHub Secrets**:

Go to your GitHub repository settings → Secrets and variables → Actions, and add:
- `AWS_ROLE_ARN`: `arn:aws:iam::620743043986:role/GitHubActionsBlizzIntRole`
- `MAPBOX_TOKEN`: Your Mapbox access token

### Deployment

Deployments are automatically triggered on push to `main` branch:
- Changes to `server/**` trigger API deployment
- Changes to `client/**` trigger frontend deployment

Manual deployment via GitHub Actions UI is also supported (workflow_dispatch).

## Stack Outputs

After deployment, get important values:

```bash
# All stack outputs
aws cloudformation describe-stacks \
  --stack-name BlizzIntDatabaseStack \
  --query "Stacks[0].Outputs" \
  --region us-east-1

aws cloudformation describe-stacks \
  --stack-name BlizzIntApiStack \
  --query "Stacks[0].Outputs" \
  --region us-east-1

aws cloudformation describe-stacks \
  --stack-name BlizzIntFrontendStack \
  --query "Stacks[0].Outputs" \
  --region us-east-1
```

## Monitoring

- **ECS Logs**: CloudWatch Logs group `/ecs/blizzint-api`
- **Database**: RDS Performance Insights enabled
- **Container Insights**: Enabled on ECS cluster

View logs:
```bash
aws logs tail /ecs/blizzint-api --follow --region us-east-1
```

## Cost Optimization

Current configuration:
- **RDS**: t3.micro instance with 20GB GP3 storage (max 100GB)
- **ECS**: 256 CPU units, 512MB RAM
- **Auto-scaling**: 1-4 tasks based on CPU utilization (70% target)
- **CloudFront**: Price Class 100 (US, Canada, Europe)
- **S3**: Standard storage with bucket retention

Estimated monthly cost: ~$30-50 depending on usage.

## Troubleshooting

### API not starting

Check ECS logs:
```bash
aws logs tail /ecs/blizzint-api --follow --region us-east-1
```

Common issues:
- Missing SSM parameter `/blizzint/api/jwt-secret`
- Database connection issues (check security groups)
- Migration failures (check database permissions)

### Database connection issues

Verify security group rules:
```bash
# Get ECS security group
ECS_SG=$(aws ssm get-parameter \
  --name /blizzint/ecs/security-group-id \
  --region us-east-1 \
  --query 'Parameter.Value' \
  --output text)

# Check security group rules
aws ec2 describe-security-groups \
  --group-ids $ECS_SG \
  --region us-east-1
```

Check database endpoint:
```bash
aws ssm get-parameter --name /blizzint/db/endpoint --region us-east-1
```

### CloudFront not serving updated content

Invalidate cache:
```bash
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name BlizzIntFrontendStack \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
  --output text \
  --region us-east-1)

aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

### ECS Task failing to start

Check task definition and events:
```bash
SERVICE_NAME=$(aws ecs list-services \
  --cluster blizzint-api-cluster \
  --region us-east-1 \
  --query 'serviceArns[0]' \
  --output text | awk -F'/' '{print $NF}')

aws ecs describe-services \
  --cluster blizzint-api-cluster \
  --services $SERVICE_NAME \
  --region us-east-1
```

## Cleanup

To destroy all resources:

```bash
# Delete S3 bucket contents first
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name BlizzIntFrontendStack \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
  --output text \
  --region us-east-1)

aws s3 rm s3://$BUCKET_NAME --recursive

# Empty ECR repository
aws ecr delete-repository \
  --repository-name blizzint-api \
  --force \
  --region us-east-1

# Destroy stacks (order matters due to dependencies)
cd infrastructure
cdk destroy BlizzIntFrontendStack
cdk destroy BlizzIntApiStack
cdk destroy BlizzIntDatabaseStack
```

Note: The database stack will create a final snapshot before deletion (due to `removalPolicy: SNAPSHOT`).

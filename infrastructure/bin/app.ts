#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/database-stack';
import { ApiStack } from '../lib/api-stack';
import { FrontendStack } from '../lib/frontend-stack';

const app = new cdk.App();

// Configuration - these can be passed as context variables
const config = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1', // Required for CloudFront with ACM
  },
  vpcId: 'vpc-031afd59d544cdfd6',
  certificateArn: 'arn:aws:acm:us-east-1:620743043986:certificate/4adfe4e2-124b-4be8-a202-07a46328fd4e',
  hostedZoneId: 'Z10135082LBR0Q1K4ELD9',
  domainName: 'blizzint.app',
  apiDomain: 'api.blizzint.app',
  frontendDomain: 'demo.blizzint.app',
};

// Database Stack
const databaseStack = new DatabaseStack(app, 'BlizzIntDatabaseStack', {
  env: config.env,
  vpcId: config.vpcId,
});

// API Stack
const apiStack = new ApiStack(app, 'BlizzIntApiStack', {
  env: config.env,
  vpcId: config.vpcId,
  database: databaseStack.database,
  dbSecurityGroup: databaseStack.dbSecurityGroup,
  certificateArn: config.certificateArn,
  hostedZoneId: config.hostedZoneId,
  domainName: config.apiDomain,
});

apiStack.addDependency(databaseStack);

// Frontend Stack
const frontendStack = new FrontendStack(app, 'BlizzIntFrontendStack', {
  env: config.env,
  certificateArn: config.certificateArn,
  hostedZoneId: config.hostedZoneId,
  domainName: config.frontendDomain,
  apiDomain: config.apiDomain,
});

app.synth();

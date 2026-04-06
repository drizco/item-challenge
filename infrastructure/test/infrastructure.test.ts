import * as cdk from 'aws-cdk-lib/core';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { InfrastructureStack } from '../lib/infrastructure-stack';

let template: Template;

beforeAll(() => {
  const app = new cdk.App();
  const stack = new InfrastructureStack(app, 'TestStack');
  template = Template.fromStack(stack);
});

describe('DynamoDB', () => {
  test('creates ExamItems table with correct keys', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'ExamItems',
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    });
  });

  test('creates SubjectIndex GSI', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      GlobalSecondaryIndexes: Match.arrayWith([
        Match.objectLike({
          IndexName: 'SubjectIndex',
          KeySchema: [
            { AttributeName: 'subjectKey', KeyType: 'HASH' },
            { AttributeName: 'subjectSortKey', KeyType: 'RANGE' },
          ],
        }),
      ]),
    });
  });

  test('creates StatusIndex GSI', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      GlobalSecondaryIndexes: Match.arrayWith([
        Match.objectLike({
          IndexName: 'StatusIndex',
          KeySchema: [
            { AttributeName: 'statusKey', KeyType: 'HASH' },
            { AttributeName: 'statusSortKey', KeyType: 'RANGE' },
          ],
        }),
      ]),
    });
  });
});

describe('Lambda', () => {
  test('creates three Lambda functions', () => {
    template.resourceCountIs('AWS::Lambda::Function', 3);
  });

  test('Lambda functions use Node.js 22 runtime', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs22.x',
    });
  });

  test('Lambda functions have DynamoDB environment variables', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: Match.objectLike({
          USE_DYNAMODB: 'true',
        }),
      },
    });
  });
});

describe('API Gateway', () => {
  test('creates a REST API', () => {
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      Name: 'ExamItems',
    });
  });

  test('creates POST, GET, and PUT methods', () => {
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'POST',
    });
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'GET',
    });
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'PUT',
    });
  });
});

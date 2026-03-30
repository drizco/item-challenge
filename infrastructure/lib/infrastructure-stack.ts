import * as cdk from 'aws-cdk-lib/core';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export class InfrastructureStack extends cdk.Stack {
  examItemsTable: dynamodb.Table;
  createItemHandler: lambda.Function;
  getItemHandler: lambda.Function;
  updateItemHandler: lambda.Function;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.initializeTable();

    this.initializeFunctions();

    this.initializeApi();
  }

  initializeTable() {
    this.examItemsTable = new dynamodb.Table(this, 'ExamItems', {
      tableName: 'ExamItems',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    this.examItemsTable.addGlobalSecondaryIndex({
      indexName: 'SubjectIndex',
      partitionKey: { name: 'subjectKey', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'subjectSortKey', type: dynamodb.AttributeType.STRING },
    });

    this.examItemsTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'statusKey', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'statusSortKey', type: dynamodb.AttributeType.NUMBER },
    });
  }

  initializeFunctions() {
    this.createItemHandler = new lambda.Function(this, 'CreateItemHandler', {
      functionName: 'CreateItemHandler',
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'handlers/items.createItemHandler',
      code: lambda.Code.fromAsset('../dist'),
      environment: {
        DYNAMODB_TABLE_NAME: this.examItemsTable.tableName,
        USE_DYNAMODB: 'true',
      },
    });

    this.getItemHandler = new lambda.Function(this, 'GetItemHandler', {
      functionName: 'GetItemHandler',
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'handlers/items.getItemHandler',
      code: lambda.Code.fromAsset('../dist'),
      environment: {
        DYNAMODB_TABLE_NAME: this.examItemsTable.tableName,
        USE_DYNAMODB: 'true',
      },
    });

    this.updateItemHandler = new lambda.Function(this, 'UpdateItemHandler', {
      functionName: 'UpdateItemHandler',
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'handlers/items.updateItemHandler',
      code: lambda.Code.fromAsset('../dist'),
      environment: {
        DYNAMODB_TABLE_NAME: this.examItemsTable.tableName,
        USE_DYNAMODB: 'true',
      },
    });

    this.examItemsTable.grantReadWriteData(this.createItemHandler);

    this.examItemsTable.grantReadData(this.getItemHandler);

    this.examItemsTable.grantReadWriteData(this.updateItemHandler);
  }

  initializeApi() {
    const api = new apigateway.RestApi(this, 'ExamItemsApi', {
      restApiName: 'ExamItems',
    });

    const items = api.root.addResource('api').addResource('items');

    items.addMethod(
      'POST',
      new apigateway.LambdaIntegration(this.createItemHandler)
    );

    const item = items.addResource('{id}');

    item.addMethod(
      'GET',
      new apigateway.LambdaIntegration(this.getItemHandler)
    );

    item.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(this.updateItemHandler)
    );
  }
}

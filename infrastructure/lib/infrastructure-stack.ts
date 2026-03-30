import * as cdk from 'aws-cdk-lib/core';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class InfrastructureStack extends cdk.Stack {
  examItemsTable: dynamodb.Table;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.initializeTable();

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
  }
}

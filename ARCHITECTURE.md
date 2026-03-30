# Architecture Documentation

## Data model

All exam items and their version history are stored in a single table with a composite primary key (partition key + sort key). This keeps an item with its versions in the same partition, so fetching version history is a single query. Updates use a transaction to ensure the version snapshot and the latest state are written atomically

Table: `ExamItems`

- `PK`
  - String
  - `ITEM#<id>`
  - partition key grouping an item and all its versions

- `SK`
  - String
  - `LATEST` for current state, `v1`, `v2`, etc for version history

- `subject`
  - String
  - "AP Biology"

- `itemType`
  - String
  - "multiple-choice", "free-response", "essay"

- `difficulty`
  - Number
  - 1-5

- `securityLevel`
  - String
  - "standard", "secure", "highly-secure"

- `content`
  - Map
  - question, options, correctAnswer, explanation

- `metadata`
  - Map
  - author, created, lastModified, version, status, tags

- `subjectKey`
  - String
  - `SUBJECT#<subject>`

- `subjectSortKey`
  - String
  - `STATUS#<status>#<lastModified>`

- `statusKey`
  - String
  - `STATUS#<status>`

- `statusSortKey`
  - Number
  - lastModified timestamp

### Global secondary indexes

- `SubjectIndex`
  - Partition Key: `subjectKey`
  - Sort Key: `subjectSortKey`
  - list items by subject, sorted by status and lastModified

- `StatusIndex`
  - Partition Key: `statusKey`
  - Sort Key: `statusSortKey`
  - list items by status, sorted by lastModified

GSI attributes are only written on `LATEST` records to prevent older versions showing up in query results

### Operations

- Create item
  - TransactWrite: PutItem SK=`LATEST` + PutItem SK=`v1`

- Get item by ID
  - GetItem PK=`ITEM#<id>`, SK=`LATEST`

- Update item
  - TransactWrite: copy `LATEST` to SK=`v<N>`, overwrite `LATEST` with new state

- List by subject
  - Query `SubjectIndex` where subjectKey=`SUBJECT#<subject>`

- List by status
  - Query `StatusIndex` where statusKey=`STATUS#<status>`

- Version history
  - Query PK=`ITEM#<id>`, all SK values sorted ascending

## Infrastructure choices

I wasn't really able to dig into the infrastructure as code portion unfortunately. But it's pretty clear from the instructions that the repo is designed around lambdas, api gateway, and dynamodb. The rest api would be deployed with individual lambda functions so the route handlers can scale independently. The storage instance would use the operations described above to store and fetch exam items from dynamodb

## Scalability

- Dynamodb scales horizontally by partition. Each item's data and all of its versions lives in a single partition keyed by `ITEM#<id>`, so reads and writes for a single item are fast regardless of table size
- GSIs enable efficient list queries by status or subject
- Deploying individual lambda functions per endpoint, so a spike in reads won't affect writes

## Security

- Least-privilege access
  - each lambda function's role only has permissions for the specific operations it needs (GetItem, PutItem, Query) for the ExamItems table
- Input validation
  - all request payloads are validated with zod schemas before reaching the storage layer
- Lambdas would check user's JWT in each request for authorization and access
- Dynamodb encrypts data by default

## Trade-offs

### What I prioritized

- Thorough input validation with zod (including conditional validation for multiple-choice items)
- Individual request handler functions designed for lambda deployment
- TDD for writing request handlers
- A dynamodb schema that supports all operations efficiently

### What I'd add with more time

- Complete the remaining endpoints
- Implement the dynamodb storage layer to match the schema above
- Infrastructure as code
- Integration tests calling the server endpoints
- Validate item type transitions on update (changing to multiple-choice requires options in the merged state)
- Logging middleware

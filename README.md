# Replicache Chat (via Next.js/Cosmos DB)

This is a very simple chat sample built with Next.js and Cosmos DB.

## Code Layout

- `index.js` - A very simple UI that talks to the Replicache client
- `pages/api/init.js` - Initializes the Cosmos DB schema. In a real application you'd want to migrate versions. See notes inline.
- `pages/api/[push, pull].js` - Endpoints for Replicache's push and pull operations. These just delegate to stored procedures in Cosmos.
- `cosmos/proc/[push, pull].js` - Implement the push and pull operations.
- `cosmos/shared/*` - Utilities supporting stored procedures.

## Big Picture

Replicache requires multikey read/write transactions for its push handler. Cosmos DB offers this feature via "stored procedures", which are written in JavaScript and uploaded to the DB.

This sample uses Cosmos DB stored procedures to implement both the push and pull handler for consistency. There are also performance benefits to this approach since it makes the communication protocol between app server and db server a lot less chatty.

See the `cosmos` directory for the JavaScript implementation of these procedures. The `pages/api/{push, pull}` endpoints become thin wrappers that just delegate to the corresponding procedures in the database.

## Considerations

- Cosmos DB has tunable consistency. For correct operation, Replicache requires the consistency level to be [Consistent Prefix](https://docs.microsoft.com/en-us/azure/cosmos-db/consistency-levels#consistent-prefix-consistency) or better.
- Cosmos DB only offers consistency guarantees within partitions. This sample puts all data in a single partition. Shoud you need multiple partitions, all data in a single Replicache instance must come from a single Cosmos DB partition.
- This sample implements Replicache's `cookie` feature by using a global counter. This is effectively a global lock that limits write throughput. A better implementation would be to use a finer-grained lock. There are also other options for implementing the cookie that are additional effort. Talk to our team if you'd like help working through this.

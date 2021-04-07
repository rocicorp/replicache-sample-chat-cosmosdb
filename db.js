import {CosmosClient} from "@azure/cosmos";

const endpoint = mustEnv("REPLICHAT_COSMOSDB_ENDPOINT");
const key = mustEnv("REPLICHAT_COSMOSDB_KEY");
const databaseID = mustEnv("REPLICHAT_COSMOSDB_DATABASE_ID");
const containerID = mustEnv("REPLICHAT_COSMOSDB_CONTAINER_ID");
const partitionKey = "/partitionKey";

export async function initDB() {
  const client = new CosmosClient({ endpoint, key });
  await client.databases.createIfNotExists({
    id: databaseID
  });
  await client.database(databaseID).containers.createIfNotExists({
    id: containerID,
    partitionKey
  });
}

function mustEnv(name) {
  const r = process.env[name];
  if (!r) {
    throw new Error(`Required environment variable ${name} not found`);
  }
  return r;
}

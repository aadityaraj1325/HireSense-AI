const { MongoClient } = require("mongodb");
const env = require("./src/config/env");

async function main() {
  let client;

  try {
    client = new MongoClient(env.mongoUri);
    await client.connect();
    console.log("MongoDB connected successfully!");

    const db = client.db();
    console.log("Database:", db.databaseName);
  } catch (error) {
    console.error("Connection failed:", error.message);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

main();
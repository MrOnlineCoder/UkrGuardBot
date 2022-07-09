import pg from "pg";
import logger from "./logger";

let client: pg.Client;

export async function initDb() {
  client = new pg.Client({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "ukrbot",
    password: process.env.DB_PASSWORD || "postgres",
    port: +(process.env.DB_PORT || 5432),
  });

  await client.connect();

  logger.log(`DB`, `Connected to database '${client.database}' at ${client.host}`);
}

export function getDbClient() {
  return client; 
}

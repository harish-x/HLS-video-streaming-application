import pg from "pg";
import config from "./config";

const pool = new pg.Pool({
  user: config.DB_USER,
  host: config.DB_HOST,
  database: config.DB_NAME,
  password: config.DB_PASSWORD,
  port: 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("connect", () => {
  console.log("Database connected successfully");
});

pool.on("error", (err) => {
  console.error("An idle client has experienced an error", err.stack);
});

pool.query("CREATE TABLE IF NOT EXISTS Videos (id SERIAL PRIMARY KEY, url TEXT, createdAt TIMESTAMP DEFAULT NOW())");

export default pool;

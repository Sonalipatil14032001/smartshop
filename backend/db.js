const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test connection on startup
pool.query("SELECT NOW()")
  .then(() => console.log("[✓] Connected to PostgreSQL"))
  .catch((err) => console.error("[✗] Database connection failed:", err.message));

module.exports = pool;
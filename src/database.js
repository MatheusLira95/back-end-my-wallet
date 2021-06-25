import pg from "pg";

const { Pool } = pg;

const connection = new Pool({
  host: "localhost",
  port: 5432,
  password: "123456",
  database: "project_mywallet",
  user: "postgres",
});

export default connection;

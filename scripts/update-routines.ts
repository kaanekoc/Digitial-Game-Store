import "dotenv/config";
import { readFile } from "node:fs/promises";
import { pool } from "../src/lib/db";
import { statements } from "./setup-db";

async function main() {
  const name = process.env.DB_NAME ?? "digital_game_store";
  if (!/^[a-zA-Z0-9_]+$/.test(name)) throw new Error("Gecersiz DB_NAME");
  const source = (await readFile("database/routines.sql", "utf8")).replaceAll(
    "digital_game_store",
    name,
  );
  const connection = await pool.getConnection();
  try {
    for (const sql of statements(source)) await connection.query(sql);
    console.log(
      "3 trigger ve 3 stored procedure guncellendi; tablo verileri korundu.",
    );
  } finally {
    connection.release();
    await pool.end();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

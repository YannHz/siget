/* Ejecuta schema.sql usando las credenciales de administrador de MySQL.
 * Ejemplo (PowerShell):
 *   $env:DB_HOST='localhost'; $env:DB_USER='root'; $env:DB_PASSWORD='...'; node scripts/bootstrap-database.js
 */
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

async function main() {
  const sql = fs.readFileSync(path.resolve(__dirname, "../../schema.sql"), "utf8");
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  });
  await connection.query(sql);
  await connection.end();
  console.log("Base siget creada con usuarios locales admin/admin y alumno/admin.");
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });

require("dotenv").config();
const app = require("./app");
const PORT = process.env.PORT || 3000;

if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
  console.error("FATAL: Variables de base de datos (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME) no están definidas");
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

const crypto = require("crypto");
const db = require("../config/db");

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
exports.crearSesion = async (usuario) => {
  await db.promise().query("DELETE FROM sesiones WHERE expira_en <= NOW()");
  const id = crypto.randomBytes(32).toString("base64url");
  const expiraEn = new Date(Date.now() + SESSION_TTL_MS);
  await db.promise().query(
    "INSERT INTO sesiones (id, usuario_id, rol, usuario_codigo, expira_en) VALUES (?, ?, ?, ?, ?)",
    [id, usuario.id, usuario.role, usuario.usuario, expiraEn],
  );
  return id;
};

exports.obtenerSesion = async (id) => {
  if (!id) return null;
  await db.promise().query("DELETE FROM sesiones WHERE expira_en <= NOW()");
  const [rows] = await db.promise().query(
    "SELECT usuario_id, rol, usuario_codigo FROM sesiones WHERE id = ? AND expira_en > NOW()",
    [id],
  );
  if (!rows[0]) return null;
  return { id: rows[0].usuario_id, role: rows[0].rol, usuario: rows[0].usuario_codigo };
};

exports.cerrarSesion = async (id) => {
  if (id) await db.promise().query("DELETE FROM sesiones WHERE id = ?", [id]);
};

exports.cerrarTodasLasSesiones = async (usuarioId) => {
  await db.promise().query("DELETE FROM sesiones WHERE usuario_id = ?", [usuarioId]);
};
exports.SESSION_TTL_MS = SESSION_TTL_MS;

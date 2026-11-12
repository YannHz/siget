const { loginService } = require("../services/login.service");
const sessionService = require("../services/session.service");

exports.login = async (req, res) => {
  const { usuario, password } = req.body;

  try {
    const result = await loginService(usuario, password);

    const sessionId = await sessionService.crearSesion({
      id: result.user.id,
      role: result.role,
      usuario,
    });

    res.cookie("siase_session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionService.SESSION_TTL_MS,
    });

    return res.json(result);

  } catch (error) {
    if (error.message === "Faltan credenciales") {
      return res.status(400).json({ success: false, error: error.message });
    }
    if (error.message === "Credenciales inválidas o usuario inactivo") {
      return res.status(401).json({ success: false, error: error.message });
    }
    console.error("Error de autenticación:", error.message);
    return res.status(500).json({ success: false, error: "Error interno del servidor" });
  }
};

exports.logout = async (req, res) => {
  await sessionService.cerrarSesion(req.cookies.siase_session);
  res.clearCookie("siase_session", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  });
  return res.json({ success: true, message: "Sesión cerrada correctamente" });
};

exports.session = async (req, res) => {
  const session = await sessionService.obtenerSesion(req.cookies.siase_session);
  if (!session) return res.status(401).json({ success: false, error: "Sesión no válida o expirada" });
  return res.json({ success: true, user: session });
};

exports.logoutAll = async (req, res) => {
  const session = await sessionService.obtenerSesion(req.cookies.siase_session);
  if (!session) return res.status(401).json({ success: false, error: "Sesión no válida o expirada" });
  await sessionService.cerrarTodasLasSesiones(session.id);
  res.clearCookie("siase_session", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" });
  return res.json({ success: true, message: "Sesiones cerradas" });
};

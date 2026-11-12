const sessionService = require("../services/session.service");

exports.requireAuth = async (req, res, next) => {
  const usuario = await sessionService.obtenerSesion(req.cookies.siase_session);

  if (!usuario) {
    return res.status(401).json({ success: false, error: "Sesión no válida o expirada" });
  }

  req.user = usuario;
  next();
};

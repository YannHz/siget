const reportes = require("../repositories/reportes.repository");

const soloVigilante = (req, res) => {
  if (req.user.role !== "vigilante") {
    res.status(403).json({ error: "Solo vigilantes pueden consultar reportes" });
    return false;
  }
  return true;
};

exports.movimientos = async (req, res) => {
  if (!soloVigilante(req, res)) return;
  res.json(await reportes.movimientos());
};
exports.dentro = async (req, res) => {
  if (!soloVigilante(req, res)) return;
  res.json(await reportes.dentro());
};
exports.pendientes = async (req, res) => {
  if (!soloVigilante(req, res)) return;
  res.json(await reportes.pendientes());
};
exports.historialAlumno = async (req, res) => {
  if (!soloVigilante(req, res)) return;
  res.json(await reportes.historialAlumno(req.params.alumnoId));
};
exports.resumen = async (req, res) => {
  if (!soloVigilante(req, res)) return;
  res.json(await reportes.resumen());
};

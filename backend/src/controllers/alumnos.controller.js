const alumnosService = require("../services/alumnos.service");

exports.obtenerAlumnoFormateadoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role === "alumno" && Number(id) !== Number(req.user.id)) {
      return res.status(403).json({ message: "No puedes consultar otro perfil" });
    }

    const alumno = await alumnosService.obtenerAlumnoFormateadoPorId(id);

    if (!alumno) {
      return res.status(404).json({
        message: "Alumno no encontrado",
      });
    }

    res.json(alumno);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};

exports.obtenerDatosAlumnoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role === "alumno" && Number(id) !== Number(req.user.id)) {
      return res.status(403).json({ message: "No puedes consultar otro perfil" });
    }

    const alumno = await alumnosService.obtenerDatosAlumnoPorId(id);

    if (!alumno) {
      return res.status(404).json({
        message: "Alumno no encontrado",
      });
    }

    res.json(alumno);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};

exports.getAlumnos = async (req, res) => {
  try {
    if (req.user.role !== "vigilante") return res.status(403).json({ mensaje: "Solo vigilantes pueden consultar alumnos" });
    const alumnos = await alumnosService.listarAlumnos();
    res.status(200).json(alumnos);
  } catch (error) {
    console.error("Error en getAlumnos:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

exports.obtenerAlumnoPorIdSenati = async (req, res) => {
  try {
    if (req.user.role !== "vigilante") return res.status(403).json({ message: "Solo vigilantes pueden buscar alumnos" });
    const { idsenati } = req.params;
    const alumno = await alumnosService.obtenerAlumnoPorIdSenati(idsenati);
    if (!alumno) {
      return res.status(404).json({ message: "Alumno no encontrado" });
    }
    res.json(alumno);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

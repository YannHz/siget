const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/registro_dispositivo.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

router.use(requireAuth);

router.get("/", ctrl.obtenerRegistros.bind(ctrl));
router.post("/", ctrl.registrarDispositivo.bind(ctrl));

router.get("/alumno/:alumno_id/dispositivos", ctrl.obtenerDispositivosPorAlumno.bind(ctrl));
router.get("/alumno/:alumno_id/solicitudes", ctrl.obtenerSolicitudesPorAlumno.bind(ctrl));
router.post("/solicitud-ingreso", ctrl.crearSolicitudIngreso.bind(ctrl));
router.post("/escanear-qr", ctrl.escanearQr.bind(ctrl));
router.put("/dispositivo/:id", ctrl.actualizarDispositivo.bind(ctrl));
router.delete("/dispositivo/:id", ctrl.eliminarDispositivo.bind(ctrl));

module.exports = router;

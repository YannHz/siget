const router = require("express").Router();
const controller = require("../controllers/reportes.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

router.use(requireAuth);
router.get("/movimientos", controller.movimientos);
router.get("/dentro", controller.dentro);
router.get("/pendientes", controller.pendientes);
router.get("/historial/:alumnoId", controller.historialAlumno);
router.get("/resumen", controller.resumen);

module.exports = router;

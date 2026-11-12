const express = require("express");
const router = express.Router();
const instructorController = require("../controllers/instructor.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

// Todas las rutas de instructor requieren autenticación
router.use(requireAuth);

router.get("/", instructorController.obtenerInstructores);

module.exports = router;

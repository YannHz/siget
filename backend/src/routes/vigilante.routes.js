const express = require("express");
const router = express.Router();
const vigilanteController = require("../controllers/vigilante.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

// Todas las rutas de vigilante requieren autenticación
router.use(requireAuth);

router.get(
  "/:vigilante_id",
  vigilanteController.getVigilantePorId.bind(vigilanteController),
);

module.exports = router;

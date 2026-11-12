const registroService = require("../services/registro_dispositivo.service");

class RegistroDispositivoController {
  async obtenerRegistros(req, res) {
    try {
      if (req.user.role !== "vigilante") {
        return res
          .status(403)
          .json({ error: "Solo vigilantes pueden consultar las solicitudes" });
      }
      const resultados = await registroService.obtenerRegistros();

      const resultadosOrdenados = resultados.map(
        ({
          id,
          alumno_id,
          idsenati,
          alumno,
          objeto,
          observacion,
          instructor,
          vigilante,
          estado,
          fecha_envio,
          fecha_entrada,
          fecha_salida,
        }) => ({
          id,
          alumno_id,
          idsenati,
          alumno,
          objeto,
          observacion,
          instructor,
          vigilante,
          estado,
          fecha_envio,
          fecha_entrada,
          fecha_salida,
        }),
      );

      return res.status(200).json(resultadosOrdenados);
    } catch (error) {
      console.error("Error en obtenerRegistros:", error);
      return res.status(500).json({
        error: "Error al obtener los registros",
      });
    }
  }

  async obtenerDispositivosPorAlumno(req, res) {
    try {
      const { alumno_id } = req.params;
      if (
        req.user.role === "alumno" &&
        Number(alumno_id) !== Number(req.user.id)
      ) {
        return res
          .status(403)
          .json({
            error: "No puedes consultar los dispositivos de otro alumno",
          });
      }
      const dispositivos =
        await registroService.obtenerDispositivosPorAlumno(alumno_id);
      return res.status(200).json(dispositivos);
    } catch (error) {
      console.error("Error en obtenerDispositivosPorAlumno:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  async obtenerSolicitudesPorAlumno(req, res) {
    try {
      const { alumno_id } = req.params;
      if (
        req.user.role === "alumno" &&
        Number(alumno_id) !== Number(req.user.id)
      ) {
        return res
          .status(403)
          .json({
            error: "No puedes consultar las solicitudes de otro alumno",
          });
      }
      const solicitudes =
        await registroService.obtenerSolicitudesPorAlumno(alumno_id);
      return res.status(200).json(solicitudes);
    } catch (error) {
      console.error("Error en obtenerSolicitudesPorAlumno:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  /*POST - Registrar dispositivo*/
  async registrarDispositivo(req, res) {
    try {
      if (req.user.role !== "alumno")
        return res
          .status(403)
          .json({ error: "Solo alumnos pueden registrar dispositivos" });
      const resultado = await registroService.registrarDispositivo({
        ...req.body,
        alumno_id: req.user.id,
        codigo_qr: require("crypto").randomUUID(),
      });
      return res.status(201).json({
        message: "Dispositivo registrado correctamente",
        data: resultado,
      });
    } catch (error) {
      console.error("Error en registrarDispositivo:", error);
      return res.status(500).json({
        error: "Error interno del servidor",
      });
    }
  }

  /*POST - Crear solicitud de ingreso */
  async crearSolicitudIngreso(req, res) {
    try {
      const { alumno_id, dispositivo_id } = req.body;
      if (
        req.user.role !== "alumno" ||
        Number(alumno_id) !== Number(req.user.id)
      ) {
        return res
          .status(403)
          .json({ error: "No puedes crear solicitudes para otro alumno" });
      }
      if (!alumno_id || !dispositivo_id) {
        return res.status(400).json({ error: "Faltan datos requeridos" });
      }
      const dispositivoPertenece =
        await registroService.dispositivoPerteneceAAlumno(
          dispositivo_id,
          alumno_id,
        );
      if (!dispositivoPertenece) {
        return res
          .status(403)
          .json({ error: "El dispositivo no pertenece al alumno autenticado" });
      }
      const tieneSolicitudActiva =
        await registroService.tieneSolicitudActiva(dispositivo_id);
      if (tieneSolicitudActiva) {
        return res
          .status(409)
          .json({ error: "Este dispositivo ya tiene una solicitud activa" });
      }
      const id = await registroService.crearSolicitudIngreso(
        alumno_id,
        dispositivo_id,
      );
      return res
        .status(201)
        .json({ message: "Solicitud creada", solicitud_id: id });
    } catch (error) {
      console.error("Error en crearSolicitudIngreso:", error);
      if (error.code === "ER_DUP_ENTRY") {
        return res
          .status(409)
          .json({ error: "Este dispositivo ya tiene una solicitud activa" });
      }
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  async actualizarDispositivo(req, res) {
    try {
      if (req.user.role !== "alumno")
        return res
          .status(403)
          .json({ error: "Solo alumnos pueden editar dispositivos" });
      const { id } = req.params;
      const { tipo, marca, modelo } = req.body;
      if (!tipo || !marca || !modelo)
        return res
          .status(400)
          .json({ error: "Tipo, marca y modelo son obligatorios" });
      if (await registroService.tieneSolicitudActiva(id))
        return res
          .status(409)
          .json({
            error: "No puedes editar un equipo con una solicitud activa",
          });
      const actualizado = await registroService.actualizarDispositivo(
        id,
        req.user.id,
        req.body,
      );
      if (!actualizado)
        return res.status(404).json({ error: "Dispositivo no encontrado" });
      return res.json({ message: "Dispositivo actualizado" });
    } catch (error) {
      return res
        .status(500)
        .json({ error: "No se pudo actualizar el dispositivo" });
    }
  }

  async eliminarDispositivo(req, res) {
    try {
      if (req.user.role !== "alumno")
        return res
          .status(403)
          .json({ error: "Solo alumnos pueden eliminar dispositivos" });
      const { id } = req.params;
      if (await registroService.tieneSolicitudActiva(id))
        return res
          .status(409)
          .json({
            error: "No puedes eliminar un equipo con una solicitud activa",
          });
      const eliminado = await registroService.desactivarDispositivo(
        id,
        req.user.id,
      );
      if (!eliminado)
        return res.status(404).json({ error: "Dispositivo no encontrado" });
      return res.json({ message: "Dispositivo eliminado" });
    } catch (error) {
      return res
        .status(500)
        .json({ error: "No se pudo eliminar el dispositivo" });
    }
  }

  async marcarEntrada(req, res) {
    try {
      if (req.user.role !== "vigilante")
        return res
          .status(403)
          .json({ error: "Solo vigilantes pueden registrar movimientos" });
      const { id } = req.params;
      const { guardia_id } = req.body;
      const success = await registroService.marcarEntrada(id, guardia_id);
      if (success) return res.status(200).json({ message: "Entrada marcada" });
      return res.status(404).json({ error: "Registro no encontrado" });
    } catch (error) {
      console.error("Error en marcarEntrada:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  async escanearQr(req, res) {
    try {
      if (req.user.role !== "vigilante")
        return res
          .status(403)
          .json({ error: "Solo vigilantes pueden escanear QR" });
      const { codigo_qr } = req.body;
      if (!codigo_qr)
        return res.status(400).json({ error: "Se requiere el código QR" });
      const resultado = await registroService.procesarEscaneoQr(
        codigo_qr,
        req.user.id,
      );
      return res.json(resultado);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async marcarSalida(req, res) {
    try {
      if (req.user.role !== "vigilante")
        return res
          .status(403)
          .json({ error: "Solo vigilantes pueden registrar movimientos" });
      const { id } = req.params;
      const success = await registroService.marcarSalida(id);
      if (success) return res.status(200).json({ message: "Salida marcada" });
      return res.status(404).json({ error: "Registro no encontrado" });
    } catch (error) {
      console.error("Error en marcarSalida:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }
}

module.exports = new RegistroDispositivoController();

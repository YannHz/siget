const pool = require("../config/db");
const vigilanteRepo = require("../repositories/vigilante.repository");

class VigilanteService {
  async procesarCambioEstado(registroId, nuevoEstado, vigilanteId) {
    const connection = await pool.promise().getConnection();

    try {
      await connection.beginTransaction();

      const registro = await vigilanteRepo.obtenerRegistroPorId(
        connection,
        registroId,
      );
      if (!registro) {
        throw new Error("Registro de dispositivo no encontrado");
      }

      await vigilanteRepo.actualizarEstadoRegistro(
        connection,
        registroId,
        nuevoEstado,
      );

      await connection.commit();
      return {
        exito: true,
        mensaje: "Estado del registro actualizado correctamente",
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async obtenerVigilantePorId(vigilanteId) {
    return await vigilanteRepo.getVigilantePorId(vigilanteId);
  }
}

module.exports = new VigilanteService();

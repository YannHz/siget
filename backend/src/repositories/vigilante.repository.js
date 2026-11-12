const pool = require("../config/db");

class VigilanteRepository {
    async obtenerRegistroPorId(connection, registroId) {
        const [rows] = await connection
            .promise()
            .query("SELECT alumno_id FROM registro_dispositivo WHERE id = ?", [
                registroId,
            ]);
        return rows[0];
    }

    async actualizarEstadoRegistro(connection, registroId, nuevoEstado) {
        await connection
            .promise()
            .query("UPDATE registro_dispositivo SET estado = ? WHERE id = ?", [
                nuevoEstado,
                registroId,
            ]);
    }

    async getVigilantePorId(vigilanteId) {
        const query = `
            SELECT id, guardia_id AS vigilante_id, nombre, apellido, turno
            FROM vigilante
            WHERE guardia_id = ?
        `;
        const [rows] = await pool.promise().query(query, [vigilanteId]);
        return rows;
    }

    async obtenerVigilantePorCredenciales(usuario) {
        const query = "SELECT id, guardia_id, nombre, apellido, turno, password_vigilante, estado FROM vigilante WHERE (guardia_id = ? OR usuario = ?) AND estado = 1";
        const [rows] = await pool.promise().query(query, [usuario, usuario]);
        return rows;
    }
}

module.exports = new VigilanteRepository();

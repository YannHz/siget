const db = require("../config/db");

class RegistroDispositivoRepository {
    async obtenerRegistros() {
        const query = `
            SELECT 
                r.id,
                r.alumno_id,
                a.idsenati,
                r.estado,
                r.fecha_envio,
                r.fecha_entrada,
                r.fecha_salida,
                r.observacion,
                CONCAT(a.nombres, ' ', a.apellidos) AS alumno,
                CONCAT(i.nombre, ' ', i.apellido) AS instructor,
                CONCAT(g.nombre, ' ', g.apellido) AS vigilante,
                CONCAT(d.tipo, ' ', d.marca, ' ', d.modelo) AS objeto
            FROM registro_dispositivo r
            JOIN datos_alumnos a
                ON r.alumno_id = a.id
            JOIN instructor i
                ON r.instructor_id = i.id
            JOIN vigilante g
                ON r.guardia_id = g.id
            JOIN dispositivos_x_alumno d
                ON r.objeto_id = d.id
            ORDER BY r.id DESC
        `;

        const [rows] = await db.promise().query(query);

        return rows;
    }

    async obtenerDispositivosPorAlumno(alumnoId) {
        // Los dispositivos creados antes del QR estático reciben uno una sola vez.
        await db.promise().query(
            "UPDATE dispositivos_x_alumno SET codigo_qr = UUID() WHERE alumno_id = ? AND (codigo_qr IS NULL OR codigo_qr = '')",
            [alumnoId],
        );
        const query = `
            SELECT
                d.id,
                d.tipo,
                d.marca,
                d.modelo,
                d.codigo_qr,
                d.numero_serie,
                d.descripcion,
                d.estado
            FROM dispositivos_x_alumno d
            WHERE d.alumno_id = ? AND d.estado = 1
            ORDER BY d.fecha_creacion DESC
        `;
        const [rows] = await db.promise().query(query, [alumnoId]);
        return rows;
    }

    async obtenerSolicitudesPorAlumno(alumnoId) {
        const query = `
            SELECT
                r.id,
                r.estado,
                r.fecha_envio,
                r.fecha_entrada,
                r.fecha_salida,
                r.observacion,
                d.tipo,
                d.marca,
                d.modelo,
                d.numero_serie,
                d.descripcion,
                r.objeto_id AS dispositivo_id
            FROM registro_dispositivo r
            JOIN dispositivos_x_alumno d ON r.objeto_id = d.id
            WHERE r.alumno_id = ?
            ORDER BY r.fecha_envio DESC
        `;
        const [rows] = await db.promise().query(query, [alumnoId]);
        return rows;
    }

    async crearDispositivo(data) {
        const query = `
            INSERT INTO dispositivos_x_alumno (
                alumno_id,
                tipo,
                marca,
                modelo,
                numero_serie,
                descripcion,
                codigo_qr,
                estado,
                usuario_creacion
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            data.alumno_id,
            data.tipo,
            data.marca,
            data.modelo,
            data.numero_serie,
            data.descripcion,
            data.codigo_qr,
            1,
            "sistema",
        ];

        const [result] = await db.promise().query(query, values);

        return result.insertId;
    }

    async crearRegistro(data) {
        const query = `
            INSERT INTO registro_dispositivo (
                estado,
                fecha_entrada,
                fecha_salida,
                alumno_id,
                instructor_id,
                guardia_id,
                objeto_id,
                usuario_creacion
            )
            VALUES (?, NULL, NULL, ?, ?, ?, ?, ?)
        `;

        const values = [
            1, // estado: activo/ingresado
            data.alumno_id,
            data.instructor_id,
            data.guardia_id,
            data.objeto_id,
            "sistema",
        ];

        const [result] = await db.promise().query(query, values);

        return result.insertId;
    }

    async crearSolicitudIngreso(alumnoId, dispositivoId) {
        // La tabla histórica exige instructor y guardia. El vigilante real se asigna al escanear.
        const query = `
            INSERT INTO registro_dispositivo (
                estado,
                fecha_entrada,
                fecha_salida,
                alumno_id,
                instructor_id,
                guardia_id,
                objeto_id,
                usuario_creacion
            )
            VALUES (0, NULL, NULL, ?, (SELECT id FROM instructor ORDER BY id LIMIT 1), 1, ?, 'alumno')
        `;
        const [result] = await db.promise().query(query, [alumnoId, dispositivoId]);
        return result.insertId;
    }

    async dispositivoPerteneceAAlumno(dispositivoId, alumnoId) {
        const [rows] = await db.promise().query(
            "SELECT 1 FROM dispositivos_x_alumno WHERE id = ? AND alumno_id = ? LIMIT 1",
            [dispositivoId, alumnoId],
        );
        return Boolean(rows[0]);
    }

    async tieneSolicitudActiva(dispositivoId) {
        const [rows] = await db.promise().query(
            "SELECT 1 FROM registro_dispositivo WHERE objeto_id = ? AND estado IN (0, 1) LIMIT 1",
            [dispositivoId],
        );
        return Boolean(rows[0]);
    }

    async actualizarDispositivo(dispositivoId, alumnoId, data) {
        const [result] = await db.promise().query(
            `UPDATE dispositivos_x_alumno
             SET tipo = ?, marca = ?, modelo = ?, numero_serie = ?, descripcion = ?
             WHERE id = ? AND alumno_id = ? AND estado = 1`,
            [data.tipo, data.marca, data.modelo, data.numero_serie || null, data.descripcion || null, dispositivoId, alumnoId],
        );
        return result.affectedRows > 0;
    }

    async desactivarDispositivo(dispositivoId, alumnoId) {
        const [result] = await db.promise().query(
            "UPDATE dispositivos_x_alumno SET estado = 0 WHERE id = ? AND alumno_id = ? AND estado = 1",
            [dispositivoId, alumnoId],
        );
        return result.affectedRows > 0;
    }
    async marcarEntrada(registroId, guardiaId) {
        const query = `
            UPDATE registro_dispositivo 
            SET estado = 1, fecha_entrada = NOW(), guardia_id = ?
            WHERE id = ?
        `;
        const [result] = await db.promise().query(query, [guardiaId, registroId]);
        return result.affectedRows > 0;
    }

    async marcarSalida(registroId) {
        const query = `
            UPDATE registro_dispositivo 
            SET estado = 2, fecha_salida = NOW()
            WHERE id = ? AND estado = 1
        `;
        const [result] = await db.promise().query(query, [registroId]);
        return result.affectedRows > 0;
    }

    async procesarEscaneoQr(codigoQr, guardiaId) {
        const connection = await db.promise().getConnection();
        try {
            await connection.beginTransaction();
            const [rows] = await connection.query(
                `SELECT r.id, r.estado
                 FROM registro_dispositivo r
                 JOIN dispositivos_x_alumno d ON d.id = r.objeto_id
                 WHERE d.codigo_qr = ? AND r.estado IN (0, 1)
                 ORDER BY r.id DESC
                 LIMIT 1 FOR UPDATE`,
                [codigoQr],
            );
            if (!rows[0]) throw new Error("No hay una solicitud activa para este dispositivo");

            const registro = rows[0];
            const nuevoEstado = registro.estado === 0 ? 1 : 2;
            const campoFecha = nuevoEstado === 1 ? "fecha_entrada" : "fecha_salida";
            await connection.query(
                `UPDATE registro_dispositivo
                 SET estado = ?, guardia_id = ?, ${campoFecha} = NOW()
                 WHERE id = ?`,
                [nuevoEstado, guardiaId, registro.id],
            );
            await connection.commit();
            return { registroId: registro.id, accion: nuevoEstado === 1 ? "INGRESO" : "SALIDA", estado: nuevoEstado };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = new RegistroDispositivoRepository();

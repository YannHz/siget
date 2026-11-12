const db = require("../config/db");

const baseSelect = `
  SELECT r.id, r.estado, r.fecha_envio, r.fecha_entrada, r.fecha_salida,
    a.idsenati, CONCAT(a.nombres, ' ', a.apellidos) AS alumno,
    d.tipo, d.marca, d.modelo, d.numero_serie
  FROM registro_dispositivo r
  JOIN datos_alumnos a ON a.id = r.alumno_id
  JOIN dispositivos_x_alumno d ON d.id = r.objeto_id`;

exports.movimientos = async () => {
  const [rows] = await db.promise().query(`${baseSelect} ORDER BY r.id DESC LIMIT 500`);
  return rows;
};

exports.dentro = async () => {
  const [rows] = await db.promise().query(`${baseSelect} WHERE r.estado = 1 ORDER BY r.fecha_entrada DESC`);
  return rows;
};

exports.pendientes = async () => {
  const [rows] = await db.promise().query(`${baseSelect} WHERE r.estado = 0 ORDER BY r.fecha_envio DESC`);
  return rows;
};

exports.historialAlumno = async (alumnoId) => {
  const [rows] = await db.promise().query(`${baseSelect} WHERE r.alumno_id = ? OR a.idsenati = ? ORDER BY r.id DESC`, [alumnoId, alumnoId]);
  return rows;
};

exports.resumen = async () => {
  const [rows] = await db.promise().query(`
    SELECT DATE(fecha_envio) AS fecha,
      COUNT(*) AS solicitudes,
      SUM(estado = 0) AS pendientes,
      SUM(estado = 1) AS dentro,
      SUM(estado = 2) AS salidas
    FROM registro_dispositivo
    GROUP BY DATE(fecha_envio)
    ORDER BY fecha DESC
    LIMIT 31
  `);
  return rows;
};

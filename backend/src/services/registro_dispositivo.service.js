const registroRepository = require("../repositories/registro_dispositivo.repository");

class RegistroDispositivoService {
  async obtenerRegistros() {
    return await registroRepository.obtenerRegistros();
  }

  async obtenerDispositivosPorAlumno(alumnoId) {
    return await registroRepository.obtenerDispositivosPorAlumno(alumnoId);
  }

  async obtenerSolicitudesPorAlumno(alumnoId) {
    return await registroRepository.obtenerSolicitudesPorAlumno(alumnoId);
  }

  async registrarDispositivo(data) {
    const dispositivoId = await registroRepository.crearDispositivo(data);
    return {
      dispositivo_id: dispositivoId,
    };
  }

  async procesarEscaneoQr(codigoQr, guardiaId) {
    return registroRepository.procesarEscaneoQr(codigoQr, guardiaId);
  }

  async crearSolicitudIngreso(alumnoId, dispositivoId) {
    return await registroRepository.crearSolicitudIngreso(alumnoId, dispositivoId);
  }

  async dispositivoPerteneceAAlumno(dispositivoId, alumnoId) {
    return registroRepository.dispositivoPerteneceAAlumno(dispositivoId, alumnoId);
  }

  async tieneSolicitudActiva(dispositivoId) {
    return registroRepository.tieneSolicitudActiva(dispositivoId);
  }

  async actualizarDispositivo(dispositivoId, alumnoId, data) {
    return registroRepository.actualizarDispositivo(dispositivoId, alumnoId, data);
  }

  async desactivarDispositivo(dispositivoId, alumnoId) {
    return registroRepository.desactivarDispositivo(dispositivoId, alumnoId);
  }

  async marcarEntrada(registroId, guardiaId) {
    return await registroRepository.marcarEntrada(registroId, guardiaId);
  }

  async marcarSalida(registroId) {
    return await registroRepository.marcarSalida(registroId);
  }
}

module.exports = new RegistroDispositivoService();

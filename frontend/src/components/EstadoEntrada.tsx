import '../styles/EstadoEntrada.css'
import type { Alumno } from '../types'
import { ScanLine } from 'lucide-react'

interface Props {
  alumno: Alumno | null;
}

export default function EstadoEntrada({ alumno }: Props) {

  const getEstadoLabel = (estado?: number) => {
    switch (estado) {
      case 0: return 'EN ESPERA';
      case 1: return 'INGRESO';
      case 2: return 'SALIDA';
      default: return 'DESCONOCIDO';
    }
  };

  const getEstadoClass = (estado?: number) => {
    switch (estado) {
      case 0: return 'espera'; 
      case 1: return 'ingreso';
      case 2: return 'salida';
      default: return '';
    }
  };

  return (
    <div className="card-panel estado-panel">
      <div className="card-title center">
        ESTADO DE LA SOLICITUD
      </div>
      
      <div className="estado-content">
        {alumno && (
          <div className="ultimo-registro">
            Estado actual: 
            <span className={`registro-estado ${getEstadoClass(alumno.estado)}`}>
              {getEstadoLabel(alumno.estado)}
            </span> 
            {alumno.fecha_envio && (
              <> enviado el {new Date(alumno.fecha_envio).toLocaleDateString()}</>
            )}
          </div>
        )}
        {!alumno && <p className="estado-empty">Selecciona una solicitud para ver sus datos.</p>}
        <div className="scan-guidance"><ScanLine size={18} /> Verifica el equipo y escanea su QR para registrar el siguiente movimiento.</div>
      </div>
    </div>
  )
}

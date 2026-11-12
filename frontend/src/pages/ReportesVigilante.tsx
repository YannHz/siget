import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardList, DoorOpen, History, Laptop, RefreshCw } from 'lucide-react';
import { API_BASE } from '../services/api';
import '../styles/ReportesVigilante.css';

interface Movimiento { id: number; estado: number; alumno: string; idsenati: string; tipo: string; marca: string; modelo: string; numero_serie?: string; fecha_envio: string; fecha_entrada?: string; fecha_salida?: string; }
interface Resumen { fecha: string; solicitudes: number; pendientes: number; dentro: number; salidas: number; }
const estado = (value: number) => value === 0 ? 'Pendiente' : value === 1 ? 'Dentro' : 'Salida';

export default function ReportesVigilante() {
  const navigate = useNavigate();
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [pendientes, setPendientes] = useState<Movimiento[]>([]);
  const [dentro, setDentro] = useState<Movimiento[]>([]);
  const [resumen, setResumen] = useState<Resumen[]>([]);
  const [historial, setHistorial] = useState<Movimiento[]>([]);
  const [alumnoId, setAlumnoId] = useState('');
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    setLoading(true);
    try {
      const urls = ['movimientos', 'pendientes', 'dentro', 'resumen'];
      const values = await Promise.all(urls.map(async path => {
        const response = await fetch(`${API_BASE}/api/reportes/${path}`, { credentials: 'include' });
        if (!response.ok) throw new Error('No se pudieron cargar los reportes.');
        return response.json();
      }));
      setMovimientos(values[0]); setPendientes(values[1]); setDentro(values[2]); setResumen(values[3]);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void cargar(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const buscarHistorial = async (event: React.FormEvent) => {
    event.preventDefault(); if (!alumnoId.trim()) return;
    const response = await fetch(`${API_BASE}/api/reportes/historial/${encodeURIComponent(alumnoId)}`, { credentials: 'include' });
    setHistorial(response.ok ? await response.json() : []);
  };

  const rows = historial.length ? historial : movimientos;
  return <main className="reports-page">
    <section className="reports-shell">
      <header className="reports-header"><button onClick={() => navigate('/dashboard-vigilante')}><ArrowLeft size={18} /> Panel</button><div><span>CONTROL DE ACCESO</span><h1>Reportes</h1></div><button className="reports-refresh" onClick={() => void cargar()}><RefreshCw size={17} /> Actualizar</button></header>
      <div className="report-metrics">
        <article><ClipboardList /><span>Solicitudes registradas</span><strong>{movimientos.length}</strong></article>
        <article><DoorOpen /><span>Equipos dentro</span><strong>{dentro.length}</strong></article>
        <article><Laptop /><span>Solicitudes pendientes</span><strong>{pendientes.length}</strong></article>
      </div>
      <section className="reports-card"><div className="report-card-heading"><div><h2>Movimientos de equipos</h2><p>{loading ? 'Actualizando datos…' : 'Últimos 500 movimientos registrados'}</p></div><form onSubmit={buscarHistorial}><History size={16}/><input value={alumnoId} onChange={event => setAlumnoId(event.target.value)} placeholder="ID SENATI o ID interno"/><button>Ver historial</button></form></div>
      <div className="report-table-wrap"><table><thead><tr><th>Alumno</th><th>Equipo</th><th>Serie</th><th>Estado</th><th>Solicitud</th><th>Ingreso / salida</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><strong>{row.alumno}</strong><small>{row.idsenati}</small></td><td>{row.tipo} · {row.marca} {row.modelo}</td><td>{row.numero_serie || '—'}</td><td><span className={`report-status s${row.estado}`}>{estado(row.estado)}</span></td><td>{new Date(row.fecha_envio).toLocaleString()}</td><td>{row.estado === 1 ? new Date(row.fecha_entrada || row.fecha_envio).toLocaleString() : row.estado === 2 ? new Date(row.fecha_salida || row.fecha_envio).toLocaleString() : '—'}</td></tr>)}</tbody></table></div></section>
      <section className="reports-card summary-card"><h2>Resumen de actividad</h2><div className="summary-list">{resumen.map(day => <div key={day.fecha}><strong>{new Date(day.fecha).toLocaleDateString()}</strong><span>{day.solicitudes} solicitudes</span><span>{day.pendientes} pendientes</span><span>{day.dentro} dentro</span><span>{day.salidas} salidas</span></div>)}</div></section>
    </section>
  </main>;
}

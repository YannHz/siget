import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Laptop, MonitorSmartphone, Plus, Send, ChevronRight, QrCode, LogOut, ArrowRight, Check, Download, Printer, Pencil, Trash2, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

import DetallesItem from '../components/DetallesItem';
import RegistroDispositivoModal from '../components/RegistroDispositivoModal';
import { obtenerAlumno } from '../services/alumnoService';
import { API_BASE } from '../services/api';
import type { Alumno } from '../types/alumnos';

import '../styles/App.css';
import '../styles/DashboardAlumno.css';
import '../styles/DetallesItem.css';
import '../styles/EstadoEntrada.css';
import '../styles/BarraLateral.css';

/* ---- Tipos locales ---- */
interface Dispositivo {
  id: number;
  tipo: string;
  marca: string;
  modelo: string;
  numero_serie: string;
  descripcion: string;
  codigo_qr?: string;
  estado: number;
}

interface Solicitud {
  id: number;
  estado: number; // 0=en espera, 1=aprobado/ingreso, 2=salida
  fecha_envio: string;
  fecha_entrada: string | null;
  fecha_salida: string | null;
  dispositivo_id: number;
  tipo: string;
  marca: string;
  modelo: string;
}

/* ---- Helpers de estado de solicitud ---- */
const ESTADO_LABEL: Record<number, string> = {
  0: 'En espera',
  1: 'Ingreso aprobado',
  2: 'Salida registrada',
};
const ESTADO_CLASS: Record<number, string> = {
  0: 'en-espera',
  1: 'aprobado',
  2: 'aprobado',
};

/* ================================================================
   Dashboard principal del alumno
   ================================================================ */
export default function DashboardAlumno() {
  const navigate = useNavigate();
  const [alumno, setAlumno] = useState<Alumno | null>(null);
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [selectedDispositivo, setSelectedDispositivo] = useState<Dispositivo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Dispositivo | null>(null);
  const [qrDevice, setQrDevice] = useState<Dispositivo | null>(null);
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('user');
    fetch('/login/logout', { method: 'POST', credentials: 'include' }).catch(() => undefined);
    navigate('/login');
  };

  const handleLogoutAll = async () => {
    await fetch(`${API_BASE}/login/logout-all`, { method: 'POST', credentials: 'include' }).catch(() => undefined);
    localStorage.removeItem('user');
    toast.success('Se cerraron todas tus sesiones.');
    navigate('/login');
  };

  /* Cargar datos del alumno desde localStorage */
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { navigate('/login'); return; }

    const user = JSON.parse(userData);
    const refresh = window.setInterval(() => { fetchDispositivos(user.id); fetchSolicitudes(user.id); }, 4000);
    obtenerAlumno(user.id)
      .then(data => { 
        setAlumno(data); 
        fetchDispositivos(user.id); 
        fetchSolicitudes(user.id);
      })
      .catch(() => navigate('/login'));
    return () => window.clearInterval(refresh);
  }, [navigate]);

  async function fetchDispositivos(id: number) {
    try {
      const resp = await fetch(`${API_BASE}/api/registro_dispositivo/alumno/${id}/dispositivos`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      if (resp.ok) {
        const data = await resp.json();
        setDispositivos(data);
      }
    } catch (error) {
      console.error("Error al buscar dispositivos:", error);
    }
  }

  async function fetchSolicitudes(id: number) {
    try {
      const resp = await fetch(`${API_BASE}/api/registro_dispositivo/alumno/${id}/solicitudes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      if (resp.ok) {
        const data = await resp.json();
        setSolicitudes(data);
      }
    } catch (error) {
      console.error("Error al buscar solicitudes:", error);
    }
  }

  const handleRegistroExitoso = () => {
    setShowModal(false);
    setEditingDevice(null);
    if (alumno) { fetchDispositivos(alumno.id); fetchSolicitudes(alumno.id); }
  };

  const handleEliminarDispositivo = async (device: Dispositivo) => {
    if (!window.confirm(`¿Eliminar ${device.marca} ${device.modelo}? Su QR dejará de estar disponible.`)) return;
    const response = await fetch(`${API_BASE}/api/registro_dispositivo/dispositivo/${device.id}`, { method: 'DELETE', credentials: 'include' });
    const data = await response.json();
    if (!response.ok) { toast.error(data.error || 'No se pudo eliminar el dispositivo.'); return; }
    if (selectedDispositivo?.id === device.id) setSelectedDispositivo(null);
    toast.success('Dispositivo eliminado.');
    if (alumno) fetchDispositivos(alumno.id);
  };

  const handleShowQr = async (device: Dispositivo) => {
    if (device.codigo_qr) { setQrDevice(device); return; }
    if (!alumno) return;
    await fetchDispositivos(alumno.id);
    const refreshed = await fetch(`${API_BASE}/api/registro_dispositivo/alumno/${alumno.id}/dispositivos`, { credentials: 'include' });
    const devices = refreshed.ok ? await refreshed.json() as Dispositivo[] : [];
    const deviceWithQr = devices.find(item => item.id === device.id);
    if (deviceWithQr?.codigo_qr) { setQrDevice(deviceWithQr); return; }
    toast.error('No se pudo recuperar el QR del equipo. Intenta nuevamente.');
  };

  const handleEnviarSolicitud = async () => {
    if (!selectedDispositivo || !alumno) return;
    setEnviandoSolicitud(true);


    try {
      const resp = await fetch(`${API_BASE}/api/registro_dispositivo/solicitud-ingreso`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          alumno_id: alumno.id,
          dispositivo_id: selectedDispositivo.id,
        }),
      });
      if (resp.ok) {
        fetchSolicitudes(alumno.id);
        toast.success('Solicitud enviada. Presenta el QR del equipo al vigilante.');
      } else {
        const d = await resp.json();
        toast.error(d.error || 'No se pudo enviar la solicitud.');
      }
    } catch {
      toast.error('No se pudo conectar al enviar la solicitud.');
    } finally {
      setEnviandoSolicitud(false);
    }
  };

  const descargarQr = () => {
    const device = qrDevice ?? selectedDispositivo;
    const svg = document.querySelector('.qr-modal svg, .qr-preview svg');
    if (!svg || !device) return;
    const source = new XMLSerializer().serializeToString(svg);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 600; canvas.height = 600;
      const context = canvas.getContext('2d');
      if (!context) return;
      context.fillStyle = '#ffffff'; context.fillRect(0, 0, 600, 600);
      context.drawImage(image, 0, 0, 600, 600);
      const anchor = document.createElement('a');
      anchor.download = `SIGET-${device.marca}-${device.modelo}-QR.png`.replace(/\s+/g, '-');
      anchor.href = canvas.toDataURL('image/png');
      anchor.click();
    };
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
  };

  const imprimirQr = () => {
    const device = qrDevice ?? selectedDispositivo;
    const svg = document.querySelector('.qr-modal svg, .qr-preview svg');
    if (!svg || !device) return;
    const label = `${device.tipo} · ${device.marca} ${device.modelo}`;
    const windowPrint = window.open('', '_blank', 'width=720,height=720');
    if (!windowPrint) { toast.error('El navegador bloqueó la ventana de impresión.'); return; }
    windowPrint.document.write(`<html><head><title>QR SIGET</title><style>body{font-family:Arial;text-align:center;padding:42px;color:#081a3b}svg{width:360px;height:360px}p{color:#52677f}</style></head><body><h1>SIGET</h1><p>${label}</p>${new XMLSerializer().serializeToString(svg)}<p>QR estático del equipo</p><script>window.onload=()=>window.print()</script></body></html>`);
    windowPrint.document.close();
  };

  /* Solicitud activa del dispositivo seleccionado (la más reciente que no sea salida) */
  const solicitudActiva = selectedDispositivo
    ? solicitudes
        .filter(s => s.dispositivo_id === selectedDispositivo.id)
        .sort((a, b) => b.id - a.id)[0] ?? null
    : null;

  /* Transformar Dispositivo → forma que acepta DetallesItem */
  const selectedForDetalles = selectedDispositivo
    ? {
        id: selectedDispositivo.id,
        idsenati: alumno?.idsenati ?? '',
        marca: selectedDispositivo.marca,
        modelo: selectedDispositivo.modelo,
        tipo: selectedDispositivo.tipo,
        numero_serie: selectedDispositivo.numero_serie,
        descripcion: selectedDispositivo.descripcion,
      }
    : null;

  if (!alumno) {
    return (
      <div className="layout-wrapper">
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>Cargando…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-wrapper">
      <div className="app-container">
        {/* ===================== CONTENIDO PRINCIPAL ===================== */}
        <div className="main-content">

          {/* Barra superior con info del alumno */}
          <div className="alumno-topbar">
            <div className="alumno-topbar-info">
              <div className="alumno-topbar-avatar">
                <User size={22} />
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#374151', margin: 0 }}>
                Hola, {alumno.nombres}
              </h2>
            </div>
          </div>

          {/* Área de contenido */}
          <div className={`content-area ${dispositivos.length === 0 ? 'is-empty' : ''}`}>

            {dispositivos.length === 0 && (
              <section className="onboarding-empty" aria-labelledby="onboarding-title">
                <div className="onboarding-mark"><MonitorSmartphone size={30} /></div>
                <p className="onboarding-eyebrow">PRIMER PASO</p>
                <h2 id="onboarding-title">Registra el equipo que llevarás a la sede.</h2>
                <p>Después podrás enviar la solicitud de ingreso y presentar su QR al vigilante.</p>
                <button className="onboarding-action" onClick={() => setShowModal(true)}>
                  Registrar dispositivo <ArrowRight size={18} />
                </button>
                <ol className="onboarding-steps" aria-label="Pasos para ingresar un equipo">
                  <li><span><Check size={13} /></span> Registra tu equipo</li>
                  <li><span>2</span> Envía la solicitud</li>
                  <li><span>3</span> Presenta el QR</li>
                </ol>
              </section>
            )}

            {/* Panel superior: Lista de dispositivos */}
            <div className="card-panel dispositivos-panel">
              <div className="card-title">
                <span className="title-dot" />
                MIS DISPOSITIVOS
              </div>

              {dispositivos.length === 0 ? (
                <div className="disp-empty">
                  <MonitorSmartphone className="disp-empty-icon" />
                  <p className="disp-empty-text">
                    No tienes dispositivos registrados aún
                  </p>
                </div>
              ) : (
                <div className="resultados-list">
                  <div className="dispositivos-grid">
                    {dispositivos.map(d => {
                      const isSelected = selectedDispositivo?.id === d.id;
                      return (
                        <div
                          key={d.id}
                          className={`dispositivo-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedDispositivo(isSelected ? null : d)}
                        >
                          <div className="disp-card-header">
                            <span className="disp-tipo-badge">{d.tipo || 'Dispositivo'}</span>
                            <span className={`disp-estado-badge ${d.estado === 1 ? 'activo' : 'inactivo'}`}>
                              <span className={`status-dot ${d.estado === 1 ? 'ingreso' : 'salida'}`} />
                              {d.estado === 1 ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>

                          <div className="disp-name">
                            {d.marca} {d.modelo}
                          </div>

                          {d.numero_serie && (
                            <div className="disp-serie">N/S: {d.numero_serie}</div>
                          )}

                          <div className="disp-card-footer">
                            <div className="date-info">
                              <Laptop size={13} />
                              <span>{d.descripcion || 'Sin descripción'}</span>
                            </div>
                            <ChevronRight size={16} color={isSelected ? 'var(--color-nav-bg)' : '#D1D5DB'} />
                          </div>
                          <div className="device-card-actions">
                            <button onClick={(event) => { event.stopPropagation(); void handleShowQr(d); }}><QrCode size={15} /> Ver QR</button>
                            <button onClick={(event) => { event.stopPropagation(); setEditingDevice(d); setShowModal(true); }}><Pencil size={14} /> Editar</button>
                            <button className="device-delete" onClick={(event) => { event.stopPropagation(); void handleEliminarDispositivo(d); }}><Trash2 size={14} /> Eliminar</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Panel inferior: Detalles + Acciones */}
            <div className="content-grid">
              {/* Detalles del dispositivo seleccionado */}
              <DetallesItem alumno={selectedForDetalles} />

              {/* Acciones del alumno */}
              <div className="card-panel acciones-panel">
                <div className="card-title center">
                  ACCIONES
                </div>

                <div className="acciones-content">
                  <div className="primary-action-row">
                    <button className="btn-accion-alumno btn-registrar" onClick={() => { setEditingDevice(null); setShowModal(true); }}>
                      <Plus size={18} /> Registrar equipo
                    </button>
                    <button
                      className="btn-accion-alumno btn-solicitar"
                      disabled={!selectedDispositivo || enviandoSolicitud || (!!solicitudActiva && solicitudActiva.estado !== 2)}
                      onClick={handleEnviarSolicitud}
                      title={!selectedDispositivo ? 'Selecciona un dispositivo primero' : solicitudActiva && solicitudActiva.estado !== 2 ? 'Ya existe una solicitud activa para este dispositivo' : 'Enviar solicitud de ingreso al vigilante'}
                    >
                      <Send size={18} /> {enviandoSolicitud ? 'Enviando…' : 'Solicitar ingreso'}
                    </button>
                  </div>

                  {solicitudActiva && (
                    <div className={`solicitud-estado ${ESTADO_CLASS[solicitudActiva.estado] ?? ''}`}>
                      Último estado: <strong>{ESTADO_LABEL[solicitudActiva.estado] ?? 'Desconocido'}</strong>
                      {solicitudActiva.fecha_entrada && (
                        <> · Entrada: {new Date(solicitudActiva.fecha_entrada).toLocaleDateString()}</>
                      )}
                    </div>
                  )}

                  {!selectedDispositivo && dispositivos.length > 0 && (
                    <p style={{ fontSize: 12, color: 'var(--color-secondary-text)', textAlign: 'center', marginTop: 4 }}>
                      Selecciona un dispositivo para solicitar ingreso
                    </p>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ===================== PANEL DERECHO: INFO ALUMNO ===================== */}
        <div className="alumno-info-panel">
          <div className="barra-lateral-header" style={{ marginBottom: 20 }}>
            <h1 className="barra-lateral-title">ALUMNO</h1>
          </div>

          <div className="avatar-container">
            <div className="avatar">
              <User className="avatar-icon" />
            </div>
          </div>

          <div className="alumno-info-list">
            <div className="info-item">
              <span className="info-label">ID SENATI</span>
              <span>{alumno.idsenati}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Nombre</span>
              <span>{alumno.nombres}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Apellidos</span>
              <span>{alumno.apellidos}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Carrera</span>
              <span>{alumno.carrera}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Semestre</span>
              <span>{alumno.semestre}° Semestre</span>
            </div>
          </div>

          <button className="perfil-logout" onClick={handleLogout}>
            <LogOut size={17} />
            Cerrar sesión
          </button>
          <button className="perfil-logout perfil-logout-all" onClick={handleLogoutAll}>Cerrar todas mis sesiones</button>
        </div>
      </div>

      {/* ===================== MODAL REGISTRO ===================== */}
      {showModal && (
        <RegistroDispositivoModal
          alumnoId={alumno.id}
          dispositivo={editingDevice}
          onClose={() => setShowModal(false)}
          onSuccess={handleRegistroExitoso}
        />
      )}
      {qrDevice?.codigo_qr && (
        <div className="modal-overlay" onClick={() => setQrDevice(null)}>
          <section className="qr-modal" onClick={event => event.stopPropagation()} aria-label="QR del equipo">
            <button className="modal-close-btn qr-close" onClick={() => setQrDevice(null)}><X size={21} /></button>
            <p className="onboarding-eyebrow">QR ESTÁTICO DEL EQUIPO</p>
            <h2>{qrDevice.marca} {qrDevice.modelo}</h2>
            <QRCodeSVG value={qrDevice.codigo_qr} size={250} level="M" includeMargin />
            <p>Muéstralo al vigilante desde aquí o imprímelo para colocarlo en el equipo.</p>
            <div className="qr-modal-actions"><button onClick={descargarQr}><Download size={17} /> Descargar PNG</button><button onClick={imprimirQr}><Printer size={17} /> Imprimir</button></div>
          </section>
        </div>
      )}
    </div>
  );
}

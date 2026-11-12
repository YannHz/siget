import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { ArrowLeft, Camera, CheckCircle2, RefreshCw, ScanLine, ShieldCheck, XCircle } from 'lucide-react';
import { API_BASE } from '../services/api';
import '../styles/EscanerVigilante.css';

type ScanState = 'ready' | 'scanning' | 'processing' | 'success' | 'error';

interface ScanResult {
  accion: 'INGRESO' | 'SALIDA';
  registroId: number;
}

export default function EscanerVigilante() {
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef(false);
  const [state, setState] = useState<ScanState>('ready');
  const [message, setMessage] = useState('Activa la cámara cuando hayas verificado físicamente el equipo.');
  const [result, setResult] = useState<ScanResult | null>(null);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      if (scanner.isScanning) await scanner.stop();
    } catch {
      // La cámara puede cerrarse desde el navegador antes de desmontar la vista.
    }
  }, []);

  const submitCode = useCallback(async (codigo_qr: string) => {
    setState('processing');
    setMessage('Validando la solicitud y registrando el movimiento…');
    try {
      const response = await fetch(`${API_BASE}/api/registro_dispositivo/escanear-qr`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo_qr }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo validar el QR.');
      setResult(data);
      setState('success');
      setMessage(data.accion === 'INGRESO' ? 'Ingreso registrado correctamente.' : 'Salida registrada correctamente.');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'No se pudo procesar el QR.');
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setResult(null);
    setState('scanning');
    setMessage('Enfoca el QR estático del equipo dentro del recuadro.');
    try {
      await stopScanner();
      const scanner = new Html5Qrcode('siget-qr-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decodedText) => {
          await stopScanner();
          await submitCode(decodedText);
        },
        () => undefined,
      );
    } catch {
      setState('error');
      setMessage('No se pudo abrir la cámara. Revisa el permiso del navegador e inténtalo otra vez.');
    } finally {
      isStartingRef.current = false;
    }
  }, [stopScanner, submitCode]);

  useEffect(() => () => { void stopScanner(); }, [stopScanner]);

  const retry = async () => {
    await stopScanner();
    await startScanner();
  };

  return (
    <main className="scanner-page">
      <section className="scanner-shell" aria-labelledby="scanner-title">
        <button className="scanner-back" onClick={() => navigate('/dashboard-vigilante')}>
          <ArrowLeft size={18} /> Volver al panel
        </button>

        <div className="scanner-heading">
          <span className="scanner-kicker"><ShieldCheck size={16} /> CONTROL DE ACCESO</span>
          <h1 id="scanner-title">Escanear equipo</h1>
          <p>Confirma que el equipo coincide con la solicitud y luego lee su QR.</p>
        </div>

        <div className={`scanner-stage is-${state}`}>
          <div id="siget-qr-reader" className="qr-reader" />
          {state !== 'scanning' && (
            <div className="scanner-placeholder">
              {state === 'success' ? <CheckCircle2 /> : state === 'error' ? <XCircle /> : <Camera />}
              <span>{state === 'processing' ? 'Procesando QR' : state === 'success' ? result?.accion === 'INGRESO' ? 'Ingreso confirmado' : 'Salida confirmada' : state === 'error' ? 'Lectura no disponible' : 'Cámara preparada'}</span>
            </div>
          )}
          {state === 'scanning' && <div className="scanner-frame" aria-hidden="true"><i /><i /><i /><i /></div>}
        </div>

        <p className={`scanner-message is-${state}`} aria-live="polite">{message}</p>

        <div className="scanner-actions">
          {state === 'ready' && <button className="scanner-primary" onClick={() => void startScanner()}><ScanLine size={19} /> Activar cámara</button>}
          {(state === 'error' || state === 'success') && <button className="scanner-primary" onClick={() => void retry()}><RefreshCw size={18} /> Escanear otro QR</button>}
          {state === 'scanning' && <button className="scanner-secondary" onClick={() => void stopScanner().then(() => setState('ready'))}>Cancelar</button>}
        </div>

        <p className="scanner-note">El mismo QR registra ingreso cuando existe una solicitud pendiente y salida cuando el equipo ya está dentro.</p>
      </section>
    </main>
  );
}

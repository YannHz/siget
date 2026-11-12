import { useState } from 'react';
import { X, Laptop } from 'lucide-react';
import { API_BASE } from '../services/api';
import { toast } from 'sonner';

interface Props {
  alumnoId: number;
  dispositivo?: { id: number; tipo: string; marca: string; modelo: string; numero_serie?: string; descripcion?: string } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RegistroDispositivoModal({
  alumnoId,
  dispositivo = null,
  onClose,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    tipo: dispositivo?.tipo ?? '',
    marca: dispositivo?.marca ?? '',
    modelo: dispositivo?.modelo ?? '',
    numero_serie: dispositivo?.numero_serie ?? '',
    descripcion: dispositivo?.descripcion ?? '',
    observacion: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tipo || !formData.marca || !formData.modelo) {
      toast.error('Completa tipo, marca y modelo.');
      return;
    }
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/registro_dispositivo${dispositivo ? `/dispositivo/${dispositivo.id}` : ''}`, {
        method: dispositivo ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...(!dispositivo && { alumno_id: alumnoId }),
          tipo: formData.tipo,
          marca: formData.marca,
          modelo: formData.modelo,
          numero_serie: formData.numero_serie,
          descripcion: formData.descripcion,
          observacion: formData.observacion,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(dispositivo ? 'Equipo actualizado.' : 'Equipo registrado. Ya puedes crear su solicitud de ingreso.');
        onSuccess();
      } else {
        toast.error(data.error || 'No se pudo registrar el dispositivo.');
      }
    } catch {
      toast.error('No se pudo conectar al registrar el dispositivo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Laptop size={22} color="var(--color-nav-bg)" />
            <h2 className="modal-title">{dispositivo ? 'Editar dispositivo' : 'Registro de dispositivo'}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Cerrar">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Datos del dispositivo */}
          <div className="modal-form-grid">
            <div className="modal-form-group">
              <label className="modal-label">Tipo *</label>
              <input
                className="modal-input"
                name="tipo"
                placeholder="Ej: Laptop, Tablet…"
                value={formData.tipo}
                onChange={handleChange}
                required
              />
            </div>
            <div className="modal-form-group">
              <label className="modal-label">Marca *</label>
              <input
                className="modal-input"
                name="marca"
                placeholder="Ej: Dell, HP…"
                value={formData.marca}
                onChange={handleChange}
                required
              />
            </div>
            <div className="modal-form-group">
              <label className="modal-label">Modelo *</label>
              <input
                className="modal-input"
                name="modelo"
                placeholder="Ej: Inspiron 15"
                value={formData.modelo}
                onChange={handleChange}
                required
              />
            </div>
            <div className="modal-form-group">
              <label className="modal-label">Número de Serie</label>
              <input
                className="modal-input"
                name="numero_serie"
                placeholder="Ej: SN1234567"
                value={formData.numero_serie}
                onChange={handleChange}
              />
            </div>

            <div className="modal-form-group full-width">
              <label className="modal-label">Descripción</label>
              <textarea
                className="modal-textarea"
                name="descripcion"
                placeholder="Descripción del dispositivo…"
                value={formData.descripcion}
                onChange={handleChange}
              />
            </div>

            <div className="modal-form-group full-width">
              <label className="modal-label">Observación</label>
              <textarea
                className="modal-textarea"
                name="observacion"
                placeholder="Observaciones adicionales…"
                value={formData.observacion}
                onChange={handleChange}
              />
            </div>

          </div>

          <div className="modal-footer">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-modal-submit" disabled={loading}>
              {loading ? 'Guardando…' : dispositivo ? 'Guardar cambios' : 'Registrar dispositivo'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

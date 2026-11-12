import { API_BASE } from './api';

const API = `${API_BASE}/api`;

const getAuthHeaders = () => {
  return {
    'Content-Type': 'application/json',
  };
};

export const obtenerAlumno = async (id: string) => {
  const response = await fetch(`${API}/alumnos/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  
  if (!response.ok) throw new Error(`Error al obtener alumno: ${response.status}`);
  return await response.json();
};

export const obtenerInstructores = async () => {
  const response = await fetch(`${API}/instructores`, {
    method: "GET", 
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  
  if (!response.ok) throw new Error(`Error al obtener instructores: ${response.status}`);
  return await response.json();
};

export interface RegistroDispositivoPayload {
  alumno_id: string | number;
  instructor_id: string | number;
  tipo: string;
  marca: string;
  modelo: string;
  numero_serie?: string;
  descripcion?: string;
  observacion?: string;
  estado?: number;
  usuario_creacion?: string;
}

export const registrarDispositivo = async (data: RegistroDispositivoPayload) => {
  const response = await fetch(`${API}/registro-dispositivo`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  });
  
  if (!response.ok) throw new Error(`Error al registrar dispositivo: ${response.status}`);
  return await response.json();
};

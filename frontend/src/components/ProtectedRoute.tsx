import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { API_BASE } from '../services/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Required role to access this route: 'vigilante' | 'alumno' */
  requiredRole: 'vigilante' | 'alumno';
}

const ROLE_REDIRECTS: Record<string, string> = {
  vigilante: '/dashboard-vigilante',
  alumno: '/dashboard-alumno',
};

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const userStr = localStorage.getItem('user');
  const [validating, setValidating] = useState(true);
  const [sessionRole, setSessionRole] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/login/session`, { credentials: 'include' })
      .then(async response => response.ok ? response.json() : Promise.reject())
      .then(data => setSessionRole(data.user.role))
      .catch(() => { localStorage.removeItem('user'); setSessionRole(null); })
      .finally(() => setValidating(false));
  }, []);

  // Not logged in → go to login
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }

  if (validating) return <div className="session-loading">Validando sesión…</div>;
  if (!sessionRole) return <Navigate to="/login" replace />;

  let role: string | undefined;
  try {
    const parsed = JSON.parse(userStr);
    // The login service stores role on the response root, but we also need to
    // persist it into the user object. We store it under "role" key.
    role = parsed.role;
  } catch {
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  // Role doesn't match → redirect to their correct dashboard
  if (role !== requiredRole || sessionRole !== requiredRole) {
    const correctPath = sessionRole ? ROLE_REDIRECTS[sessionRole] : '/login';
    return <Navigate to={correctPath ?? '/login'} replace />;
  }

  return <>{children}</>;
}

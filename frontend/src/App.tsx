import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Login from "./pages/Login";
import DashboardVigilante from "./pages/DashboardVigilante";
import DashboardAlumno from "./pages/DashboardAlumno";
import EscanerVigilante from "./pages/EscanerVigilante";
import ReportesVigilante from "./pages/ReportesVigilante";
import ProtectedRoute from "./components/ProtectedRoute";
import "./styles/Contrast.css";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton toastOptions={{ style: { borderRadius: '16px' } }} />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard-vigilante"
          element={
            <ProtectedRoute requiredRole="vigilante">
              <DashboardVigilante />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard-vigilante/escanear"
          element={
            <ProtectedRoute requiredRole="vigilante">
              <EscanerVigilante />
            </ProtectedRoute>
          }
        />
        <Route path="/dashboard-vigilante/reportes" element={<ProtectedRoute requiredRole="vigilante"><ReportesVigilante /></ProtectedRoute>} />
        <Route
          path="/dashboard-alumno"
          element={
            <ProtectedRoute requiredRole="alumno">
              <DashboardAlumno />
            </ProtectedRoute>
          }
        />
        
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

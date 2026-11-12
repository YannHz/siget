import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import senatiLogo from "../assets/Senati.png";
import { API_BASE } from "../services/api";
import { toast } from 'sonner';
import "../styles/Login.css";

function Login() {
  const [usuario, setUsuario] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!usuario || !password) {
      toast.error("Completa usuario y contraseña.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          usuario,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 1. Guardamos los datos del usuario y su rol
        localStorage.setItem("user", JSON.stringify({ ...data.user, role: data.role }));
        
        navigate(data.redirectUrl);
      } else {
        toast.error(data.error || "No se pudo iniciar sesión.");
      }
    } catch (error) {
      console.error(error);
      toast.error("No se pudo conectar con el servidor.");
    }
  };

  return (
    <div className="container">
      <div className="card">
        <img src={senatiLogo} alt="Logo SENATI" className="logo" />
        <h1 className="title">SIGET</h1>
        <form onSubmit={handleLogin} className="form">
          <input
            type="text"
            placeholder="Usuario"
            aria-label="Usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            className="input"
          />

          <div className="password-container">
            <input
              type={showPassword ? "text" : "password"}
            placeholder="Contraseña"
            aria-label="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button type="submit" className="button">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import senatiVigilante from '../assets/SenatiVigilante.png';
import '../styles/Navbar.css';

const NavbarAlumno = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { title: 'Dashboard', path: '/dashboard-alumno' },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <nav className="siget-navbar">
        <div className="navbar-container">
          <div className="navbar-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard-alumno')}>
            <img src={senatiVigilante} alt="SENATI" className="logo" />
            <span className="titulo">SIGET</span>
          </div>

          {/* Menú desktop */}
          <div className="navbar-menu">
            <div className="nav-links">
              {navItems.map((item) => (
                <span
                  key={item.title}
                  className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => navigate(item.path)}
                  style={{ cursor: 'pointer' }}
                >
                  {item.title}
                </span>
              ))}
            </div>

          </div>

          {/* Botón hamburguesa (solo móvil) */}
          <button
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Abrir menú"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Overlay oscuro */}
      <div
        className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={closeMobileMenu}
      />

      {/* Panel lateral móvil */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
        {navItems.map((item) => (
          <span
            key={item.title}
            className={`mobile-nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => { navigate(item.path); closeMobileMenu(); }}
            style={{ cursor: 'pointer' }}
          >
            {item.title}
          </span>
        ))}
      </div>
    </>
  );
};

export default NavbarAlumno;


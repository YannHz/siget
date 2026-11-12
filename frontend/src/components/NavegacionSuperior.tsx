import { BarChart3, ScanLine, Search, User } from 'lucide-react'
import '../styles/NavegacionSuperior.css'
import type { Guardia } from '../types'

export default function NavegacionSuperior({ guardia, onSearch, onScan, onReports }: { guardia: Guardia | null, onSearch: (term: string) => void, onScan: () => void, onReports: () => void }) {
  return (
    <div className="navegacion-superior">
      <div className="guardia-info">
        <div className="guardia-avatar">
          <User size={24} />
        </div>
        <div className="guardia-details">
          <span className="guardia-name">{guardia?.nombre || "NOMBRE GUARDIA"}</span>
          <span className="guardia-role">{guardia?.rol || "Dato extra"}</span>
          {guardia?.turno && <span className="guardia-role" style={{marginTop: '2px'}}>Turno {guardia.turno}</span>}
        </div>
      </div>
      
      <div className="nav-actions">
        <button className="reports-trigger" onClick={onReports} title="Ver reportes"><BarChart3 size={18} /> <span>Reportes</span></button>
        <button className="scan-trigger" onClick={onScan}>
          <ScanLine size={18} />
          Escanear QR
        </button>
        <div className="search-container">
          <input 
            type="text" 
            id="buscar-alumno"
            name="buscar-alumno"
            className="search-input"
            placeholder="Buscar ID Senati..."
            onChange={(e) => onSearch && onSearch(e.target.value)}
          />
          <Search className="search-icon" />
        </div>
      </div>
    </div>
  )
}

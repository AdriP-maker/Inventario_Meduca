import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import logoMeduca from '../assets/logo_meduca.png';
import {
  LayoutDashboard,
  PlusCircle,
  Wrench,
  Users,
  HandCoins,
  History,
  FileBarChart,
  Settings,
  LogOut,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useContext(AuthContext);

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isOpen && (
        <div className="sidebar-backdrop d-lg-none" onClick={onClose} />
      )}

      <aside className={`app-sidebar ${isOpen ? 'show' : ''}`}>
        {/* Header / Brand */}
        <div className="sidebar-header justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <div className="d-flex align-items-center justify-content-center bg-white rounded p-1 shadow-sm" style={{ width: '42px', height: '42px', flexShrink: 0 }}>
              <img src={logoMeduca} alt="MEDUCA Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
            </div>
            <div>
              <h1 className="brand-title">MEDUCA COCLÉ</h1>
              <p className="brand-subtitle">DEPTO. DE MANTENIMIENTO</p>
            </div>
          </div>
          <button className="sidebar-close-btn d-lg-none" onClick={onClose} title="Cerrar menú">
            <X size={22} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" onClick={handleLinkClick} className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
            <span className="nav-item-icon"><LayoutDashboard size={20} /></span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/prestamos/nuevo" onClick={handleLinkClick} className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
            <span className="nav-item-icon"><PlusCircle size={20} /></span>
            <span>Nuevo Préstamo</span>
          </NavLink>

          <NavLink to="/herramientas" onClick={handleLinkClick} className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
            <span className="nav-item-icon"><Wrench size={20} /></span>
            <span>Herramientas</span>
          </NavLink>

          <NavLink to="/funcionarios" onClick={handleLinkClick} className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
            <span className="nav-item-icon"><Users size={20} /></span>
            <span>Funcionarios</span>
          </NavLink>

          <NavLink to="/devoluciones" onClick={handleLinkClick} className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
            <span className="nav-item-icon"><HandCoins size={20} /></span>
            <span>Devoluciones</span>
          </NavLink>

          <NavLink to="/reportes" onClick={handleLinkClick} className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
            <span className="nav-item-icon"><FileBarChart size={20} /></span>
            <span>Reportes</span>
          </NavLink>

          <NavLink to="/historial" onClick={handleLinkClick} className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
            <span className="nav-item-icon"><History size={20} /></span>
            <span>Historial</span>
          </NavLink>

          <NavLink to="/configuracion" onClick={handleLinkClick} className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
            <span className="nav-item-icon"><Settings size={20} /></span>
            <span>Configuración</span>
          </NavLink>
        </nav>

        {/* Footer / Connected User */}
        <div className="sidebar-footer">
          <div className="user-connected-box">
            <span className="user-connected-label">Usuario conectado:</span>
            <span className="user-connected-name">{user?.nombre || 'Carlos Admin'}</span>
            <span className="user-connected-role">Rol: {user?.rol || 'Administrador'}</span>
          </div>
          <button onClick={() => { handleLinkClick(); logout(); }} className="btn-logout">
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

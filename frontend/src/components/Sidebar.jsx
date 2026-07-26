import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import logoMeduca from '../assets/logo_meduca.png';
import {
  LayoutDashboard,
  PlusCircle,
  Wrench,
  Building2,
  Users,
  HandCoins,
  History,
  FileBarChart,
  Settings,
  LogOut,
  ShieldCheck
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <aside className="app-sidebar">
      {/* Header / Brand */}
      <div className="sidebar-header">
        <div className="d-flex align-items-center justify-content-center bg-white rounded p-1 shadow-sm" style={{ width: '42px', height: '42px', flexShrink: 0 }}>
          <img src={logoMeduca} alt="MEDUCA Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
        </div>
        <div>
          <h1 className="brand-title">MEDUCA COCLÉ</h1>
          <p className="brand-subtitle">DEPTO. DE MANTENIMIENTO</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
          <span className="nav-item-icon"><LayoutDashboard size={20} /></span>
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/prestamos/nuevo" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
          <span className="nav-item-icon"><PlusCircle size={20} /></span>
          <span>Nuevo Préstamo</span>
        </NavLink>

        <NavLink to="/herramientas" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
          <span className="nav-item-icon"><Wrench size={20} /></span>
          <span>Herramientas</span>
        </NavLink>

        <NavLink to="/funcionarios" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
          <span className="nav-item-icon"><Users size={20} /></span>
          <span>Funcionarios</span>
        </NavLink>

        <NavLink to="/devoluciones" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
          <span className="nav-item-icon"><HandCoins size={20} /></span>
          <span>Devoluciones</span>
        </NavLink>

        <NavLink to="/reportes" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
          <span className="nav-item-icon"><FileBarChart size={20} /></span>
          <span>Reportes</span>
        </NavLink>

        <NavLink to="/historial" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
          <span className="nav-item-icon"><History size={20} /></span>
          <span>Historial</span>
        </NavLink>

        <NavLink to="/configuracion" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
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
        <button onClick={logout} className="btn-logout">
          <LogOut size={18} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

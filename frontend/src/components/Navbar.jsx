import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Bell, AlertTriangle, CheckCircle2, Info, ArrowRight, X } from 'lucide-react';

const Navbar = ({ title, breadcrumbs }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifData, setNotifData] = useState({ total_no_leidas: 0, notificaciones: [] });
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchNotificaciones = async () => {
    try {
      const res = await api.get('/notificaciones');
      if (res.data.success) {
        setNotifData(res.data.data);
        setUnreadCount(res.data.data.total_no_leidas);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotificaciones();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    setUnreadCount(0);
  };

  return (
    <header className="app-navbar">
      <div>
        <h2 className="nav-page-title">{title}</h2>
        <div className="nav-breadcrumbs">
          <span>Departamento de Mantenimiento</span>
          {breadcrumbs && <span> • {breadcrumbs}</span>}
        </div>
      </div>

      <div className="d-flex align-items-center gap-3">
        {/* Notification Bell Dropdown Container */}
        <div className="position-relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="btn btn-light rounded-circle p-2 text-secondary position-relative shadow-sm"
            title="Ver Notificaciones"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Floating Dropdown Panel */}
          {showNotifications && (
            <div
              className="card border-0 shadow-lg position-absolute end-0 mt-2 rounded-3"
              style={{ width: '360px', zIndex: 9999 }}
            >
              <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-bottom">
                <div className="fw-bold text-dark d-flex align-items-center gap-2">
                  <Bell size={18} className="text-primary" />
                  <span>Notificaciones</span>
                  {unreadCount > 0 && (
                    <span className="badge bg-danger-subtle text-danger ms-1">{unreadCount} nuevas</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="btn btn-link btn-sm text-decoration-none p-0 text-muted"
                    style={{ fontSize: '0.75rem' }}
                  >
                    Marcar leídas
                  </button>
                )}
              </div>

              <div className="card-body p-0" style={{ maxHeight: '340px', overflowY: 'auto' }}>
                {notifData.notificaciones.length === 0 ? (
                  <div className="p-4 text-center text-muted" style={{ fontSize: '0.875rem' }}>
                    <CheckCircle2 size={32} className="text-success mb-2 opacity-75" />
                    <div>¡Todo al día! No hay notificaciones pendientes.</div>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {notifData.notificaciones.map((item) => (
                      <div
                        key={item.id}
                        className="list-group-item list-group-item-action p-3 border-bottom cursor-pointer"
                        onClick={() => {
                          setShowNotifications(false);
                          if (item.link) navigate(item.link);
                        }}
                      >
                        <div className="d-flex gap-2">
                          <div className="mt-1">
                            {item.tipo === 'danger' ? (
                              <AlertTriangle className="text-danger" size={18} />
                            ) : item.tipo === 'warning' ? (
                              <AlertTriangle className="text-warning" size={18} />
                            ) : (
                              <Info className="text-info" size={18} />
                            )}
                          </div>
                          <div>
                            <div className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>{item.titulo}</div>
                            <div className="text-muted mb-1" style={{ fontSize: '0.8rem' }}>{item.mensaje}</div>
                            <div className="text-primary d-flex align-items-center gap-1 fw-semibold" style={{ fontSize: '0.75rem' }}>
                              <span>Ver detalle</span>
                              <ArrowRight size={12} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card-footer bg-light text-center py-2">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/historial');
                  }}
                  className="btn btn-link btn-sm text-decoration-none fw-bold text-primary"
                  style={{ fontSize: '0.8rem' }}
                >
                  Ver Historial Completo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Info Pill */}
        <div className="d-flex align-items-center gap-2 ps-3 border-start">
          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: '40px', height: '40px' }}>
            {user?.nombre?.charAt(0) || 'C'}
          </div>
          <div>
            <div className="fw-bold text-dark" style={{ fontSize: '0.9rem', lineHeight: '1.2' }}>
              {user?.nombre || 'Carlos Admin'}
            </div>
            <div className="text-muted" style={{ fontSize: '0.775rem' }}>
              {user?.rol || 'Administrador'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

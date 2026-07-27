import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Bell, AlertTriangle, CheckCircle2, Info, ArrowRight, Menu } from 'lucide-react';

const Navbar = ({ title, breadcrumbs, onToggleSidebar }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifData, setNotifData] = useState({ total_no_leidas: 0, notificaciones: [] });
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchNotificaciones = async () => {
    try {
      const res = await api.get('/notificaciones');
      if (res.data?.success) {
        const list = Array.isArray(res.data?.data?.notificaciones) ? res.data.data.notificaciones : [];
        const count = typeof res.data?.data?.total_no_leidas === 'number' ? res.data.data.total_no_leidas : 0;
        setNotifData({ total_no_leidas: count, notificaciones: list });
        setUnreadCount(count);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotificaciones();
  }, []);

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

  const notificacionesList = Array.isArray(notifData?.notificaciones) ? notifData.notificaciones : [];

  return (
    <header className="app-navbar">
      <div className="d-flex align-items-center">
        <button
          onClick={onToggleSidebar}
          className="btn btn-light border p-2 me-2 text-dark d-lg-none rounded-3 shadow-sm"
          title="Abrir menú de navegación"
        >
          <Menu size={22} />
        </button>
        <div>
          <h2 className="nav-page-title">{title}</h2>
          <div className="nav-breadcrumbs">
            <span>Depto. Mantenimiento</span>
            {breadcrumbs && <span className="d-none d-sm-inline"> • {breadcrumbs}</span>}
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2 gap-sm-3">
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

          {showNotifications && (
            <div
              className="card border-0 shadow-lg position-absolute end-0 mt-2 rounded-3"
              style={{ width: 'min(360px, 88vw)', zIndex: 9999 }}
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
                {notificacionesList.length === 0 ? (
                  <div className="p-4 text-center text-muted" style={{ fontSize: '0.875rem' }}>
                    <CheckCircle2 size={32} className="text-success mb-2 opacity-75" />
                    <div>¡Todo al día! No hay notificaciones pendientes.</div>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {notificacionesList.map((item) => (
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

        <div className="d-flex align-items-center gap-2 ps-2 ps-sm-3 border-start">
          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: '38px', height: '38px', flexShrink: 0 }}>
            {user?.nombre?.charAt(0) || 'C'}
          </div>
          <div className="user-profile-text">
            <div className="fw-bold text-dark" style={{ fontSize: '0.85rem', lineHeight: '1.2' }}>
              {user?.nombre || 'Carlos Admin'}
            </div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
              {user?.rol || 'Administrador'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

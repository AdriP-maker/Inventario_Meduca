import React, { useState, useEffect, useContext } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { ToastContext } from '../../context/ToastContext';
import { Settings, Lock, Save, KeyRound, Eye, EyeOff } from 'lucide-react';

const ConfiguracionPage = () => {
  const { user } = useContext(AuthContext);
  const { toast } = useContext(ToastContext);

  const [config, setConfig] = useState({
    sistema_nombre: 'Sistema de Control de Préstamo de Herramientas',
    institucion_nombre: 'MEDUCA Coclé - Departamento de Mantenimiento',
    version: '1.0.0',
    contacto_soporte: 'soporte.cocle@meduca.gob.pa'
  });

  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [showNuevaPass, setShowNuevaPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  useEffect(() => {
    api.get('/configuracion').then((res) => {
      if (res.data.success && res.data.data) {
        const c = res.data.data;
        setConfig({
          sistema_nombre: c.sistema_nombre?.valor || config.sistema_nombre,
          institucion_nombre: c.institucion_nombre?.valor || config.institucion_nombre,
          version: c.version?.valor || config.version,
          contacto_soporte: c.contacto_soporte?.valor || config.contacto_soporte
        });
      }
    });
  }, []);

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/configuracion', config);
      if (res.data.success) {
        toast.success('Configuración guardada.');
      }
    } catch (err) {
      toast.error('Error al guardar.');
    }
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    if (nuevaPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }
    try {
      const res = await api.post('/configuracion/cambiar-password', {
        nueva_password: nuevaPassword,
        confirmar_password: confirmarPassword
      });
      if (res.data.success) {
        toast.success('Contraseña actualizada.');
        setNuevaPassword('');
        setConfirmarPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al actualizar contraseña');
    }
  };

  return (
    <Layout title="Configuración" breadcrumbs="Configuración general del sistema y cuenta">
      <div className="row g-4">
        {/* General Info Form */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                <Settings size={20} className="text-primary" />
                <span>Información General del Sistema</span>
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSaveGeneral}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Nombre del Sistema</label>
                  <input
                    type="text"
                    className="form-control"
                    value={config.sistema_nombre}
                    onChange={(e) => setConfig({ ...config, sistema_nombre: e.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Institución</label>
                  <input
                    type="text"
                    className="form-control"
                    value={config.institucion_nombre}
                    onChange={(e) => setConfig({ ...config, institucion_nombre: e.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Versión del Sistema</label>
                  <input
                    type="text"
                    className="form-control"
                    value={config.version}
                    disabled
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Correo de Soporte Técnico</label>
                  <input
                    type="email"
                    className="form-control"
                    value={config.contacto_soporte}
                    onChange={(e) => setConfig({ ...config, contacto_soporte: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary fw-bold d-flex align-items-center gap-2"
                  style={{ background: '#1a5bb8', borderColor: '#1a5bb8' }}
                >
                  <Save size={18} />
                  <span>Guardar Cambios</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Security & Password Form */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                <KeyRound size={20} className="text-success" />
                <span>Configuración de Cuenta</span>
              </h5>
            </div>
            <div className="card-body">
              <div className="p-3 bg-light rounded mb-4">
                <div className="text-muted" style={{ fontSize: '0.85rem' }}>Usuario Actual:</div>
                <div className="fw-bold fs-6 text-dark">{user?.usuario || 'admin'} ({user?.nombre})</div>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>Rol: {user?.rol || 'Administrador'}</div>
              </div>

              <form onSubmit={handleCambiarPassword}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Nueva Contraseña</label>
                  <div className="input-group">
                    <input
                      type={showNuevaPass ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Mínimo 6 caracteres"
                      value={nuevaPassword}
                      onChange={(e) => setNuevaPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowNuevaPass(!showNuevaPass)}
                      title={showNuevaPass ? 'Ocultar' : 'Mostrar'}
                      tabIndex="-1"
                    >
                      {showNuevaPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Confirmar Nueva Contraseña</label>
                  <div className="input-group">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Repita la nueva contraseña"
                      value={confirmarPassword}
                      onChange={(e) => setConfirmarPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      title={showConfirmPass ? 'Ocultar' : 'Mostrar'}
                      tabIndex="-1"
                    >
                      {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn btn-success fw-bold d-flex align-items-center gap-2">
                  <Lock size={18} />
                  <span>Actualizar Contraseña</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ConfiguracionPage;

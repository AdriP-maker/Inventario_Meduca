import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import logoMeduca from '../../assets/logo_meduca.png';
import { LogIn, Lock, User, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const [usuario, setUsuario] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [errorMsg, setErrorMsg] = useState('');
  const { login, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const res = await login(usuario, password);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="login-container">
      {/* Left Branding Banner */}
      <div className="login-banner">
        <div className="bg-white rounded-4 p-3 mb-4 shadow-lg d-flex align-items-center justify-content-center" style={{ width: '130px', height: '130px' }}>
          <img 
            src={logoMeduca} 
            alt="MEDUCA Coclé Logo" 
            style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'contain' }} 
          />
        </div>
        <h1 className="login-banner-title">MEDUCA COCLÉ</h1>
        <p className="login-banner-subtitle">
          Sistema de Control de Préstamo de Herramientas
        </p>
        <div className="mt-3 text-white-50" style={{ fontSize: '0.9rem' }}>
          Departamento de Mantenimiento • MEDUCA Coclé
        </div>
        <img 
          src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600" 
          alt="Herramientas" 
          className="rounded shadow-lg mt-4 opacity-75"
          style={{ maxWidth: '340px', objectFit: 'cover' }}
        />
      </div>

      {/* Right Login Form */}
      <div className="login-form-wrapper">
        <div className="mb-4 text-center">
          <h2 className="fw-bold text-dark mb-1">Iniciar Sesión</h2>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>
            Ingrese sus credenciales para acceder al sistema
          </p>
        </div>

        {errorMsg && (
          <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
            <AlertCircle size={18} />
            <div>{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold text-secondary">Usuario</label>
            <div className="input-group">
              <span className="input-group-text bg-light"><User size={18} /></span>
              <input
                type="text"
                className="form-control form-control-lg"
                placeholder="Ingrese su usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold text-secondary">Contraseña</label>
            <div className="input-group">
              <span className="input-group-text bg-light"><Lock size={18} /></span>
              <input
                type="password"
                className="form-control form-control-lg"
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-100 fw-bold d-flex align-items-center justify-content-center gap-2"
            disabled={loading}
            style={{ background: '#1a5bb8', borderColor: '#1a5bb8' }}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              <>
                <LogIn size={20} />
                <span>Iniciar Sesión</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 p-3 bg-light rounded text-center" style={{ fontSize: '0.85rem' }}>
          <span className="text-muted">Credenciales de prueba por defecto:</span>
          <br />
          <strong>Usuario:</strong> admin | <strong>Contraseña:</strong> admin123
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

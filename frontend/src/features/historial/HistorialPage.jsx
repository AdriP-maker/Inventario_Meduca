import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { History, Search, User } from 'lucide-react';

const HistorialPage = () => {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchHistorial = async () => {
    try {
      const res = await api.get(`/historial?search=${encodeURIComponent(search)}`);
      if (res.data.success) {
        setHistorial(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorial();
  }, [search]);

  // Semáforo de Colores para las acciones del historial
  const renderAccionBadge = (accion) => {
    if (accion.includes('Devolución') || accion.includes('Inicio de Sesión')) {
      return <span className="badge-status badge-verde">{accion}</span>;
    }
    if (accion.includes('Nuevo Préstamo') || accion.includes('Préstamo')) {
      return <span className="badge-status badge-amarillo">{accion}</span>;
    }
    if (accion.includes('Edición') || accion.includes('Configuración') || accion.includes('Herramienta')) {
      return <span className="badge-status badge-naranja">{accion}</span>;
    }
    if (accion.includes('Eliminación') || accion.includes('Seguridad')) {
      return <span className="badge-status badge-rojo">{accion}</span>;
    }
    return <span className="badge-status badge-azul">{accion}</span>;
  };

  return (
    <Layout title="Historial de Actividades" breadcrumbs="Registro de todas las actividades del sistema">
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3">
          <div className="input-group" style={{ maxWidth: '400px' }}>
            <span className="input-group-text bg-light"><Search size={18} /></span>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar en historial por usuario, acción o detalle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-custom mb-0">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Módulo</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">Cargando audit log...</td>
                </tr>
              ) : historial.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted">No se encontraron registros de auditoría.</td>
                </tr>
              ) : (
                historial.map((row) => (
                  <tr key={row.id}>
                    <td className="text-secondary" style={{ fontSize: '0.85rem' }}>
                      {new Date(row.fecha).toLocaleString()}
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="bg-light rounded-circle p-1 text-primary">
                          <User size={16} />
                        </div>
                        <span className="fw-bold">{row.usuario_nombre}</span>
                      </div>
                    </td>
                    <td>{renderAccionBadge(row.accion)}</td>
                    <td><span className="badge bg-light text-dark fw-semibold">{row.entidad}</span></td>
                    <td className="text-dark">{row.detalle}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default HistorialPage;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';
import {
  Wrench,
  ArrowRightLeft,
  CheckCircle2,
  Users,
  PlusCircle,
  Eye,
  Undo2,
  FileText,
  Clock,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar datos del dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Layout title="Dashboard" breadcrumbs="Resumen general">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando dashboard...</span>
          </div>
        </div>
      </Layout>
    );
  }

  const kpis = data?.kpis || {};
  const prestamosActivos = data?.prestamos_activos || [];
  const devueltosRecientemente = data?.devueltos_recientemente || [];

  const hoy = new Date().toISOString().split('T')[0];
  const prestamosVencidos = prestamosActivos.filter((p) => p.fecha_devolucion_estimada && p.fecha_devolucion_estimada < hoy);

  return (
    <Layout title="Dashboard" breadcrumbs="Mantenimiento • Electricidad • Refrigeración">
      {/* 4 KPI Top Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3 d-flex">
          <div className="stat-card w-100">
            <div className="stat-icon-wrapper stat-icon-blue">
              <Wrench />
            </div>
            <div>
              <div className="stat-value">{kpis.disponibles ?? 0}</div>
              <div className="stat-label">Herramientas Disponibles</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3 d-flex">
          <div className="stat-card w-100">
            <div className="stat-icon-wrapper stat-icon-amber">
              <ArrowRightLeft />
            </div>
            <div>
              <div className="stat-value">{kpis.prestamos_activos ?? 0}</div>
              <div className="stat-label">Préstamos Activos</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3 d-flex">
          <div className="stat-card w-100">
            <div className="stat-icon-wrapper stat-icon-green">
              <CheckCircle2 />
            </div>
            <div>
              <div className="stat-value">{kpis.herramientas_devueltas ?? 0}</div>
              <div className="stat-label">Herramientas Devueltas</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3 d-flex">
          <div className="stat-card w-100">
            <div className="stat-icon-wrapper stat-icon-purple">
              <Users />
            </div>
            <div>
              <div className="stat-value">{kpis.funcionarios_registrados ?? 0}</div>
              <div className="stat-label">Funcionarios Registrados</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Banner: Overdue Loans for Supervisor Action */}
      {prestamosVencidos.length > 0 && (
        <div className="alert alert-danger shadow-sm border-danger border-2 p-3 mb-4 rounded-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-danger text-white p-2.5 rounded-circle d-flex align-items-center justify-content-center">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h6 className="fw-bold mb-0.5 text-danger fs-6">
                ¡Atención! Hay {prestamosVencidos.length} préstamo(s) vencido(s) pendiente(s) por recuperar.
              </h6>
              <div className="text-secondary" style={{ fontSize: '0.85rem' }}>
                Los funcionarios responsables han sobrepasado la fecha límite de devolución. Tramita su recolección o comunícate con ellos.
              </div>
            </div>
          </div>
          <button onClick={() => navigate('/devoluciones')} className="btn btn-danger fw-bold d-flex align-items-center gap-1.5 px-3 py-1.5" style={{ fontSize: '0.85rem' }}>
            <span>Gestionar Devoluciones</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Main Grid: Left Table & Right Side Panel */}
      <div className="row g-4">
        {/* Left Column: Tables */}
        <div className="col-12 col-lg-8 col-xl-9">
          {/* Active Loans Card */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3 d-flex align-items-center justify-content-between">
              <h5 className="mb-0 fw-bold text-primary">Préstamos Activos (Prestados)</h5>
              <button
                onClick={() => navigate('/prestamos/nuevo')}
                className="btn btn-primary btn-sm d-flex align-items-center gap-1 fw-semibold"
                style={{ background: '#1a5bb8', borderColor: '#1a5bb8' }}
              >
                <PlusCircle size={16} />
                <span>Nuevo Préstamo</span>
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>Fecha Préstamo</th>
                    <th>Herramienta</th>
                    <th>A quién se le prestó</th>
                    <th>Escuela / Proyecto</th>
                    <th>Registrado por</th>
                    <th>Estado</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {prestamosActivos.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">
                        No hay préstamos activos en este momento.
                      </td>
                    </tr>
                  ) : (
                    prestamosActivos.map((row) => (
                      <tr key={row.id}>
                        <td>{new Date(row.fecha_prestamo).toLocaleDateString()}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <img
                              src={row.herramienta_foto || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=100'}
                              alt="Herramienta"
                              className="rounded"
                              style={{ width: '36px', height: '36px', objectFit: 'cover' }}
                            />
                            <span className="fw-semibold">{row.herramienta_nombre || 'Herramientas de Trabajo'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="fw-bold">{row.funcionario_nombre} {row.funcionario_apellido}</div>
                          <div className="text-muted" style={{ fontSize: '0.8rem' }}>{row.funcionario_cargo}</div>
                        </td>
                        <td>{row.escuela_proyecto}</td>
                        <td>{row.registrado_por}</td>
                        <td>
                          <span className="badge-status badge-prestado">
                            Prestado
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="d-flex align-items-center justify-content-center gap-1">
                            <button
                              onClick={() => navigate('/devoluciones')}
                              className="btn btn-sm btn-outline-success p-1"
                              title="Registrar Devolución"
                            >
                              <Undo2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recently Returned Loans Card */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0 fw-bold text-dark">Préstamos Devueltos Recientemente</h5>
            </div>
            <div className="table-responsive">
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>Fecha Préstamo</th>
                    <th>Fecha Devolución</th>
                    <th>Herramienta</th>
                    <th>A quién se le prestó</th>
                    <th>Escuela / Proyecto</th>
                    <th>Registrado por</th>
                  </tr>
                </thead>
                <tbody>
                  {devueltosRecientemente.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        No hay registros de devoluciones recientes.
                      </td>
                    </tr>
                  ) : (
                    devueltosRecientemente.map((row) => (
                      <tr key={row.id}>
                        <td>{new Date(row.fecha_prestamo).toLocaleDateString()}</td>
                        <td>{row.fecha_devolucion_real ? new Date(row.fecha_devolucion_real).toLocaleDateString() : 'N/A'}</td>
                        <td>
                          <span className="fw-semibold">{row.herramienta_nombre || 'Herramienta'}</span>
                        </td>
                        <td>{row.funcionario_nombre} {row.funcionario_apellido}</td>
                        <td>{row.escuela_proyecto}</td>
                        <td>{row.registrado_por}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side Panel: Quick Actions & Summary */}
        <div className="col-12 col-lg-4 col-xl-3">
          {/* Quick Actions Card */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h6 className="mb-0 fw-bold text-dark">Acciones Rápidas</h6>
            </div>
            <div className="card-body d-flex flex-column gap-2">
              <button
                onClick={() => navigate('/prestamos/nuevo')}
                className="btn btn-outline-primary text-start d-flex align-items-center gap-2 p-2.5 fw-semibold"
              >
                <PlusCircle size={18} />
                <span>Nuevo Préstamo</span>
              </button>

              <button
                onClick={() => navigate('/devoluciones')}
                className="btn btn-outline-success text-start d-flex align-items-center gap-2 p-2.5 fw-semibold"
              >
                <CheckCircle2 size={18} />
                <span>Registrar Devolución</span>
              </button>

              <button
                onClick={() => navigate('/reportes')}
                className="btn btn-outline-danger text-start d-flex align-items-center gap-2 p-2.5 fw-semibold"
              >
                <FileText size={18} />
                <span>Generar Reporte</span>
              </button>
            </div>
          </div>

          {/* General Summary Card */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <h6 className="mb-0 fw-bold text-dark">Resumen</h6>
            </div>
            <div className="card-body p-0">
              <ul className="list-group list-group-flush">
                <li className="list-group-flush-item p-3 d-flex justify-content-between align-items-center border-bottom">
                  <span className="text-secondary">Total de Herramientas</span>
                  <span className="fw-bold fs-6 text-primary">{kpis.total_herramientas ?? 0}</span>
                </li>
                <li className="list-group-flush-item p-3 d-flex justify-content-between align-items-center border-bottom">
                  <span className="text-secondary">Disponibles</span>
                  <span className="fw-bold fs-6 text-success">{kpis.disponibles ?? 0}</span>
                </li>
                <li className="list-group-flush-item p-3 d-flex justify-content-between align-items-center border-bottom">
                  <span className="text-secondary">Prestadas</span>
                  <span className="fw-bold fs-6 text-warning">{kpis.prestamos_activos ?? 0}</span>
                </li>
                <li className="list-group-flush-item p-3 d-flex justify-content-between align-items-center border-bottom">
                  <span className="text-secondary">En Mantenimiento</span>
                  <span className="fw-bold fs-6 text-danger">{kpis.en_mantenimiento ?? 0}</span>
                </li>
                <li className="list-group-flush-item p-3 d-flex justify-content-between align-items-center">
                  <span className="text-secondary">Dañadas</span>
                  <span className="fw-bold fs-6 text-secondary">{kpis.danadas ?? 0}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;

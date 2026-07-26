import React, { useEffect, useState, useContext } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import { Undo2, CheckCircle2, Search, AlertCircle } from 'lucide-react';

const DevolucionesPage = () => {
  const { toast } = useContext(ToastContext);
  const [prestamosActivos, setPrestamosActivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [selectedPrestamo, setSelectedPrestamo] = useState(null);
  const [estadoDevolucion, setEstadoDevolucion] = useState('Bueno');
  const [observaciones, setObservaciones] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPrestamos = async () => {
    try {
      const res = await api.get('/prestamos');
      if (res.data.success) {
        // Filter active loans
        const activos = res.data.data.filter((p) => p.estado === 'Prestado');
        setPrestamosActivos(activos);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrestamos();
  }, []);

  const handleOpenDevolucion = (p) => {
    setSelectedPrestamo(p);
    setEstadoDevolucion('Bueno');
    setObservaciones('');
  };

  const handleConfirmarDevolucion = async (e) => {
    e.preventDefault();
    if (!selectedPrestamo) return;

    setSubmitting(true);
    try {
      const res = await api.post('/devoluciones/registrar', {
        prestamo_id: selectedPrestamo.id,
        estado_devolucion: estadoDevolucion,
        observaciones: observaciones
      });

      if (res.data.success) {
        toast.success('Devolución registrada.');
        setSelectedPrestamo(null);
        fetchPrestamos();
      }
    } catch (err) {
      toast.error('Error al registrar.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = prestamosActivos.filter((p) => {
    const query = search.toLowerCase();
    return (
      p.codigo_prestamo.toLowerCase().includes(query) ||
      p.funcionario_nombre.toLowerCase().includes(query) ||
      p.funcionario_apellido.toLowerCase().includes(query) ||
      p.escuela_proyecto.toLowerCase().includes(query)
    );
  });

  return (
    <Layout title="Devoluciones" breadcrumbs="Gestionar devoluciones de herramientas">
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <div className="input-group" style={{ maxWidth: '400px' }}>
            <span className="input-group-text bg-light"><Search size={18} /></span>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar préstamo por código, funcionario o proyecto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-custom mb-0">
            <thead>
              <tr>
                <th>ID Préstamo</th>
                <th>Funcionario</th>
                <th>Herramientas</th>
                <th>Fecha Préstamo</th>
                <th>Fecha Devolución Est.</th>
                <th>Estado</th>
                <th className="text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">Cargando préstamos pendientes...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    No hay préstamos activos pendientes por devolver.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="fw-bold text-primary">{p.codigo_prestamo}</td>
                    <td>
                      <div className="fw-bold">{p.funcionario_nombre} {p.funcionario_apellido}</div>
                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>{p.escuela_proyecto}</div>
                    </td>
                    <td>
                      <span className="badge bg-secondary-subtle text-secondary fw-semibold">
                        {p.total_herramientas} herramienta(s)
                      </span>
                    </td>
                    <td>{new Date(p.fecha_prestamo).toLocaleDateString()}</td>
                    <td>{p.fecha_devolucion_estimada ? new Date(p.fecha_devolucion_estimada).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <span className="badge-status badge-prestado">Prestado</span>
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => handleOpenDevolucion(p)}
                        className="btn btn-sm btn-success d-inline-flex align-items-center gap-1 fw-bold px-3"
                      >
                        <Undo2 size={16} />
                        <span>Devolver</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Devolución */}
      {selectedPrestamo && (
        <div className="modal d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold text-success d-flex align-items-center gap-2">
                  <CheckCircle2 size={22} />
                  <span>Registrar Devolución ({selectedPrestamo.codigo_prestamo})</span>
                </h5>
                <button type="button" className="btn-close" onClick={() => setSelectedPrestamo(null)}></button>
              </div>
              <form onSubmit={handleConfirmarDevolucion}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label text-muted" style={{ fontSize: '0.85rem' }}>Funcionario:</label>
                    <div className="fw-bold fs-6">{selectedPrestamo.funcionario_nombre} {selectedPrestamo.funcionario_apellido}</div>
                    <div className="text-muted" style={{ fontSize: '0.85rem' }}>{selectedPrestamo.escuela_proyecto}</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Estado de las Herramientas al entregar</label>
                    <select
                      className="form-select"
                      value={estadoDevolucion}
                      onChange={(e) => setEstadoDevolucion(e.target.value)}
                    >
                      <option value="Excelente">Excelente (Como nueva)</option>
                      <option value="Bueno">Bueno (Sin inconvenientes)</option>
                      <option value="Regular">Regular (Desgaste normal)</option>
                      <option value="Con Daño">Con Daño (Pasar a taller / reparación)</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Observaciones de Devolución</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Ingrese cualquier detalle adicional..."
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setSelectedPrestamo(null)}>Cancelar</button>
                  <button type="submit" className="btn btn-success fw-bold" disabled={submitting}>
                    {submitting ? 'Procesando...' : 'Confirmar Devolución'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default DevolucionesPage;

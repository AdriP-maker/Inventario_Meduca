import React, { useEffect, useState, useContext } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import { Undo2, CheckCircle2, Search, AlertCircle, FileText, Printer, AlertTriangle } from 'lucide-react';
import NotaDanoModal from '../../components/NotaDanoModal';

const DevolucionesPage = () => {
  const { toast } = useContext(ToastContext);
  const [prestamosActivos, setPrestamosActivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Tab mode: 'devoluciones' | 'notas_dano'
  const [activeTab, setActiveTab] = useState('devoluciones');
  const [notasDanoList, setNotasDanoList] = useState([]);

  // Modal Return State
  const [selectedPrestamo, setSelectedPrestamo] = useState(null);
  const [estadoDevolucion, setEstadoDevolucion] = useState('Bueno');
  const [cantidadDanada, setCantidadDanada] = useState(1);
  const [descripcionDano, setDescripcionDano] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modal Damage Note Viewer State
  const [selectedNotaDano, setSelectedNotaDano] = useState(null);
  const [showNotaModal, setShowNotaModal] = useState(false);

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

  const fetchNotasDano = async () => {
    try {
      const res = await api.get('/notas-dano');
      if (res.data.success) {
        setNotasDanoList(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPrestamos();
    fetchNotasDano();
  }, []);

  const handleOpenDevolucion = (p) => {
    setSelectedPrestamo(p);
    setEstadoDevolucion('Bueno');
    setCantidadDanada(1);
    setDescripcionDano('');
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
        cantidad_danada: cantidadDanada,
        descripcion_dano: descripcionDano,
        observaciones: observaciones
      });

      if (res.data.success) {
        toast.success('Devolución de herramientas registrada con éxito.');
        setSelectedPrestamo(null);
        fetchPrestamos();
        fetchNotasDano();

        // If returned with damage, pop up damage note immediately
        if (estadoDevolucion === 'Con Daño') {
          const resNotas = await api.get('/notas-dano');
          if (resNotas.data?.success && resNotas.data.data.length > 0) {
            setSelectedNotaDano(resNotas.data.data[0]);
            setShowNotaModal(true);
          }
        }
      }
    } catch (err) {
      toast.error('Ocurrió un error al registrar la devolución.');
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
    <Layout title="Devoluciones y Actas de Daño" breadcrumbs="Gestionar devoluciones e incidencias de herramientas">
      {/* Navigation Tabs */}
      <div className="d-flex gap-2 mb-3">
        <button
          className={`btn ${activeTab === 'devoluciones' ? 'btn-primary fw-bold' : 'btn-light text-secondary'} d-flex align-items-center gap-2`}
          onClick={() => setActiveTab('devoluciones')}
        >
          <Undo2 size={18} />
          <span>Préstamos por Devolver ({prestamosActivos.length})</span>
        </button>
        <button
          className={`btn ${activeTab === 'notas_dano' ? 'btn-danger fw-bold' : 'btn-light text-secondary'} d-flex align-items-center gap-2`}
          onClick={() => setActiveTab('notas_dano')}
        >
          <FileText size={18} />
          <span>Actas de Daño e Incidencia MEDUCA ({notasDanoList.length})</span>
        </button>
      </div>

      {activeTab === 'devoluciones' ? (
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
                    <td colSpan="7" className="text-center py-4">Cargando devoluciones pendientes...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">No hay préstamos activos pendientes por devolver.</td>
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
                          {p.total_herramientas} tipo(s)
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
      ) : (
        /* Tab 2: Actas de Daño MEDUCA */
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white py-3 fw-bold text-dark d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <AlertTriangle size={20} className="text-danger" />
              <span>Registro Regional de Notas de Daño e Incidencias</span>
            </div>
            <span className="badge bg-danger-subtle text-danger fs-6">{notasDanoList.length} registro(s)</span>
          </div>
          <div className="table-responsive">
            <table className="table table-custom mb-0 align-middle">
              <thead>
                <tr>
                  <th>Código Nota</th>
                  <th>Funcionario Responsable</th>
                  <th>Producto Afectado</th>
                  <th className="text-center">Cant. Dañada</th>
                  <th>Estado Evaluación</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {notasDanoList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">No hay notas de daño registradas en el sistema.</td>
                  </tr>
                ) : (
                  notasDanoList.map((n) => (
                    <tr key={n.id}>
                      <td className="fw-bold text-danger">{n.codigo_nota}</td>
                      <td>
                        <div className="fw-bold">{n.funcionario_nombre} {n.funcionario_apellido}</div>
                        <div className="text-muted" style={{ fontSize: '0.775rem' }}>{n.escuela_proyecto}</div>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{n.herramienta_nombre}</div>
                        <div className="text-muted" style={{ fontSize: '0.775rem' }}>{n.herramienta_codigo}</div>
                      </td>
                      <td className="text-center fw-bold text-danger">{n.cantidad}</td>
                      <td>
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                          {n.estado_evaluacion || 'Pendiente Evaluación'}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          onClick={() => {
                            setSelectedNotaDano(n);
                            setShowNotaModal(true);
                          }}
                          className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1.5 fw-semibold"
                        >
                          <Printer size={15} />
                          <span>Ver Nota / Imprimir</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                  <div className="mb-3 p-3 bg-light rounded border">
                    <label className="form-label text-muted mb-0" style={{ fontSize: '0.85rem' }}>Funcionario Solicante:</label>
                    <div className="fw-bold text-dark fs-6">{selectedPrestamo.funcionario_nombre} {selectedPrestamo.funcionario_apellido}</div>
                    <div className="text-primary fw-semibold" style={{ fontSize: '0.85rem' }}>{selectedPrestamo.escuela_proyecto}</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Estado de los Productos al Devolver *</label>
                    <select
                      className="form-select"
                      value={estadoDevolucion}
                      onChange={(e) => setEstadoDevolucion(e.target.value)}
                    >
                      <option value="Excelente">Excelente (Como nuevo)</option>
                      <option value="Bueno">Bueno (Sin inconvenientes)</option>
                      <option value="Regular">Regular (Desgaste normal)</option>
                      <option value="Con Daño">Con Daño (Generar Nota Oficial MEDUCA)</option>
                    </select>
                  </div>

                  {/* If returned with damage, show quantity and detailed incident fields */}
                  {estadoDevolucion === 'Con Daño' && (
                    <div className="p-3 bg-danger-subtle border border-danger-subtle rounded mb-3">
                      <h6 className="fw-bold text-danger d-flex align-items-center gap-2 mb-2" style={{ fontSize: '0.9rem' }}>
                        <AlertTriangle size={18} />
                        <span>Generar Acta de Daño e Incidencia MEDUCA</span>
                      </h6>
                      <div className="mb-2">
                        <label className="form-label fw-semibold text-danger mb-1" style={{ fontSize: '0.8rem' }}>
                          Cantidad de Unidades Afectadas con Daño *
                        </label>
                        <input
                          type="number"
                          min="1"
                          className="form-control form-control-sm"
                          value={cantidadDanada}
                          onChange={(e) => setCantidadDanada(Math.max(1, parseInt(e.target.value || 1, 10)))}
                          required
                        />
                      </div>
                      <div>
                        <label className="form-label fw-semibold text-danger mb-1" style={{ fontSize: '0.8rem' }}>
                          Descripción Detallada del Daño / Incidencia *
                        </label>
                        <textarea
                          className="form-control form-control-sm"
                          rows="3"
                          placeholder="Explique claramente qué ocurrió con el producto y cuál es la avería para remitir a la regional..."
                          value={descripcionDano}
                          onChange={(e) => setDescripcionDano(e.target.value)}
                          required
                        ></textarea>
                      </div>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Observaciones de la Devolución</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      maxLength={120}
                      placeholder="Observaciones adicionales (máximo 120 caracteres)..."
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

      {/* Nota de Daño Visualizer Modal */}
      <NotaDanoModal
        show={showNotaModal}
        onClose={() => setShowNotaModal(false)}
        nota={selectedNotaDano}
      />
    </Layout>
  );
};

export default DevolucionesPage;

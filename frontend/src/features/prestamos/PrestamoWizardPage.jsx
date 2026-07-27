import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import { UserCheck, Wrench, Calendar, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { validators } from '../../utils/validators';

const PrestamoWizardPage = () => {
  const { toast } = useContext(ToastContext);
  const [step, setStep] = useState(1);
  const [funcionarios, setFuncionarios] = useState([]);
  const [herramientas, setHerramientas] = useState([]);
  const [selectedFuncionario, setSelectedFuncionario] = useState(null);
  const [selectedHerramientas, setSelectedHerramientas] = useState([]);
  const [escuelaProyecto, setEscuelaProyecto] = useState('');
  const [fechaDevolucion, setFechaDevolucion] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [observaciones, setObservaciones] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoadingData(true);
    Promise.all([
      api.get('/funcionarios'),
      api.get('/herramientas?estado=Disponible')
    ]).then(([resFunc, resHerr]) => {
      if (resFunc.data.success) setFuncionarios(resFunc.data.data);
      if (resHerr.data.success) {
        const dispList = (resHerr.data.data || []).filter(h => {
          const stockDisp = parseInt(h.stock_disponible ?? (h.estado === 'Disponible' ? 1 : 0), 10);
          return stockDisp > 0;
        });
        setHerramientas(dispList);
      }
    }).catch(err => {
      console.error(err);
      toast.error('Ocurrió un error al cargar datos para el préstamo.');
    }).finally(() => {
      setLoadingData(false);
    });
  }, []);

  const [selectedHerramientasMap, setSelectedHerramientasMap] = useState({});

  const toggleHerramienta = (id, stockDisp = 1) => {
    const updated = { ...selectedHerramientasMap };
    if (updated[id]) {
      delete updated[id];
    } else {
      updated[id] = 1;
    }
    setSelectedHerramientasMap(updated);
  };

  const setCantidadHerramienta = (id, delta, maxDisp = 1) => {
    const current = selectedHerramientasMap[id] || 1;
    const next = Math.max(1, Math.min(maxDisp, current + delta));
    setSelectedHerramientasMap({
      ...selectedHerramientasMap,
      [id]: next
    });
  };

  const selectedHerramientasIds = Object.keys(selectedHerramientasMap).map(Number);
  const totalCantidadSeleccionada = Object.values(selectedHerramientasMap).reduce((acc, c) => acc + c, 0);

  const handleFinish = async () => {
    const payloadItems = Object.entries(selectedHerramientasMap).map(([id, cant]) => ({
      id: parseInt(id, 10),
      cantidad: cant
    }));

    const err = validators.validatePrestamo({
      funcionario_id: selectedFuncionario?.id,
      herramienta_ids: selectedHerramientasIds,
      escuela_proyecto: escuelaProyecto,
      fecha_devolucion_estimada: fechaDevolucion
    });
    if (err) {
      toast.warning(err);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/prestamos', {
        funcionario_id: selectedFuncionario.id,
        escuela_proyecto: escuelaProyecto,
        fecha_devolucion_estimada: fechaDevolucion,
        observaciones: observaciones,
        herramientas: payloadItems,
        herramientas_ids: selectedHerramientasIds
      });

      if (res.data.success) {
        toast.success('Préstamo registrado exitosamente en el sistema.');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ocurrió un error al registrar el préstamo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <Layout title="Nuevo Préstamo de Herramientas" breadcrumbs="Cargando catálogo...">
        <div className="card border-0 shadow-sm p-5 text-center my-4">
          <div className="spinner-border text-primary mx-auto mb-3" role="status" style={{ width: '3rem', height: '3rem' }}></div>
          <h5 className="fw-bold text-dark mb-1">Cargando Datos de Inventario</h5>
          <p className="text-muted mb-0">Consultando funcionarios y catálogo de productos disponibles...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Nuevo Préstamo de Herramientas" breadcrumbs="Registrar un nuevo préstamo">
      <div className="card border-0 shadow-sm p-3 p-md-4">
        {/* Stepper Navigation */}
        <div className="mb-4 mb-md-5 position-relative" style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div 
            className="position-absolute top-0 start-0 w-100 border-top border-2 text-secondary-subtle" 
            style={{ zIndex: 0, marginTop: '23px' }} 
          />

          <div className="row g-1 g-sm-2 position-relative z-1">
            {[
              { id: 1, title: 'Seleccionar Funcionario', shortTitle: 'Funcionario' },
              { id: 2, title: 'Seleccionar Herramientas', shortTitle: 'Herramientas' },
              { id: 3, title: 'Fechas y Observaciones', shortTitle: 'Detalles' },
              { id: 4, title: 'Confirmar Préstamo', shortTitle: 'Confirmar' }
            ].map((st) => {
              const isActive = step >= st.id;
              const isCurrent = step === st.id;
              return (
                <div key={st.id} className="col-3 d-flex flex-column align-items-center text-center">
                  <div
                    className={`rounded-circle d-flex align-items-center justify-content-center fw-bold mb-2 shadow-sm transition-all ${
                      isActive ? 'bg-primary text-white border border-2 border-primary' : 'bg-white text-secondary border border-2'
                    }`}
                    style={{ 
                      width: '42px', 
                      height: '42px', 
                      fontSize: '0.95rem',
                      transform: isCurrent ? 'scale(1.08)' : 'scale(1)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {st.id}
                  </div>
                  <div
                    className={`fw-semibold text-center px-1 ${
                      isActive ? 'text-primary' : 'text-muted'
                    }`}
                    style={{ fontSize: '0.75rem', lineHeight: '1.2' }}
                  >
                    <span className="d-none d-sm-block text-muted text-uppercase fw-bold mb-0.5" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>
                      Paso {st.id}
                    </span>
                    <span className="d-none d-sm-inline">{st.title}</span>
                    <span className="d-inline d-sm-none">{st.shortTitle}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Steps Content */}
        {step === 1 && (
          <div>
            <h5 className="fw-bold mb-3">1. Seleccionar Funcionario Responsable</h5>
            <div className="row g-3">
              {funcionarios.map((f) => (
                <div key={f.id} className="col-12 col-md-6 col-lg-4">
                  <div
                    onClick={() => setSelectedFuncionario(f)}
                    className={`p-3 rounded-3 border cursor-pointer transition-all ${
                      selectedFuncionario?.id === f.id
                        ? 'border-primary bg-primary-subtle shadow-sm'
                        : 'bg-white border-light-subtle hover-shadow'
                    }`}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div className={`rounded-circle p-2 ${selectedFuncionario?.id === f.id ? 'bg-primary text-white' : 'bg-light text-secondary'}`}>
                        <UserCheck size={20} />
                      </div>
                      <div>
                        <div className="fw-bold text-dark">{f.nombre} {f.apellido}</div>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>Cédula: {f.cedula}</div>
                        <div className="text-primary fw-semibold" style={{ fontSize: '0.75rem' }}>{f.cargo}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Seleccionar Herramientas con Cantidades */}
        {step === 2 && (
          <div>
            <h5 className="fw-bold mb-3">2. Seleccionar Productos y Cantidad a Prestar</h5>
            <div className="row g-3">
              {herramientas.length === 0 ? (
                <div className="alert alert-warning">No hay herramientas con stock disponible en inventario.</div>
              ) : (
                herramientas.map((h) => {
                  const isSelected = !!selectedHerramientasMap[h.id];
                  const cantSel = selectedHerramientasMap[h.id] || 1;
                  const maxDisp = parseInt(h.stock_disponible ?? (h.estado === 'Disponible' ? 1 : 0), 10);

                  return (
                    <div key={h.id} className="col-12 col-md-6 col-lg-4">
                      <div className={`card h-100 p-3 border transition-all ${isSelected ? 'border-primary bg-primary-subtle shadow-sm' : ''}`}>
                        <div className="d-flex align-items-start gap-3">
                          <input
                            type="checkbox"
                            className="form-check-input flex-shrink-0 mt-1 cursor-pointer"
                            checked={isSelected}
                            onChange={() => toggleHerramienta(h.id, maxDisp)}
                          />
                          <img src={h.foto_url} alt={h.nombre} className="rounded flex-shrink-0" style={{ width: '48px', height: '48px', objectFit: 'cover' }} />
                          <div className="flex-grow-1">
                            <div className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>{h.nombre}</div>
                            <div className="text-muted mb-1" style={{ fontSize: '0.775rem' }}>{h.codigo} • {h.marca}</div>
                            <div className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '0.725rem' }}>
                              Disponibles: {maxDisp} unidad(es)
                            </div>

                            {/* Quantity Selector if selected */}
                            {isSelected && (
                              <div className="mt-2 pt-2 border-top d-flex align-items-center justify-content-between">
                                <span className="text-dark fw-semibold" style={{ fontSize: '0.8rem' }}>Cantidad:</span>
                                <div className="input-group input-group-sm" style={{ width: '100px' }}>
                                  <button
                                    className="btn btn-outline-secondary"
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setCantidadHerramienta(h.id, -1, maxDisp); }}
                                    disabled={cantSel <= 1}
                                  >-</button>
                                  <input
                                    type="text"
                                    className="form-control text-center fw-bold bg-white"
                                    value={cantSel}
                                    readOnly
                                  />
                                  <button
                                    className="btn btn-outline-secondary"
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setCantidadHerramienta(h.id, 1, maxDisp); }}
                                    disabled={cantSel >= maxDisp}
                                  >+</button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="mt-3 text-secondary fw-semibold">
              Tipos de productos seleccionados: <strong>{selectedHerramientasIds.length}</strong> ({totalCantidadSeleccionada} unidad(es) total).
            </div>
          </div>
        )}

        {/* Step 3: Fechas y Proyecto */}
        {step === 3 && (
          <div>
            <h5 className="fw-bold mb-3">3. Fechas y Ubicación del Trabajo</h5>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label fw-semibold">Escuela / Proyecto / Lugar de Trabajo *</label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Ej: Escuela José María La Vega - Penonomé"
                  value={escuelaProyecto}
                  onChange={(e) => setEscuelaProyecto(e.target.value)}
                  minLength={3}
                  maxLength={80}
                  required
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Fecha Estimada de Devolución *</label>
                <input
                  type="date"
                  className="form-control"
                  value={fechaDevolucion}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFechaDevolucion(e.target.value)}
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">Observaciones o Motivo del Préstamo</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Describa el trabajo a realizar o estado al entregar (máximo 120 caracteres)..."
                  value={observaciones}
                  maxLength={120}
                  onChange={(e) => setObservaciones(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Resumen y Confirmación */}
        {step === 4 && (
          <div>
            <h5 className="fw-bold mb-3">4. Confirmación y Registro de Préstamo</h5>
            <div className="card bg-light border-0 p-4 mb-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <span className="text-muted d-block fs-7">Funcionario Solicitante:</span>
                  <span className="fw-bold text-dark fs-6">{selectedFuncionario?.nombre} {selectedFuncionario?.apellido}</span>
                  <span className="d-block text-secondary fs-7">{selectedFuncionario?.cargo} ({selectedFuncionario?.cedula})</span>
                </div>
                <div className="col-md-6">
                  <span className="text-muted d-block fs-7">Lugar / Proyecto:</span>
                  <span className="fw-bold text-dark fs-6">{escuelaProyecto}</span>
                  <span className="d-block text-primary fs-7">Devolución Estimada: {fechaDevolucion}</span>
                </div>
              </div>
            </div>

            <h6 className="fw-bold mb-2">Herramientas Asignadas ({selectedHerramientas.length}):</h6>
            <div className="list-group mb-4">
              {herramientas.filter(h => selectedHerramientas.includes(h.id)).map(h => (
                <div key={h.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <span className="fw-bold text-dark me-2">{h.codigo}</span>
                    <span>{h.nombre} ({h.marca})</span>
                  </div>
                  <span className="badge bg-success-subtle text-success">Disponible</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="d-flex flex-column-reverse flex-sm-row justify-content-between align-items-center gap-2.5 mt-4 mt-sm-5 pt-3 border-top">
          {step > 1 ? (
            <button
              className="btn btn-outline-secondary w-100 w-sm-auto d-flex align-items-center justify-content-center gap-2 fw-semibold py-2 px-3"
              onClick={() => setStep(step - 1)}
              disabled={submitting}
            >
              <ArrowLeft size={18} />
              <span>Anterior</span>
            </button>
          ) : <div className="d-none d-sm-block" />}

          {step < 4 ? (
            <button
              className="btn btn-primary w-100 w-sm-auto d-flex align-items-center justify-content-center gap-2 fw-semibold py-2 px-3"
              style={{ background: '#1a5bb8', borderColor: '#1a5bb8' }}
              onClick={() => {
                if (step === 1 && !selectedFuncionario) return toast.warning('Debe seleccionar un funcionario responsable del préstamo.');
                if (step === 2 && selectedHerramientas.length === 0) return toast.warning('Debe seleccionar al menos una herramienta disponible.');
                if (step === 3) {
                  const err = validators.validatePrestamo({
                    funcionario_id: selectedFuncionario?.id,
                    herramientas_ids: selectedHerramientas,
                    escuela_proyecto: escuelaProyecto,
                    fecha_devolucion_estimada: fechaDevolucion,
                    observaciones: observaciones
                  });
                  if (err) return toast.warning(err);
                }
                setStep(step + 1);
              }}
            >
              <span>Siguiente</span>
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              className="btn btn-success w-100 w-sm-auto d-flex align-items-center justify-content-center gap-2 fw-bold py-2 px-3"
              onClick={handleFinish}
              disabled={submitting}
            >
              {submitting ? 'Guardando...' : 'Confirmar y Guardar Préstamo'}
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PrestamoWizardPage;

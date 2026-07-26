import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import { UserCheck, Wrench, Calendar, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

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
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/funcionarios').then((res) => {
      if (res.data.success) setFuncionarios(res.data.data);
    });

    api.get('/herramientas?estado=Disponible').then((res) => {
      if (res.data.success) setHerramientas(res.data.data);
    });
  }, []);

  const toggleHerramienta = (id) => {
    if (selectedHerramientas.includes(id)) {
      setSelectedHerramientas(selectedHerramientas.filter((item) => item !== id));
    } else {
      setSelectedHerramientas([...selectedHerramientas, id]);
    }
  };

  const handleFinish = async () => {
    if (!selectedFuncionario || selectedHerramientas.length === 0 || !escuelaProyecto) {
      toast.warning('Complete todos los datos.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/prestamos', {
        funcionario_id: selectedFuncionario.id,
        escuela_proyecto: escuelaProyecto,
        fecha_devolucion_estimada: fechaDevolucion,
        observaciones: observaciones,
        herramientas_ids: selectedHerramientas
      });

      if (res.data.success) {
        toast.success('Préstamo registrado.');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al registrar préstamo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="Nuevo Préstamo de Herramientas" breadcrumbs="Registrar un nuevo préstamo">
      <div className="card border-0 shadow-sm p-4">
        {/* Stepper Navigation */}
        <div className="mb-5 position-relative" style={{ maxWidth: '850px', margin: '0 auto' }}>
          {/* Background Connecting Line */}
          <div 
            className="position-absolute top-0 start-0 w-100 border-top border-2 text-secondary-subtle" 
            style={{ zIndex: 0, marginTop: '23px' }} 
          />

          <div className="row g-2 position-relative z-1">
            {[
              { id: 1, title: 'Seleccionar Funcionario' },
              { id: 2, title: 'Seleccionar Herramientas' },
              { id: 3, title: 'Fechas y Observaciones' },
              { id: 4, title: 'Confirmar Préstamo' }
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
                      width: '46px', 
                      height: '46px', 
                      fontSize: '1rem',
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
                    style={{ fontSize: '0.8rem', lineHeight: '1.25' }}
                  >
                    <span className="d-block text-muted text-uppercase fw-bold mb-0.5" style={{ fontSize: '0.675rem', letterSpacing: '0.5px' }}>
                      Paso {st.id}
                    </span>
                    {st.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 1: Seleccionar Funcionario */}
        {step === 1 && (
          <div>
            <h5 className="fw-bold mb-3">1. Seleccionar Funcionario que solicita el préstamo</h5>
            <div className="mb-4">
              <label className="form-label fw-semibold">Buscar / Seleccionar Funcionario</label>
              <select
                className="form-select form-select-lg"
                value={selectedFuncionario?.id || ''}
                onChange={(e) => {
                  const f = funcionarios.find((item) => item.id === parseInt(e.target.value));
                  setSelectedFuncionario(f);
                }}
              >
                <option value="">-- Seleccionar Funcionario registrado --</option>
                {funcionarios.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nombre} {f.apellido} — {f.cargo} ({f.cedula})
                  </option>
                ))}
              </select>
            </div>

            {selectedFuncionario && (
              <div className="p-3 bg-light rounded border border-primary-subtle d-flex align-items-center gap-3">
                <UserCheck size={32} className="text-primary" />
                <div>
                  <h6 className="fw-bold mb-1">{selectedFuncionario.nombre} {selectedFuncionario.apellido}</h6>
                  <p className="mb-0 text-muted" style={{ fontSize: '0.85rem' }}>
                    <strong>Cargo:</strong> {selectedFuncionario.cargo} | <strong>Cédula:</strong> {selectedFuncionario.cedula} | <strong>Teléfono:</strong> {selectedFuncionario.telefono || 'N/A'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Seleccionar Herramientas */}
        {step === 2 && (
          <div>
            <h5 className="fw-bold mb-3">2. Seleccionar Herramientas a prestar (Estado Disponible)</h5>
            <div className="row g-3">
              {herramientas.length === 0 ? (
                <div className="alert alert-warning">No hay herramientas disponibles en inventario.</div>
              ) : (
                herramientas.map((h) => (
                  <div key={h.id} className="col-12 col-md-6 col-lg-4">
                    <div
                      className={`card h-100 p-3 cursor-pointer border ${selectedHerramientas.includes(h.id) ? 'border-primary bg-primary-subtle' : ''}`}
                      onClick={() => toggleHerramienta(h.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <input
                          type="checkbox"
                          className="form-check-input flex-shrink-0"
                          checked={selectedHerramientas.includes(h.id)}
                          onChange={() => {}}
                        />
                        <img src={h.foto_url} alt={h.nombre} className="rounded" style={{ width: '48px', height: '48px', objectFit: 'cover' }} />
                        <div>
                          <div className="fw-bold" style={{ fontSize: '0.9rem' }}>{h.nombre}</div>
                          <div className="text-muted" style={{ fontSize: '0.775rem' }}>{h.codigo} • {h.marca}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-3 text-muted">
              Seleccionadas: <strong>{selectedHerramientas.length}</strong> herramientas.
            </div>
          </div>
        )}

        {/* Step 3: Fechas y Proyecto */}
        {step === 3 && (
          <div>
            <h5 className="fw-bold mb-3">3. Fechas y Ubicación del Trabajo</h5>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label fw-semibold">Escuela / Proyecto / Lugar de Trabajo</label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Ej: Escuela José María La Vega - Penonomé"
                  value={escuelaProyecto}
                  onChange={(e) => setEscuelaProyecto(e.target.value)}
                  required
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Fecha Estimada de Devolución</label>
                <input
                  type="date"
                  className="form-control"
                  value={fechaDevolucion}
                  onChange={(e) => setFechaDevolucion(e.target.value)}
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">Observaciones o Motivo del Préstamo</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Describa el trabajo a realizar o el estado de las herramientas al entregar..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirmar */}
        {step === 4 && (
          <div>
            <h5 className="fw-bold mb-3 text-success d-flex align-items-center gap-2">
              <CheckCircle2 size={24} />
              <span>4. Confirmación de Datos del Préstamo</span>
            </h5>
            <div className="bg-light p-4 rounded border mb-4">
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <span className="text-muted d-block" style={{ fontSize: '0.85rem' }}>Funcionario Receptor:</span>
                  <strong className="fs-6">{selectedFuncionario?.nombre} {selectedFuncionario?.apellido}</strong> ({selectedFuncionario?.cargo})
                </div>
                <div className="col-12 col-md-6">
                  <span className="text-muted d-block" style={{ fontSize: '0.85rem' }}>Escuela / Proyecto:</span>
                  <strong className="fs-6">{escuelaProyecto}</strong>
                </div>
                <div className="col-12 col-md-6">
                  <span className="text-muted d-block" style={{ fontSize: '0.85rem' }}>Fecha Dev. Estimada:</span>
                  <strong>{fechaDevolucion}</strong>
                </div>
                <div className="col-12">
                  <span className="text-muted d-block" style={{ fontSize: '0.85rem' }}>Herramientas Seleccionadas ({selectedHerramientas.length}):</span>
                  <ul className="mt-1 mb-0">
                    {herramientas.filter(h => selectedHerramientas.includes(h.id)).map(h => (
                      <li key={h.id}><strong>{h.codigo}</strong> - {h.nombre} ({h.marca})</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stepper Buttons */}
        <div className="d-flex justify-content-between mt-4 pt-3 border-top">
          <button
            className="btn btn-outline-secondary d-flex align-items-center gap-2"
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
          >
            <ArrowLeft size={18} />
            <span>Anterior</span>
          </button>

          {step < 4 ? (
            <button
              className="btn btn-primary d-flex align-items-center gap-2 fw-semibold"
              style={{ background: '#1a5bb8', borderColor: '#1a5bb8' }}
              onClick={() => {
                if (step === 1 && !selectedFuncionario) return toast.warning('Seleccione un funcionario.');
                if (step === 2 && selectedHerramientas.length === 0) return toast.warning('Seleccione una herramienta.');
                if (step === 3 && !escuelaProyecto) return toast.warning('Indique la escuela o proyecto.');
                setStep(step + 1);
              }}
            >
              <span>Siguiente</span>
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              className="btn btn-success d-flex align-items-center gap-2 fw-bold"
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

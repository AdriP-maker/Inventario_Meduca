import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, Wrench, User, FileText, X, AlertCircle } from 'lucide-react';

const DisponibilidadModal = ({ show, onClose, data, loading }) => {
  if (!show) return null;

  const h = data?.herramienta || {};
  const prestamosActivos = data?.prestamos_activos || [];
  const notasDano = data?.notas_dano || [];

  const parseVal = (val, defaultVal = 0) => {
    if (val === null || val === undefined) return defaultVal;
    return parseInt(val, 10);
  };

  const cantPrestadaCalc = prestamosActivos.reduce((acc, p) => acc + parseInt(p.cantidad || 1, 10), 0);
  const cantDanadaCalc = notasDano.reduce((acc, n) => acc + parseInt(n.cantidad || 1, 10), 0);

  const total = parseVal(h.stock_total, 1);
  const prestado = parseVal(h.stock_prestado, cantPrestadaCalc > 0 ? cantPrestadaCalc : (h.estado === 'Prestado' ? 1 : 0));
  const danado = parseVal(h.stock_danado, cantDanadaCalc > 0 ? cantDanadaCalc : (h.estado === 'Dañado' ? 1 : 0));
  const disponible = parseVal(h.stock_disponible, Math.max(0, total - prestado - danado));

  const esSinStock = disponible <= 0;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(12, 35, 64, 0.65)', zIndex: 1060 }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          
          {/* Header */}
          <div className={`modal-header py-3 border-0 ${esSinStock ? 'bg-danger text-white' : 'bg-primary text-white'}`}>
            <div className="d-flex align-items-center gap-2">
              {esSinStock ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
              <div>
                <h5 className="modal-title fw-bold mb-0" style={{ fontSize: '1.15rem' }}>
                  Estado de Disponibilidad: {h.nombre}
                </h5>
                <span className="opacity-75" style={{ fontSize: '0.8rem' }}>
                  Código: {h.codigo} • Marca: {h.marca || 'N/A'}
                </span>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <div className="text-muted mt-2">Cargando desglose de inventario...</div>
              </div>
            ) : (
              <>
                {/* Status Explanation Banner ("Manzanas y Peras") */}
                <div className={`p-3.5 rounded-3 mb-4 border d-flex align-items-start gap-3 ${esSinStock ? 'bg-danger-subtle text-danger border-danger-subtle' : 'bg-success-subtle text-success border-success-subtle'}`}>
                  <AlertCircle size={24} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <h6 className="fw-bold mb-1">
                      {esSinStock 
                        ? '¡Atención! Este producto NO tiene unidades disponibles para préstamos.' 
                        : `Producto disponible (${disponible} de ${total} unidades listas para uso).`}
                    </h6>
                    <p className="mb-0" style={{ fontSize: '0.875rem', lineHeight: '1.45' }}>
                      {esSinStock ? (
                        <>
                          Todas las <strong>{total} unidades</strong> registradas se encuentran actualmente prestadas a funcionarios o reportadas con daño. A continuación puedes ver exactamente quién las tiene y cuándo debe devolverlas.
                        </>
                      ) : (
                        <>
                          Actualmente hay <strong>{disponible} unidad(es) disponible(s)</strong> en la Bodega de Mantenimiento.
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Metric Summary Cards */}
                <div className="row g-2 mb-4">
                  <div className="col-6 col-sm-3">
                    <div className="p-3 bg-light rounded-3 text-center border">
                      <div className="text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>STOCK TOTAL</div>
                      <div className="fs-3 fw-bold text-dark">{total}</div>
                    </div>
                  </div>
                  <div className="col-6 col-sm-3">
                    <div className="p-3 bg-success-subtle rounded-3 text-center border border-success-subtle">
                      <div className="text-success fw-bold" style={{ fontSize: '0.75rem' }}>DISPONIBLES</div>
                      <div className="fs-3 fw-bold text-success">{disponible}</div>
                    </div>
                  </div>
                  <div className="col-6 col-sm-3">
                    <div className="p-3 bg-warning-subtle rounded-3 text-center border border-warning-subtle">
                      <div className="text-warning-emphasis fw-bold" style={{ fontSize: '0.75rem' }}>EN PRÉSTAMO</div>
                      <div className="fs-3 fw-bold text-warning-emphasis">{prestado}</div>
                    </div>
                  </div>
                  <div className="col-6 col-sm-3">
                    <div className="p-3 bg-danger-subtle rounded-3 text-center border border-danger-subtle">
                      <div className="text-danger fw-bold" style={{ fontSize: '0.75rem' }}>CON DAÑO</div>
                      <div className="fs-3 fw-bold text-danger">{danado}</div>
                    </div>
                  </div>
                </div>

                {/* Section 1: Active Loans Breakdown */}
                <div className="mb-4">
                  <h6 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3">
                    <Clock size={18} className="text-warning-emphasis" />
                    <span>¿Quién tiene prestado este producto? ({prestamosActivos.reduce((acc, p) => acc + parseInt(p.cantidad || 1, 10), 0)} unidades)</span>
                  </h6>

                  {prestamosActivos.length === 0 ? (
                    <div className="p-3 bg-light rounded text-muted text-center" style={{ fontSize: '0.875rem' }}>
                      No hay préstamos activos registrados para este producto.
                    </div>
                  ) : (
                    <div className="table-responsive rounded border">
                      <table className="table table-sm align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                        <thead className="bg-light text-secondary">
                          <tr>
                            <th>Funcionario Solicante</th>
                            <th>Proyecto / Lugar</th>
                            <th className="text-center">Cant.</th>
                            <th>Fecha Límite</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {prestamosActivos.map((p, idx) => {
                            const fechaDev = p.fecha_devolucion_estimada;
                            const hoy = new Date().toISOString().split('T')[0];
                            const esAtrasado = fechaDev && fechaDev < hoy;

                            return (
                              <tr key={idx}>
                                <td>
                                  <div className="fw-bold text-dark">{p.funcionario_nombre} {p.funcionario_apellido}</div>
                                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>{p.funcionario_cargo} ({p.funcionario_cedula})</div>
                                </td>
                                <td>
                                  <span className="badge bg-secondary-subtle text-secondary">{p.escuela_proyecto}</span>
                                </td>
                                <td className="text-center fw-bold">{p.cantidad}</td>
                                <td>
                                  <div className={`fw-semibold ${esAtrasado ? 'text-danger' : 'text-dark'}`}>
                                    {fechaDev || 'Sin fecha'}
                                  </div>
                                </td>
                                <td>
                                  {esAtrasado ? (
                                    <span className="badge bg-danger text-white">Vencido (Atrasado)</span>
                                  ) : (
                                    <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">En Préstamo</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Section 2: Damage Notes Breakdown */}
                {notasDano.length > 0 && (
                  <div>
                    <h6 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3">
                      <FileText size={18} className="text-danger" />
                      <span>Reportes de Daño Asociados ({notasDano.reduce((acc, n) => acc + parseInt(n.cantidad || 1, 10), 0)} unidades)</span>
                    </h6>
                    <div className="table-responsive rounded border">
                      <table className="table table-sm align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                        <thead className="bg-light text-secondary">
                          <tr>
                            <th>Código Nota</th>
                            <th>Funcionario Responsable</th>
                            <th className="text-center">Cant.</th>
                            <th>Descripción del Daño</th>
                            <th>Evaluación Regional</th>
                          </tr>
                        </thead>
                        <tbody>
                          {notasDano.map((n, idx) => (
                            <tr key={idx}>
                              <td className="fw-bold text-primary">{n.codigo_nota}</td>
                              <td>{n.funcionario_nombre} {n.funcionario_apellido}</td>
                              <td className="text-center fw-bold text-danger">{n.cantidad}</td>
                              <td className="text-secondary">{n.descripcion_dano}</td>
                              <td>
                                <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                                  {n.estado_evaluacion || 'Pendiente Evaluation'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal-footer bg-light py-3 border-0">
            <button type="button" className="btn btn-secondary px-4 fw-semibold" onClick={onClose}>
              Entendido / Cerrar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DisponibilidadModal;

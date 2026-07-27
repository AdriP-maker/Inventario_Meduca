import React, { useRef } from 'react';
import logoMeducaPng from '../assets/logo_meduca.png';
import { Printer, X, FileText, AlertTriangle, CheckCircle } from 'lucide-react';

const NotaDanoModal = ({ show, onClose, nota }) => {
  const printRef = useRef(null);

  if (!show || !nota) return null;

  const handlePrint = () => {
    const printContent = printRef.current;
    const windowUrl = 'about:blank';
    const uniqueName = new Date().getTime();
    const windowName = 'Print' + uniqueName;
    const printWindow = window.open(windowUrl, windowName, 'left=100,top=100,width=800,height=900');

    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Nota Oficial de Daño MEDUCA - ${nota.codigo_nota}</title>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
            <style>
              body { font-family: system-ui, sans-serif; padding: 30px; background: white; color: #1e293b; }
              .header-box { border-bottom: 2px solid #0c2340; padding-bottom: 15px; margin-bottom: 20px; }
              .stamp-box { border: 2px dashed #dc3545; padding: 10px; border-radius: 8px; font-weight: bold; text-align: center; color: #dc3545; }
              @media print {
                .no-print { display: none !important; }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(12, 35, 64, 0.7)', zIndex: 1070 }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          
          <div className="modal-header bg-dark text-white py-3 border-0 justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <FileText size={22} className="text-warning" />
              <h5 className="modal-title fw-bold mb-0">Nota Oficial de Daño e Incidencia MEDUCA</h5>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button onClick={handlePrint} className="btn btn-warning btn-sm d-flex align-items-center gap-1.5 fw-bold px-3">
                <Printer size={16} />
                <span>Imprimir Nota</span>
              </button>
              <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
            </div>
          </div>

          <div className="modal-body p-4" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            
            {/* Printable Document Area */}
            <div ref={printRef} className="p-4 bg-white border rounded shadow-sm">
              {/* Official Header */}
              <div className="header-box d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <img src={logoMeducaPng} alt="MEDUCA" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
                  <div>
                    <h5 className="fw-bold text-dark mb-0" style={{ letterSpacing: '0.5px' }}>MINISTERIO DE EDUCACIÓN</h5>
                    <div className="fw-bold text-primary" style={{ fontSize: '0.9rem' }}>DIRECCIÓN REGIONAL DE EDUCACIÓN DE COCLÉ</div>
                    <div className="text-muted" style={{ fontSize: '0.775rem' }}>DEPARTAMENTO DE MANTENIMIENTO E INVENTARIO</div>
                  </div>
                </div>
                <div className="text-end">
                  <div className="badge bg-danger text-white fs-6 px-3 py-2">{nota.codigo_nota}</div>
                  <div className="text-muted mt-1" style={{ fontSize: '0.775rem' }}>Fecha: {new Date(nota.fecha_registro || Date.now()).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Notice Title */}
              <div className="text-center my-4">
                <h5 className="fw-bold text-uppercase text-danger" style={{ letterSpacing: '1px' }}>
                  ACTA DE REGISTRO DE DAÑO Y SOLICITUD DE EVALUACIÓN REGIONAL
                </h5>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                  Remitido a la Dirección Regional de Educación para dictamen de reparación, reemplazo o descarte.
                </p>
              </div>

              {/* Funcionario Info */}
              <div className="bg-light p-3 rounded mb-3 border">
                <h6 className="fw-bold text-dark border-bottom pb-2 mb-2" style={{ fontSize: '0.9rem' }}>
                  1. DATOS DEL FUNCIONARIO SOLICITANTE / RESPONSABLE
                </h6>
                <div className="row g-2" style={{ fontSize: '0.875rem' }}>
                  <div className="col-6"><strong>Nombre Completo:</strong> {nota.funcionario_nombre} {nota.funcionario_apellido}</div>
                  <div className="col-6"><strong>Cédula de Identidad:</strong> {nota.funcionario_cedula || 'N/A'}</div>
                  <div className="col-6"><strong>Cargo:</strong> {nota.funcionario_cargo || 'Mantenimiento'}</div>
                  <div className="col-6"><strong>Proyecto / Escuela:</strong> {nota.escuela_proyecto || 'N/A'}</div>
                </div>
              </div>

              {/* Item Info */}
              <div className="bg-light p-3 rounded mb-3 border">
                <h6 className="fw-bold text-dark border-bottom pb-2 mb-2" style={{ fontSize: '0.9rem' }}>
                  2. DETALLE DEL PRODUCTO / HERRAMIENTA AFECTADA
                </h6>
                <div className="row g-2" style={{ fontSize: '0.875rem' }}>
                  <div className="col-6"><strong>Código de Inventario:</strong> <span className="badge bg-secondary">{nota.herramienta_codigo}</span></div>
                  <div className="col-6"><strong>Nombre de Producto:</strong> {nota.herramienta_nombre}</div>
                  <div className="col-6"><strong>Marca / Modelo:</strong> {nota.herramienta_marca} {nota.herramienta_modelo || ''}</div>
                  <div className="col-6"><strong>Cantidad Reportada con Daño:</strong> <span className="badge bg-danger fs-6">{nota.cantidad} unidad(es)</span></div>
                </div>
              </div>

              {/* Damage Description */}
              <div className="p-3 border border-danger-subtle rounded bg-danger-subtle mb-4">
                <h6 className="fw-bold text-danger mb-2" style={{ fontSize: '0.9rem' }}>
                  3. DESCRIPCIÓN DETALLADA DE LA INCIDENCIA Y DAÑO REPORTADO
                </h6>
                <p className="mb-0 text-dark" style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                  {nota.descripcion_dano || 'Sin descripción ingresada.'}
                </p>
              </div>

              {/* Status and Signatures */}
              <div className="row g-4 mt-4 pt-3 border-top align-items-center">
                <div className="col-6 text-center">
                  <div className="border-bottom border-dark pb-2 mb-1" style={{ minHeight: '40px' }}></div>
                  <div className="fw-bold" style={{ fontSize: '0.8rem' }}>Firma Funcionario Responsable</div>
                  <div className="text-muted" style={{ fontSize: '0.725rem' }}>{nota.funcionario_nombre} {nota.funcionario_apellido}</div>
                </div>
                <div className="col-6 text-center">
                  <div className="border-bottom border-dark pb-2 mb-1" style={{ minHeight: '40px' }}></div>
                  <div className="fw-bold" style={{ fontSize: '0.8rem' }}>Firma Encargado de Bodega / Mantenimiento</div>
                  <div className="text-muted" style={{ fontSize: '0.725rem' }}>MEDUCA Regional Coclé</div>
                </div>
              </div>

              {/* Status Stamp */}
              <div className="mt-4 pt-2 text-center">
                <span className="badge bg-dark-subtle text-dark border px-4 py-2 fs-6">
                  ESTADO DE TRÁMITE REGIONAL: <strong>{nota.estado_evaluacion || 'Pendiente Evaluación'}</strong>
                </span>
              </div>

            </div>

          </div>

          <div className="modal-footer bg-light py-3 border-0">
            <button type="button" className="btn btn-secondary px-4 fw-semibold" onClick={onClose}>
              Cerrar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default NotaDanoModal;

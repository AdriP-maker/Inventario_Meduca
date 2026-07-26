import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

const ConfirmModal = ({
  show,
  title = 'Confirmar Acción',
  message = '¿Está seguro de que desea realizar esta acción?',
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
  submitting = false
}) => {
  if (!show) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div className={`modal-header bg-${variant}-subtle text-${variant} py-3 border-0`}>
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2" style={{ fontSize: '1.1rem' }}>
              <AlertTriangle size={22} className={`text-${variant}`} />
              <span>{title}</span>
            </h5>
            <button type="button" className="btn-close" onClick={onCancel} disabled={submitting}></button>
          </div>
          
          <div className="modal-body p-4 text-center">
            <p className="text-secondary mb-0" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
              {message}
            </p>
          </div>

          <div className="modal-footer bg-light border-0 py-3 d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary px-4 fw-semibold rounded-3"
              onClick={onCancel}
              disabled={submitting}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className={`btn btn-${variant} px-4 fw-bold rounded-3 d-flex align-items-center gap-2`}
              onClick={onConfirm}
              disabled={submitting}
            >
              {submitting ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : (
                <>
                  <Trash2 size={16} />
                  <span>{confirmText}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

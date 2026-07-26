import React, { createContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'danger'),
    warning: (msg) => addToast(msg, 'warning'),
    info: (msg) => addToast(msg, 'info')
  };

  const renderIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="text-success" size={20} />;
      case 'danger':
        return <XCircle className="text-danger" size={20} />;
      case 'warning':
        return <AlertTriangle className="text-warning" size={20} />;
      default:
        return <Info className="text-primary" size={20} />;
    }
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast show align-items-center border-0 mb-2 shadow-lg bg-white rounded-3`}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            style={{ minWidth: '320px', borderLeft: `5px solid ${
              t.type === 'success' ? '#2e7d32' : t.type === 'danger' ? '#dc3545' : t.type === 'warning' ? '#f57f17' : '#1a5bb8'
            }` }}
          >
            <div className="d-flex p-3 align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                {renderIcon(t.type)}
                <div className="fw-semibold text-dark" style={{ fontSize: '0.9rem' }}>{t.message}</div>
              </div>
              <button
                type="button"
                className="btn-close ms-2 me-0"
                onClick={() => removeToast(t.id)}
              ></button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

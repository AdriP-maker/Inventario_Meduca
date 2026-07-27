import React, { useEffect, useState, useContext } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import { Plus, Search, Edit, Trash2, Upload, Image as ImageIcon, Info, AlertTriangle, Layers } from 'lucide-react';

import ConfirmModal from '../../components/ConfirmModal';
import DisponibilidadModal from '../../components/DisponibilidadModal';
import { validators } from '../../utils/validators';

const HerramientasPage = () => {
  const { toast } = useContext(ToastContext);
  const [herramientas, setHerramientas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [useUrlInput, setUseUrlInput] = useState(false);

  // Availability Modal State ("Manzanas y Peras")
  const [showDispModal, setShowDispModal] = useState(false);
  const [dispData, setDispData] = useState(null);
  const [dispLoading, setDispLoading] = useState(false);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    marca: '',
    modelo: '',
    numero_serie: '',
    stock_total: 1,
    estado: 'Disponible',
    ubicacion: 'Bodega Mantenimiento',
    foto_url: '',
    observaciones: ''
  });

  const handleOpenDisponibilidad = async (id) => {
    setShowDispModal(true);
    setDispLoading(true);
    try {
      const res = await api.get(`/herramientas/${id}/disponibilidad`);
      if (res.data.success) {
        setDispData(res.data.data);
      }
    } catch (err) {
      toast.error('Ocurrió un error al cargar el detalle de disponibilidad.');
    } finally {
      setDispLoading(false);
    }
  };

  const fetchHerramientas = async () => {
    try {
      const res = await api.get(`/herramientas?search=${encodeURIComponent(search)}&estado=${encodeURIComponent(estadoFilter)}`);
      if (res.data.success) {
        setHerramientas(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHerramientas();
  }, [search, estadoFilter]);

  const handleOpenModal = (item = null) => {
    setUseUrlInput(false);
    if (item) {
      setEditId(item.id);
      setFormData(item);
    } else {
      setEditId(null);
      setFormData({
        codigo: '',
        nombre: '',
        marca: '',
        modelo: '',
        numero_serie: '',
        estado: 'Disponible',
        ubicacion: 'Bodega Mantenimiento',
        foto_url: '',
        observaciones: ''
      });
    }
    setShowModal(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen seleccionada no debe superar 2MB.');
      return;
    }

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result;
        setFormData((prev) => ({ ...prev, foto_url: base64Image }));
        setUploadingImage(false);
        toast.success('Imagen cargada con éxito para la herramienta.');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      toast.error('Ocurrió un error al procesar la imagen.');
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const err = validators.validateHerramienta(formData);
    if (err) {
      toast.error(err);
      return;
    }

    try {
      if (editId) {
        await api.put(`/herramientas/${editId}`, formData);
        toast.success('Información de la herramienta actualizada con éxito.');
      } else {
        await api.post('/herramientas', formData);
        toast.success('Nueva herramienta registrada en el inventario exitosamente.');
      }
      setShowModal(false);
      fetchHerramientas();
    } catch (err) {
      toast.error('Ocurrió un error al guardar la herramienta.');
    }
  };

  const handlePromptDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/herramientas/${deleteId}`);
      toast.success('Herramienta eliminada del inventario con éxito.');
      setShowDeleteModal(false);
      fetchHerramientas();
    } catch (err) {
      toast.error('Ocurrió un error al eliminar la herramienta.');
    } finally {
      setDeleting(false);
    }
  };

  const getToolStock = (h) => {
    const total = parseInt(h.stock_total ?? 1, 10);
    const prest = parseInt(h.stock_prestado ?? (h.estado === 'Prestado' ? 1 : 0), 10);
    const dan = parseInt(h.stock_danado ?? (h.estado === 'Dañado' ? 1 : 0), 10);
    const disp = parseInt(h.stock_disponible ?? (h.estado === 'Disponible' ? Math.max(0, total - prest - dan) : 0), 10);
    return { total, disp, prest, dan };
  };

  const renderBadge = (h) => {
    const { total, disp, prest, dan } = getToolStock(h);

    if (disp <= 0 && prest > 0) {
      return (
        <span 
          className="badge-status badge-naranja cursor-pointer shadow-sm" 
          onClick={() => handleOpenDisponibilidad(h.id)}
          title="Toca para ver detalle explicativo ('Manzanas y Peras')"
        >
          <AlertTriangle size={13} /> Sin Stock / En Préstamo
        </span>
      );
    }
    if (disp <= 0 && dan > 0) {
      return <span className="badge-status badge-danado">Agotado (Dañado)</span>;
    }
    if (h.estado === 'Mantenimiento') {
      return <span className="badge-status badge-mantenimiento">Mantenimiento</span>;
    }
    return (
      <span className="badge-status badge-disponible">
        Disponible {total > 1 ? `(${disp}/${total})` : ''}
      </span>
    );
  };

  return (
    <Layout title="Herramientas" breadcrumbs="Gestión de inventario de herramientas">
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <div className="d-flex flex-grow-1 gap-2 flex-wrap" style={{ maxWidth: '600px' }}>
            <div className="input-group flex-grow-1">
              <span className="input-group-text bg-light"><Search size={18} /></span>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar herramienta por código, nombre o marca..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              style={{ width: '180px' }}
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="Disponible">Disponible</option>
              <option value="Agotado">Agotado / Sin Stock</option>
              <option value="Prestado">En Préstamo</option>
              <option value="Mantenimiento">Mantenimiento</option>
              <option value="Dañado">Dañado</option>
            </select>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="btn btn-primary d-flex align-items-center gap-2 fw-semibold"
            style={{ background: '#1a5bb8', borderColor: '#1a5bb8' }}
          >
            <Plus size={18} />
            <span>Nueva Herramienta</span>
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-custom mb-0">
            <thead>
              <tr>
                <th>Código</th>
                <th>Herramienta</th>
                <th>Marca</th>
                <th>Stock (Total / Disp / Prest / Dañ)</th>
                <th>Estado</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">Cargando inventario...</td>
                </tr>
              ) : herramientas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">No se encontraron herramientas.</td>
                </tr>
              ) : (
                herramientas.map((h) => {
                  const stock = getToolStock(h);
                  return (
                    <tr key={h.id}>
                      <td className="fw-bold text-primary">{h.codigo}</td>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <img
                            src={h.foto_url || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=100'}
                            alt={h.nombre}
                            className="rounded shadow-sm cursor-pointer"
                            onClick={() => handleOpenDisponibilidad(h.id)}
                            style={{ width: '44px', height: '44px', objectFit: 'cover' }}
                          />
                          <div>
                            <div 
                              className="fw-bold cursor-pointer text-dark hover-primary"
                              onClick={() => handleOpenDisponibilidad(h.id)}
                              title="Ver estado de disponibilidad ('Manzanas y Peras')"
                            >
                              {h.nombre}
                            </div>
                            <div className="text-muted" style={{ fontSize: '0.8rem' }}>{h.modelo || 'Sin modelo'}</div>
                          </div>
                        </div>
                      </td>
                      <td>{h.marca}</td>
                      <td>
                        <div className="d-flex align-items-center gap-1 font-monospace" style={{ fontSize: '0.85rem' }}>
                          <span className="badge bg-secondary" title="Stock Total">{stock.total} Total</span>
                          <span className="badge bg-success" title="Disponibles">{stock.disp} Disp</span>
                          <span className="badge bg-warning text-dark" title="Prestados">{stock.prest} Prest</span>
                          <span className="badge bg-danger" title="Dañados">{stock.dan} Dañ</span>
                        </div>
                      </td>
                      <td>{renderBadge(h)}</td>
                    <td className="text-center">
                      <button onClick={() => handleOpenDisponibilidad(h.id)} className="btn btn-sm btn-outline-info p-1 me-1" title="Ver Estado de Disponibilidad ('Manzanas y Peras')">
                        <Info size={16} />
                      </button>
                      <button onClick={() => handleOpenModal(h)} className="btn btn-sm btn-outline-primary p-1 me-1" title="Editar">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handlePromptDelete(h.id)} className="btn btn-sm btn-outline-danger p-1" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Agregar / Editar con Subida de Imagen y Vista Previa */}
      {showModal && (
        <div className="modal d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold text-dark">
                  {editId ? 'Editar Herramienta' : 'Nueva Herramienta'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body row g-3">
                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold">Código *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      minLength={2}
                      maxLength={20}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-8">
                    <label className="form-label fw-semibold">Nombre de Herramienta *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      minLength={2}
                      maxLength={50}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold">Marca *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.marca}
                      onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                      minLength={2}
                      maxLength={30}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold">Modelo</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.modelo}
                      onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                      minLength={1}
                      maxLength={30}
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold">Número de Serie</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.numero_serie}
                      onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
                      minLength={1}
                      maxLength={30}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Estado</label>
                    <select
                      className="form-select"
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    >
                      <option value="Disponible">Disponible</option>
                      <option value="Prestado">Prestado</option>
                      <option value="Mantenimiento">Mantenimiento</option>
                      <option value="Dañado">Dañado</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold">Cantidad Total en Stock *</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      value={formData.stock_total || 1}
                      onChange={(e) => setFormData({ ...formData, stock_total: Math.max(1, parseInt(e.target.value || 1, 10)) })}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold">Ubicación *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.ubicacion}
                      onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                      minLength={2}
                      maxLength={40}
                      required
                    />
                  </div>

                  {/* Componente de Subida e Inspección Visual de Imagen */}
                  <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label fw-semibold mb-0">Fotografía de la Herramienta</label>
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 text-decoration-none"
                        onClick={() => setUseUrlInput(!useUrlInput)}
                      >
                        {useUrlInput ? '📁 Subir archivo desde PC' : '🔗 Ingresar URL de imagen'}
                      </button>
                    </div>

                    <div className="border rounded-3 p-3 bg-light d-flex flex-column flex-sm-row align-items-center gap-3">
                      {/* Vista Previa de la Imagen */}
                      <div className="position-relative flex-shrink-0">
                        {formData.foto_url ? (
                          <img
                            src={formData.foto_url}
                            alt="Vista previa"
                            className="rounded-3 border shadow-sm"
                            style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="bg-white rounded-3 border d-flex flex-column align-items-center justify-content-center text-muted" style={{ width: '100px', height: '100px' }}>
                            <ImageIcon size={32} />
                            <span style={{ fontSize: '0.7rem' }}>Sin foto</span>
                          </div>
                        )}
                        {uploadingImage && (
                          <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 rounded-3 d-flex align-items-center justify-content-center text-white">
                            <span className="spinner-border spinner-border-sm" role="status"></span>
                          </div>
                        )}
                      </div>

                      {/* Area de Subida o Input URL */}
                      <div className="flex-grow-1 w-100">
                        {useUrlInput ? (
                          <div>
                            <input
                              type="url"
                              className="form-control"
                              placeholder="Pegue la URL de la imagen (ej: https://...)"
                              value={formData.foto_url}
                              onChange={(e) => setFormData({ ...formData, foto_url: e.target.value })}
                            />
                            <div className="form-text">Pegue una dirección web directa de la imagen.</div>
                          </div>
                        ) : (
                          <div>
                            <label className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2 py-2 fw-semibold">
                              <Upload size={18} />
                              <span>{uploadingImage ? 'Subiendo imagen...' : 'Seleccionar Foto desde tu Equipo'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="d-none"
                                onChange={handleImageUpload}
                                disabled={uploadingImage}
                              />
                            </label>
                            <div className="form-text text-center text-sm-start mt-1">
                              Formatos permitidos: JPG, PNG, WEBP. Vista previa instantánea.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Observaciones / Especificaciones</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      maxLength={120}
                      placeholder="Observaciones adicionales (máximo 120 caracteres)..."
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary fw-bold" disabled={uploadingImage}>
                    Guardar Herramienta
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Custom Confirmation Modal */}
      <ConfirmModal
        show={showDeleteModal}
        title="Eliminar Herramienta"
        message="¿Está seguro de que desea eliminar esta herramienta del inventario? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        submitting={deleting}
      />

      {/* Explicación Explicativa de Disponibilidad ("Manzanas y Peras") */}
      <DisponibilidadModal
        show={showDispModal}
        onClose={() => setShowDispModal(false)}
        data={dispData}
        loading={dispLoading}
      />
    </Layout>
  );
};

export default HerramientasPage;

import React, { useEffect, useState, useContext } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import { Plus, Search, Edit, Trash2, Upload, Image as ImageIcon } from 'lucide-react';

import ConfirmModal from '../../components/ConfirmModal';
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
    estado: 'Disponible',
    ubicacion: 'Bodega Mantenimiento',
    foto_url: '',
    observaciones: ''
  });

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
      toast.error('La imagen no debe superar los 2MB.');
      return;
    }

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result;
        setFormData((prev) => ({ ...prev, foto_url: base64Image }));
        setUploadingImage(false);
        toast.success('Imagen cargada.');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      toast.error('Error en imagen.');
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const codigoErr = validators.validateText(formData.codigo, 'Código', 2, 30);
    if (codigoErr) { toast.error(codigoErr); return; }

    const nombreErr = validators.validateText(formData.nombre, 'Nombre', 2, 60);
    if (nombreErr) { toast.error(nombreErr); return; }

    const marcaErr = validators.validateText(formData.marca, 'Marca', 2, 40);
    if (marcaErr) { toast.error(marcaErr); return; }

    try {
      if (editId) {
        await api.put(`/herramientas/${editId}`, formData);
        toast.success('Herramienta actualizada.');
      } else {
        await api.post('/herramientas', formData);
        toast.success('Herramienta registrada.');
      }
      setShowModal(false);
      fetchHerramientas();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar.');
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
      toast.success('Herramienta eliminada.');
      setShowDeleteModal(false);
      fetchHerramientas();
    } catch (err) {
      toast.error('Error al eliminar.');
    } finally {
      setDeleting(false);
    }
  };

  const renderBadge = (estado) => {
    switch (estado) {
      case 'Disponible':
        return <span className="badge-status badge-disponible">Disponible</span>;
      case 'Prestado':
        return <span className="badge-status badge-prestado">Prestado</span>;
      case 'Mantenimiento':
        return <span className="badge-status badge-mantenimiento">Mantenimiento</span>;
      case 'Dañado':
        return <span className="badge-status badge-danado">Dañado</span>;
      default:
        return <span className="badge bg-secondary">{estado}</span>;
    }
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
              <option value="Prestado">Prestado</option>
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
                <th>Ubicación</th>
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
                herramientas.map((h) => (
                  <tr key={h.id}>
                    <td className="fw-bold text-primary">{h.codigo}</td>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <img
                          src={h.foto_url || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=100'}
                          alt={h.nombre}
                          className="rounded shadow-sm"
                          style={{ width: '44px', height: '44px', objectFit: 'cover' }}
                        />
                        <div>
                          <div className="fw-bold">{h.nombre}</div>
                          <div className="text-muted" style={{ fontSize: '0.8rem' }}>{h.modelo || 'Sin modelo'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{h.marca}</td>
                    <td>{h.ubicacion || 'Bodega'}</td>
                    <td>{renderBadge(h.estado)}</td>
                    <td className="text-center">
                      <button onClick={() => handleOpenModal(h)} className="btn btn-sm btn-outline-primary p-1 me-1" title="Editar">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handlePromptDelete(h.id)} className="btn btn-sm btn-outline-danger p-1" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
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
                    <label className="form-label fw-semibold">Código</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-8">
                    <label className="form-label fw-semibold">Nombre de Herramienta</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold">Marca</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.marca}
                      onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
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
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold">Número de Serie</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.numero_serie}
                      onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
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
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Ubicación</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.ubicacion}
                      onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
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
                                onChange={handleFileChange}
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
    </Layout>
  );
};

export default HerramientasPage;

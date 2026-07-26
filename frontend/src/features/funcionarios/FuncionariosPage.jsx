import React, { useEffect, useState, useContext } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { ToastContext } from '../../context/ToastContext';
import { UserPlus, Search, Edit, Trash2 } from 'lucide-react';
import { validators } from '../../utils/validators';
import ConfirmModal from '../../components/ConfirmModal';

const FuncionariosPage = () => {
  const { toast } = useContext(ToastContext);
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Form Modal state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    cedula: '',
    nombre: '',
    apellido: '',
    cargo: '',
    departamento: 'Mantenimiento General',
    telefono: '',
    email: '',
    estado: 'Activo'
  });

  // Delete Confirm Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFuncionarios = async () => {
    try {
      const res = await api.get(`/funcionarios?search=${encodeURIComponent(search)}`);
      if (res.data.success) {
        setFuncionarios(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFuncionarios();
  }, [search]);

  const handleOpenModal = (func = null) => {
    if (func) {
      setEditId(func.id);
      setFormData(func);
    } else {
      setEditId(null);
      setFormData({
        cedula: '',
        nombre: '',
        apellido: '',
        cargo: '',
        departamento: 'Mantenimiento General',
        telefono: '',
        email: '',
        estado: 'Activo'
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const err = validators.validateFuncionario(formData);
    if (err) {
      toast.error(err);
      return;
    }

    try {
      if (editId) {
        await api.put(`/funcionarios/${editId}`, formData);
        toast.success('Funcionario actualizado con éxito en el sistema.');
      } else {
        await api.post('/funcionarios', formData);
        toast.success('Nuevo funcionario registrado con éxito en sistema.');
      }
      setShowModal(false);
      fetchFuncionarios();
    } catch (err) {
      toast.error('Ocurrió un error al guardar el funcionario.');
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
      await api.delete(`/funcionarios/${deleteId}`);
      toast.success('Funcionario eliminado del sistema con éxito.');
      setShowDeleteModal(false);
      fetchFuncionarios();
    } catch (err) {
      toast.error('Ocurrió un error al eliminar el funcionario.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Layout title="Funcionarios" breadcrumbs="Gestión de funcionarios registrados">
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <div className="input-group" style={{ maxWidth: '380px' }}>
            <span className="input-group-text bg-light"><Search size={18} /></span>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar funcionario por nombre, cédula o cargo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="btn btn-primary d-flex align-items-center gap-2 fw-semibold"
            style={{ background: '#1a5bb8', borderColor: '#1a5bb8' }}
          >
            <UserPlus size={18} />
            <span>Nuevo Funcionario</span>
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-custom mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cédula</th>
                <th>Nombre Completo</th>
                <th>Cargo</th>
                <th>Departamento</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">Cargando funcionarios...</td>
                </tr>
              ) : funcionarios.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">No se encontraron funcionarios.</td>
                </tr>
              ) : (
                funcionarios.map((f) => (
                  <tr key={f.id}>
                    <td>#{f.id}</td>
                    <td className="fw-semibold">{f.cedula}</td>
                    <td className="fw-bold">{f.nombre} {f.apellido}</td>
                    <td>{f.cargo}</td>
                    <td>{f.departamento}</td>
                    <td>{f.telefono || 'N/A'}</td>
                    <td>
                      <span className={`badge ${f.estado === 'Activo' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                        {f.estado}
                      </span>
                    </td>
                    <td className="text-center">
                      <button onClick={() => handleOpenModal(f)} className="btn btn-sm btn-outline-primary p-1 me-1" title="Editar">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handlePromptDelete(f.id)} className="btn btn-sm btn-outline-danger p-1" title="Eliminar">
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

      {/* Modal Agregar / Editar */}
      {showModal && (
        <div className="modal d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header py-3 border-bottom">
                <h5 className="modal-title fw-bold text-dark">
                  {editId ? 'Editar Funcionario' : 'Nuevo Funcionario'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body row g-3 p-4">
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Cédula *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej: 2-710-1234"
                      value={formData.cedula}
                      onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Nombre *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej: Juan"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Apellido *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej: Pérez"
                      value={formData.apellido}
                      onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Cargo *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej: Técnico Electricista"
                      value={formData.cargo}
                      onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Departamento</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej: Mantenimiento General"
                      value={formData.departamento}
                      onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Teléfono</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej: 6501-1122"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Correo Electrónico</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Ej: juan.perez@meduca.gob.pa"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer py-3 bg-light border-top">
                  <button type="button" className="btn btn-outline-secondary px-4 fw-semibold" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary px-4 fw-bold" style={{ background: '#1a5bb8', borderColor: '#1a5bb8' }}>Guardar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Custom Confirmation Modal */}
      <ConfirmModal
        show={showDeleteModal}
        title="Eliminar Funcionario"
        message="¿Está seguro de que desea eliminar este funcionario? Esta acción no se puede deshacer."
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

export default FuncionariosPage;

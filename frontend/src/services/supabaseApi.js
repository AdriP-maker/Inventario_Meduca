import { supabase } from './supabaseClient.js';
import { validators } from '../utils/validators.js';
import bcrypt from 'bcryptjs';

// Serverless Supabase API Service replacing legacy PHP backend
export const supabaseApi = {
  // Auth
  async login(usuario, password) {
    const { data: users, error } = await supabase
      .from('usuarios')
      .select('*')
      .or(`usuario.eq.${usuario},email.eq.${usuario}`)
      .eq('estado', 'Activo')
      .limit(1);

    if (error || !users || users.length === 0) {
      throw { response: { data: { message: 'Usuario o contraseña incorrectos.' } } };
    }

    const u = users[0];

    // ✅ Verify password against bcrypt hash (same as PHP password_verify)
    const passwordValid = await bcrypt.compare(password, u.password_hash);
    if (!passwordValid) {
      throw { response: { data: { message: 'Usuario o contraseña incorrectos.' } } };
    }

    // Generate a simple session token from user data
    const sessionToken = btoa(JSON.stringify({ id: u.id, usuario: u.usuario, ts: Date.now() }));

    return {
      data: {
        success: true,
        data: {
          token: sessionToken,
          user: {
            id: u.id,
            usuario: u.usuario,
            nombre: u.nombre,
            email: u.email,
            rol: u.rol
          }
        }
      }
    };
  },

  // Change Password
  async cambiarPassword({ nueva_password }) {
    if (!nueva_password || nueva_password.length < 6) {
      throw { response: { data: { message: 'La contraseña debe tener al menos 6 caracteres.' } } };
    }

    // Get current user ID from localStorage
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!currentUser?.id) {
      throw { response: { data: { message: 'No se pudo identificar al usuario actual.' } } };
    }

    // Hash the new password with bcrypt (cost 12, same as PHP)
    const salt = await bcrypt.genSalt(12);
    const newHash = await bcrypt.hash(nueva_password, salt);

    const { error } = await supabase
      .from('usuarios')
      .update({ password_hash: newHash })
      .eq('id', currentUser.id);

    if (error) {
      throw { response: { data: { message: 'Error al actualizar la contraseña: ' + error.message } } };
    }

    return {
      data: {
        success: true,
        message: 'Contraseña actualizada correctamente.'
      }
    };
  },

  // Dashboard Stats
  async getDashboardStats() {
    const [
      { count: totalHerramientas },
      { count: disponibles },
      { count: prestamosActivosCount },
      { count: devueltasCount },
      { count: funcionariosCount },
      { count: mantenimientoCount },
      { count: danadasCount }
    ] = await Promise.all([
      supabase.from('herramientas').select('*', { count: 'exact', head: true }),
      supabase.from('herramientas').select('*', { count: 'exact', head: true }).eq('estado', 'Disponible'),
      supabase.from('prestamos').select('*', { count: 'exact', head: true }).eq('estado', 'Prestado'),
      supabase.from('prestamos').select('*', { count: 'exact', head: true }).eq('estado', 'Devuelto'),
      supabase.from('funcionarios').select('*', { count: 'exact', head: true }).eq('estado', 'Activo'),
      supabase.from('herramientas').select('*', { count: 'exact', head: true }).eq('estado', 'Mantenimiento'),
      supabase.from('herramientas').select('*', { count: 'exact', head: true }).eq('estado', 'Dañado')
    ]);

    // Active loans (Prestado)
    const { data: activeLoans } = await supabase
      .from('prestamos')
      .select(`
        id, codigo_prestamo, fecha_prestamo, fecha_devolucion_estimada, escuela_proyecto, estado, observaciones,
        funcionario:funcionarios(nombre, apellido, cargo),
        prestamo_detalles(herramienta:herramientas(nombre, foto_url))
      `)
      .eq('estado', 'Prestado')
      .order('fecha_prestamo', { ascending: false })
      .limit(10);

    const prestamosActivos = (activeLoans || []).map(p => ({
      id: p.id,
      codigo_prestamo: p.codigo_prestamo,
      fecha_prestamo: p.fecha_prestamo,
      fecha_devolucion_estimada: p.fecha_devolucion_estimada,
      escuela_proyecto: p.escuela_proyecto,
      estado: p.estado,
      funcionario_nombre: p.funcionario?.nombre || 'Funcionario',
      funcionario_apellido: p.funcionario?.apellido || '',
      funcionario_cargo: p.funcionario?.cargo || '',
      registrado_por: 'Carlos Admin',
      herramienta_nombre: (p.prestamo_detalles || [])[0]?.herramienta?.nombre || 'Herramienta',
      herramienta_foto: (p.prestamo_detalles || [])[0]?.herramienta?.foto_url || ''
    }));

    // Recently returned loans (Devuelto)
    const { data: returnedLoans } = await supabase
      .from('prestamos')
      .select(`
        id, codigo_prestamo, fecha_prestamo, fecha_devolucion_real, escuela_proyecto, estado, observaciones,
        funcionario:funcionarios(nombre, apellido, cargo),
        prestamo_detalles(herramienta:herramientas(nombre, foto_url))
      `)
      .eq('estado', 'Devuelto')
      .order('fecha_devolucion_real', { ascending: false })
      .limit(5);

    const devueltosRecientemente = (returnedLoans || []).map(p => ({
      id: p.id,
      codigo_prestamo: p.codigo_prestamo,
      fecha_prestamo: p.fecha_prestamo,
      fecha_devolucion_real: p.fecha_devolucion_real,
      escuela_proyecto: p.escuela_proyecto,
      estado: p.estado,
      funcionario_nombre: p.funcionario?.nombre || 'Funcionario',
      funcionario_apellido: p.funcionario?.apellido || '',
      funcionario_cargo: p.funcionario?.cargo || '',
      registrado_por: 'Carlos Admin',
      herramienta_nombre: (p.prestamo_detalles || [])[0]?.herramienta?.nombre || 'Herramienta',
      herramienta_foto: (p.prestamo_detalles || [])[0]?.herramienta?.foto_url || ''
    }));

    return {
      data: {
        success: true,
        data: {
          kpis: {
            total_herramientas: totalHerramientas || 0,
            disponibles: disponibles || 0,
            prestamos_activos: prestamosActivosCount || 0,
            herramientas_devueltas: devueltasCount || 0,
            funcionarios_registrados: funcionariosCount || 0,
            en_mantenimiento: mantenimientoCount || 0,
            danadas: danadasCount || 0
          },
          prestamos_activos: prestamosActivos,
          devueltos_recientemente: devueltosRecientemente
        }
      }
    };
  },

  // Funcionarios
  async getFuncionarios(search = '') {
    let query = supabase.from('funcionarios').select('*').order('id', { ascending: false });
    if (search && search.trim() !== '') {
      const q = search.trim();
      query = query.or(`nombre.ilike.%${q}%,apellido.ilike.%${q}%,cedula.ilike.%${q}%,cargo.ilike.%${q}%`);
    }
    const { data, error } = await query;
    if (error) throw error;
    return { data: { success: true, data: data || [] } };
  },

  async createFuncionario(formData) {
    const valErr = validators.validateFuncionario(formData);
    if (valErr) throw { response: { data: { message: valErr } } };

    const { data, error } = await supabase
      .from('funcionarios')
      .insert([formData])
      .select();

    if (error) throw { response: { data: { message: error.message } } };
    return { data: { success: true, data: data[0] } };
  },

  async updateFuncionario(id, formData) {
    const valErr = validators.validateFuncionario(formData);
    if (valErr) throw { response: { data: { message: valErr } } };

    const { data, error } = await supabase
      .from('funcionarios')
      .update(formData)
      .eq('id', id)
      .select();

    if (error) throw { response: { data: { message: error.message } } };
    return { data: { success: true, data: data[0] } };
  },

  async deleteFuncionario(id) {
    const { error } = await supabase
      .from('funcionarios')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { data: { success: true } };
  },

  // Herramientas
  async getHerramientas(search = '', estado = null) {
    let query = supabase.from('herramientas').select('*').order('id', { ascending: false });
    if (search && search.trim() !== '') {
      const q = search.trim();
      query = query.or(`nombre.ilike.%${q}%,codigo.ilike.%${q}%,marca.ilike.%${q}%,modelo.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    let list = (data || []).map(h => {
      const stotal = parseInt(h.stock_total ?? 1, 10);
      const sprest = parseInt(h.stock_prestado ?? (h.estado === 'Prestado' ? 1 : 0), 10);
      const sdan = parseInt(h.stock_danado ?? (h.estado === 'Dañado' ? 1 : 0), 10);
      const calcDisp = Math.max(0, stotal - sprest - sdan);
      const dbDisp = parseInt(h.stock_disponible ?? calcDisp, 10);
      const effectiveDisp = (dbDisp === 0 && (h.estado === 'Disponible' || !h.estado) && sprest === 0 && sdan === 0) ? calcDisp : dbDisp;

      return {
        ...h,
        stock_total: stotal,
        stock_prestado: sprest,
        stock_danado: sdan,
        stock_disponible: effectiveDisp,
        estado_display: (effectiveDisp <= 0 && sprest > 0) ? 'Agotado' : (h.estado || 'Disponible')
      };
    });

    if (estado && estado.trim() !== '') {
      const est = estado.trim();
      if (est === 'Disponible') {
        list = list.filter(h => h.stock_disponible > 0 && h.estado !== 'Mantenimiento' && h.estado !== 'Dañado');
      } else if (est === 'Agotado') {
        list = list.filter(h => h.stock_disponible <= 0 || h.estado === 'Agotado');
      } else {
        list = list.filter(h => h.estado === est);
      }
    }

    return { data: { success: true, data: list } };
  },

  async createHerramienta(formData) {
    const valErr = validators.validateHerramienta(formData);
    if (valErr) throw { response: { data: { message: valErr } } };

    const { data, error } = await supabase
      .from('herramientas')
      .insert([formData])
      .select();

    if (error) throw { response: { data: { message: error.message } } };
    return { data: { success: true, data: data[0] } };
  },

  async updateHerramienta(id, formData) {
    const valErr = validators.validateHerramienta(formData);
    if (valErr) throw { response: { data: { message: valErr } } };

    const { data, error } = await supabase
      .from('herramientas')
      .update(formData)
      .eq('id', id)
      .select();

    if (error) throw { response: { data: { message: error.message } } };
    return { data: { success: true, data: data[0] } };
  },

  async deleteHerramienta(id) {
    const { error } = await supabase
      .from('herramientas')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { data: { success: true } };
  },

  // Prestamos
  async getPrestamos(search = '', estado = null) {
    let query = supabase
      .from('prestamos')
      .select(`
        *,
        funcionario:funcionarios(nombre, apellido, cedula, cargo),
        prestamo_detalles(herramienta:herramientas(id, codigo, nombre, marca))
      `)
      .order('id', { ascending: false });

    if (estado && estado.trim() !== '') {
      query = query.eq('estado', estado.trim());
    }

    const { data, error } = await query;
    if (error) throw error;

    let formatted = (data || []).map(p => ({
      ...p,
      funcionario_nombre: p.funcionario?.nombre || '',
      funcionario_apellido: p.funcionario?.apellido || '',
      funcionario_cedula: p.funcionario?.cedula || '',
      registrado_por: 'Carlos Admin',
      herramientas: (p.prestamo_detalles || []).map(d => d.herramienta).filter(Boolean)
    }));

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      formatted = formatted.filter(p => 
        (p.codigo_prestamo && p.codigo_prestamo.toLowerCase().includes(q)) ||
        (p.funcionario_nombre && p.funcionario_nombre.toLowerCase().includes(q)) ||
        (p.funcionario_apellido && p.funcionario_apellido.toLowerCase().includes(q)) ||
        (p.escuela_proyecto && p.escuela_proyecto.toLowerCase().includes(q))
      );
    }

    return { data: { success: true, data: formatted } };
  },

  async createPrestamo(payload) {
    const count = Math.floor(1000 + Math.random() * 9000);
    const codigo_prestamo = `PRE-2025-${count}`;

    const { data: newPrestamo, error: pErr } = await supabase
      .from('prestamos')
      .insert([{
        codigo_prestamo,
        funcionario_id: payload.funcionario_id,
        escuela_proyecto: payload.escuela_proyecto,
        fecha_devolucion_estimada: payload.fecha_devolucion_estimada,
        observaciones: payload.observaciones,
        estado: 'Prestado'
      }])
      .select()
      .single();

    if (pErr) throw { response: { data: { message: pErr.message } } };

    // Insert loan details & update tool statuses
    if (payload.herramientas_ids && payload.herramientas_ids.length > 0) {
      const details = payload.herramientas_ids.map(hid => ({
        prestamo_id: newPrestamo.id,
        herramienta_id: hid,
        estado_entrega: 'Bueno'
      }));

      await supabase.from('prestamo_detalles').insert(details);
      await supabase.from('herramientas').update({ estado: 'Prestado' }).in('id', payload.herramientas_ids);
    }

    return { data: { success: true, data: newPrestamo } };
  },

  // Devoluciones
  async registrarDevolucion(payload) {
    const { data: prestamo } = await supabase
      .from('prestamos')
      .select('*, prestamo_detalles(herramienta_id)')
      .eq('id', payload.prestamo_id)
      .single();

    if (!prestamo) throw { response: { data: { message: 'Préstamo no encontrado' } } };

    // Create devolucion record
    await supabase.from('devoluciones').insert([{
      prestamo_id: payload.prestamo_id,
      observaciones: payload.observaciones
    }]);

    // Update prestamo state to Devuelto
    await supabase.from('prestamos').update({
      estado: 'Devuelto',
      fecha_devolucion_real: new Date().toISOString()
    }).eq('id', payload.prestamo_id);

    // Update tools state back to Disponible or Dañado based on condition
    const toolIds = (prestamo.prestamo_detalles || []).map(d => d.herramienta_id);
    const newEstado = payload.estado_devolucion === 'Con Daño' ? 'Dañado' : 'Disponible';
    if (toolIds.length > 0) {
      await supabase.from('herramientas').update({ estado: newEstado }).in('id', toolIds);
    }

    return { data: { success: true } };
  },

  // Reportes
  async getReporte(tipo) {
    let registros = [];
    if (tipo === 'prestamos') {
      const res = await this.getPrestamos();
      registros = res.data.data;
    } else if (tipo === 'herramientas') {
      const res = await this.getHerramientas();
      registros = res.data.data;
    } else if (tipo === 'devoluciones') {
      const { data } = await supabase
        .from('devoluciones')
        .select(`
          *,
          prestamo:prestamos(codigo_prestamo, escuela_proyecto, funcionario:funcionarios(nombre, apellido))
        `)
        .order('id', { ascending: false });

      registros = (data || []).map(d => ({
        ...d,
        codigo_prestamo: d.prestamo?.codigo_prestamo,
        escuela_proyecto: d.prestamo?.escuela_proyecto,
        funcionario_nombre: d.prestamo?.funcionario?.nombre,
        funcionario_apellido: d.prestamo?.funcionario?.apellido,
        registrado_por: 'Carlos Admin'
      }));
    } else if (tipo === 'funcionarios') {
      const res = await this.getFuncionarios();
      registros = res.data.data;
    }

    return { data: { success: true, data: { registros } } };
  },

  // Historial
  async getHistorial(search = '') {
    let query = supabase.from('historial_actividades').select('*').order('fecha', { ascending: false });
    if (search && search.trim() !== '') {
      const q = search.trim();
      query = query.or(`usuario_nombre.ilike.%${q}%,accion.ilike.%${q}%,detalle.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data: { success: true, data: data || [] } };
  },

  // Configuracion
  async getConfiguracion() {
    const { data } = await supabase.from('configuracion').select('*');
    const map = {};
    (data || []).forEach(row => { map[row.clave] = row; });
    return { data: { success: true, data: map } };
  },

  async saveConfiguracion(config) {
    for (const [clave, valor] of Object.entries(config)) {
      await supabase.from('configuracion').upsert({ clave, valor: String(valor) }, { onConflict: 'clave' });
    }
    return { data: { success: true } };
  }
};

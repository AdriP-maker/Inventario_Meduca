import { supabase } from './supabaseClient';

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

    const user = users[0];
    // In production client demo or Supabase Auth
    const mockToken = `sb-token-${user.id}-${Date.now()}`;
    return {
      data: {
        success: true,
        message: 'Login exitoso',
        data: {
          token: mockToken,
          user: {
            id: user.id,
            nombre: user.nombre,
            usuario: user.usuario,
            email: user.email,
            rol: user.rol
          }
        }
      }
    };
  },

  // Dashboard Stats
  async getDashboardStats() {
    const [{ count: funcionariosCount }, { count: totalHerramientas }, { count: prestadasCount }, { count: disponiblesCount }, { count: damagadasCount }] = await Promise.all([
      supabase.from('funcionarios').select('*', { count: 'exact', head: true }),
      supabase.from('herramientas').select('*', { count: 'exact', head: true }),
      supabase.from('herramientas').select('*', { count: 'exact', head: true }).eq('estado', 'Prestado'),
      supabase.from('herramientas').select('*', { count: 'exact', head: true }).eq('estado', 'Disponible'),
      supabase.from('herramientas').select('*', { count: 'exact', head: true }).in('estado', ['Dañado', 'Mantenimiento'])
    ]);

    const { data: prestamosRecientes } = await supabase
      .from('prestamos')
      .select(`
        *,
        funcionario:funcionarios(nombre, apellido, cedula, cargo),
        prestamo_detalles(herramienta:herramientas(codigo, nombre, marca))
      `)
      .order('fecha_prestamo', { ascending: false })
      .limit(5);

    const formattedRecientes = (prestamosRecientes || []).map(p => ({
      ...p,
      funcionario_nombre: p.funcionario?.nombre,
      funcionario_apellido: p.funcionario?.apellido,
      herramientas: (p.prestamo_detalles || []).map(d => d.herramienta)
    }));

    return {
      data: {
        success: true,
        data: {
          totales: {
            funcionarios: funcionariosCount || 0,
            total_herramientas: totalHerramientas || 0,
            herramientas_prestadas: prestadasCount || 0,
            herramientas_disponibles: disponiblesCount || 0,
            herramientas_danadas: damagadasCount || 0
          },
          prestamos_recientes: formattedRecientes
        }
      }
    };
  },

  // Funcionarios
  async getFuncionarios() {
    const { data, error } = await supabase
      .from('funcionarios')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;
    return { data: { success: true, data: data || [] } };
  },

  async createFuncionario(formData) {
    const { data, error } = await supabase
      .from('funcionarios')
      .insert([formData])
      .select();

    if (error) throw { response: { data: { message: error.message } } };
    return { data: { success: true, data: data[0] } };
  },

  async updateFuncionario(id, formData) {
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
  async getHerramientas(estado = null) {
    let query = supabase.from('herramientas').select('*').order('id', { ascending: false });
    if (estado) query = query.eq('estado', estado);

    const { data, error } = await query;
    if (error) throw error;
    return { data: { success: true, data: data || [] } };
  },

  async createHerramienta(formData) {
    const { data, error } = await supabase
      .from('herramientas')
      .insert([formData])
      .select();

    if (error) throw { response: { data: { message: error.message } } };
    return { data: { success: true, data: data[0] } };
  },

  async updateHerramienta(id, formData) {
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
  async getPrestamos(estado = null) {
    let query = supabase
      .from('prestamos')
      .select(`
        *,
        funcionario:funcionarios(nombre, apellido, cedula, cargo),
        prestamo_detalles(herramienta:herramientas(id, codigo, nombre, marca))
      `)
      .order('id', { ascending: false });

    if (estado) query = query.eq('estado', estado);

    const { data, error } = await query;
    if (error) throw error;

    const formatted = (data || []).map(p => ({
      ...p,
      funcionario_nombre: p.funcionario?.nombre,
      funcionario_apellido: p.funcionario?.apellido,
      funcionario_cedula: p.funcionario?.cedula,
      herramientas: (p.prestamo_detalles || []).map(d => d.herramienta)
    }));

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
        funcionario_apellido: d.prestamo?.funcionario?.apellido
      }));
    } else if (tipo === 'funcionarios') {
      const res = await this.getFuncionarios();
      registros = res.data.data;
    }

    return { data: { success: true, data: { registros } } };
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

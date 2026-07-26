import axios from 'axios';
import { supabaseApi } from './supabaseApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const api = {
  async get(url, config) {
    try {
      if (import.meta.env.PROD || import.meta.env.VITE_SUPABASE_URL) {
        return await routeSupabase('GET', url, null, config);
      }
      return await axiosInstance.get(url, config);
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        return await routeSupabase('GET', url, null, config);
      }
      throw err;
    }
  },

  async post(url, data, config) {
    try {
      if (import.meta.env.PROD || import.meta.env.VITE_SUPABASE_URL) {
        return await routeSupabase('POST', url, data, config);
      }
      return await axiosInstance.post(url, data, config);
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        return await routeSupabase('POST', url, data, config);
      }
      throw err;
    }
  },

  async put(url, data, config) {
    try {
      if (import.meta.env.PROD || import.meta.env.VITE_SUPABASE_URL) {
        return await routeSupabase('PUT', url, data, config);
      }
      return await axiosInstance.put(url, data, config);
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        return await routeSupabase('PUT', url, data, config);
      }
      throw err;
    }
  },

  async delete(url, config) {
    try {
      if (import.meta.env.PROD || import.meta.env.VITE_SUPABASE_URL) {
        return await routeSupabase('DELETE', url, null, config);
      }
      return await axiosInstance.delete(url, config);
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        return await routeSupabase('DELETE', url, null, config);
      }
      throw err;
    }
  }
};

// Supabase Route Resolver (Extract query string parameters cleanly)
async function routeSupabase(method, url, data) {
  const parts = url.split('?');
  const cleanUrl = parts[0];
  const queryString = parts[1] || '';
  const params = new URLSearchParams(queryString);

  const search = params.get('search') || '';
  const estado = params.get('estado') || null;
  const tipo = params.get('tipo') || 'prestamos';

  if (cleanUrl === '/auth/login') {
    return await supabaseApi.login(data.usuario, data.password);
  }
  if (cleanUrl === '/dashboard/stats') {
    return await supabaseApi.getDashboardStats();
  }
  if (cleanUrl === '/funcionarios') {
    if (method === 'GET') return await supabaseApi.getFuncionarios(search);
    if (method === 'POST') return await supabaseApi.createFuncionario(data);
  }
  if (cleanUrl.startsWith('/funcionarios/')) {
    const id = cleanUrl.split('/')[2];
    if (method === 'PUT') return await supabaseApi.updateFuncionario(id, data);
    if (method === 'DELETE') return await supabaseApi.deleteFuncionario(id);
  }
  if (cleanUrl === '/herramientas') {
    if (method === 'GET') return await supabaseApi.getHerramientas(search, estado);
    if (method === 'POST') return await supabaseApi.createHerramienta(data);
  }
  if (cleanUrl.startsWith('/herramientas/')) {
    const id = cleanUrl.split('/')[2];
    if (method === 'PUT') return await supabaseApi.updateHerramienta(id, data);
    if (method === 'DELETE') return await supabaseApi.deleteHerramienta(id);
  }
  if (cleanUrl === '/prestamos') {
    if (method === 'GET') return await supabaseApi.getPrestamos(search, estado);
    if (method === 'POST') return await supabaseApi.createPrestamo(data);
  }
  if (cleanUrl === '/devoluciones/registrar') {
    return await supabaseApi.registrarDevolucion(data);
  }
  if (cleanUrl === '/reportes') {
    return await supabaseApi.getReporte(tipo);
  }
  if (cleanUrl === '/historial') {
    return await supabaseApi.getHistorial(search);
  }
  if (cleanUrl === '/configuracion') {
    if (method === 'GET') return await supabaseApi.getConfiguracion();
    if (method === 'POST') return await supabaseApi.saveConfiguracion(data);
  }

  // Default fallback
  return { data: { success: true, data: [] } };
}

export default api;

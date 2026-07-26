import axios from 'axios';
import { supabaseApi } from './supabaseApi';

// Use relative /api URL or Supabase fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptors
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

// Hybrid API Wrapper: Falls back seamlessly to Supabase API when deployed on Vercel or when local XAMPP is offline
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

// Supabase Route Resolver
async function routeSupabase(method, url, data) {
  if (url === '/auth/login') {
    return await supabaseApi.login(data.usuario, data.password);
  }
  if (url === '/dashboard/stats') {
    return await supabaseApi.getDashboardStats();
  }
  if (url === '/funcionarios') {
    if (method === 'GET') return await supabaseApi.getFuncionarios();
    if (method === 'POST') return await supabaseApi.createFuncionario(data);
  }
  if (url.startsWith('/funcionarios/')) {
    const id = url.split('/')[2];
    if (method === 'PUT') return await supabaseApi.updateFuncionario(id, data);
    if (method === 'DELETE') return await supabaseApi.deleteFuncionario(id);
  }
  if (url.startsWith('/herramientas')) {
    if (method === 'GET') {
      const match = url.match(/estado=([^&]+)/);
      const estado = match ? decodeURIComponent(match[1]) : null;
      return await supabaseApi.getHerramientas(estado);
    }
    if (method === 'POST') return await supabaseApi.createHerramienta(data);
  }
  if (url.startsWith('/herramientas/')) {
    const id = url.split('/')[2];
    if (method === 'PUT') return await supabaseApi.updateHerramienta(id, data);
    if (method === 'DELETE') return await supabaseApi.deleteHerramienta(id);
  }
  if (url.startsWith('/prestamos')) {
    if (method === 'GET') {
      const match = url.match(/estado=([^&]+)/);
      const estado = match ? decodeURIComponent(match[1]) : null;
      return await supabaseApi.getPrestamos(estado);
    }
    if (method === 'POST') return await supabaseApi.createPrestamo(data);
  }
  if (url === '/devoluciones/registrar') {
    return await supabaseApi.registrarDevolucion(data);
  }
  if (url.startsWith('/reportes')) {
    const match = url.match(/tipo=([^&]+)/);
    const tipo = match ? match[1] : 'prestamos';
    return await supabaseApi.getReporte(tipo);
  }
  if (url.startsWith('/historial')) {
    return await supabaseApi.getHistorial();
  }
  if (url === '/configuracion') {
    if (method === 'GET') return await supabaseApi.getConfiguracion();
    if (method === 'POST') return await supabaseApi.saveConfiguracion(data);
  }

  // Default fallback
  return { data: { success: true, data: [] } };
}

export default api;

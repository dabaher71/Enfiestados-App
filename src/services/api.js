import axios from 'axios';

// ✅ Cambiar esta línea
const getApiUrl = () => {
  // 1. Si está definido en .env, usarlo
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // 2. Detectar si es emulador Android
  if (typeof navigator !== 'undefined' && navigator.userAgent.includes('Android')) {
    return 'http://10.0.2.2:5001';
  }

  // 3. Detectar si es web local (navegador)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5001';
    }
  }

  // 4. Fallback a Render (producción - APK y web)
  return 'https://enfiestados-api.onrender.com';
};

const API_URL = getApiUrl();

const API = axios.create({
  baseURL: `${API_URL}/api`
});

// Interceptor para agregar el token a todas las peticiones
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
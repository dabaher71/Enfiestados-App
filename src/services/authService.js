import API from './api';

// 🎯 Detectar automáticamente el entorno (igual que en api.js)
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

export const authService = {
  // Registro
  register: async (userData) => {
    const response = await API.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Login
  login: async (credentials) => {
    const response = await API.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Login con Google (OAuth) - Ahora detecta automáticamente el entorno
  loginWithGoogle: () => {
    const apiURL = getApiUrl();
    window.location.href = `${apiURL}/api/auth/google`;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  // Obtener usuario actual
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Obtener perfil completo
  getProfile: async () => {
    const response = await API.get('/auth/me');
    return response.data;
  }
};
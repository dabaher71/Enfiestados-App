import axios from 'axios';

// ✅ Cambiar esta línea
const API_URL = process.env.REACT_APP_API_URL || 'https://enfiestados-api.onrender.com';

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
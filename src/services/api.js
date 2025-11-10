import axios from 'axios';

const API = axios.create({
  baseURL: 'https://enfiestados-api.onrender.com/api'
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
import API from './api';

export const eventService = {
  // Crear evento
  createEvent: async (eventData) => {
    const response = await API.post('/events', eventData);
    return response.data;
  },

  // Obtener todos los eventos
  getEvents: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.category) params.append('category', filters.category);
    if (filters.location) params.append('location', filters.location);
    if (filters.search) params.append('search', filters.search);
    if (filters.lat) params.append('lat', filters.lat);
    if (filters.lng) params.append('lng', filters.lng);
    if (filters.radius) params.append('radius', filters.radius);

    const response = await API.get(`/events?${params.toString()}`);
    return response.data;
  },

  // Obtener un evento por ID
  getEventById: async (eventId) => {
    const response = await API.get(`/events/${eventId}`);
    return response.data;
  },

  // Obtener eventos del organizador
  getOrganizerEvents: async (organizerId) => {
    const response = await API.get(`/events/organizer/${organizerId}`);
    return response.data;
  },

  // Actualizar evento
  updateEvent: async (eventId, eventData) => {
    const response = await API.put(`/events/${eventId}`, eventData);
    return response.data;
  },

  // Eliminar evento
  deleteEvent: async (eventId) => {
    const response = await API.delete(`/events/${eventId}`);
    return response.data;
  },

  // Asistir a un evento
  attendEvent: async (eventId) => {
    const response = await API.post(`/events/${eventId}/attend`);
    return response.data;
  },

  // Cancelar asistencia
  unattendEvent: async (eventId) => {
    const response = await API.post(`/events/${eventId}/unattend`);
    return response.data;
  },

  // Dar like a un evento
  likeEvent: async (eventId) => {
    const response = await API.post(`/events/${eventId}/like`);
    return response.data;
  },

  // Agregar comentario
  addComment: async (eventId, text) => {
    const response = await API.post(`/events/${eventId}/comments`, { text });
    return response.data;
  },

  // Subir imagen del evento
  uploadEventImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await API.post('/events/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};
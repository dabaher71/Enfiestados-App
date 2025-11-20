import API from './api';

export const userService = {
  // Actualizar preferencias del usuario
  updatePreferences: async (preferences) => {
    const response = await API.put('/users/preferences', preferences);
    return response.data;
  },

  // Actualizar perfil del usuario
  updateProfile: async (profileData) => {
    const response = await API.put('/users/profile', profileData);
    return response.data;
  },

  // Obtener perfil de usuario
  getUserProfile: async (userId) => {
    const response = await API.get(`/users/${userId}`);
    return response.data;
  },

  // Seguir usuario
  followUser: async (userId) => {
    const response = await API.post(`/users/${userId}/follow`);
    return response.data;
  },

  // Dejar de seguir usuario
  unfollowUser: async (userId) => {
    const response = await API.post(`/users/${userId}/unfollow`);
    return response.data;
  },

  // Subir avatar
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await API.post('/users/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Subir imagen de portada
  uploadCoverImage: async (file) => {
    const formData = new FormData();
    formData.append('cover', file);
    const response = await API.post('/users/upload-cover', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  //  Eliminar avatar
  removeAvatar: async () => {
    const response = await API.delete('/users/remove-avatar');
    return response.data;
  },

  //  Eliminar imagen de portada
  removeCoverImage: async () => {
    const response = await API.delete('/users/remove-cover');
    return response.data;
  },

  //  Solicitar seguir (para perfiles privados)
  requestFollow: async (userId) => {
    const response = await API.post(`/users/${userId}/request-follow`);
    return response.data;
  },

  //  Aceptar solicitud de seguimiento
  acceptFollowRequest: async (requesterId) => {
    const response = await API.post(`/users/${requesterId}/accept-follow`);
    return response.data;
  },

  //  Rechazar solicitud de seguimiento
  rejectFollowRequest: async (requesterId) => {
    const response = await API.post(`/users/${requesterId}/reject-follow`);
    return response.data;
  },

  //  Cancelar solicitud de seguimiento
  cancelFollowRequest: async (userId) => {
    const response = await API.post(`/users/${userId}/cancel-follow-request`);
    return response.data;
  },

  //  Obtener solicitudes pendientes
  getFollowRequests: async () => {
    const response = await API.get('/users/follow-requests');
    return response.data;
  }

};


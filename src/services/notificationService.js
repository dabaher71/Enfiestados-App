import API from './api';

export const notificationService = {
  // Obtener todas las notificaciones
  getNotifications: async () => {
    const response = await API.get('/notifications');
    return response.data;
  },

  // Marcar como leída
  markAsRead: async (notificationId) => {
    const response = await API.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Marcar todas como leídas
  markAllAsRead: async () => {
    const response = await API.put('/notifications/mark-all-read');
    return response.data;
  }
};
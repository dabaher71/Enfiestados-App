const Notification = require('../models/Notification');
const Event = require('../models/Event');

// Obtener notificaciones del usuario
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate('sender', 'name avatar')
      .populate('event', 'title image')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones',
      error: error.message
    });
  }
};

// Marcar notificación como leída
exports.markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(
      req.params.notificationId,
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: 'Notificación marcada como leída'
    });
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar notificación',
      error: error.message
    });
  }
};

// Marcar todas como leídas
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    });
  } catch (error) {
    console.error('Error al marcar todas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar todas',
      error: error.message
    });
  }
};

// Función auxiliar para crear notificación
exports.createNotification = async (recipientId, senderId, type, eventId, comment = null) => {
  try {
    // No crear notificación si el receptor y emisor son la misma persona
    if (recipientId.toString() === senderId.toString()) {
      return;
    }

    // Evitar notificaciones duplicadas recientes (últimos 5 minutos)
    const recentNotification = await Notification.findOne({
      recipient: recipientId,
      sender: senderId,
      type,
      event: eventId,
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
    });

    if (recentNotification) {
      console.log('⏭️ Notificación duplicada ignorada');
      return;
    }

    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      type,
      event: eventId,
      comment
    });

    await notification.save();
    console.log('✅ Notificación creada:', type);
  } catch (error) {
    console.error('Error al crear notificación:', error);
  }
};
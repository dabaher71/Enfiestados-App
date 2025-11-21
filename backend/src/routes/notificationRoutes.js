const express = require('express');
const {
  getNotifications,
  markAsRead,
  markAllAsRead
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getNotifications);
router.put('/:notificationId/read', protect, markAsRead);
router.put('/mark-all-read', protect, markAllAsRead);

module.exports = router;
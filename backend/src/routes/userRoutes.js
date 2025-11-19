const express = require('express');
const {
  updatePreferences,
  updateProfile,
  getUserProfile,
  followUser,
  unfollowUser,
  uploadAvatar,
  uploadCoverImage,
  removeAvatar,        // ✅ NUEVO
  removeCoverImage     // ✅ NUEVO
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

const router = express.Router();

router.put('/preferences', protect, updatePreferences);
router.put('/profile', protect, updateProfile);
router.get('/:userId', protect, getUserProfile);
router.post('/:userId/follow', protect, followUser);
router.post('/:userId/unfollow', protect, unfollowUser);

// Rutas de subida de imágenes
router.post('/upload-avatar', protect, upload.single('avatar'), uploadAvatar);
router.post('/upload-cover', protect, upload.single('cover'), uploadCoverImage);

// ✅ NUEVAS RUTAS: Eliminar imágenes
router.delete('/remove-avatar', protect, removeAvatar);
router.delete('/remove-cover', protect, removeCoverImage);

module.exports = router;
const express = require('express');
const {
  updatePreferences,
  updateProfile,
  getUserProfile,
  followUser,
  unfollowUser,
  uploadAvatar,
  uploadCoverImage,
  removeAvatar,        
  removeCoverImage,
  requestFollow,          
  acceptFollowRequest,    
  rejectFollowRequest,   
  getFollowRequests,
  cancelFollowRequest    
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

const router = express.Router();

// ✅ Rutas específicas PRIMERO
router.put('/preferences', protect, updatePreferences);
router.put('/profile', protect, updateProfile);

// ✅ Rutas de imágenes
router.post('/upload-avatar', protect, upload.single('avatar'), uploadAvatar);
router.post('/upload-cover', protect, upload.single('cover'), uploadCoverImage);
router.delete('/remove-avatar', protect, removeAvatar);
router.delete('/remove-cover', protect, removeCoverImage);

// ✅ Rutas de solicitudes (ANTES de /:userId)
router.get('/follow-requests', protect, getFollowRequests);

// ✅ Rutas con :userId (DESPUÉS de las específicas)
router.get('/:userId', protect, getUserProfile);
router.post('/:userId/follow', protect, followUser);
router.post('/:userId/unfollow', protect, unfollowUser);
router.post('/:userId/request-follow', protect, requestFollow);
router.post('/:userId/cancel-follow-request', protect, cancelFollowRequest); // ✅ AQUÍ
router.post('/:requesterId/accept-follow', protect, acceptFollowRequest);
router.post('/:requesterId/reject-follow', protect, rejectFollowRequest);

module.exports = router;
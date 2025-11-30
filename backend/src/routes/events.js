const express = require('express');
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  attendEvent,
  unattendEvent,
  likeEvent,
  addComment,
  uploadEventImage,
  getEventsByOrganizer,
  getFollowingEvents,    // 🆕 Agregar
  getForYouEvents,       // 🆕 Agregar
  getExploreEvents 
} = require('../controllers/eventController');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

const router = express.Router();

router.get('/feed/following', protect, eventController.getFollowingEvents);
router.get('/feed/for-you', protect, eventController.getForYouEvents);
router.get('/feed/explore', protect, eventController.getExploreEvents);


// Rutas públicas
router.get('/', getEvents);
router.get('/organizer/:organizerId', getEventsByOrganizer); 
router.get('/:eventId', getEventById);

// Rutas protegidas
router.post('/', protect, createEvent);
router.put('/:eventId', protect, updateEvent);
router.delete('/:eventId', protect, deleteEvent);

// Asistencia
router.post('/:eventId/attend', protect, attendEvent);
router.post('/:eventId/unattend', protect, unattendEvent);

// Likes y comentarios
router.post('/:eventId/like', protect, likeEvent);
router.post('/:eventId/comments', protect, addComment);

// Subir imagen
router.post('/upload-image', protect, upload.single('image'), uploadEventImage);



module.exports = router;
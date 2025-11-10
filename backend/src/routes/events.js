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
  getEventsByOrganizer
} = require('../controllers/eventController');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

const router = express.Router();

// Rutas públicas
router.get('/', getEvents);
router.get('/organizer/:organizerId', getEventsByOrganizer); 
router.get('/:id', getEventById);

// Rutas protegidas
router.post('/', protect, createEvent);
router.put('/:id', protect, updateEvent); // ✅ Solo una ruta PUT
router.delete('/:id', protect, deleteEvent); // ✅ Solo una ruta DELETE

// Asistencia
router.post('/:id/attend', protect, attendEvent);
router.post('/:id/unattend', protect, unattendEvent);

// Likes y comentarios
router.post('/:id/like', protect, likeEvent);
router.post('/:id/comments', protect, addComment);

// Subir imagen
router.post('/upload-image', protect, upload.single('image'), uploadEventImage);

module.exports = router;
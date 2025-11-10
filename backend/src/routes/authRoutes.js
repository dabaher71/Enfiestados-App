const express = require('express');
const {
  register,
  login,
  getMe,
  googleCallback     // ✅ NUEVO
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const passport = require('passport');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

// ✅ NUEVAS RUTAS DE GOOGLE
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/?error=google_auth_failed`
  }),
  googleCallback
);

module.exports = router;
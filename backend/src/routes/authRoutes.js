const express = require('express');
const {
  register,
  login,
  getMe,
  googleCallback
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const passport = require('../config/passport');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

// ✅ AGREGANDO LOGS PARA DEBUG
router.get('/google', (req, res, next) => {
  console.log('🔵 ========== RUTA /GOOGLE ALCANZADA ==========');
  console.log('🔵 GOOGLE_CLIENT_ID existe:', !!process.env.GOOGLE_CLIENT_ID);
  console.log('🔵 GOOGLE_CLIENT_SECRET existe:', !!process.env.GOOGLE_CLIENT_SECRET);
  console.log('🔵 GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL);
  next();
},
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
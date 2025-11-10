const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('🔍 Buscando usuario con Google ID:', profile.id);
        
        // Buscar si el usuario ya existe por Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          console.log('✅ Usuario encontrado por Google ID');
          return done(null, user);
        }

        console.log('🔍 Buscando usuario por email:', profile.emails[0].value);
        
        // Si no existe, buscar por email
        user = await User.findOne({ email: profile.emails[0].value.toLowerCase() });

        if (user) {
          console.log('✅ Usuario encontrado por email, vinculando Google ID...');
          // Vincular cuenta de Google con usuario existente
          user.googleId = profile.id;
          if (profile.photos && profile.photos.length > 0) {
            user.avatar = profile.photos[0].value;
          }
          await user.save();
          console.log('✅ Cuenta vinculada exitosamente');
          return done(null, user);
        }

        console.log('🆕 Creando nuevo usuario...');
        
        // Crear nuevo usuario
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value.toLowerCase(),
          avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
          password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
        });

        console.log('✅ Nuevo usuario creado');
        done(null, user);
      } catch (error) {
        console.error('❌ Error en Google Strategy:', error);
        done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
// backend/server.js

// 🛑 PASO 1: Cargar DotEnv DE PRIMERO
// Esto garantiza que todas las variables de .env estén disponibles 
// ANTES de que cualquier módulo las necesite (como passport.js).
const dotenv = require('dotenv'); 
dotenv.config(); 

// Nota: Si necesitas cargar un .env adicional, usa override: false
// dotenv.config({ path: '../.env', override: false }); 

// 🛑 PASO 2: Importaciones y Requires (Ahora seguros de usar process.env)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// La importación de passport.js ahora es segura porque process.env ya tiene las claves.
const passport = require('./src/config/passport'); 


const app = express();

// Middleware
// Middleware CORS - Permitir apps móviles
app.use(cors({
  origin: function(origin, callback) {
    // Permitir requests sin origin (como mobile apps o Postman)
    if (!origin) return callback(null, true);
    
    // Permitir localhost para Capacitor
    if (origin && (origin.startsWith('http://localhost') || origin.startsWith('https://localhost'))) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `La política de CORS no permite acceso desde el origen: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🛑 PASO 3: INICIALIZACIÓN DE PASSPORT
// Es crucial que esto se ejecute después de cargar dotenv.
app.use(passport.initialize());

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Conectado a MongoDB'))
    .catch((err) => console.error('❌ Error conectando a MongoDB:', err));

// Rutas
app.get('/', (req, res) => {
    res.json({ message: '🚀 API de Eventos Sociales funcionando' });
});

// USO DE LAS RUTAS
app.use('/api/auth', require('./src/routes/authRoutes')); 
app.use('/api/users', require('./src/routes/userRoutes')); 
app.use('/api/notifications', require('./src/routes/notificationRoutes'));
app.use('/api/events', require('./src/routes/events')); 



// Puerto
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';


app.listen(PORT, HOST, () => {
    console.log(`🚀 Servidor corriendo en http://${HOST}:${PORT}`);
});
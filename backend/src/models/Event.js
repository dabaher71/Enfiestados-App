const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título es requerido'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'La categoría es requerida'],
    enum: ['music', 'art', 'food', 'sports', 'tech', 'wellness', 'nightlife', 'culture', 'education', 'nature', 'family', 'business']
  },
  date: {
    type: Date,
    required: [true, 'La fecha es requerida']
  },
  time: {
    type: String,
    required: [true, 'La hora es requerida']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: [true, 'Las coordenadas son requeridas']
    },
    name: {
      type: String,
      trim: true
    }
  },
  price: {
    type: Number,
    default: 0
  },
  isFree: {
    type: Boolean,
    default: true
  },
  capacity: {
    type: Number
  },
  hasParking: {
    type: Boolean,
    default: false
  },
  acceptsOnlinePayment: {
    type: Boolean,
    default: false
  },
  image: {
    type: String,
    default: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop'
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índice geoespacial para búsquedas por ubicación
eventSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Event', eventSchema);
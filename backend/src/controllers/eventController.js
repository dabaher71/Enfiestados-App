const Event = require('../models/Event');
const User = require('../models/User');

// Crear evento
exports.createEvent = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            date,
            time,
            location,
            locationName,
            price,
            isFree,
            capacity,
            hasParking,
            acceptsOnlinePayment,
            image
        } = req.body;

        // Validaciones básicas
        if (!title || !category || !date || !time) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos'
            });
        }

        if (!location || !location.lat || !location.lng) {
            return res.status(400).json({
                success: false,
                message: 'La ubicación es requerida'
            });
        }

        // Crear el evento
        const event = await Event.create({
            title,
            description,
            category,
            date,
            time,
            location: {
                type: 'Point',
                coordinates: [location.lng, location.lat], // MongoDB usa [lng, lat]
                name: locationName || ''
            },
            price: isFree ? 0 : price,
            isFree,
            capacity,
            hasParking,
            acceptsOnlinePayment,
            image,
            organizer: req.user.id
        });

        // Agregar el evento a la lista de eventos organizados del usuario
        await User.findByIdAndUpdate(req.user.id, {
            $push: { eventsOrganized: event._id }
        });

        const populatedEvent = await Event.findById(event._id).populate('organizer', 'name avatar');

        res.status(201).json({
            success: true,
            message: 'Evento creado exitosamente',
            event: populatedEvent
        });
    } catch (error) {
        console.error('Error al crear evento:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear evento',
            error: error.message
        });
    }
};

// Obtener todos los eventos
exports.getEvents = async (req, res) => {
     console.log('🚀 ========== GET EVENTS LLAMADO ==========');
    try {
        const { category, location, search, lat, lng, radius } = req.query;

        let query = {};

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Inicio del día actual
        query.date = { $gte: today };

        console.log('🔍 Fecha actual para filtro:', today);
        console.log('🔍 Query completo:', JSON.stringify(query, null, 2));

        // Filtrar por categoría
        if (category) {
            query.category = category;
        }

        // Búsqueda por texto
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Búsqueda por proximidad geográfica
        if (lat && lng) {
            const maxDistance = radius ? parseInt(radius) : 10000; // 10km por defecto
            query.location = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: maxDistance
                }
            };
        }

        const events = await Event.find(query)
            .populate('organizer', 'name avatar')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: events.length,
            events
        });
    } catch (error) {
        console.error('Error al obtener eventos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener eventos',
            error: error.message
        });
    }
};

// Obtener un evento por ID
exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'name avatar email')
            .populate('attendees', 'name avatar')
            .populate('comments.user', 'name avatar');

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Evento no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            event
        });
    } catch (error) {
        console.error('Error al obtener evento:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener evento',
            error: error.message
        });
    }
};

// Actualizar evento

// Actualizar evento (solo el organizador)
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ 
        success: false,
        message: 'Evento no encontrado' 
      });
    }

    // Verificar que el usuario sea el organizador
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'No tienes permiso para editar este evento' 
      });
    }

    // Actualizar campos simples
    const simpleFields = [
      'title', 
      'description', 
      'category', 
      'date', 
      'time', 
      'price', 
      'isFree', 
      'capacity', 
      'hasParking', 
      'acceptsOnlinePayment',
      'image'
    ];

    simpleFields.forEach(field => {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    });

    // Manejar ubicación (convertir a formato GeoJSON)
    if (req.body.location) {
      event.location = {
        type: 'Point',
        coordinates: [req.body.location.lng, req.body.location.lat],
        name: req.body.locationName || event.location.name || ''
      };
    } else if (req.body.locationName) {
      event.location.name = req.body.locationName;
    }

    await event.save();

    // Poblar datos para la respuesta
    await event.populate('organizer', 'name email avatar');
    await event.populate('attendees', 'name avatar');
    await event.populate('likes', 'name');
    await event.populate('comments.user', 'name avatar');

    res.json({ 
      success: true, 
      message: 'Evento actualizado exitosamente',
      event 
    });
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar evento', 
      error: error.message 
    });
  }
};

// Eliminar evento (solo el organizador)
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    // Verificar que el usuario sea el organizador
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar este evento' });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({ 
      success: true, 
      message: 'Evento eliminado exitosamente' 
    });
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    res.status(500).json({ 
      message: 'Error al eliminar evento', 
      error: error.message 
    });
  }
};

// Asistir a un evento
exports.attendEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Evento no encontrado'
            });
        }

        // Verificar si ya está asistiendo
        if (event.attendees.includes(req.user.id)) {
            return res.status(400).json({
                success: false,
                message: 'Ya estás asistiendo a este evento'
            });
        }

        // Verificar capacidad
        if (event.capacity && event.attendees.length >= event.capacity) {
            return res.status(400).json({
                success: false,
                message: 'El evento ha alcanzado su capacidad máxima'
            });
        }

        event.attendees.push(req.user.id);
        await event.save();

        // Agregar evento a la lista del usuario
        await User.findByIdAndUpdate(req.user.id, {
            $push: { eventsAttending: event._id }
        });

        res.status(200).json({
            success: true,
            message: 'Te has registrado al evento exitosamente',
            event
        });
    } catch (error) {
        console.error('Error al asistir a evento:', error);
        res.status(500).json({
            success: false,
            message: 'Error al asistir a evento',
            error: error.message
        });
    }
};

// Cancelar asistencia a un evento
exports.unattendEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Evento no encontrado'
            });
        }

        // Verificar si está asistiendo
        if (!event.attendees.includes(req.user.id)) {
            return res.status(400).json({
                success: false,
                message: 'No estás asistiendo a este evento'
            });
        }

        event.attendees = event.attendees.filter(
            id => id.toString() !== req.user.id
        );
        await event.save();

        // Remover evento de la lista del usuario
        await User.findByIdAndUpdate(req.user.id, {
            $pull: { eventsAttending: event._id }
        });

        res.status(200).json({
            success: true,
            message: 'Has cancelado tu asistencia al evento',
            event
        });
    } catch (error) {
        console.error('Error al cancelar asistencia:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cancelar asistencia',
            error: error.message
        });
    }
};

// Dar like a un evento
exports.likeEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Evento no encontrado'
            });
        }

        // Toggle like
        if (event.likes.includes(req.user.id)) {
            event.likes = event.likes.filter(id => id.toString() !== req.user.id);
        } else {
            event.likes.push(req.user.id);
        }

        await event.save();

        res.status(200).json({
            success: true,
            liked: event.likes.includes(req.user.id),
            likesCount: event.likes.length
        });
    } catch (error) {
        console.error('Error al dar like:', error);
        res.status(500).json({
            success: false,
            message: 'Error al dar like',
            error: error.message
        });
    }
};

// Agregar comentario
exports.addComment = async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El comentario no puede estar vacío'
            });
        }

        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Evento no encontrado'
            });
        }

        event.comments.push({
            user: req.user.id,
            text: text.trim()
        });

        await event.save();

        const updatedEvent = await Event.findById(req.params.id)
            .populate('comments.user', 'name avatar');

        res.status(201).json({
            success: true,
            message: 'Comentario agregado',
            comments: updatedEvent.comments
        });
    } catch (error) {
        console.error('Error al agregar comentario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al agregar comentario',
            error: error.message
        });
    }
};

// Subir imagen del evento
exports.uploadEventImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionó imagen'
            });
        }

        res.status(200).json({
            success: true,
            image: req.file.path,
            message: 'Imagen subida exitosamente'
        });
    } catch (error) {
        console.error('Error al subir imagen:', error);
        res.status(500).json({
            success: false,
            message: 'Error al subir imagen',
            error: error.message
        });
    }
};

// NUEVA FUNCIÓN: Obtener eventos por el ID del organizador
exports.getEventsByOrganizer = async (req, res) => {
    try {
        const organizerId = req.params.organizerId;

        // Busca todos los eventos donde el campo 'organizer' coincida con el ID proporcionado
        const events = await Event.find({ organizer: organizerId })
            .populate('organizer', 'name avatar') 
            .sort({ createdAt: -1 });

        if (!events || events.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Este organizador aún no ha creado eventos.' 
            });
        }

        res.status(200).json({ 
            success: true, 
            count: events.length, 
            events: events 
        });

    } catch (error) {
        console.error('Error al obtener eventos por organizador:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error del servidor al buscar eventos por organizador.',
            error: error.message
        });
    }
};

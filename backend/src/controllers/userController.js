const User = require('../models/User');

// Actualizar preferencias
exports.updatePreferences = async (req, res) => {
  try {
    const { location, categories } = req.body;
    
    // Validaciones
    if (location && typeof location !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'La ubicación debe ser texto'
      });
    }

    if (categories && !Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        message: 'Las categorías deben ser un array'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { location, categories },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error al actualizar preferencias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar preferencias',
      error: error.message
    });
  }
};

// Actualizar perfil
exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar, coverImage, interests, bio, perfilPublico } = req.body;
    
    // ✅ LOGS DE DEBUG
    console.log('📝 ========== UPDATE PROFILE ==========');
    console.log('📝 Datos recibidos:', { name, avatar, coverImage, interests, bio, perfilPublico });
    console.log('📝 Usuario ID:', req.user.id);
    
    // Validar nombre si se proporciona
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'El nombre debe tener al menos 2 caracteres'
        });
      }
    }

    // Validar bio si se proporciona
    if (bio !== undefined) {
      if (typeof bio !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'La biografía debe ser texto'
        });
      }
      if (bio.length > 500) {
        return res.status(400).json({
          success: false,
          message: 'La biografía no puede exceder 500 caracteres'
        });
      }
    }

    // Validar interests si se proporcionan
    if (interests !== undefined) {
      if (!Array.isArray(interests)) {
        return res.status(400).json({
          success: false,
          message: 'Los intereses deben ser un array'
        });
      }
    }

    // ✅ Validar perfilPublico si se proporciona
    if (perfilPublico !== undefined) {
      if (typeof perfilPublico !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'perfilPublico debe ser un valor booleano'
        });
      }
    }

    // Preparar datos para actualizar
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (avatar !== undefined) updateData.avatar = avatar;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (interests) updateData.interests = interests;
    if (bio !== undefined) updateData.bio = bio.trim();
    if (perfilPublico !== undefined) updateData.perfilPublico = perfilPublico; // ✅ NUEVO
    
    console.log('📝 updateData preparado:', updateData);
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // ✅ LOGS DESPUÉS DE ACTUALIZAR
    console.log('📝 Usuario actualizado en DB:', {
      id: user._id,
      name: user.name,
      bio: user.bio,
      bioLength: user.bio ? user.bio.length : 0,
      perfilPublico: user.perfilPublico
    });

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        coverImage: user.coverImage,
        interests: user.interests,
        bio: user.bio,
        perfilPublico: user.perfilPublico,  // ✅ NUEVO
        location: user.location,
        categories: user.categories,
        followers: user.followers || [],     
        following: user.following || []      
      }
    });
  } catch (error) {
    console.error('❌ Error al actualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil',
      error: error.message
    });
  }
};


// Obtener perfil de usuario
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('eventsOrganized')
      .populate('eventsAttending');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const isOwnProfile = req.user && req.user.id === user._id.toString();
    
    const isFollowing = req.user && user.followers.some(
      followerId => followerId.toString() === req.user.id.toString()
    );

    // ✅ NUEVO: Verificar si hay solicitud pendiente
    const hasPendingRequest = req.user && user.followRequests.some(
      requesterId => requesterId.toString() === req.user.id.toString()
    );

    console.log('🔍 ========== VERIFICACIÓN DE PRIVACIDAD ==========');
    console.log('Usuario viendo:', req.user?.id);
    console.log('Perfil de:', user._id.toString());
    console.log('Es su propio perfil:', isOwnProfile);
    console.log('Lo sigue:', isFollowing);
    console.log('Tiene solicitud pendiente:', hasPendingRequest); // ✅ NUEVO
    console.log('Perfil es público:', user.perfilPublico);
    console.log('Seguidores del perfil:', user.followers.map(f => f.toString()));

    if (!user.perfilPublico && !isOwnProfile && !isFollowing) {
      console.log('❌ Bloqueando acceso - Perfil privado');
      return res.status(200).json({
        success: true,
        isPrivate: true,
        hasPendingRequest, // ✅ NUEVO
        user: {
          id: user._id,
          name: user.name,
          avatar: user.avatar,
          coverImage: user.coverImage,
          bio: user.bio,
          perfilPublico: user.perfilPublico,
          followers: user.followers,
          following: user.following,
          hasPendingRequest // ✅ NUEVO
        },
        events: []
      });
    }

    console.log('✅ Permitiendo acceso completo al perfil');
    
    res.status(200).json({
      success: true,
      isPrivate: false,
      hasPendingRequest, // ✅ NUEVO
      user: {
        ...user.toObject(),
        hasPendingRequest // ✅ NUEVO
      },
      events: user.eventsOrganized || []
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: error.message
    });
  }
};

// Seguir usuario
exports.followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.userId);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (userToFollow._id.toString() === currentUser._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'No puedes seguirte a ti mismo'
      });
    }

    if (currentUser.following.includes(userToFollow._id)) {
      return res.status(400).json({
        success: false,
        message: 'Ya sigues a este usuario'
      });
    }

    currentUser.following.push(userToFollow._id);
    userToFollow.followers.push(currentUser._id);

    // ✅ USAR Promise.all para guardar ambos al mismo tiempo
    await Promise.all([
      currentUser.save(),
      userToFollow.save()
    ]);

    console.log('✅ Usuario seguido correctamente');
    console.log('Seguidores actualizados:', userToFollow.followers.map(f => f.toString()));

    res.status(200).json({
      success: true,
      message: 'Siguiendo usuario'
    });
  } catch (error) {
    console.error('Error al seguir usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al seguir usuario',
      error: error.message
    });
  }
};

// Dejar de seguir
exports.unfollowUser = async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.userId);
    const currentUser = await User.findById(req.user.id);

    if (!userToUnfollow) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    currentUser.following = currentUser.following.filter(
      id => id.toString() !== userToUnfollow._id.toString()
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => id.toString() !== currentUser._id.toString()
    );

    // ✅ USAR Promise.all para guardar ambos al mismo tiempo
    await Promise.all([
      currentUser.save(),
      userToUnfollow.save()
    ]);

    console.log('✅ Dejaste de seguir correctamente');

    res.status(200).json({
      success: true,
      message: 'Dejaste de seguir al usuario'
    });
  } catch (error) {
    console.error('Error al dejar de seguir:', error);
    res.status(500).json({
      success: false,
      message: 'Error al dejar de seguir',
      error: error.message
    });
  }
};

// ✅ Solicitar seguir (para perfiles privados)
exports.requestFollow = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.userId);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (userToFollow._id.toString() === currentUser._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'No puedes enviarte solicitud a ti mismo'
      });
    }

    // Verificar si ya lo sigue
    if (currentUser.following.includes(userToFollow._id)) {
      return res.status(400).json({
        success: false,
        message: 'Ya sigues a este usuario'
      });
    }

    // Verificar si ya envió solicitud
    if (userToFollow.followRequests.includes(currentUser._id)) {
      return res.status(400).json({
        success: false,
        message: 'Ya enviaste una solicitud a este usuario'
      });
    }

    // Agregar solicitud
    userToFollow.followRequests.push(currentUser._id);
    await userToFollow.save();

    console.log('✅ Solicitud de seguimiento enviada');

    res.status(200).json({
      success: true,
      message: 'Solicitud enviada'
    });
  } catch (error) {
    console.error('Error al enviar solicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar solicitud',
      error: error.message
    });
  }
};

// ✅ Aceptar solicitud de seguimiento
exports.acceptFollowRequest = async (req, res) => {
  try {
    const requesterId = req.params.requesterId;
    const currentUser = await User.findById(req.user.id);
    const requester = await User.findById(requesterId);

    if (!requester) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar que la solicitud existe
    if (!currentUser.followRequests.includes(requesterId)) {
      return res.status(400).json({
        success: false,
        message: 'No hay solicitud de este usuario'
      });
    }

    // Remover de solicitudes
    currentUser.followRequests = currentUser.followRequests.filter(
      id => id.toString() !== requesterId
    );

    // Agregar a seguidores/siguiendo
    currentUser.followers.push(requesterId);
    requester.following.push(currentUser._id);

    await Promise.all([
      currentUser.save(),
      requester.save()
    ]);

    console.log('✅ Solicitud aceptada');

    res.status(200).json({
      success: true,
      message: 'Solicitud aceptada'
    });
  } catch (error) {
    console.error('Error al aceptar solicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aceptar solicitud',
      error: error.message
    });
  }
};

// ✅ Rechazar solicitud de seguimiento
exports.rejectFollowRequest = async (req, res) => {
  try {
    const requesterId = req.params.requesterId;
    const currentUser = await User.findById(req.user.id);

    if (!currentUser.followRequests.includes(requesterId)) {
      return res.status(400).json({
        success: false,
        message: 'No hay solicitud de este usuario'
      });
    }

    // Remover de solicitudes
    currentUser.followRequests = currentUser.followRequests.filter(
      id => id.toString() !== requesterId
    );

    await currentUser.save();

    console.log('✅ Solicitud rechazada');

    res.status(200).json({
      success: true,
      message: 'Solicitud rechazada'
    });
  } catch (error) {
    console.error('Error al rechazar solicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error al rechazar solicitud',
      error: error.message
    });
  }
};

// ✅ Cancelar solicitud de seguimiento
exports.cancelFollowRequest = async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.userId);
    const currentUser = await User.findById(req.user.id);

    if (!userToUnfollow) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar que la solicitud existe
    if (!userToUnfollow.followRequests.includes(currentUser._id)) {
      return res.status(400).json({
        success: false,
        message: 'No hay solicitud pendiente'
      });
    }

    // Remover solicitud
    userToUnfollow.followRequests = userToUnfollow.followRequests.filter(
      id => id.toString() !== currentUser._id.toString()
    );

    await userToUnfollow.save();

    console.log('✅ Solicitud cancelada');

    res.status(200).json({
      success: true,
      message: 'Solicitud cancelada'
    });
  } catch (error) {
    console.error('Error al cancelar solicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar solicitud',
      error: error.message
    });
  }
};

// ✅ Obtener solicitudes pendientes
exports.getFollowRequests = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id)
      .populate('followRequests', 'name avatar email');

    res.status(200).json({
      success: true,
      requests: currentUser.followRequests || []
    });
  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener solicitudes',
      error: error.message
    });
  }
};


// Subir avatar
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó imagen'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: req.file.path },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      avatar: user.avatar,
      message: 'Avatar actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al subir avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir avatar',
      error: error.message
    });
  }
};

// Subir imagen de portada
exports.uploadCoverImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó imagen'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { coverImage: req.file.path },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      coverImage: user.coverImage,
      message: 'Imagen de portada actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al subir imagen de portada:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir imagen de portada',
      error: error.message
    });
  }
};

// ✅ NUEVO: Eliminar avatar
exports.removeAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (!user.avatar) {
      return res.status(400).json({
        success: false,
        message: 'No hay avatar para eliminar'
      });
    }

    user.avatar = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Avatar eliminado correctamente',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        coverImage: user.coverImage,
        interests: user.interests,
        location: user.location,
        categories: user.categories
      }
    });
  } catch (error) {
    console.error('Error al eliminar avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar avatar',
      error: error.message
    });
  }
};

// ✅ NUEVO: Eliminar imagen de portada
exports.removeCoverImage = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (!user.coverImage) {
      return res.status(400).json({
        success: false,
        message: 'No hay imagen de portada para eliminar'
      });
    }

    user.coverImage = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Imagen de portada eliminada correctamente',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        coverImage: user.coverImage,
        interests: user.interests,
        location: user.location,
        categories: user.categories
      }
    });
  } catch (error) {
    console.error('Error al eliminar imagen de portada:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar imagen de portada',
      error: error.message
    });
  }
};
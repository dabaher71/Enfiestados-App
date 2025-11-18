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
    const { name, avatar, coverImage, interests, bio } = req.body;
    
    // ✅ LOGS DE DEBUG
    console.log('📝 ========== UPDATE PROFILE ==========');
    console.log('📝 Datos recibidos:', { name, avatar, coverImage, interests, bio });
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

    // Preparar datos para actualizar
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (avatar !== undefined) updateData.avatar = avatar;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (interests) updateData.interests = interests;
    if (bio !== undefined) updateData.bio = bio.trim();
    
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
      bioLength: user.bio ? user.bio.length : 0
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

    res.status(200).json({
      success: true,
      user
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

    // No puedes seguirte a ti mismo
    if (userToFollow._id.toString() === currentUser._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'No puedes seguirte a ti mismo'
      });
    }

    // Verificar si ya lo sigue
    if (currentUser.following.includes(userToFollow._id)) {
      return res.status(400).json({
        success: false,
        message: 'Ya sigues a este usuario'
      });
    }

    currentUser.following.push(userToFollow._id);
    userToFollow.followers.push(currentUser._id);

    await currentUser.save();
    await userToFollow.save();

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

    await currentUser.save();
    await userToUnfollow.save();

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
import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Bell, User, Calendar, Plus, Search, Home, MapPin, Filter, ChevronLeft, Navigation } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { authService } from './services/authService';
import { userService } from './services/userService';
import { eventService } from './services/eventService';
import { notificationService } from './services/notificationService';

// Componente Toast Notification estilo YouTube
const Toast = ({ message, type = 'info', onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Tiempo total visible antes de iniciar salida
    const visibleMs = 3500;
    const exitAnimMs = 400; // debe coincidir con la animación de salida
    const enterDelay = 50;

    const t1 = setTimeout(() => {
      // iniciar salida después de visibleMs
      setIsExiting(true);
      setTimeout(onClose, exitAnimMs);
    }, visibleMs + enterDelay);

    return () => clearTimeout(t1);
  }, [onClose]);

  const getIcon = () => {
    switch(type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'follow': return '👤';
      default: return 'ℹ️';
    }
  };

  const getIconBg = () => {
    switch(type) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  // animaciones inline para no depender de CSS global
  const enterDuration = 600;
  const exitDuration = 400;
  const enterTiming = 'cubic-bezier(.2,.9,.2,1)';
  const exitTiming = 'cubic-bezier(.25,.8,.25,1)';

  return (
    <>
      <style>{`
        @keyframes enfi_toast_enter {
          0% { transform: translate(-50%, -36px); opacity: 0; }
          60% { transform: translate(-50%, 6px); opacity: 1; }
          100% { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes enfi_toast_exit {
          0% { transform: translate(-50%, 0); opacity: 1; }
          100% { transform: translate(-50%, -48px); opacity: 0; }
        }
      `}</style>

      <div
        aria-live="polite"
        style={{
          zIndex: 9999,
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'auto',
          animationName: isExiting ? 'enfi_toast_exit' : 'enfi_toast_enter',
          animationDuration: `${isExiting ? exitDuration : enterDuration}ms`,
          animationTimingFunction: isExiting ? exitTiming : enterTiming,
          animationFillMode: 'forwards'
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl px-5 py-3 flex items-center space-x-3 min-w-[320px] max-w-[90vw]">
          <div className={`${getIconBg()} text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold`}>
            {getIcon()}
          </div>
          <p className="text-gray-800 font-medium flex-1 text-sm">{message}</p>
          <button
            onClick={() => {
              setIsExiting(true);
              // esperar la animación de salida antes de cerrar
              setTimeout(onClose, exitDuration);
            }}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Cerrar notificación"
          >
            ×
          </button>
        </div>
      </div>
    </>
  );
};

const EventsApp = () => {
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [toast, setToast] = useState(null);
  const [editProfileData, setEditProfileData] = useState({
    name: '',
    bio: '',
    interests: [],
    avatar: null,
    coverImage: null,
    perfilPublico: undefined
  });
  const [authMode, setAuthMode] = useState('login');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [activeTab, setActiveTab] = useState('feed');
  const [followRequests, setFollowRequests] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('San José');
  const [viewingUserProfile, setViewingUserProfile] = useState(null);
  const [viewingUserEvents, setViewingUserEvents] = useState([]);
  const [loadingUserProfile, setLoadingUserProfile] = useState(false);
  const [likedEvents, setLikedEvents] = useState({});
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState('pending');
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [map, setMap] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    gender: 'no-especificado'
  });
  const [userPreferences, setUserPreferences] = useState({
    location: '',
    categories: []
  });
  const [createEventStep, setCreateEventStep] = useState(1);
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    category: '',
    date: '',
    time: '',
    location: null,
    locationName: '',
    price: '',
    isFree: true,
    capacity: '',
    image: null,
    imagePreview: null,
    hasParking: false,
    acceptsOnlinePayment: true
  });
  const [isFollowing, setIsFollowing] = useState(false);
  const [profileRefresh, setProfileRefresh] = useState(0);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [organizedEvents, setOrganizedEvents] = useState([]);
  const [loadingOrganizedEvents, setLoadingOrganizedEvents] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  // Estados para el perfil de usuario
  const [userProfileTab, setUserProfileTab] = useState('eventos'); // 'eventos' o 'intereses'
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [editEventStep, setEditEventStep] = useState(1);
  const [activityNotifications, setActivityNotifications] = useState([]);

    const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY
  });

   const availableLocations = [
    'San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 
    'Puntarenas', 'Limón'
  ];

  
  const availableCategories = [
    { id: 'music', name: 'Música', icon: '🎵', color: '#8B5CF6' },
    { id: 'art', name: 'Arte', icon: '🎨', color: '#EC4899' },
    { id: 'food', name: 'Gastronomía', icon: '🍽️', color: '#F59E0B' },
    { id: 'sports', name: 'Deportes', icon: '⚽', color: '#10B981' },
    { id: 'tech', name: 'Tecnología', icon: '💻', color: '#3B82F6' },
    { id: 'wellness', name: 'Bienestar', icon: '🧘', color: '#14B8A6' },
    { id: 'nightlife', name: 'Vida Nocturna', icon: '🌙', color: '#6366F1' },
    { id: 'culture', name: 'Cultura', icon: '🎭', color: '#EF4444' },
    { id: 'education', name: 'Educación', icon: '📚', color: '#06B6D4' },
    { id: 'nature', name: 'Naturaleza', icon: '🌿', color: '#22C55E' },
    { id: 'family', name: 'Familiar', icon: '👨‍👩‍👧', color: '#F97316' },
    { id: 'business', name: 'Negocios', icon: '💼', color: '#64748B' }
  ];

  const mapContainerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '24px'
  };

  const mapOptions = {
    disableDefaultUI: true,
    zoomControl: false,
    mapTypeControl: false,
    scaleControl: false,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: false,
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
      }
    ]
  };

  // Cargar datos del usuario al iniciar
  
  useEffect(() => {
    const token = authService.getToken();
    setIsAuthenticated(!!token);
    if (token) {
      const userData = authService.getCurrentUser();
      setCurrentUserData(userData);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && !showOnboarding) {
      requestLocation();
    }
  }, [isAuthenticated, showOnboarding]);

  useEffect(() => {
    if (showEditProfile) {
      const currentUser = authService.getCurrentUser();
      setEditProfileData({
        name: currentUser?.name || '',
        interests: currentUser?.interests || [],
        avatar: null,
        coverImage: null,
        // inicializar perfilPublico para que el toggle tenga valor correcto
        perfilPublico: currentUser?.perfilPublico !== undefined ? currentUser.perfilPublico : true
      });
    }
  }, [showEditProfile]);

  // Cargar eventos cuando el usuario esté autenticado
  useEffect(() => {
    if (isAuthenticated && !showOnboarding) {
      loadEvents();
    }
  }, [isAuthenticated, showOnboarding]);

    useEffect(() => {
  const userId = currentUserData?._id || currentUserData?.id;
  if (activeTab === 'profile' && userId) {
    console.log('📋 Cargando eventos del organizador:', userId);
    loadOrganizedEvents(userId);
  }
}, [activeTab, currentUserData, profileRefresh]);

useEffect(() => {
  console.log('🔄 TOAST STATE CAMBIÓ A:', toast);
}, [toast]);



// Función para mostrar notificaciones tipo toast

const showToast = (message, type = 'info') => {
  console.log('🔔 SHOWTOAST LLAMADO:', message, type);
  console.log('📊 Toast state antes:', toast);
  setToast({ message, type });
  console.log('✅ setToast ejecutado');
};


  // Función para cargar eventos
  const loadEvents = async () => {
    try {
      setLoadingEvents(true);
      const filters = {};
      
      if (userLocation) {
        filters.lat = userLocation.lat;
        filters.lng = userLocation.lng;
        filters.radius = 50000;
      }
      
      const data = await eventService.getEvents(filters);
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
    } finally {
      setLoadingEvents(false);
    }
  };
  const loadOrganizedEvents = async (organizerId) => {
  if (!organizerId) return;
  
  try {
    setLoadingOrganizedEvents(true);
    const data = await eventService.getOrganizerEvents(organizerId);
    setOrganizedEvents(data.events || []);
    console.log('✅ Eventos organizados cargados:', data.events?.length || 0);
  } catch (error) {
    console.error('❌ Error al cargar eventos del organizador:', error);
    setOrganizedEvents([]);
  } finally {
    setLoadingOrganizedEvents(false);
  }
  };

  // --- FUNCIONES AUXILIARES FALTANTES ---

// Función de manejo de cambios en formularios de Auth/Onboarding/Create


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handlers de Auth (Registro e Inicio de Sesión)
  const handleAuthSubmit = async (e) => {
  e.preventDefault();
  try {
    let response;
    if (authMode === 'register') {
      response = await authService.register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        gender: formData.gender
      });
      showToast('Registro exitoso. ¡Inicia sesión!', 'success');
      setAuthMode('login');
    } else {
      response = await authService.login({
        email: formData.email,
        password: formData.password
      });
      showToast('Inicio de sesión exitoso', 'success');
      setIsAuthenticated(true);
      setCurrentUserData(authService.getCurrentUser());
      if (!response.user.location && response.user.categories?.length === 0) {
        setShowOnboarding(true);
      }
    }
    setFormData({ email: '', password: '', name: '', gender: 'no-especificado' });
  } catch (error) {
    console.error('Error de autenticación:', error);
    showToast(error.response?.data?.message || 'Credenciales inválidas', 'error');
  }
  };

  // Handlers de Onboarding
  const handleOnboardingNext = () => {
    if (onboardingStep === 1 && !userPreferences.location) {
        showToast('Por favor, selecciona tu ubicación.', 'error');
        return;
    }
    if (onboardingStep === 2 && userPreferences.categories.length === 0) {
        showToast('Por favor, selecciona al menos una categoría.', 'error');
        return;
    }

    if (onboardingStep < 3) {
        setOnboardingStep(prev => prev + 1);
    } else {
        // Fin del Onboarding: Guardar preferencias
        handleSavePreferences();
    }
  };

  const handleToggleCategory = (categoryId) => {
    setUserPreferences(prev => {
        const categories = prev.categories.includes(categoryId)
            ? prev.categories.filter(id => id !== categoryId)
            : [...prev.categories, categoryId];
        return { ...prev, categories };
    });
  };

  const handleSavePreferences = async () => {
    try {
        await userService.updatePreferences(userPreferences);
        showToast('✅ Preferencias guardadas', 'success');
        setShowOnboarding(false);
        setProfileRefresh(prev => prev + 1); // Forzar recarga de datos/eventos
    } catch (error) {
        console.error('Error al guardar preferencias:', error);
        showToast('Error al guardar preferencias. Intenta de nuevo.', 'error');
    }
  };

  // --- FIN FUNCIONES AUXILIARES FALTANTES ---

  // --- FUNCIONES DE RENDERIZADO (Auth y Onboarding) ---


  const renderOnboarding = () => (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex gap-2 mb-8">
          <div className={`flex-1 h-1 rounded-full ${onboardingStep >= 1 ? 'bg-blue-600' : 'bg-gray-700'}`}></div>
          <div className={`flex-1 h-1 rounded-full ${onboardingStep >= 2 ? 'bg-blue-600' : 'bg-gray-700'}`}></div>
        </div>

        {onboardingStep === 1 ? (
          <>
            <h2 className="text-white text-2xl font-bold mb-2">¿Dónde te gustaría explorar?</h2>
            <p className="text-gray-400 mb-6">Selecciona tu zona de interés para eventos</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {availableLocations.map(location => (
                <button
                  key={location}
                  onClick={() => handleLocationSelect(location)}
                  className={`p-4 rounded-xl font-semibold transition-all ${
                    userPreferences.location === location
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {location}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-white text-2xl font-bold mb-2">¿Qué te interesa?</h2>
            <p className="text-gray-400 mb-6">Selecciona tus categorías favoritas (mínimo 1)</p>

            <div className="grid grid-cols-2 gap-3 mb-6 max-h-96 overflow-y-auto">
              {availableCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryToggle(category.id)}
                  className={`p-4 rounded-xl font-semibold transition-all flex flex-col items-center gap-2 ${
                    userPreferences.categories.includes(category.id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span className="text-3xl">{category.icon}</span>
                  <span className="text-sm">{category.name}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleOnboardingSkip}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition-all"
          >
            Omitir
          </button>
          <button
            onClick={handleOnboardingNext}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all"
          >
            {onboardingStep === 1 ? 'Siguiente' : 'Finalizar'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderAuth = () => {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-gray-900">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img 
            src={require('./assets/logo.png')} 
            alt="Enfiestados" 
            className="w-48 h-48 object-contain"
          />
        </div>
        

        
        <h1 className="text-white text-xl font-semibold mb-2 text-center">
          {authMode === 'login' ? 'Bienvenido' : 'Crear Cuenta'}
        </h1>
        <p className="text-gray-400 mb-6 text-center">
          {authMode === 'login' 
            ? 'Inicia sesión para continuar' 
            : 'Regístrate para comenzar'}
        </p>

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {authMode === 'register' && (
            <div>
              <label className="text-white font-semibold mb-2 block">Nombre</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full bg-gray-800 text-white text-base rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Tu nombre completo"
                required
              />
            </div>
          )}

          <div>
            <label className="text-white font-semibold mb-2 block">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full bg-gray-800 text-white text-base rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label className="text-white font-semibold mb-2 block">Contraseña</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full bg-gray-800 text-white text-base rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="••••••••"
              required
            />
          </div>

          {authMode === 'register' && (
            <div>
              <label className="text-white font-semibold mb-2 block">Género</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full bg-gray-800 text-white text-base rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="no-especificado">Prefiero no decirlo</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all"
          >
            {authMode === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
          </button>

          <button
            type="button"
            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            className="w-full text-gray-400 hover:text-white text-sm transition-all"
          >
            {authMode === 'login' 
              ? '¿No tienes cuenta? Regístrate' 
              : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </form>

        {/* Separador */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-700"></div>
          <span className="text-gray-500 text-sm">O continúa con</span>
          <div className="flex-1 h-px bg-gray-700"></div>
        </div>

        {/* Botón de Google */}
        <button
          type="button"
          onClick={() => authService.loginWithGoogle()}
          className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-3 border border-gray-300"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar con Google
        </button>
      </div>
    </div>
  );
  };

  // --- FIN FUNCIONES DE RENDERIZADO (Auth y Onboarding) ---

  
  const renderFeed = () => {
    const handleEventClick = async (event) => {
      try {
        
        const response = await eventService.getEventById(event._id);
        setSelectedEvent(response.event);
        setShowEventDetail(true);
      } catch (error) {
        console.error('Error al cargar evento:', error);
        // NO USAR alert(). Se reemplaza por un console.warn para evitar el bloqueo del iframe.
        console.warn('Advertencia: El error original usaba alert(), lo cual no funciona en este entorno.'); 
      }
    };

    // return de tu feed completo
    return (
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="sticky top-0 z-10 bg-gray-900 p-4 border-b border-gray-800">
          <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-4 py-3">
            {/* Si MapPin y Search son componentes de íconos (como Lucide React), deben estar importados */}
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              // Debes asegurar que setSearchQuery esté definida con useState en tu componente App
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="flex-1 bg-transparent text-white outline-none"
              placeholder="Buscar eventos..."
            />
            <MapPin className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex justify-between items-center mt-3">
            <button className="text-white text-sm flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtrar
            </button>
            <span className="text-gray-400 text-sm">
              {events.length} eventos cerca de ti
            </span>
          </div>
        </div>

        {/* renderMap() debe ser una función definida en tu componente App que retorna JSX */}
        <div className="px-4 mt-4">
          {renderMap()}
        </div>

        <div className="px-4 mt-4">
          {loadingEvents ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-400 mt-4">Cargando eventos...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">No hay eventos aún</h3>
              <p className="text-gray-400 mb-6">Sé el primero en crear un evento en tu zona</p>
              <button
                // Debes asegurar que setActiveTab esté definida con useState en tu componente App
                onClick={() => setActiveTab('create')} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
              >
                Crear Evento
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                // availableCategories debe estar definido en tu componente App
                const category = availableCategories.find(c => c.id === event.category); 
                // likedEvents debe estar definido en tu componente App
                const isLiked = likedEvents[event._id]; 
                
                return (
                  <div
                    key={event._id}
                    className="bg-gray-800 rounded-2xl overflow-hidden cursor-pointer hover:bg-gray-750 transition-all"
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="relative h-48">
                      <img
                        src={event.image || `https://placehold.co/600x480/4F46E5/ffffff?text=Evento+${event.title}`}
                        alt={event.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        {category && (
                          <span
                            className="px-3 py-1 rounded-full text-white text-sm font-semibold"
                            style={{ backgroundColor: category.color }}
                          >
                            {category.icon} {category.name}
                          </span>
                        )}
                        {event.isFree && (
                          <span className="bg-green-600 px-3 py-1 rounded-full text-white text-sm font-semibold">
                            Gratis
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="text-white text-lg font-bold mb-2">{event.title}</h3>
                      
                      <div 
  className="flex items-center gap-2 text-gray-400 text-sm mb-2 hover:text-blue-400 transition-colors cursor-pointer"
  onClick={(e) => {
    e.stopPropagation();
    if (event.organizer?._id) {
      const loggedInUser = authService.getCurrentUser();
      
      // ✅ Si el organizador eres tú, limpia viewingUserProfile
      if (event.organizer._id === loggedInUser.id) {
        setViewingUserProfile(null);
        setActiveTab('profile');
      } else {
        // ✅ Si es otra persona, carga su perfil
        loadUserProfile(event.organizer._id);
        setActiveTab('profile');
      }
    }
  }}
>
  <User className="w-4 h-4" /> 
  <span>{event.organizer?.name || 'Organizador'}</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location?.name || 'Ubicación por confirmar'}</span>
                      </div>

                      {event.description && (
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                        <div className="flex gap-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // handleLike debe ser una función definida en tu componente App
                              handleLike(event._id); 
                            }}
                            className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-all"
                          >
                            <Heart
                              className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`}
                            />
                            <span className="text-sm">{event.likes?.length || 0}</span>
                          </button>

                          <button className="flex items-center gap-2 text-gray-400 hover:text-blue-500 transition-all">
                            <MessageCircle className="w-5 h-5" />
                            <span className="text-sm">{event.comments?.length || 0}</span>
                          </button>

                          <button className="flex items-center gap-2 text-gray-400 hover:text-green-500 transition-all">
                            <Share2 className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <User className="w-4 h-4" />
                          <span>{event.attendees?.length || 0} asistirán</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderUserProfile = () => {
  if (!viewingUserProfile) return null;

  const profileData = {
    name: viewingUserProfile.name || 'Usuario',
    avatar: viewingUserProfile.avatar || null,
    coverImage: viewingUserProfile.coverImage || null,
    bio: viewingUserProfile.bio || '',
    eventsCount: viewingUserEvents.length,
    followersCount: viewingUserProfile.followers?.length || 0,
    interestsCount: viewingUserProfile.interests?.length || 0,
    interests: viewingUserProfile.interests || [],
  };

  const handleFollowToggle = async () => {
    try {
      setFollowLoading(true);
      // TODO: Implementar endpoint de follow/unfollow
      // await userService.toggleFollow(viewingUserProfile._id);
      setIsFollowingUser(!isFollowingUser);
      console.log('Toggle follow:', viewingUserProfile._id);
    } catch (error) {
      console.error('Error al seguir/dejar de seguir:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      {/* Botones superiores */}
      <div className="absolute top-4 left-4 z-10">
        <button 
          onClick={() => {
            setActiveTab('feed');
            setViewingUserProfile(null);
            setViewingUserEvents([]);
            setUserProfileTab('eventos');
          }}
          className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg"
        >
          <ChevronLeft className="w-5 h-5 text-gray-900" />
        </button>
      </div>

      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg">
          <Share2 className="w-5 h-5 text-gray-900" />
        </button>
      </div>

      {/* Cover Image */}
      <div className="relative h-48">
        {profileData.coverImage ? (
          <img 
            src={profileData.coverImage} 
            alt="Cover" 
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/50"></div>
      </div>

      {/* Profile Content */}
      <div className="px-6 -mt-16 relative">
        {/* Avatar */}
        <div className="relative inline-block">
          {profileData.avatar ? (
            <img 
              src={profileData.avatar} 
              alt="Avatar" 
              className="w-28 h-28 rounded-full border-4 border-gray-900 object-cover bg-gray-700"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-28 h-28 rounded-full border-4 border-gray-900 bg-gray-700 flex items-center justify-center">
              <User className="w-14 h-14 text-gray-500" />
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-8 mt-4 mb-4">
          <div className="text-center">
            <div className="text-white text-2xl font-bold">{profileData.eventsCount}</div>
            <div className="text-gray-400 text-xs">Eventos</div>
          </div>
          <div className="text-center">
            <div className="text-white text-2xl font-bold">{profileData.followersCount}</div>
            <div className="text-gray-400 text-xs">Seguidores</div>
          </div>
          <div className="text-center">
            <div className="text-white text-2xl font-bold">{profileData.interestsCount}</div>
            <div className="text-gray-400 text-xs">Intereses</div>
          </div>
        </div>

        {/* Name */}
        <h1 className="text-white text-2xl font-bold mb-2">{profileData.name}</h1>

        {/* Bio */}
        {profileData.bio && (
          <p className="text-gray-400 text-sm mb-4">{profileData.bio}</p>
        )}

        {/* Follow Button */}
        <div className="flex gap-2 mb-6">
          <button 
            onClick={handleFollowToggle}
            disabled={followLoading}
            className={`flex-1 font-semibold py-3 rounded-xl transition-all disabled:opacity-50 ${
              isFollowingUser 
                ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {followLoading ? '...' : isFollowingUser ? 'Siguiendo' : 'Seguir'}
          </button>
          <button className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-all">
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 mb-6">
          <button 
            onClick={() => setUserProfileTab('eventos')}
            className={`flex-1 text-center py-3 font-semibold transition-all ${
              userProfileTab === 'eventos' 
                ? 'text-white border-b-2 border-blue-600' 
                : 'text-gray-400'
            }`}
          >
            Eventos
          </button>
          <button 
            onClick={() => setUserProfileTab('intereses')}
            className={`flex-1 text-center py-3 font-semibold transition-all ${
              userProfileTab === 'intereses' 
                ? 'text-white border-b-2 border-blue-600' 
                : 'text-gray-400'
            }`}
          >
            Intereses
          </button>
        </div>

        {/* Tab Content */}
        {userProfileTab === 'eventos' && (
          <div>
            <h2 className="text-white font-bold text-lg mb-3">
              Eventos organizados ({viewingUserEvents.length})
            </h2>
            
            {loadingUserProfile ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-400">Cargando eventos...</p>
              </div>
            ) : viewingUserEvents.length > 0 ? (
              <div className="space-y-3">
                {viewingUserEvents.map(event => {
                  const category = availableCategories.find(c => c.id === event.category);
                  
                  return (
                    <div 
                      key={event._id}
                      className="bg-gray-800 rounded-xl overflow-hidden cursor-pointer hover:bg-gray-750 transition-all"
                      onClick={async () => {
                        try {
                          const response = await eventService.getEventById(event._id);
                          setSelectedEvent(response.event);
                          setShowEventDetail(true);
                        } catch (error) {
                          console.error('Error al cargar evento:', error);
                          showToast('Error al cargar el evento', 'error');
                        }
                      }}
                    >
                      <div className="flex gap-3">
                        <img 
                          src={event.image || `https://placehold.co/600x480/4F46E5/ffffff?text=${event.title}`}
                          alt={event.title}
                          className="w-24 h-24 object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="flex-1 py-3 pr-3">
                          <h3 className="text-white font-semibold mb-1">{event.title}</h3>
                          <p className="text-gray-400 text-xs mb-1">
                            {new Date(event.date).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })} • {event.time}
                          </p>
                          <div className="flex items-center gap-3 text-gray-400 text-xs">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {event.attendees?.length || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {event.likes?.length || 0}
                            </span>
                            {category && (
                              <span 
                                className="px-2 py-0.5 rounded-full text-white text-xs font-medium"
                                style={{ backgroundColor: category.color }}
                              >
                                {category.icon}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-800 rounded-xl">
                <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Este usuario aún no ha creado eventos</p>
              </div>
            )}
          </div>
        )}

        {userProfileTab === 'intereses' && (
          <div>
            <h2 className="text-white font-bold text-lg mb-3">
              Intereses ({profileData.interestsCount})
            </h2>
            {profileData.interests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profileData.interests.map((interest, index) => (
                  <span 
                    key={index}
                    className="bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-medium"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-800 rounded-xl">
                <p className="text-gray-400">Este usuario no ha agregado intereses</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

  const renderCreate = () => {
    const handleEventInputChange = (field, value) => {
      setEventData(prev => ({
        ...prev,
        [field]: value
      }));
    };

    const handleImageUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setEventData(prev => ({
            ...prev,
            image: file,
            imagePreview: reader.result
          }));
        };
        reader.readAsDataURL(file);
      }
    };

    const handleLocationSelect = (e) => {
      setEventData(prev => ({
        ...prev,
        location: {
          lat: e.latLng.lat(),
          lng: e.latLng.lng()
        }
      }));
    };

    const handleSubmitEvent = async () => {
      if (!eventData.title || !eventData.category || !eventData.date || !eventData.time) {
        showToast('Por favor completa todos los campos requeridos', 'error');
        return;
      }

      const selectedDate = new Date(eventData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        showToast('❌ No puedes crear eventos en fechas pasadas', 'error');
        return;
          }
      
      if (!eventData.location) {
        showToast('Por favor selecciona una ubicación en el mapa', 'error');
        return;
      }

      try {
        let imageUrl = null;
        if (eventData.image) {
          const imageData = await eventService.uploadEventImage(eventData.image);
          imageUrl = imageData.image;
        }

        const newEvent = {
          title: eventData.title,
          description: eventData.description,
          category: eventData.category,
          date: eventData.date,
          time: eventData.time,
          location: eventData.location,
          locationName: eventData.locationName,
          price: eventData.isFree ? 0 : parseFloat(eventData.price) || 0,
          isFree: eventData.isFree,
          capacity: eventData.capacity ? parseInt(eventData.capacity) : null,
          hasParking: eventData.hasParking,
          acceptsOnlinePayment: eventData.acceptsOnlinePayment,
          image: imageUrl
        };

        await eventService.createEvent(newEvent);
        
        showToast('🎉 ¡Evento creado exitosamente!', 'success');
        
        await loadEvents();
        
        setCreateEventStep(1);
        setEventData({
          title: '',
          description: '',
          category: '',
          date: '',
          time: '',
          location: userLocation || { lat: 9.9281, lng: -84.0907 },
          locationName: '',
          price: '',
          isFree: true,
          capacity: '',
          image: null,
          imagePreview: null,
          hasParking: false,
          acceptsOnlinePayment: true
        });
        
        setActiveTab('feed');
      } catch (error) {
        console.error('Error al crear evento:', error);
        showToast('❌ Error al crear evento: ' + (error.response?.data?.message || error.message), 'error');
      }
    };

    if (createEventStep === 1) {
      return (
        <div className="flex-1 overflow-y-auto pb-20 p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setActiveTab('feed')} className="text-gray-400">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-white text-2xl font-bold">Crear Evento</h2>
            </div>

            <div className="flex gap-2 mb-8">
              <div className="flex-1 h-1 rounded-full bg-blue-600"></div>
              <div className="flex-1 h-1 rounded-full bg-gray-700"></div>
              <div className="flex-1 h-1 rounded-full bg-gray-700"></div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-white font-semibold mb-2 block">Título del evento *</label>
                <input
                  type="text"
                  value={eventData.title}
                  onChange={(e) => handleEventInputChange('title', e.target.value)}
                  className="w-full bg-gray-800 text-white text-base rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Ej: Concierto de Jazz en vivo"
                />
              </div>

              <div>
                <label className="text-white font-semibold mb-2 block">Descripción</label>
                <textarea
                  value={eventData.description}
                  onChange={(e) => handleEventInputChange('description', e.target.value)}
                  className="w-full bg-gray-800 text-white text-base rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 min-h-32"
                  placeholder="Describe tu evento..."
                />
              </div>

              <div>
                <label className="text-white font-semibold mb-3 block">Categoría *</label>
                <div className="grid grid-cols-3 gap-3">
                  {availableCategories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => handleEventInputChange('category', category.id)}
                      className={`p-4 rounded-xl transition-all flex flex-col items-center gap-2 ${
                        eventData.category === category.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <span className="text-2xl">{category.icon}</span>
                      <span className="text-xs font-medium">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>

             <div>
              <label className="text-white font-semibold mb-2 block">Fecha *</label>
                <input
                  type="date"
                  value={eventData.date}
                   onChange={(e) => handleEventInputChange('date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]} // ✅ No permite fechas pasadas
                     className="w-full bg-gray-800 text-white text-base rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600"
                    />
              </div>
              <div>
                <label className="text-white font-semibold mb-2 block">Hora *</label>
                  <input
                   type="time"
                    value={eventData.time}
                    onChange={(e) => handleEventInputChange('time', e.target.value)}
                    className="w-full bg-gray-800 text-white text-base rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    </div>

              <button
                onClick={() => setCreateEventStep(2)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (createEventStep === 2) {
      return (
        <div className="flex-1 overflow-y-auto pb-20 p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setCreateEventStep(1)} className="text-gray-400">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-white text-2xl font-bold">Ubicación</h2>
            </div>

            <div className="flex gap-2 mb-8">
              <div className="flex-1 h-1 rounded-full bg-blue-600"></div>
              <div className="flex-1 h-1 rounded-full bg-blue-600"></div>
              <div className="flex-1 h-1 rounded-full bg-gray-700"></div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-white font-semibold mb-2 block">Nombre del lugar</label>
                <input
                  type="text"
                  value={eventData.locationName}
                  onChange={(e) => handleEventInputChange('locationName', e.target.value)}
                  className="w-full bg-gray-800 text-white text-base rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Ej: Teatro Nacional, Parque Central"
                />
              </div>

              <div>
                <label className="text-white font-semibold mb-2 block">Ubicación en el mapa</label>
                <p className="text-gray-400 text-sm mb-3">Haz clic en el mapa para marcar la ubicación</p>
                
                {isLoaded && window.google && (
                  <div className="map-wrapper relative shadow-xl" style={{ height: '400px' }}>
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={eventData.location || userLocation || { lat: 9.9281, lng: -84.0907 }}
                      zoom={15}
                      options={mapOptions}
                      onClick={handleLocationSelect}
                    >
                      <Marker position={eventData.location || userLocation || { lat: 9.9281, lng: -84.0907 }} />
                    </GoogleMap>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCreateEventStep(1)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition-all"
                >
                  Atrás
                </button>
                <button
                  onClick={() => setCreateEventStep(3)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (createEventStep === 3) {
      return (
        <div className="flex-1 overflow-y-auto pb-20 p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setCreateEventStep(2)} className="text-gray-400">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-white text-2xl font-bold">Detalles finales</h2>
            </div>

            <div className="flex gap-2 mb-8">
              <div className="flex-1 h-1 rounded-full bg-blue-600"></div>
              <div className="flex-1 h-1 rounded-full bg-blue-600"></div>
              <div className="flex-1 h-1 rounded-full bg-blue-600"></div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-white font-semibold mb-3 block">Precio</label>
                <div className="flex gap-3 mb-4">
                  <button
                    onClick={() => handleEventInputChange('isFree', true)}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                      eventData.isFree
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    Gratis
                  </button>
                  <button
                    onClick={() => handleEventInputChange('isFree', false)}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                      !eventData.isFree
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    De pago
                  </button>
                </div>

                {!eventData.isFree && (
                  <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-4 py-3">
                    <span className="text-white">₡</span>
                    <input
                      type="number"
                      value={eventData.price}
                      onChange={(e) => handleEventInputChange('price', e.target.value)}
                      className="flex-1 bg-transparent text-white text-base outline-none"
                      placeholder="0"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-white font-semibold mb-2 block">Capacidad máxima</label>
                <input
                  type="number"
                  value={eventData.capacity}
                  onChange={(e) => handleEventInputChange('capacity', e.target.value)}
                  className="w-full bg-gray-800 text-white text-base rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Número de personas (opcional)"
                />
              </div>

              <div>
                <label className="text-white font-semibold mb-3 block">¿Cuenta con parqueo?</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleEventInputChange('hasParking', true)}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                      eventData.hasParking
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    🅿️ Sí
                  </button>
                  <button
                    onClick={() => handleEventInputChange('hasParking', false)}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                      !eventData.hasParking
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {!eventData.isFree && (
                <div>
                  <label className="text-white font-semibold mb-3 block">Método de pago</label>
                  <div className="bg-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">💳</div>
                        <div>
                          <p className="text-white font-medium">Pago en línea</p>
                          <p className="text-gray-400 text-sm">Los usuarios pueden comprar entradas desde la app</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEventInputChange('acceptsOnlinePayment', !eventData.acceptsOnlinePayment)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          eventData.acceptsOnlinePayment ? 'bg-blue-600' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            eventData.acceptsOnlinePayment ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    {eventData.acceptsOnlinePayment && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <p className="text-gray-400 text-xs">
                          Se integrará con Stripe/PayPal. Comisión: 3.5% + ₡150 por transacción
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="text-white font-semibold mb-2 block">Imagen del evento</label>
                
                {eventData.imagePreview ? (
                  <div className="relative">
                    <img
                      src={eventData.imagePreview}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-xl"
                    />
                    <button
                      onClick={() => {
                        setEventData(prev => ({
                          ...prev,
                          image: null,
                          imagePreview: null
                        }));
                      }}
                      className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-64 bg-gray-800 border-2 border-dashed border-gray-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-700 transition-all">
                    <Plus className="w-12 h-12 text-gray-500 mb-2" />
                    <span className="text-gray-400">Haz clic para subir una imagen</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCreateEventStep(2)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition-all"
                >
                  Atrás
                </button>
                <button
                  onClick={handleSubmitEvent}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-all"
                >
                  Publicar Evento
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  const renderSearch = () => (
  <div className="flex-1 overflow-y-auto pb-24">
    <div className="sticky top-0 z-10 bg-gray-900 p-4 border-b border-gray-800">
      <h2 className="text-white text-2xl font-bold mb-4">Explorar</h2>
      <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-4 py-3">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          className="flex-1 bg-transparent text-white outline-none"
          placeholder="Buscar por categoría o zona..."
        />
      </div>
    </div>

    <div className="px-4 mt-4">
      {renderMap()}
    </div>

    <div className="px-4 mt-6">
      <h3 className="text-white text-lg font-semibold mb-4">Categorías</h3>
      <div className="grid grid-cols-3 gap-3">
        {availableCategories.map(category => (
          <button
            key={category.id}
            className="bg-gray-800 hover:bg-gray-700 p-4 rounded-xl transition-all flex flex-col items-center gap-2"
            style={{ borderLeft: `4px solid ${category.color}` }}
          >
            <span className="text-3xl">{category.icon}</span>
            <span className="text-white text-sm font-medium">{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
  );

  const renderProfile = () => {
  // ✅ Usuario logueado (tú)
  const loggedInUser = currentUserData || authService.getCurrentUser();
  
  // ✅ Usuario cuyo perfil estás viendo (puede ser tú u otra persona)
  const profileUser = viewingUserProfile || loggedInUser;
  
  // ✅ IDs normalizados (usar _id o id)
  const loggedInUserId = loggedInUser?._id || loggedInUser?.id;
  const profileUserId = profileUser?._id || profileUser?.id;
  
  // ✅ Determinar si es tu propio perfil
  const isOwnProfile = !viewingUserProfile || (loggedInUserId === profileUserId);
  
  // ✅ Verificar si ya sigues a este usuario
  const isFollowing = viewingUserProfile 
  ? (profileUser?.followers || []).some(followerId => 
      followerId.toString() === loggedInUserId.toString()
    )
  : false;
  
  const profileData = {
    name: profileUser?.name || 'Usuario',
    avatar: profileUser?.avatar || null,
    coverImage: profileUser?.coverImage || null,
    gender: profileUser?.gender || 'no-especificado',
    eventsCount: isOwnProfile ? organizedEvents.length : (viewingUserEvents?.length || 0),
    interestsCount: profileUser?.interests?.length || 0,
    attendancesCount: 0,
    interests: profileUser?.interests || [],
    organizedEvents: organizedEvents
  };

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg">
          <Share2 className="w-5 h-5 text-gray-900" />
        </button>
        <button className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg">
          <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      <div className="relative h-48">
        {profileData.coverImage ? (
          <img 
            src={profileData.coverImage} 
            alt="Cover" 
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/50"></div>
      </div>

      <div className="px-6 -mt-16 relative">
        <div className="relative inline-block">
          {profileData.avatar ? (
            <img 
              src={profileData.avatar} 
              alt="Avatar" 
              className="w-28 h-28 rounded-full border-4 border-gray-900 object-cover bg-gray-700"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-28 h-28 rounded-full border-4 border-gray-900 bg-gray-700 flex items-center justify-center">
              <User className="w-14 h-14 text-gray-500" />
            </div>
          )}
          {isOwnProfile && (
            <button 
              onClick={() => setShowEditProfile(true)}
              className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full border-2 border-gray-900 hover:bg-blue-700 transition-all"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex gap-8 mt-4 mb-4">
          <div className="text-center">
            <div className="text-white text-2xl font-bold">{profileData.eventsCount}</div>
            <div className="text-gray-400 text-xs">Eventos</div>
          </div>
          <div className="text-center">
            <div className="text-white text-2xl font-bold">{profileUser?.followers?.length || 0}</div>
            <div className="text-gray-400 text-xs">Seguidores</div>
          </div>
          <div className="text-center">
            <div className="text-white text-2xl font-bold">{profileData.interestsCount}</div>
            <div className="text-gray-400 text-xs">Intereses</div>
          </div>
        </div>

        <h1 className="text-white text-2xl font-bold mb-3">{profileData.name}</h1>

        {/* Bio */}
        {profileUser?.bio && (
          <p className="text-gray-400 text-sm mb-4">{profileUser.bio}</p>
        )}

        {isOwnProfile ? (
          <>
            <button 
              onClick={() => {
                authService.logout();
                setIsAuthenticated(false);
                setCurrentUserData(null);
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-all mb-3"
            >
              Cerrar Sesión
            </button>
            <button 
              onClick={() => setShowEditProfile(true)}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition-all mb-6"
            >
              Editar Perfil
            </button>
          </>
        ) : (
         
          <button 
  onClick={async () => {
    try {
      const userId = profileUser._id || profileUser.id;
      
      if (isFollowing) {
        // Dejar de seguir
        if (!profileUser.perfilPublico) {
          const confirmed = window.confirm(
            `⚠️ Este es un perfil privado.\n\nSi dejas de seguir a ${profileUser.name}, tendrás que enviar otra solicitud y esperar su aprobación para volver a ver su contenido.\n\n¿Estás seguro?`
          );
          
          if (!confirmed) {
            return;
          }
        }
        
        await userService.unfollowUser(userId);
        
        const updatedUser = {...loggedInUser};
        updatedUser.following = (updatedUser.following || []).filter(id => id !== userId);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setCurrentUserData({...updatedUser});
        
        if (!profileUser.perfilPublico) {
          setViewingUserProfile({
            ...profileUser,
            isPrivate: true,
            followers: (profileUser.followers || []).filter(f => f.toString() !== loggedInUserId.toString())
          });
          setViewingUserEvents([]);
        } else {
          setViewingUserProfile({
            ...profileUser,
            followers: (profileUser.followers || []).filter(f => f.toString() !== loggedInUserId.toString())
          });
        }
        
        showToast('✅ Dejaste de seguir a ' + profileUser.name, 'success');
      } else if (profileUser?.hasPendingRequest) {
        // ✅ NUEVO: Cancelar solicitud pendiente
        const confirmed = window.confirm(
          `¿Estás seguro de que quieres cancelar la solicitud de seguimiento a ${profileUser.name}?`
        );
        
        if (!confirmed) {
          return;
        }
        
        await userService.cancelFollowRequest(userId);
        
        setViewingUserProfile({
          ...profileUser,
          hasPendingRequest: false
        });
        
        showToast('✅ Solicitud cancelada', 'success');
      } else {
        // Seguir o solicitar seguir
        if (!profileUser.perfilPublico) {
          await userService.requestFollow(userId);
          
          setViewingUserProfile({
            ...profileUser,
            hasPendingRequest: true
          });
          
          showToast('📩 Solicitud enviada a ' + profileUser.name, 'success');
        } else {
          await userService.followUser(userId);
          
          const updatedUser = {...loggedInUser};
          updatedUser.following = [...(updatedUser.following || []), userId];
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setCurrentUserData({...updatedUser});
          
          setTimeout(async () => {
            await loadUserProfile(userId);
          }, 500);
          
          showToast('✅ Ahora sigues a ' + profileUser.name, 'success');
        }
      }
    } catch (error) {
      console.error('Error al seguir/dejar de seguir:', error);
      showToast('❌ Error: ' + (error.response?.data?.message || error.message), 'error');
    }
  }}
  className={`w-full font-semibold py-3 rounded-xl transition-all mb-6 ${
    isFollowing 
      ? 'bg-gray-800 hover:bg-gray-700 text-white' 
      : profileUser?.hasPendingRequest
      ? 'bg-yellow-600 hover:bg-yellow-700 text-white cursor-pointer'
      : 'bg-blue-600 hover:bg-blue-700 text-white'
  }`}
>
  {isFollowing 
    ? 'Siguiendo' 
    : profileUser?.hasPendingRequest 
    ? '📩 Cancelar solicitud' 
    : (!profileUser.perfilPublico ? 'Solicitar seguir' : 'Seguir')
  }
            </button>

        )}

        <div className="mb-6">
          <h2 className="text-white font-bold text-lg mb-3">Intereses ({profileData.interestsCount})</h2>
          <p className="text-gray-400 text-sm mb-3">
            Selecciona los temas que más te interesan y favoritos y descubre eventos similares
          </p>
          {profileData.interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profileData.interests.map((interest, index) => (
                <span 
                  key={index}
                  className="bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-medium"
                >
                  {interest}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">
              Aún no has seleccionado intereses. Haz clic en "Editar Perfil" para agregarlos.
            </p>
          )}
        </div>

        {isOwnProfile && (
          <div className="mb-6">
            <h2 className="text-white font-bold text-lg mb-3">
              Eventos organizados ({organizedEvents.length})
            </h2>
            
            {loadingOrganizedEvents ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-400">Cargando eventos...</p>
              </div>
            ) : organizedEvents.length > 0 ? (
              <div className="space-y-3">
                {(() => {
                  const now = new Date();
                  const upcomingEvents = organizedEvents.filter(event => new Date(event.date) >= now);
                  const pastEvents = organizedEvents.filter(event => new Date(event.date) < now);
                  
                  return (
                    <>
                      {upcomingEvents.map(event => {
                        const category = availableCategories.find(c => c.id === event.category);
                        
                        return (
                          <div 
                            key={event._id}
                            className="bg-gray-800 rounded-xl overflow-hidden"
                          >
                            <div 
                              className="flex gap-3 cursor-pointer hover:bg-gray-750 transition-all"
                              onClick={async () => {
                                try {
                                  const response = await eventService.getEventById(event._id);
                                  setSelectedEvent(response.event);
                                  setShowEventDetail(true);
                                } catch (error) {
                                  console.error('Error al cargar evento:', error);
                                  showToast('Error al cargar el evento', 'error');
                                }
                              }}
                            >
                              <img 
                                src={event.image} 
                                alt={event.title}
                                className="w-24 h-24 object-cover"
                                loading="lazy"
                                decoding="async"
                              />
                              <div className="flex-1 py-3 pr-3">
                                <h3 className="text-white font-semibold mb-1">{event.title}</h3>
                                <p className="text-gray-400 text-xs mb-1">
                                  {new Date(event.date).toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  })} • {event.time}
                                </p>
                                <div className="flex items-center gap-3 text-gray-400 text-xs">
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {event.attendees?.length || 0}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Heart className="w-3 h-3" />
                                    {event.likes?.length || 0}
                                  </span>
                                  {category && (
                                    <span 
                                      className="px-2 py-0.5 rounded-full text-white text-xs font-medium"
                                      style={{ backgroundColor: category.color }}
                                    >
                                      {category.icon}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 p-3 bg-gray-900 border-t border-gray-700">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditEvent(event);
                                }}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Editar
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteEvent(event._id, event.title);
                                }}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Eliminar
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      
                      {pastEvents.length > 0 && (
                        <>
                          <div className="flex items-center gap-3 my-6">
                            <div className="flex-1 h-px bg-gray-700"></div>
                            <span className="text-gray-500 text-sm font-medium">Eventos finalizados</span>
                            <div className="flex-1 h-px bg-gray-700"></div>
                          </div>
                          
                          {pastEvents.map(event => {
                            const category = availableCategories.find(c => c.id === event.category);
                            
                            return (
                              <div 
                                key={event._id}
                                className="bg-gray-800/50 rounded-xl overflow-hidden opacity-75"
                              >
                                <div 
                                  className="flex gap-3 cursor-pointer hover:bg-gray-750 transition-all"
                                  onClick={async () => {
                                    try {
                                      const response = await eventService.getEventById(event._id);
                                      setSelectedEvent(response.event);
                                      setShowEventDetail(true);
                                    } catch (error) {
                                      console.error('Error al cargar evento:', error);
                                      showToast('Error al cargar el evento', 'error');
                                    }
                                  }}
                                >
                                  <img 
                                    src={event.image} 
                                    alt={event.title}
                                    className="w-24 h-24 object-cover"
                                    loading="lazy"
                                    decoding="async"
                                  />
                                  <div className="flex-1 py-3 pr-3">
                                    <h3 className="text-white font-semibold mb-1">{event.title}</h3>
                                    <p className="text-gray-400 text-xs mb-1">
                                      {new Date(event.date).toLocaleDateString('es-ES', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                      })} • {event.time}
                                    </p>
                                    <div className="flex items-center gap-3 text-gray-400 text-xs">
                                      <span className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {event.attendees?.length || 0}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Heart className="w-3 h-3" />
                                        {event.likes?.length || 0}
                                      </span>
                                      {category && (
                                        <span 
                                          className="px-2 py-0.5 rounded-full text-white text-xs font-medium"
                                          style={{ backgroundColor: category.color }}
                                        >
                                          {category.icon}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex gap-2 p-3 bg-gray-900 border-t border-gray-700">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteEvent(event._id, event.title);
                                    }}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Eliminar
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-800 rounded-xl">
                <div className="text-4xl mb-2">📅</div>
                <p className="text-gray-400 mb-2">Aún no has creado eventos</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="text-blue-500 hover:text-blue-400 text-sm font-semibold"
                >
                  Crear tu primer evento →
                </button>
              </div>
            )}
          </div>
        )}

       {!isOwnProfile && (
  <div className="mb-6">
    <h2 className="text-white font-bold text-lg mb-3">
      Eventos organizados ({viewingUserEvents?.length || 0})
    </h2>
    
    {loadingUserProfile ? (
      <div className="text-center py-8">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-gray-400">Cargando eventos...</p>
      </div>
    ) : profileUser?.isPrivate && (!viewingUserEvents || viewingUserEvents.length === 0) ? (
      <div className="text-center py-12 bg-gray-800 rounded-xl">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-white text-xl font-semibold mb-2">Perfil privado</h3>
        <p className="text-gray-400 mb-4">
          Este usuario tiene su perfil privado. Síguelo para ver sus eventos.
        </p>
      </div>
    ) : viewingUserEvents && viewingUserEvents.length > 0 ? (
      <div className="space-y-3">
        {(() => {
          const now = new Date();
          const upcomingEvents = viewingUserEvents.filter(event => new Date(event.date) >= now);
          const pastEvents = viewingUserEvents.filter(event => new Date(event.date) < now);
          
          return (
            <>
              {upcomingEvents.map(event => {
                const category = availableCategories.find(c => c.id === event.category);
                
                return (
                  <div 
                    key={event._id}
                    className="bg-gray-800 rounded-xl overflow-hidden cursor-pointer hover:bg-gray-750 transition-all"
                    onClick={async () => {
                      try {
                        const response = await eventService.getEventById(event._id);
                        setSelectedEvent(response.event);
                        setShowEventDetail(true);
                      } catch (error) {
                        console.error('Error al cargar evento:', error);
                        showToast('Error al cargar el evento', 'error');
                      }
                    }}
                  >
                    <div className="flex gap-3 p-3">
                      <img 
                        src={event.image} 
                        alt={event.title}
                        className="w-24 h-24 object-cover rounded-lg"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-1">{event.title}</h3>
                        <p className="text-gray-400 text-xs mb-1">
                          {new Date(event.date).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })} • {event.time}
                        </p>
                        <div className="flex items-center gap-3 text-gray-400 text-xs">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {event.attendees?.length || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {event.likes?.length || 0}
                          </span>
                          {category && (
                            <span 
                              className="px-2 py-0.5 rounded-full text-white text-xs font-medium"
                              style={{ backgroundColor: category.color }}
                            >
                              {category.icon}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {pastEvents.length > 0 && (
                <>
                  <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-gray-700"></div>
                    <span className="text-gray-500 text-sm font-medium">Eventos finalizados</span>
                    <div className="flex-1 h-px bg-gray-700"></div>
                  </div>
                  
                  {pastEvents.map(event => {
                    const category = availableCategories.find(c => c.id === event.category);
                    
                    return (
                      <div 
                        key={event._id}
                        className="bg-gray-800/50 rounded-xl overflow-hidden cursor-pointer hover:bg-gray-750 transition-all opacity-75"
                        onClick={async () => {
                          try {
                            const response = await eventService.getEventById(event._id);
                            setSelectedEvent(response.event);
                            setShowEventDetail(true);
                          } catch (error) {
                            console.error('Error al cargar evento:', error);
                            showToast('Error al cargar el evento', 'error');
                          }
                        }}
                      >
                        <div className="flex gap-3 p-3">
                          <img 
                            src={event.image} 
                            alt={event.title}
                            className="w-24 h-24 object-cover rounded-lg"
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="flex-1">
                            <h3 className="text-white font-semibold mb-1">{event.title}</h3>
                            <p className="text-gray-400 text-xs mb-1">
                              {new Date(event.date).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })} • {event.time}
                            </p>
                            <div className="flex items-center gap-3 text-gray-400 text-xs">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {event.attendees?.length || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                {event.likes?.length || 0}
                              </span>
                              {category && (
                                <span 
                                  className="px-2 py-0.5 rounded-full text-white text-xs font-medium"
                                  style={{ backgroundColor: category.color }}
                                >
                                  {category.icon}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </>
          );
        })()}
      </div>
    ) : (
      <div className="text-center py-8 bg-gray-800 rounded-xl">
        <div className="text-4xl mb-2">📅</div>
        <p className="text-gray-400">Este usuario no ha creado eventos aún</p>
      </div>
    )}
  </div>
          )}

      </div>
    </div>
  );
  };

 
  const loadUserProfile = async (userId) => {
  try {
    setLoadingUserProfile(true);
    const response = await userService.getUserProfile(userId);
    
    console.log('📥 ========== RESPUESTA getUserProfile ==========');
    console.log('📥 isPrivate:', response.isPrivate);
    console.log('📥 user:', response.user);
    console.log('📥 events:', response.events);
    console.log('📥 Cantidad de eventos:', response.events?.length);
    
    // ✅ Manejar perfil privado
    if (response.isPrivate) {
      setViewingUserProfile({
        ...response.user,
        isPrivate: true
      });
      setViewingUserEvents([]);
    } else {
      setViewingUserProfile({
        ...response.user,
        isPrivate: false  // ✅ IMPORTANTE: Marcar explícitamente como NO privado
      });
      setViewingUserEvents(response.events || []);
      console.log('✅ viewingUserEvents actualizado con:', response.events?.length, 'eventos');
    }
  } catch (error) {
    console.error('Error al cargar perfil:', error);
    showToast('Error al cargar el perfil', 'error');
  } finally {
    setLoadingUserProfile(false);
  }
    };

  const renderMap = () => {
    if (!isLoaded) {
      return (
        <div className="h-96 bg-gray-800 rounded-3xl flex items-center justify-center">
          <div className="text-center">
            <Navigation className="w-12 h-12 text-gray-600 mx-auto mb-2 animate-pulse" />
            <p className="text-gray-400">Cargando mapa...</p>
          </div>
        </div>
      );
    }

    if (!userLocation) {
      return (
        <div className="h-96 bg-gray-800 rounded-3xl flex items-center justify-center">
          <div className="text-center">
            <Navigation className="w-12 h-12 text-gray-600 mx-auto mb-2 animate-pulse" />
            <p className="text-gray-400">Obteniendo ubicación...</p>
          </div>
        </div>
      );
    }

    if (!window.google) {
      return (
        <div className="h-96 bg-gray-800 rounded-3xl flex items-center justify-center">
          <div className="text-center">
            <Navigation className="w-12 h-12 text-gray-600 mx-auto mb-2 animate-pulse" />
            <p className="text-gray-400">Inicializando mapa...</p>
          </div>
        </div>
      );
    }

    const categoryMarkers = generateCategoryMarkers();

    return (
      <div className="map-wrapper relative shadow-xl" style={{ height: '400px' }}>
        <div className="absolute top-6 left-6 z-10 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-gray-900 text-sm font-medium">
            {userPreferences.location || 'Tu ubicación'}
          </span>
        </div>

        <button
          onClick={() => {
            if (map && userLocation) {
              map.panTo(userLocation);
              map.setZoom(14);
            }
          }}
          className="absolute bottom-6 right-6 z-10 bg-white hover:bg-gray-50 text-gray-900 p-3 rounded-full shadow-lg transition-all hover:scale-105"
        >
          <Navigation className="w-5 h-5" />
        </button>

        <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-2">
          <button
            onClick={() => map && map.setZoom(map.getZoom() + 1)}
            className="bg-white hover:bg-gray-50 text-gray-900 w-10 h-10 rounded-full shadow-lg transition-all hover:scale-105 flex items-center justify-center font-bold text-lg"
          >
            +
          </button>
          <button
            onClick={() => map && map.setZoom(map.getZoom() - 1)}
            className="bg-white hover:bg-gray-50 text-gray-900 w-10 h-10 rounded-full shadow-lg transition-all hover:scale-105 flex items-center justify-center font-bold text-lg"
          >
            −
          </button>
        </div>

        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={userLocation}
          zoom={14}
          options={mapOptions}
          onLoad={setMap}
        >
          {/* Marcador de ubicación del usuario */}
          <Marker
            position={userLocation}
            onClick={() => setSelectedMarker('user')}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: '#3B82F6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
              scale: 10,
            }}
          />

          {selectedMarker === 'user' && (
            <InfoWindow
              position={userLocation}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="text-center p-2">
                <div className="text-2xl mb-1">📍</div>
                <strong className="text-sm">Tu ubicación</strong>
                <p className="text-xs text-gray-600">{userPreferences.location || 'Ubicación actual'}</p>
              </div>
            </InfoWindow>
          )}

          {/* Marcadores de eventos reales */}
          {events.map(event => {
            if (!event.location?.coordinates || event.location.coordinates.length !== 2) return null;
            
            const category = availableCategories.find(c => c.id === event.category);
            const eventPosition = {
              lat: event.location.coordinates[1],
              lng: event.location.coordinates[0]
            };

            return (
              <Marker
                key={event._id}
                position={eventPosition}
                onClick={() => setSelectedMarker(event._id)}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  fillColor: category?.color || '#6B7280',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                  scale: 12,
                }}
                label={{
                  text: category?.icon || '📍',
                  fontSize: '14px',
                }}
              />
            );
          })}

          {/* InfoWindows de eventos */}
          {events.map(event => {
            if (!event.location?.coordinates || selectedMarker !== event._id) return null;
            
            const eventPosition = {
              lat: event.location.coordinates[1],
              lng: event.location.coordinates[0]
            };
            
            const category = availableCategories.find(c => c.id === event.category);

            return (
              <InfoWindow
                key={`info-${event._id}`}
                position={eventPosition}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div 
                  className="p-2 cursor-pointer max-w-xs"
                  onClick={async () => {
                    try {
                      const response = await eventService.getEventById(event._id);
                      setSelectedEvent(response.event);
                      setShowEventDetail(true);
                      setSelectedMarker(null);
                    } catch (error) {
                      console.error('Error al cargar evento:', error);
                    }
                  }}
                >
                  <div className="flex gap-2 mb-2">
                    <img 
                      src={event.image} 
                      alt={event.title}
                      className="w-16 h-16 object-cover rounded-lg"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-sm text-gray-900 line-clamp-1">{event.title}</p>
                      <p className="text-xs text-gray-600 line-clamp-2">{event.description || 'Sin descripción'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span 
                      className="px-2 py-1 rounded text-white font-medium"
                      style={{ backgroundColor: category?.color }}
                    >
                      {category?.icon} {category?.name}
                    </span>
                    {event.isFree && (
                      <span className="text-green-600 font-semibold">Gratis</span>
                    )}
                  </div>
                  <p className="text-xs text-blue-600 mt-2 font-medium">Ver detalles →</p>
                </div>
              </InfoWindow>
            );
          })}

          {/* Marcadores de categorías */}
          {categoryMarkers.map(marker => (
            <Marker
              key={marker.id}
              position={marker.position}
              onClick={() => setSelectedMarker(marker.id)}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                fillColor: marker.category.color,
                fillOpacity: 0.6,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 10,
              }}
              label={{
                text: marker.category.icon,
                fontSize: '12px',
              }}
            />
          ))}

          {categoryMarkers.map(marker => (
            selectedMarker === marker.id && (
              <InfoWindow
                key={`info-${marker.id}`}
                position={marker.position}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="text-center p-2">
                  <div className="text-2xl mb-1">{marker.category.icon}</div>
                  <strong className="text-sm">{marker.title}</strong>
                  <p className="text-xs text-gray-600">{marker.description}</p>
                </div>
              </InfoWindow>
            )
          ))}
        </GoogleMap>
      </div>
    );
  };

  const renderEditProfileModal = () => {
    const currentUser = authService.getCurrentUser();

    const handleEditInputChange = (field, value) => {
      setEditProfileData(prev => ({
        ...prev,
        [field]: value
      }));
    };

    const handleAvatarChange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const data = await userService.uploadAvatar(file);
          showToast('Avatar actualizado exitosamente', 'success');
          const user = authService.getCurrentUser();
          user.avatar = data.avatar;
          localStorage.setItem('user', JSON.stringify(user));
          setCurrentUserData({...user});
          setShowEditProfile(false);
          setProfileRefresh(prev => prev + 1);
        } catch (error) {
          showToast('Error al subir avatar', 'error');
        }
      }
    };

    const handleCoverChange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const data = await userService.uploadCoverImage(file);
          showToast('Imagen de portada actualizada exitosamente', 'success');
          const user = authService.getCurrentUser();
          user.coverImage = data.coverImage;
          localStorage.setItem('user', JSON.stringify(user));
          setCurrentUserData({...user});
          setShowEditProfile(false);
          setProfileRefresh(prev => prev + 1);
        } catch (error) {
          showToast('Error al subir imagen de portada', 'error');
        }
      }
    };

    const handleRemoveAvatar = async () => {
      if (!window.confirm('¿Estás seguro de que quieres quitar tu foto de perfil?')) {
        return;
      }
      
      try {
        await userService.removeAvatar();
        const user = authService.getCurrentUser();
        user.avatar = null;
        localStorage.setItem('user', JSON.stringify(user));
        setCurrentUserData({...user});
        showToast('Foto de perfil eliminada', 'success');
        setShowEditProfile(false);
        setProfileRefresh(prev => prev + 1);
      } catch (error) {
        showToast('Error al eliminar foto de perfil', 'error');
      }
    };

    const handleRemoveCover = async () => {
      if (!window.confirm('¿Estás seguro de que quieres quitar tu imagen de portada?')) {
        return;
      }
      
      try {
        await userService.removeCoverImage();
        const user = authService.getCurrentUser();
        user.coverImage = null;
        localStorage.setItem('user', JSON.stringify(user));
        setCurrentUserData({...user});
        showToast('Imagen de portada eliminada', 'success');
        setShowEditProfile(false);
        setProfileRefresh(prev => prev + 1);
      } catch (error) {
        showToast('Error al eliminar imagen de portada', 'error');
      }
    };

    const handleSaveProfile = async () => {
      try {
    const newName = editProfileData.name?.trim() || currentUser.name;
    const newInterests = editProfileData.interests?.length > 0 ? editProfileData.interests : (currentUser.interests || []);
    const newBio = editProfileData.bio !== undefined ? editProfileData.bio.trim() : (currentUser.bio || '');
    const newPerfilPublico = editProfileData.perfilPublico !== undefined ? editProfileData.perfilPublico : (currentUser.perfilPublico !== undefined ? currentUser.perfilPublico : true);
    const response = await userService.updateProfile({
      name: newName,
      interests: newInterests,
      bio: newBio,
      perfilPublico: newPerfilPublico
    });
        
        if (response.success && response.user) {
          const updatedUser = {
            id: response.user.id,
            name: response.user.name,
            email: response.user.email,
            avatar: response.user.avatar,
            coverImage: response.user.coverImage,
            interests: response.user.interests || [],
            location: response.user.location,
            bio: response.user.bio || '',
            perfilPublico: response.user.perfilPublico !== undefined ? response.user.perfilPublico : true,
            categories: response.user.categories,
            gender: response.user.gender
          };
        
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setCurrentUserData(updatedUser);
          
          showToast('Perfil actualizado exitosamente', 'success');
          setShowEditProfile(false);
          setProfileRefresh(prev => prev + 1);
        }
      } catch (error) {
        console.error('Error completo:', error);
        showToast('❌ ERROR: ' + (error.response?.data?.message || error.message), 'error');
      }
    };

    if (!showEditProfile) return null;

    return (
      <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-2xl font-bold">Editar Perfil</h2>
              <button onClick={() => setShowEditProfile(false)} className="text-gray-400 hover:text-white">
                <ChevronLeft className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-white font-semibold mb-2 block">Imagen de portada</label>
                {currentUser?.coverImage ? (
                  <div className="relative">
                    <img 
                      src={currentUser.coverImage} 
                      alt="Portada actual"
                      className="w-full h-48 object-cover rounded-xl"
                    />
                    <div className="absolute inset-0 bg-black/50 hover:bg-black/70 rounded-xl flex items-center justify-center gap-3 opacity-0 hover:opacity-100 transition-all">
                      <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-all">
                        Cambiar
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        onClick={handleRemoveCover}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="w-full h-48 bg-gray-700 rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-all">
                    <div className="text-center">
                      <Plus className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <span className="text-gray-400">Agregar imagen de portada</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="text-white font-semibold mb-2 block">Foto de perfil</label>
                <div className="flex items-center gap-4">
                  {currentUser?.avatar ? (
                    <img 
                      src={currentUser.avatar} 
                      alt="Avatar actual"
                      className="w-20 h-20 rounded-full object-cover bg-gray-700"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center">
                      <User className="w-10 h-10 text-gray-500" />
                    </div>
                  )}
                  
                  <div className="flex-1 flex gap-2">
                    <label className="flex-1 bg-gray-700 hover:bg-gray-600 rounded-xl px-4 py-3 cursor-pointer transition-all text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Plus className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-300">
                          {currentUser?.avatar ? 'Cambiar foto' : 'Agregar foto'}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                    
                    {currentUser?.avatar && (
                      <button
                        onClick={handleRemoveAvatar}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl transition-all"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-white font-semibold mb-2 block">Nombre *</label>
                <input
                  type="text"
                  defaultValue={currentUser?.name}
                  onChange={(e) => handleEditInputChange('name', e.target.value)}
                  className="w-full bg-gray-700 text-white text-base rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Tu nombre completo"
                  required
                  minLength={2}
                />
              </div>

                      <div>
                          <label className="text-white font-semibold mb-2 block">
                               Biografía
                                     <span className="text-gray-400 font-normal ml-2">
                                ({editProfileData.bio?.length || currentUser?.bio?.length || 0}/500)
                                </span>
                          </label>
                    <textarea
                      defaultValue={currentUser?.bio || ''}
                        onChange={(e) => {
                          if (e.target.value.length <= 500) {
                    handleEditInputChange('bio', e.target.value);
                               }
                           }}
                               className="w-full bg-gray-700 text-white text-base rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 min-h-[100px] resize-none"
                         placeholder="Cuéntanos sobre ti..."
                         maxLength={500}
                          />
                           <p className="text-gray-500 text-xs mt-1">
                        Escribe una breve descripción sobre ti (máximo 500 caracteres)
                               </p>
                          </div>

              <div>
                <label className="text-white font-semibold mb-2 block">Intereses</label>
                <div className="flex flex-wrap gap-2">
                  {['Playa', 'Deportes', 'Música', 'Arte', 'Tecnología', 'Gastronomía'].map(interest => (
                    <button
                      key={interest}
                      onClick={() => {
                        const current = editProfileData.interests || [];
                        const newInterests = current.includes(interest)
                          ? current.filter(i => i !== interest)
                          : [...current, interest];
                        handleEditInputChange('interests', newInterests);
                      }}
                      className={`px-4 py-2 rounded-full font-medium transition-all ${
                        editProfileData.interests?.includes(interest)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

                    {/* ✅ Toggle de Perfil Privado - Lógica invertida correctamente */}
                    <div>
  <label className="text-white font-semibold mb-3 block">Privacidad del perfil</label>
  <div className="bg-gray-700 rounded-xl p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="text-2xl">🔒</div>
        <div>
          <p className="text-white font-medium">Perfil privado</p>
          <p className="text-gray-400 text-sm">
            Solo tus seguidores podrán ver tus eventos y estadísticas
          </p>
        </div>
      </div>

      {/* Improved toggle: compute current value and render a clipped, responsive switch */}
      {(() => {
        const perfilPublicoCurrent = editProfileData.perfilPublico !== undefined
          ? editProfileData.perfilPublico
          : (currentUser?.perfilPublico !== undefined ? currentUser.perfilPublico : true);

        const isPrivate = !perfilPublicoCurrent;

        return (

            <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              // corregido: invertir el valor actual de perfilPublico
              handleEditInputChange('perfilPublico', !perfilPublicoCurrent);
            }}
            aria-pressed={isPrivate}
            className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors overflow-hidden focus:outline-none ${
              isPrivate ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            {/* knob positioned with absolute + small translate (safe for small screens) */}
            <span
              className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform transform ${
                isPrivate ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>

        );
      })()}
    </div>
  </div>
                </div>

              {/* Botón Guardar Cambios - YA LO TIENES */}
              <button
                onClick={handleSaveProfile}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all"
              >
                Guardar Cambios
              </button>

            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEventDetailModal = () => {
    if (!selectedEvent || !showEventDetail) return null;

    const category = availableCategories.find(c => c.id === selectedEvent.category);
    const isOrganizer = currentUserData?.id === selectedEvent.organizer?._id || currentUserData?.id === selectedEvent.organizer?.id;
    const isAttending = selectedEvent.attendees?.some(
      attendee => attendee._id === currentUserData?.id || attendee === currentUserData?.id
    );

    const handleAddComment = async () => {
      if (!newComment.trim()) {
        showToast('El comentario no puede estar vacío');
        return;
      }

      try {
        setSubmittingComment(true);
        await eventService.addComment(selectedEvent._id, newComment);
        
        const response = await eventService.getEventById(selectedEvent._id);
        setSelectedEvent(response.event);
        setNewComment('');
        
        await loadEvents();
      } catch (error) {
        console.error('Error al agregar comentario:', error);
        showToast('Error al agregar comentario', 'error');
      } finally {
        setSubmittingComment(false);
      }
    };

    const handleToggleAttend = async () => {
      try {
        if (isAttending) {
          await eventService.unattendEvent(selectedEvent._id);
          showToast('❌ Has cancelado tu asistencia', 'info');
        } else {
          await eventService.attendEvent(selectedEvent._id);
          showToast('✅ Te has registrado al evento', 'success');
        }
        
        const response = await eventService.getEventById(selectedEvent._id);
        setSelectedEvent(response.event);
        
        await loadEvents();
      } catch (error) {
        console.error('Error al cambiar asistencia:', error);
        showToast(error.response?.data?.message || 'Error al procesar asistencia', 'error');
      }
    };

    const handleToggleLike = async (e) => {
      e.stopPropagation();
      try {
        await eventService.likeEvent(selectedEvent._id);
        
        const response = await eventService.getEventById(selectedEvent._id);
        setSelectedEvent(response.event);
        
        await loadEvents();
      } catch (error) {
        console.error('Error al dar like:', error);
        showToast('Error al dar like', 'error');
      }
    };

    const isLikedByUser = selectedEvent.likes?.some(
      like => like._id === currentUserData?.id || like === currentUserData?.id
    );

    return (
      <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="relative h-64">
            <img
              src={selectedEvent.image}
              alt={selectedEvent.title}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <button
              onClick={() => {
                setShowEventDetail(false);
                setSelectedEvent(null);
              }}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
            >
              ✕
            </button>
            <div className="absolute bottom-4 left-4 flex gap-2">
              {category && (
                <span
                  className="px-3 py-1 rounded-full text-white text-sm font-semibold"
                  style={{ backgroundColor: category.color }}
                >
                  {category.icon} {category.name}
                </span>
              )}
              {selectedEvent.isFree && (
                <span className="bg-green-600 px-3 py-1 rounded-full text-white text-sm font-semibold">
                  Gratis
                </span>
              )}
            </div>
          </div>

          <div className="p-6">
            <h2 className="text-white text-2xl font-bold mb-3">{selectedEvent.title}</h2>
            
           <div 
              className="flex items-center gap-3 mb-4 cursor-pointer hover:bg-gray-700/50 p-2 rounded-xl transition-all"
                onClick={() => {
                  if (selectedEvent.organizer?._id) {
                   setShowEventDetail(false); // Cerrar el modal primero
                    loadUserProfile(selectedEvent.organizer._id);
                     }
                     }}
                        >
                     {selectedEvent.organizer?.avatar ? (
                         <img
                           src={selectedEvent.organizer.avatar}
                           alt={selectedEvent.organizer.name}
                          className="w-10 h-10 rounded-full object-cover"
                           loading="lazy"
                         decoding="async"
                         />
                         ) : (
    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
      <User className="w-5 h-5 text-gray-500" />
    </div>
  )}
  <div>
    <p className="text-white font-semibold">{selectedEvent.organizer?.name}</p>
    <p className="text-gray-400 text-sm">Organizador</p>
  </div>
          </div>

            {selectedEvent.description && (
              <div className="mb-4">
                <h3 className="text-white font-semibold mb-2">Descripción</h3>
                <p className="text-gray-400">{selectedEvent.description}</p>
              </div>
            )}

            <div className="bg-gray-900 rounded-xl p-4 mb-4 space-y-3">
              <div className="flex items-center gap-3 text-gray-300">
                <div className="text-2xl">📅</div>
                <div>
                  <p className="text-xs text-gray-500">Fecha</p>
                  <p className="font-semibold">
                    {new Date(selectedEvent.date).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-gray-300">
                <div className="text-2xl">🕐</div>
                <div>
                  <p className="text-xs text-gray-500">Hora</p>
                  <p className="font-semibold">{selectedEvent.time}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-gray-300">
                <MapPin className="w-6 h-6 text-blue-500" />
                <div>
                  <p className="text-xs text-gray-500">Ubicación</p>
                  <p className="font-semibold">{selectedEvent.location?.name || 'Por confirmar'}</p>
                </div>
              </div>

              {!selectedEvent.isFree && (
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="text-2xl">💰</div>
                  <div>
                    <p className="text-xs text-gray-500">Precio</p>
                    <p className="font-semibold">₡{selectedEvent.price}</p>
                  </div>
                </div>
              )}

              {selectedEvent.capacity && (
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="text-2xl">👥</div>
                  <div>
                    <p className="text-xs text-gray-500">Capacidad</p>
                    <p className="font-semibold">
                      {selectedEvent.attendees?.length || 0} / {selectedEvent.capacity} personas
                    </p>
                  </div>
                </div>
              )}

              {selectedEvent.hasParking && (
                <div className="flex items-center gap-3 text-green-400">
                  <div className="text-2xl">🅿️</div>
                  <p className="font-semibold">Cuenta con parqueo</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mb-6">
              {!isOrganizer && (
                <button
                  onClick={handleToggleAttend}
                  className={`flex-1 font-semibold py-3 rounded-xl transition-all ${
                    isAttending
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isAttending ? '✓ Asistiré' : 'Asistiré'}
                </button>
              )}
              
              <button
                onClick={handleToggleLike}
                className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  isLikedByUser
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                <Heart className={isLikedByUser ? 'fill-white' : ''} />
                {selectedEvent.likes?.length || 0}
              </button>
            </div>

            {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-3">
                  Asistentes ({selectedEvent.attendees.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.attendees.slice(0, 10).map((attendee, index) => (
                    <div
                      key={attendee._id || index}
                      className="flex items-center gap-2 bg-gray-900 rounded-full px-3 py-1"
                    >
                      {attendee.avatar ? (
                        <img
                          src={attendee.avatar}
                          alt={attendee.name}
                          className="w-6 h-6 rounded-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                          <User className="w-3 h-3 text-gray-500" />
                        </div>
                      )}
                      <span className="text-gray-300 text-sm">{attendee.name}</span>
                    </div>
                  ))}
                  {selectedEvent.attendees.length > 10 && (
                    <div className="flex items-center gap-2 bg-gray-900 rounded-full px-3 py-1">
                      <span className="text-gray-300 text-sm">
                        +{selectedEvent.attendees.length - 10} más
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-white font-semibold mb-3">
                Comentarios ({selectedEvent.comments?.length || 0})
              </h3>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe un comentario..."
                  className="flex-1 bg-gray-900 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !submittingComment) {
                      handleAddComment();
                    }
                  }}
                />
                <button
                  onClick={handleAddComment}
                  disabled={submittingComment}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
                >
                  {submittingComment ? '...' : 'Enviar'}
                </button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {selectedEvent.comments && selectedEvent.comments.length > 0 ? (
                  selectedEvent.comments.map((comment, index) => (
                    <div key={index} className="bg-gray-900 rounded-xl p-3 flex gap-3">
                      {comment.user?.avatar ? (
                        <img
                          src={comment.user.avatar}
                          alt={comment.user.name}
                          className="w-10 h-10 rounded-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm">
                          {comment.user?.name || 'Usuario'}
                        </p>
                        <p className="text-gray-400 text-sm">{comment.text}</p>
                        <p className="text-gray-600 text-xs mt-1">
                          {new Date(comment.createdAt).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No hay comentarios aún. ¡Sé el primero en comentar!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNotifications = () => (
    <div className="flex-1 flex items-center justify-center text-gray-400">
      <div className="text-center">
        <Bell className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p className="text-xl">Notificaciones</p>
      </div>
    </div>
  );
  
  const renderEditEventModal = () => {
  if (!showEditEvent || !editingEvent) return null;

  const handleEventInputChange = (field, value) => {
    setEventData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEventData(prev => ({
          ...prev,
          image: file,
          imagePreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLocationSelect = (e) => {
    setEventData(prev => ({
      ...prev,
      location: {
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      }
    }));
  };

  // PASO 1: Información básica
  if (editEventStep === 1) {
    return (
      <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <button 
                onClick={() => {
                  setShowEditEvent(false);
                  setEditingEvent(null);
                  setEditEventStep(1);
                }}
                className="text-gray-400 hover:text-white"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-white text-2xl font-bold">Editar Evento</h2>
            </div>

            <div className="flex gap-2 mb-8">
              <div className="flex-1 h-1 rounded-full bg-blue-600"></div>
              <div className="flex-1 h-1 rounded-full bg-gray-700"></div>
              <div className="flex-1 h-1 rounded-full bg-gray-700"></div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-white font-semibold mb-2 block">Título del evento *</label>
                <input
                  type="text"
                  value={eventData.title}
                  onChange={(e) => handleEventInputChange('title', e.target.value)}
                  className="w-full bg-gray-700 text-white text-base rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Ej: Concierto de Jazz en vivo"
                />
              </div>

              <div>
                <label className="text-white font-semibold mb-2 block">Descripción</label>
                <textarea
                  value={eventData.description}
                  onChange={(e) => handleEventInputChange('description', e.target.value)}
                  className="w-full bg-gray-700 text-white text-base rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 min-h-32"
                  placeholder="Describe tu evento..."
                />
              </div>

              <div>
                <label className="text-white font-semibold mb-3 block">Categoría *</label>
                <div className="grid grid-cols-3 gap-3">
                  {availableCategories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => handleEventInputChange('category', category.id)}
                      className={`p-4 rounded-xl transition-all flex flex-col items-center gap-2 ${
                        eventData.category === category.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <span className="text-2xl">{category.icon}</span>
                      <span className="text-xs font-medium">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white font-semibold mb-2 block">Fecha *</label>
                  <input
                    type="date"
                    value={eventData.date}
                    onChange={(e) => handleEventInputChange('date', e.target.value)}
                    className="w-full bg-gray-700 text-white text-base rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="text-white font-semibold mb-2 block">Hora *</label>
                  <input
                    type="time"
                    value={eventData.time}
                    onChange={(e) => handleEventInputChange('time', e.target.value)}
                    className="w-full bg-gray-700 text-white text-base rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <button
                onClick={() => setEditEventStep(2)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }


  // PASO 2: Ubicación
  if (editEventStep === 2) {
    return (
      <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setEditEventStep(1)} className="text-gray-400 hover:text-white">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-white text-2xl font-bold">Ubicación</h2>
            </div>

            <div className="flex gap-2 mb-8">
              <div className="flex-1 h-1 rounded-full bg-blue-600"></div>
              <div className="flex-1 h-1 rounded-full bg-blue-600"></div>
              <div className="flex-1 h-1 rounded-full bg-gray-700"></div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-white font-semibold mb-2 block">Nombre del lugar</label>
                <input
                  type="text"
                  value={eventData.locationName}
                  onChange={(e) => handleEventInputChange('locationName', e.target.value)}
                  className="w-full bg-gray-700 text-white text-base rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Ej: Teatro Nacional, Parque Central"
                />
              </div>

              <div>
                <label className="text-white font-semibold mb-2 block">Ubicación en el mapa</label>
                <p className="text-gray-400 text-sm mb-3">Haz clic en el mapa para marcar la ubicación</p>
                
                {isLoaded && window.google && (
                  <div className="map-wrapper relative shadow-xl" style={{ height: '400px' }}>
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={eventData.location || userLocation || { lat: 9.9281, lng: -84.0907 }}
                      zoom={15}
                      options={mapOptions}
                      onClick={handleLocationSelect}
                    >
                      <Marker position={eventData.location || userLocation || { lat: 9.9281, lng: -84.0907 }} />
                    </GoogleMap>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setEditEventStep(1)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-xl transition-all"
                >
                  Atrás
                </button>
                <button
                  onClick={() => setEditEventStep(3)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PASO 3: Detalles finales
  if (editEventStep === 3) {
    return (
      <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setEditEventStep(2)} className="text-gray-400 hover:text-white">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-white text-2xl font-bold">Detalles finales</h2>
            </div>

            <div className="flex gap-2 mb-8">
              <div className="flex-1 h-1 rounded-full bg-blue-600"></div>
              <div className="flex-1 h-1 rounded-full bg-blue-600"></div>
              <div className="flex-1 h-1 rounded-full bg-blue-600"></div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-white font-semibold mb-3 block">Precio</label>
                <div className="flex gap-3 mb-4">
                  <button
                    onClick={() => handleEventInputChange('isFree', true)}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                      eventData.isFree
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Gratis
                  </button>
                  <button
                    onClick={() => handleEventInputChange('isFree', false)}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                      !eventData.isFree
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    De pago
                  </button>
                </div>

                {!eventData.isFree && (
                  <div className="flex items-center gap-2 bg-gray-700 rounded-xl px-4 py-3">
                    <span className="text-white">₡</span>
                    <input
                      type="number"
                      value={eventData.price}
                      onChange={(e) => handleEventInputChange('price', e.target.value)}
                      className="flex-1 bg-transparent text-white text-base outline-none"
                      placeholder="0"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-white font-semibold mb-2 block">Capacidad máxima</label>
                <input
                  type="number"
                  value={eventData.capacity}
                  onChange={(e) => handleEventInputChange('capacity', e.target.value)}
                  className="w-full bg-gray-700 text-white text-base rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Número de personas (opcional)"
                />
              </div>

              <div>
                <label className="text-white font-semibold mb-3 block">¿Cuenta con parqueo?</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleEventInputChange('hasParking', true)}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                      eventData.hasParking
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    🅿️ Sí
                  </button>
                  <button
                    onClick={() => handleEventInputChange('hasParking', false)}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                      !eventData.hasParking
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              <div>
                <label className="text-white font-semibold mb-2 block">Imagen del evento</label>
                
                {eventData.imagePreview ? (
                  <div className="relative">
                    <img
                      src={eventData.imagePreview}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-xl"
                    />
                    <button
                      onClick={() => {
                        setEventData(prev => ({
                          ...prev,
                          image: null,
                          imagePreview: null
                        }));
                      }}
                      className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-64 bg-gray-700 border-2 border-dashed border-gray-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-600 transition-all">
                    <Plus className="w-12 h-12 text-gray-500 mb-2" />
                    <span className="text-gray-400">Haz clic para subir una imagen</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setEditEventStep(2)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-xl transition-all"
                >
                  Atrás
                </button>
                <button
                  onClick={handleSaveEditEvent}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-all"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  };

  const generateCategoryMarkers = () => {
    if (!userLocation || userPreferences.categories.length === 0) return [];
    
    return userPreferences.categories.map((catId, index) => {
      const category = availableCategories.find(c => c.id === catId);
      const angle = (index / userPreferences.categories.length) * 2 * Math.PI;
      const radius = 0.02;
      
      return {
        id: `marker-${catId}`,
        category: category,
        position: {
          lat: userLocation.lat + Math.cos(angle) * radius,
          lng: userLocation.lng + Math.sin(angle) * radius
        },
        title: `Zona de ${category.name}`,
        description: `Eventos de ${category.name} cerca de ti`
      };
    });
  };

  const requestLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationPermission('granted');
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationPermission('denied');
          setUserLocation({ lat: 9.9281, lng: -84.0907 });
        }
      );
    } else {
      setLocationPermission('denied');
      setUserLocation({ lat: 9.9281, lng: -84.0907 });
    }
  };

  const handleLocationSelect = (location) => {
    setUserPreferences({
      ...userPreferences,
      location
    });
  };

  const handleCategoryToggle = (categoryId) => {
    setUserPreferences(prev => {
      const categories = prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId];
      return { ...prev, categories };
    });
  };

  const handleLogin = async (e) => {
  e.preventDefault();
 if (!formData.email || !formData.password) {
    showToast('Por favor completa todos los campos', 'error');
    return;
  }
  
  if (!formData.email.includes('@')) {
    showToast('Por favor ingresa un email válido', 'error');
    return;
  }
  
  if (formData.password.length < 6) {
    showToast('La contraseña debe tener al menos 6 caracteres', 'error');
    return;
  }
  
  try {
    const { email, password } = formData;
    const data = await authService.login({ email, password });
    
    // ✅ AGREGAR ESTA LÍNEA:
    localStorage.setItem('user', JSON.stringify(data.user));
    
    setCurrentUserData(data.user);
    
    if (data.user.location) {
      setUserPreferences(prev => ({
        ...prev,
        location: data.user.location,
        categories: data.user.categories || []
      }));
    }
    
    setIsAuthenticated(true);
  }  catch (error) {
    console.error('Error en login:', error);
    showToast(error.response?.data?.message || 'Error al iniciar sesión. Verifica tus credenciales.', 'error');
  }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      showToast('Por favor completa todos los campos', 'error');
      return;
    }
    
    if (formData.name.length < 2) {
      showToast('El nombre debe tener al menos 2 caracteres', 'error');
      return;
    }
    
    if (!formData.email.includes('@')) {
      showToast('Por favor ingresa un email válido', 'error');
      return;
    }
    
    if (formData.password.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }
    
    try {
      const { name, email, password, gender } = formData;
      const data = await authService.register({ name, email, password, gender });
      
      setShowOnboarding(true);
    } catch (error) {
      console.error('Error en registro:', error);
      showToast(error.response?.data?.message || 'Error al registrarse. El email puede estar en uso.', 'error');
    }
  };

  const handleOnboardingSkip = () => {
    setIsAuthenticated(true);
    setShowOnboarding(false);
  };

  const handleGoogleLogin = () => {
    
    const apiURL = process.env.REACT_APP_API_URL || 'http://localhost:5000'; 
    
    
    window.location.href = `${apiURL}/api/auth/google`;
   
  };

  const handleLike = async (eventId) => {
    try {
      const response = await eventService.likeEvent(eventId);
      
      setLikedEvents(prev => ({
        ...prev,
        [eventId]: response.liked
      }));
      
      await loadEvents();
    } catch (error) {
      console.error('Error al dar like:', error);
      showToast('Error al dar like al evento', 'error');
    }
  };
 
  const handleEditEvent = (event) => {
  console.log('🔵 Editando evento:', event);
  setEditingEvent(event);
  setEventData({
    title: event.title,
    description: event.description || '',
    category: event.category,
    date: event.date.split('T')[0],
    time: event.time,
    location: event.location?.coordinates 
      ? { lat: event.location.coordinates[1], lng: event.location.coordinates[0] }
      : null,
    locationName: event.location?.name || '',
    price: event.price || '',
    isFree: event.isFree,
    capacity: event.capacity || '',
    image: event.image,
    imagePreview: event.image,
    hasParking: event.hasParking,
    acceptsOnlinePayment: event.acceptsOnlinePayment
  });
  setEditEventStep(1);
  setShowEditEvent(true);
  };

  const handleSaveEditEvent = async () => {
  if (!eventData.title || !eventData.category || !eventData.date || !eventData.time) {
    showToast('Por favor completa todos los campos requeridos', 'error');
    return;
  }

  if (!eventData.location) {
    showToast('Por favor selecciona una ubicación en el mapa', 'error');
    return;
  }

  try {
    let imageUrl = eventData.image;
    
    if (eventData.image instanceof File) {
      const imageData = await eventService.uploadEventImage(eventData.image);
      imageUrl = imageData.image;
    }

    const updatedEvent = {
      title: eventData.title,
      description: eventData.description,
      category: eventData.category,
      date: eventData.date,
      time: eventData.time,
      location: eventData.location,
      locationName: eventData.locationName,
      price: eventData.isFree ? 0 : parseFloat(eventData.price) || 0,
      isFree: eventData.isFree,
      capacity: eventData.capacity ? parseInt(eventData.capacity) : null,
      hasParking: eventData.hasParking,
      acceptsOnlinePayment: eventData.acceptsOnlinePayment,
      image: imageUrl
    };

    await eventService.updateEvent(editingEvent._id, updatedEvent);
    
    showToast('✅ ¡Evento actualizado exitosamente!', 'success');
    
    await loadEvents();
    if (currentUserData?.id) {
      await loadOrganizedEvents(currentUserData.id);
    }
    
    setShowEditEvent(false);
    setEditingEvent(null);
    setEditEventStep(1);
    
    setEventData({
      title: '',
      description: '',
      category: '',
      date: '',
      time: '',
      location: null,
      locationName: '',
      price: '',
      isFree: true,
      capacity: '',
      image: null,
      imagePreview: null,
      hasParking: false,
      acceptsOnlinePayment: true
    });
    
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    showToast('❌ Error al actualizar evento: ' + (error.response?.data?.message || error.message), 'error');
  }
  };

  const handleDeleteEvent = async (eventId, eventTitle) => {
  if (!window.confirm(`¿Estás seguro de que quieres eliminar el evento "${eventTitle}"?\n\nEsta acción no se puede deshacer.`)) {
    return;
  }

  try {
    await eventService.deleteEvent(eventId);
    showToast('✅ Evento eliminado exitosamente', 'success');
    
    await loadEvents();
    if (currentUserData?.id) {
      await loadOrganizedEvents(currentUserData.id);
    }
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    showToast('❌ Error al eliminar evento: ' + (error.response?.data?.message || error.message), 'error');
  }
  };

  const handleTabChange = async (tab) => {
  setActiveTab(tab);
  
  // ✅ Cargar notificaciones cuando abre la pestaña
  if (tab === 'notifications') {
    try {
      // Cargar solicitudes de seguimiento
      const followResponse = await userService.getFollowRequests();
      setFollowRequests(followResponse.requests || []);
      
      // ✅ NUEVO: Cargar notificaciones de actividad
      const notifResponse = await notificationService.getNotifications();
      setActivityNotifications(notifResponse.notifications || []);
      
      console.log('📩 Solicitudes cargadas:', followResponse.requests?.length || 0);
      console.log('🔔 Notificaciones cargadas:', notifResponse.notifications?.length || 0);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    }
  }
  
  // ✅ Limpiar perfil al cambiar a profile
  if (tab === 'profile') {
    setViewingUserProfile(null);
  }
  };

 if (showOnboarding) {
    return (
      <div className="w-full h-screen bg-gray-900 flex flex-col max-w-md mx-auto">
        {renderOnboarding()}
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="w-full h-screen bg-gray-900 flex flex-col max-w-md mx-auto">
        {renderAuth()}
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    );
  }

  

  return (
  <div className="w-full h-screen bg-gray-900 flex flex-col max-w-md mx-auto overflow-hidden relative">
    {/* Toast Notification */}
    {toast && (
      <Toast 
        message={toast.message} 
        type={toast.type}
        onClose={() => setToast(null)}
      />
    )}
    
    {/* Contenido principal con scroll */}
    <div className="flex-1 overflow-y-auto">
      {activeTab === 'feed' && renderFeed()}
      {activeTab === 'search' && renderSearch()}
      {activeTab === 'create' && renderCreate()}
     {activeTab === 'notifications' && (
  <div className="max-w-2xl mx-auto p-4">
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-white text-2xl font-bold">Notificaciones</h1>
      {activityNotifications.some(n => !n.read) && (
        <button
          onClick={async () => {
            try {
              await notificationService.markAllAsRead();
              setActivityNotifications(activityNotifications.map(n => ({ ...n, read: true })));
            } catch (error) {
              console.error('Error al marcar todas:', error);
            }
          }}
          className="text-blue-500 text-sm font-medium hover:text-blue-400"
        >
          Marcar todas como leídas
        </button>
      )}
    </div>
    
    {/* ✅ Solicitudes de seguimiento */}
    {followRequests.length > 0 && (
      <div className="mb-6">
        <h2 className="text-white font-semibold mb-3 text-lg">Solicitudes de seguimiento</h2>
        <div className="space-y-3">
          {followRequests.map(requester => (
            <div key={requester._id} className="bg-gray-800 rounded-xl p-4 flex items-center gap-3">
              <img 
                src={requester.avatar || 'https://via.placeholder.com/50'} 
                alt={requester.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="text-white font-semibold">{requester.name}</p>
                <p className="text-gray-400 text-sm">Quiere seguirte</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      await userService.acceptFollowRequest(requester._id);
                      setFollowRequests(followRequests.filter(r => r._id !== requester._id));
                      
                      const currentUser = authService.getCurrentUser();
                      if (currentUser) {
                        currentUser.followers = [...(currentUser.followers || []), requester._id];
                        localStorage.setItem('user', JSON.stringify(currentUser));
                        setUser(currentUser);
                      }
                      
                      showToast('Solicitud aceptada', 'success');
                    } catch (error) {
                      console.error('Error al aceptar:', error);
                      showToast('Error al aceptar solicitud', 'error');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Aceptar
                </button>
                <button
                  onClick={async () => {
                    try {
                      await userService.rejectFollowRequest(requester._id);
                      setFollowRequests(followRequests.filter(r => r._id !== requester._id));
                      showToast('Solicitud rechazada', 'error');
                    } catch (error) {
                      console.error('Error al rechazar:', error);
                      showToast('Error al rechazar solicitud', 'error');
                    }
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* ✅ Notificaciones de actividad */}
    {activityNotifications.length > 0 ? (
      <div>
        <h2 className="text-white font-semibold mb-3 text-lg">Actividad</h2>
        <div className="space-y-2">
          {activityNotifications.map(notif => {
            const getNotificationText = () => {
              switch (notif.type) {
                case 'like':
                  return 'le dio me gusta a tu evento';
                case 'comment':
                  return 'comentó en tu evento';
                case 'attend':
                  return 'confirmó asistencia a tu evento';
                default:
                  return 'interactuó con tu evento';
              }
            };

            const getNotificationIcon = () => {
              switch (notif.type) {
                case 'like':
                  return '❤️';
                case 'comment':
                  return '💬';
                case 'attend':
                  return '✅';
                default:
                  return '🔔';
              }
            };

            return (
              <div 
                key={notif._id}
                onClick={async () => {
                  if (!notif.read) {
                    try {
                      await notificationService.markAsRead(notif._id);
                      setActivityNotifications(
                        activityNotifications.map(n => 
                          n._id === notif._id ? { ...n, read: true } : n
                        )
                      );
                    } catch (error) {
                      console.error('Error al marcar:', error);
                    }
                  }
                  
                  // Navegar al evento
                  if (notif.event) {
                    try {
                      const response = await eventService.getEventById(notif.event._id);
                      setSelectedEvent(response.event);
                      setShowEventDetail(true);
                    } catch (error) {
                      console.error('Error al cargar evento:', error);
                    }
                  }
                }}
                className={`p-4 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${
                  notif.read 
                    ? 'bg-gray-800 hover:bg-gray-750' 
                    : 'bg-blue-900/30 hover:bg-blue-900/40 border-l-4 border-blue-500'
                }`}
              >
                <img 
                  src={notif.sender?.avatar || 'https://via.placeholder.com/50'} 
                  alt={notif.sender?.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white">
                    <span className="font-semibold">{notif.sender?.name}</span>
                    {' '}
                    <span className="text-gray-400">{getNotificationText()}</span>
                  </p>
                  {notif.event && (
                    <p className="text-gray-500 text-sm truncate">
                      {notif.event.title}
                    </p>
                  )}
                  {notif.comment && (
                    <p className="text-gray-400 text-sm italic truncate mt-1">
                      "{notif.comment}"
                    </p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(notif.createdAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="text-2xl">{getNotificationIcon()}</div>
              </div>
            );
          })}
        </div>
      </div>
    ) : followRequests.length === 0 ? (
      <div className="text-center py-12 bg-gray-800 rounded-xl">
        <Bell className="w-16 h-16 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">No tienes notificaciones</p>
      </div>
    ) : null}
  </div>
        )}
      {activeTab === 'userProfile' && renderUserProfile()}
      {activeTab === 'profile' && <div key={profileRefresh}>{renderProfile()}</div>}
    </div>

    {/* Modales */}
    {renderEditProfileModal()}
    {renderEventDetailModal()}
    {renderEditEventModal()} 
    {/* Barra de navegación inferior  */}
    <div className="bg-gray-950 border-t border-gray-800 px-6 py-3 flex justify-around items-center sticky bottom-0 z-50 safe-area-bottom">
  <button
    onClick={() => handleTabChange('feed')}
    className={`p-2 transition-colors ${activeTab === 'feed' ? 'text-white' : 'text-gray-500 hover:text-gray-400'}`}
  >
    <Home className="w-6 h-6" />
  </button>
  <button
    onClick={() => handleTabChange('search')}
    className={`p-2 transition-colors ${activeTab === 'search' ? 'text-white' : 'text-gray-500 hover:text-gray-400'}`}
  >
    <Search className="w-6 h-6" />
  </button>
  <button
    onClick={() => handleTabChange('create')}
    className={`p-2 transition-colors ${activeTab === 'create' ? 'text-white' : 'text-gray-500 hover:text-gray-400'}`}
  >
    <Plus className="w-7 h-7" />
  </button>
  <button
    onClick={() => handleTabChange('notifications')}
    className={`p-2 relative transition-colors ${activeTab === 'notifications' ? 'text-white' : 'text-gray-500 hover:text-gray-400'}`}
  >
    <Bell className="w-6 h-6" />
    {/* ✅ Badge para mostrar cantidad de solicitudes */}
    {followRequests.length > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
        {followRequests.length}
      </span>
    )}
  </button>
  <button
    onClick={() => handleTabChange('profile')}
    className={`p-2 transition-colors ${activeTab === 'profile' ? 'text-white' : 'text-gray-500 hover:text-gray-400'}`}
  >
    <User className="w-6 h-6" />
  </button>
      </div>
  </div>
);


};

export default EventsApp;


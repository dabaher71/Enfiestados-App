import React, { useState, useEffect } from 'react';
import { Search, MapPin, Filter, Heart, MessageCircle, Share2, User } from 'lucide-react';
import eventService from '../services/eventService';
import { authService } from '../services/authService';

const FeedTabs = ({ 
  setActiveTab, 
  availableCategories, 
  likedEvents, 
  handleLike,
  loadUserProfile,
  setViewingUserProfile,
  renderMap
}) => {
  const [feedTab, setFeedTab] = useState('para-ti'); // 'para-ti', 'siguiendo', 'explorar'
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetail, setShowEventDetail] = useState(false);

  // 📍 Obtener ubicación del usuario
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('No se pudo obtener la ubicación:', error);
          // Ubicación por defecto (San José, CR)
          setUserLocation({ lat: 9.9281, lng: -84.0907 });
        }
      );
    }
  }, []);

  // 🔄 Cargar eventos según el tab seleccionado
  useEffect(() => {
    loadEventsByTab();
  }, [feedTab, userLocation]);

  const loadEventsByTab = async () => {
  if (!userLocation) return;

  setLoadingEvents(true);
  try {
    let response;

    // 🧪 TEMPORAL: Usar solo getEvents() para testear
    // Ignorar el switch de tabs por ahora
    response = await eventService.getEvents({
      lat: userLocation.lat,
      lng: userLocation.lng,
      radius: 50000
    });

    console.log('✅ Respuesta de getEvents:', response);

    // Filtrar por búsqueda si existe
    let filteredEvents = response.events || response.data || [];
    
    console.log('📊 Eventos obtenidos:', filteredEvents.length);

    if (searchQuery.trim()) {
      filteredEvents = filteredEvents.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setEvents(filteredEvents);
  } catch (error) {
    console.error('❌ Error al cargar eventos:', error);
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    setEvents([]);
  } finally {
    setLoadingEvents(false);
  }
};

  // 🔍 Buscar cuando cambia el searchQuery
  useEffect(() => {
    loadEventsByTab();
  }, [searchQuery]);

  const handleEventClick = async (event) => {
    try {
      const response = await eventService.getEventById(event._id);
      setSelectedEvent(response.event);
      setShowEventDetail(true);
    } catch (error) {
      console.error('Error al cargar evento:', error);
      console.warn('No se pudo cargar el detalle del evento');
    }
  };

  // 🎨 Renderizar los tabs
  const renderTabs = () => {
    const tabs = [
      { id: 'para-ti', label: 'Para ti' },
      { id: 'siguiendo', label: 'Siguiendo' },
      { id: 'explorar', label: 'Explorar'}
    ];

    return (
      <div className="flex border-b border-gray-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFeedTab(tab.id)}
            className={`flex-1 py-3 px-4 font-semibold transition-all text-center ${
              feedTab === tab.id
                ? 'text-white border-b-2 border-blue-600'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    );
  };

  // 📋 Renderizar lista de eventos
  const renderEventsList = () => {
    if (loadingEvents) {
      return (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 mt-4">Cargando eventos...</p>
        </div>
      );
    }

    if (events.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-white text-xl font-semibold mb-2">
            {feedTab === 'para-ti' && 'No hay eventos para ti aún'}
            {feedTab === 'siguiendo' && 'No hay eventos de usuarios que sigues'}
            {feedTab === 'explorar' && 'No hay eventos para explorar'}
          </h3>
          <p className="text-gray-400 mb-6">
            {feedTab === 'para-ti' && 'Actualiza tus intereses para ver recomendaciones'}
            {feedTab === 'siguiendo' && 'Comienza a seguir usuarios para ver sus eventos'}
            {feedTab === 'explorar' && 'Sé el primero en crear un evento en tu zona'}
          </p>
          <button
            onClick={() => setActiveTab('create')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
          >
            Crear Evento
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {events.map((event) => {
          const category = availableCategories.find(c => c.id === event.category);
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
                      if (event.organizer._id === loggedInUser.id) {
                        setViewingUserProfile(null);
                        setActiveTab('profile');
                      } else {
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
    );
  };

  // 🎯 Renderizar el componente completo
  return (
    <div className="flex-1 overflow-y-auto pb-24">
      {/* Buscador */}
      <div className="sticky top-0 z-10 bg-gray-900 p-4 border-b border-gray-800">
       

       

        {/* TABS */}
        {renderTabs()}
      </div>

      {/* Mapa */}
      <div className="px-4 mt-4">
        {renderMap && renderMap()}
      </div>

      {/* Lista de eventos */}
      <div className="px-4 mt-4">
        {renderEventsList()}
      </div>
    </div>
  );
};

export default FeedTabs;
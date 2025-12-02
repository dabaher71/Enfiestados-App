import React, { useState, useEffect } from 'react';

const LoadingScreen = ({ 
  show = true, 
  backgroundColor = '#0f172a',
  imageSrc = '/logo.svg',
  imageAlt = 'Cargando...',
  fullScreen = true
}) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!show) return;

    // Animar los puntos suspensivos: . .. ...
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '') return '.';
        if (prev === '.') return '..';
        if (prev === '..') return '...';
        return '';
      });
    }, 400); // Cambiar cada 400ms

    return () => clearInterval(interval);
  }, [show]);

  if (!show) return null;

  const containerClasses = fullScreen
  ? 'fixed inset-0 z-40 flex flex-col items-center justify-center'
  : 'absolute inset-0 z-40 flex flex-col items-center justify-center';

  return (
    <div
      className={containerClasses}
      style={{ backgroundColor }}
    >
      {/* Logo pequeño */}
      <img
        src={imageSrc}
        alt={imageAlt}
        className="w-24 h-24 object-contain mb-8"
      />

      {/* Barra de carga que se mueve de derecha a izquierda UNA SOLA VEZ */}
      <div className="w-48 h-1 bg-gray-700 rounded-full overflow-hidden mb-8">
        <div 
          className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
          style={{
            animation: 'slide-once 2s ease-in-out forwards'
          }}
        />
      </div>

      {/* Texto con puntos suspensivos animados */}
      <p className="text-white text-lg font-semibold tracking-wider">
        Cargando{dots}
      </p>

      {/* CSS de la animación */}
      <style>{`
        @keyframes slide-once {
          0% {
            transform: translateX(100%);
            width: 0%;
          }
          50% {
            width: 100%;
          }
          100% {
            transform: translateX(-100%);
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
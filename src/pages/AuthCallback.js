import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      alert('Error al autenticar con Google');
      navigate('/');
      return;
    }

    if (token) {
      localStorage.setItem('token', token);
      
      // Obtener datos del usuario
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      fetch(`${apiUrl}/api/auth/me`, {  // ← CAMBIO AQUÍ: agregué /api
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/';
          } else {
            navigate('/');
          }
        })
        .catch(error => {
          console.error('Error:', error);
          navigate('/');
        });
    } else {
      navigate('/');
    }
  }, [searchParams, navigate]);

  return (
    <div className="w-full h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white">Completando autenticación...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
import { useEffect, useRef } from 'react';

const TokenManager = () => {
  const refreshTimeoutRef = useRef(null);

  const refreshToken = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return;

      const response = await fetch(`http://localhost:5000/api/${user.userType}/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
      } else {
        // Token refresh failed, logout user
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !localStorage.getItem('token')) return;

    // Refresh token every 25 minutes (before 30-minute expiry)
    const REFRESH_INTERVAL = 25 * 60 * 1000; // 25 minutes

    refreshTimeoutRef.current = setInterval(refreshToken, REFRESH_INTERVAL);

    return () => {
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current);
      }
    };
  }, []);

  return null; // This component doesn't render anything
};

export default TokenManager; 
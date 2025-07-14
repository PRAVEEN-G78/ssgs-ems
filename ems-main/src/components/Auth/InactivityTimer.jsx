import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const InactivityTimer = ({ onLogout }) => {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 1 minute warning period
  const FIVE_MINUTES = 5 * 60 * 1000; // 5 minutes in milliseconds
  const WARNING_TIME = 4 * 60 * 1000; // Show warning at 4 minutes

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    
    setShowWarning(false);
    setTimeLeft(60);
    
    // Set warning timer (4 minutes)
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
    }, WARNING_TIME);
    
    // Set logout timer (5 minutes)
    timeoutRef.current = setTimeout(() => {
      // User has been inactive for 5 minutes
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      if (onLogout) {
        onLogout();
      } else {
        navigate('/login');
      }
      
      alert('You have been logged out due to inactivity.');
    }, FIVE_MINUTES);
  };

  const handleUserActivity = () => {
    resetTimer();
  };

  // Countdown timer effect (only when warning is shown)
  useEffect(() => {
    if (!showWarning) return;
    
    const countdownInterval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [showWarning]);

  useEffect(() => {
    // Set up event listeners for user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    // Start the timer
    resetTimer();

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Only show warning after 4 minutes
  if (!showWarning) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: '#ff4444',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      zIndex: 9999,
      boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
      fontSize: '14px',
      fontWeight: 'bold',
      minWidth: '200px'
    }}>
      ⚠️ Session expires in {formatTime(timeLeft)}
      <br />
      <small>Move your mouse or press a key to stay logged in</small>
    </div>
  );
};

export default InactivityTimer; 
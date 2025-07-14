import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

function CentreLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/centre/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setLoading(false);
      window.location.replace('/');
    } catch (err) {
      setError('Network error');
      setLoading(false);
    }
  };

  return (
    <div className="login-bg" style={{ backgroundImage: `linear-gradient(90deg, rgba(102,126,234,0.7) 0%, rgba(118,75,162,0.7) 100%), url(${process.env.PUBLIC_URL + '/synchrobgm.jpeg'})`, backgroundPosition: 'center', backgroundSize: 'cover', backgroundRepeat: 'no-repeat' }}>
      <form className="login-form bouncy" onSubmit={handleSubmit} autoComplete="off">
        <h2 className="login-title">Centre Login</h2>
        <div className="login-field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            autoFocus
            className="bouncy-input"
          />
        </div>
        <div className="login-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="bouncy-input"
          />
        </div>
        {error && <div className="login-error bouncy-error">{error}</div>}
        <button type="submit" className={`login-btn bouncy-btn${loading ? ' loading' : ''}`} disabled={loading}>
          {loading ? (<><span className="login-spinner" /> Logging in...</>) : 'Login'}
        </button>
        <div className="login-footer" style={{ marginTop: 16, textAlign: 'center' }}>
          <Link to="/centre/forgot-password" className="login-link">Forgot Password?</Link>
        </div>
        {/* <div className="login-footer">
          <span>Don't have an account?</span>
          <Link to="/centre/register" className="login-link">Register as Centre</Link>
        </div> */}
        
      </form>
    </div>
  );
}

export default CentreLogin; 
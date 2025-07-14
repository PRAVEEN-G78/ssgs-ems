import React from 'react';
import { Link } from 'react-router-dom';
import './Login.css';

function LoginSelection() {
  return (
    <div className="login-bg">
      <div className="login-form bouncy" style={{ textAlign: 'center', padding: '40px' }}> 
      {/* <h2 className="login-title">WELCOME  </h2>
      <h2 className="login-title"> TO </h2> */}
        <img src="/logo_synchro.png" alt="SynchroServe Logo" style={{ maxHeight: '56px', width: 'auto', marginBottom: '12px' }} />
        <p style={{ marginBottom: '30px', color: '#666' }}>
          Please select your login type
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Link to="/admin/login" className="login-btn bouncy-btn" style={{ 
            textDecoration: 'none', 
            display: 'block',
            padding: '15px 30px',
            fontSize: '16px'
          }}>
            🛡️ Admin Login
          </Link>
          
          <Link to="/centre/login" className="login-btn bouncy-btn" style={{ 
            textDecoration: 'none', 
            display: 'block',
            padding: '15px 30px',
            fontSize: '16px'
          }}>
            🏢 Centre Login
          </Link>
          <Link to="/employee/login" className="login-btn bouncy-btn" style={{ 
            textDecoration: 'none', 
            display: 'block',
            padding: '15px 30px',
            fontSize: '16px'
          }}>
            👤 Employee Login
          </Link>

          
        </div>
      </div>
    </div>
  );
}

export default LoginSelection; 
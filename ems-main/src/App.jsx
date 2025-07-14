import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';

// Import SVG icons
import MenuIcon from './assets/icons/menu.svg';
import DashboardIcon from './assets/icons/dashboard.svg';
import GroupAddIcon from './assets/icons/group-add.svg';
import CalendarTodayIcon from './assets/icons/calendar.svg';
import WorkOffIcon from './assets/icons/work-off.svg';
import TrendingUpIcon from './assets/icons/trending-up.svg';
import AccountBalanceIcon from './assets/icons/account-balance.svg';
import ExpandLessIcon from './assets/icons/expand-less.svg';
import ExpandMoreIcon from './assets/icons/expand-more.svg';

import Dashboard from './components/Dashboard/Dashboard';
import Onboarding from './components/Onboarding/Onboarding';
import Attendance from './components/Attendance/Attendance';
import LeaveManagement from './components/LeaveManagement/LeaveManagement';
import PerformanceTracking from './components/PerformanceTracking/PerformanceTracking';
import PayrollPreview from './components/PayrollPreview/PayrollPreview';
import EmployeeHome from './components/Employee/EmployeeHome';
import EmployeeLogin from './components/Auth/EmployeeLogin';
import CentreLogin from './components/Auth/CentreLogin';
import AdminLogin from './components/Auth/AdminLogin';
import EmployeeRegister from './components/Auth/EmployeeRegister';
import CentreRegister from './components/Auth/CentreRegister';
import LoginSelection from './components/Auth/LoginSelection';
import InactivityTimer from './components/Auth/InactivityTimer';
import TokenManager from './components/Auth/TokenManager';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import AttendanceTracking from './components/Attendance/AttendanceTracking';
import AdminAttendanceList from './components/Attendance/AdminAttendanceList';
import MonthlyAttendanceDashboard from './components/Attendance/MonthlyAttendanceDashboard';
import AdminMonthlyAttendanceDashboard from './components/Attendance/AdminMonthlyAttendanceDashboard';
import MonthlyLeaveTrackingDashboard from './components/LeaveManagement/MonthlyLeaveTrackingDashboard';

// Add placeholder components for forgot password forms
const EmployeeForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [employeeId, setEmployeeId] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");
    if (!employeeId) { setError("Employee ID required"); return; }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/employee/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId })
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to send OTP");
      else { setMessage("OTP sent to your registered email (simulated)"); setStep(2); }
    } catch (err) { setError("Network error"); }
    finally { setLoading(false); }
  };

  const handleVerifyReset = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");
    if (!otp || !newPassword || !confirmPassword) { setError("All fields required"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/employee/verify-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, otp, newPassword })
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to reset password");
      else setMessage("Password reset successful. You can now log in.");
    } catch (err) { setError("Network error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="login-bg">
      <form className="login-form bouncy" onSubmit={step === 1 ? handleRequestOtp : handleVerifyReset}>
        <h2 className="login-title">Employee Forgot Password</h2>
        <div className="login-field">
          <label htmlFor="employeeId">Employee ID</label>
          <input id="employeeId" name="employeeId" type="text" className="bouncy-input" value={employeeId} onChange={e => setEmployeeId(e.target.value)} required disabled={step === 2} />
        </div>
        {step === 2 && (
          <>
            <div className="login-field">
              <label htmlFor="otp">OTP</label>
              <input id="otp" name="otp" type="text" className="bouncy-input" value={otp} onChange={e => setOtp(e.target.value)} required />
            </div>
            <div className="login-field">
              <label htmlFor="newPassword">New Password</label>
              <input id="newPassword" name="newPassword" type="password" className="bouncy-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            </div>
            <div className="login-field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" className="bouncy-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </div>
          </>
        )}
        {error && <div className="login-error bouncy-error">{error}</div>}
        {message && <div className="login-success" style={{ color: 'green', marginBottom: 8 }}>{message}</div>}
        <button type="submit" className="login-btn bouncy-btn" disabled={loading}>{loading ? (step === 1 ? "Sending..." : "Resetting...") : (step === 1 ? "Send OTP" : "Reset Password")}</button>
      </form>
    </div>
  );
};

const CentreForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");
    if (!username) { setError("Username required"); return; }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/centre/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to send OTP");
      else { setMessage("OTP sent to your registered email (simulated)"); setStep(2); }
    } catch (err) { setError("Network error"); }
    finally { setLoading(false); }
  };

  const handleVerifyReset = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");
    if (!otp || !newPassword || !confirmPassword) { setError("All fields required"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/centre/verify-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, otp, newPassword })
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to reset password");
      else setMessage("Password reset successful. You can now log in.");
    } catch (err) { setError("Network error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="login-bg">
      <form className="login-form bouncy" onSubmit={step === 1 ? handleRequestOtp : handleVerifyReset}>
        <h2 className="login-title">Centre Forgot Password</h2>
        <div className="login-field">
          <label htmlFor="username">Username</label>
          <input id="username" name="username" type="text" className="bouncy-input" value={username} onChange={e => setUsername(e.target.value)} required disabled={step === 2} />
        </div>
        {step === 2 && (
          <>
            <div className="login-field">
              <label htmlFor="otp">OTP</label>
              <input id="otp" name="otp" type="text" className="bouncy-input" value={otp} onChange={e => setOtp(e.target.value)} required />
            </div>
            <div className="login-field">
              <label htmlFor="newPassword">New Password</label>
              <input id="newPassword" name="newPassword" type="password" className="bouncy-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            </div>
            <div className="login-field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" className="bouncy-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </div>
          </>
        )}
        {error && <div className="login-error bouncy-error">{error}</div>}
        {message && <div className="login-success" style={{ color: 'green', marginBottom: 8 }}>{message}</div>}
        <button type="submit" className="login-btn bouncy-btn" disabled={loading}>{loading ? (step === 1 ? "Sending..." : "Resetting...") : (step === 1 ? "Send OTP" : "Reset Password")}</button>
      </form>
    </div>
  );
};

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSections, setOpenSections] = useState({});
  const [showAdminRegistrationLinks, setShowAdminRegistrationLinks] = useState(false);

  // Add missing handlers
  const handleSectionToggle = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleDrawerToggle = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  // Auth check
  const isAuthenticated = !!localStorage.getItem('token');
  const user = isAuthenticated ? JSON.parse(localStorage.getItem('user')) : null;
  const userType = user?.userType;

  // Onboarding status for employee
  const [onboarded, setOnboarded] = useState(true);
  useEffect(() => {
    async function fetchOnboardingStatus() {
      if (userType !== 'employee' || (!user?.employeeId && !user?.username)) return;
      try {
        const res = await fetch(`http://localhost:5000/api/employee/onboarding-status?employeeId=${user.employeeId || ''}&username=${user.username || ''}`);
        const data = await res.json();
        setOnboarded(data.onboarded);
      } catch (err) {
        setOnboarded(true); // fail safe: don't block UI
      }
    }
    fetchOnboardingStatus();
  }, [userType, user?.employeeId, user?.username]);

  // Employee menu items (restricted access)
  const employeeMenuItems = [
    {
      text: 'Home',
      icon: DashboardIcon,
      path: '/',
      description: 'Employee dashboard and profile overview',
    },
    // Only show onboarding if not complete
    ...(!onboarded ? [{
      text: 'Onboarding',
      icon: GroupAddIcon,
      path: '/onboarding',
      description: 'Manage new employee onboarding process',
    }] : []),
    // Attendance and Leave only if status is Approved
    ...(user?.status === 'Approved' ? [
      {
        text: 'Attendance',
        icon: CalendarTodayIcon,
        path: '/attendance',
        description: 'Track employee attendance and time records',
         subItems: [
         { text: 'Daily Attendance', path: '/attendance' },
         { text: 'Monthly Attendance', path: '/monthly-attendance-dashboard' },
        //  { text: 'Reports', path: '/ ' },
        ],
      },
      {
        text: 'Leave manage',
        icon: WorkOffIcon,
        path: '/leave',
        description: 'Manage employee leave requests and balances',
        // subItems: [
        //   { text: 'Leave Requests', path: '/leave' },
        //   { text: 'Leave Balance', path: '/leave' },
        //   { text: 'Calendar', path: '/leave' },
        // ],
      },
    ] : []),
  ];

  // Centre menu items (full access)
  const centreMenuItems = [
    {
      text: 'Dashboard',
      icon: DashboardIcon,
      path: '/dashboard',
      description: 'Overview of center operations and key metrics',
      subItems: [
        { text: 'Center Overview', path: '/dashboard' },
        { text: 'Employee Stats', path: '/dashboard' },
        { text: 'Quick Actions', path: '/dashboard' },
      ],
    },
    {
      text: 'Attendance Tracking',
      icon: CalendarTodayIcon,
      path: '/attendance-tracking',
      description: "Track employees' daily attendance records",
      subItems: [
        { text: 'Daily Attendance', path: '/attendance-tracking', description: "Present: 32, Absent: 3, Late: 2 (today)" },
        { text: 'Attendance Reports', path: '/attendance-tracking', description: "Attendance Rate: 94% this month" },
        { text: 'Monthly Attendance', path: '/attendance-tracking/monthly', description: "Monitor employees' monthly attendance" },
      ],
    },
    {
      text: 'Leave Tracking',
      icon: WorkOffIcon,
      path: '/leave-tracking',
      description: 'Track and manage employee leave requests',
      subItems: [
        { text: 'Daily Leave Tracking', path: '/leave-tracking/daily' },
        { text: 'Monthly Leave Tracking', path: '/leave-tracking/monthly' },
      ],
    },
    {
      text: 'Performance',
      icon: TrendingUpIcon,
      path: '/performance',
      description: 'Track and evaluate employee performance',
      subItems: [
        { text: 'Performance Reviews', path: '/performance' },
        { text: 'Goals & KPIs', path: '/performance' },
        { text: 'Feedback', path: '/performance' },
      ],
    },
    {
      text: 'Payroll',
      icon: AccountBalanceIcon,
      path: '/payroll',
      description: 'Manage employee compensation and benefits',
      subItems: [
        { text: 'Salary Processing', path: '/payroll' },
        { text: 'Benefits', path: '/payroll' },
        { text: 'Tax Reports', path: '/payroll' },
      ],
    },
    {
      text: 'Employee Login',
      icon: GroupAddIcon,
      path: '/employee/login',
      description: 'Login as an employee',
    },
  ];

  // Admin menu items
  const adminMenuItems = [
    {
      text: 'Dashboard',
      icon: DashboardIcon,
      path: '/admin/dashboard',
      description: 'Admin dashboard and management',
    },
    {
      text: 'Attendance List',
      icon: CalendarTodayIcon,
      path: '/admin/attendance-list',
      description: 'View all employees attendance records',
      subItems: [
        { text: 'Daily Attendance', path: '/admin/attendance-list', description: "View all employees' daily attendance records" },
        { text: 'Monthly Attendance Dashboard', path: '/admin/monthly-attendance', description: "Monitor employees' monthly attendance with detailed analytics" },
      ],
    },
    {
      text: 'Registration Links',
      icon: GroupAddIcon,
      path: '/admin/registration-links',
      description: 'Register new employees or centres',
      onClick: () => {
        setShowAdminRegistrationLinks(true);
        setSidebarOpen(false);
      },
    },
    {
      text: 'Center Login',
      icon: GroupAddIcon,
      path: '/centre/login',
      description: 'Login as a center',
    },
    {
      text: 'Employee Login',
      icon: GroupAddIcon,
      path: '/employee/login',
      description: 'Login as an employee',
    },
  ];

  // Select menu items based on user type
  let menuItems = employeeMenuItems;
  if (userType === 'centre') menuItems = centreMenuItems;
  if (userType === 'admin') menuItems = adminMenuItems;

  const drawer = (
    <>
      <div className="sidebar-header">
        {/* <img src="/logo_synchro.png" alt="SynchroServe Logo" className="sidebar-title" style={{ maxHeight: '48px', width: 'auto' }} /> */}
      </div>
      <ul className="menu-list">
        {menuItems.map((item) => (
          <li key={item.text}>
            {item.subItems ? (
              <>
                <button
                  className="menu-item"
                  onClick={() => handleSectionToggle(item.text)}
                  data-section={item.text}
                >
                  <img src={item.icon} alt="" className="menu-item-icon" />
                  <div className="menu-item-text">
                    <div>{item.text}</div>
                    <div className="menu-item-description">{item.description}</div>
                  </div>
                  <img
                    src={openSections[item.text] ? ExpandLessIcon : ExpandMoreIcon}
                    alt=""
                    className="menu-item-icon expand-icon"
                  />
                </button>
                {openSections[item.text] && (
                  <ul className="submenu">
                    {item.subItems.map((subItem) => (
                      <li key={subItem.text}>
                        <Link to={subItem.path} className="submenu-item" onClick={() => setSidebarOpen(false)}>
                          {subItem.text}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : item.onClick ? (
              <button className="menu-item" onClick={item.onClick}>
                <img src={item.icon} alt="" className="menu-item-icon" />
                <div className="menu-item-text">
                  <div>{item.text}</div>
                  <div className="menu-item-description">{item.description}</div>
                </div>
              </button>
            ) : (
              <Link to={item.path} className="menu-item" onClick={() => setSidebarOpen(false)}>
                <img src={item.icon} alt="" className="menu-item-icon" />
                <div className="menu-item-text">
                  <div>{item.text}</div>
                  <div className="menu-item-description">{item.description}</div>
                </div>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </>
  );

  // Date and time state for header
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <button className="menu-button" onClick={handleDrawerToggle}>
            <img src={sidebarOpen ? ExpandLessIcon : MenuIcon} alt="Menu" />
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src="/logo_synchro.png" alt="SynchroServe Logo" className="app-title" style={{ maxHeight: '33px', width: 'auto',backgroundColor:'white' }} />
            {isAuthenticated && user && (
              <small style={{ color: '#1565c0', fontSize: '16px' }}>
                Welcome, {userType === 'employee' ? `${user.firstName} ${user.lastName}` : user.centreName}
              </small>
            )}
          </div>
          {isAuthenticated && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#1976D2', fontWeight: 600, fontSize: '1.05rem' }}>
                <span>{currentDateTime.toLocaleDateString('en-US', { 
                  day: '2-digit',
                  month: '2-digit', 
                  year: 'numeric'
                })}</span>
                <span>{currentDateTime.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                })}</span>
              </div>
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </header>

        {sidebarOpen && <div className="sidebar-overlay" onClick={handleDrawerToggle}></div>}
        
        <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          {drawer}
        </nav>

        <main className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
          {isAuthenticated && <InactivityTimer onLogout={handleLogout} />}
          {isAuthenticated && <TokenManager />}
          {/* Show registration links only when admin clicks the sidebar link */}
          {userType === 'admin' && showAdminRegistrationLinks ? (
            <div className="dashboard-container">
              <div className="card" style={{ marginTop: '2rem', border: '2px solid #2196F3', background: 'linear-gradient(90deg, #e3f2fd 0%, #ffffff 100%)' }}>
                <div className="card-content" style={{ textAlign: 'center' }}>
                  <h2 style={{ color: '#1976D2', marginBottom: '1rem', fontWeight: 700, letterSpacing: '1px' }}>Registration Links</h2>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                    <a href="/employee/register" className="registration-link" style={{
                      display: 'inline-block',
                      padding: '14px 32px',
                      background: '#2196F3',
                      color: '#fff',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      textDecoration: 'none',
                      boxShadow: '0 2px 8px rgba(33,150,243,0.08)',
                      transition: 'background 0.2s',
                      marginBottom: '8px'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#1976D2'}
                    onMouseOut={e => e.currentTarget.style.background = '#2196F3'}
                    >
                      Register as Employee
                    </a>
                    <a href="/centre/register" className="registration-link" style={{
                      display: 'inline-block',
                      padding: '14px 32px',
                      background: '#2196F3',
                      color: '#fff',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      textDecoration: 'none',
                      boxShadow: '0 2px 8px rgba(33,150,243,0.08)',
                      transition: 'background 0.2s',
                      marginBottom: '8px'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#1976D2'}
                    onMouseOut={e => e.currentTarget.style.background = '#2196F3'}
                    >
                      Register as Centre
                    </a>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button className="button button-secondary" onClick={() => setShowAdminRegistrationLinks(false)}>
                  Back to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={isAuthenticated ? 
                (userType === 'centre' ? <Dashboard /> : userType === 'admin' ? <AdminDashboard /> : <EmployeeHome />) : 
                <LoginSelection />} 
              />
              <Route path="/employee/login" element={<EmployeeLogin />} />
              <Route path="/centre/login" element={<CentreLogin />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/employee/register" element={<EmployeeRegister />} />
              <Route path="/centre/register" element={<CentreRegister />} />
              <Route path="/login-selection" element={<LoginSelection />} />
              {/* Employee-only routes - TRUE BLOCKING */}
              <Route path="/onboarding" element={
                <ProtectedRoute allowedUserTypes={['employee']}>
                  <Onboarding />
                </ProtectedRoute>
              } />
              <Route path="/attendance" element={
                <ProtectedRoute allowedUserTypes={['employee']}>
                  <Attendance />
                </ProtectedRoute>
              } />
              <Route path="/leave" element={
                <ProtectedRoute allowedUserTypes={['employee']}>
                  <LeaveManagement />
                </ProtectedRoute>
              } />
              {/* Centre-only routes - TRUE BLOCKING */}
              <Route path="/dashboard" element={
                <ProtectedRoute allowedUserTypes={['centre']}>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/performance" element={
                <ProtectedRoute allowedUserTypes={['centre']}>
                  <PerformanceTracking />
                </ProtectedRoute>
              } />
              <Route path="/payroll" element={
                <ProtectedRoute allowedUserTypes={['centre']}>
                  <PayrollPreview />
                </ProtectedRoute>
              } />
              <Route path="/attendance-tracking" element={
                <ProtectedRoute allowedUserTypes={['centre']}>
                  <AttendanceTracking />
                </ProtectedRoute>
              } />
              <Route path="/attendance-tracking/monthly" element={
                <ProtectedRoute allowedUserTypes={['centre']}>
                  <MonthlyAttendanceDashboard />
                </ProtectedRoute>
              } />
              <Route path="/monthly-attendance-dashboard" element={
                <ProtectedRoute allowedUserTypes={['employee']}>
                  <MonthlyAttendanceDashboard />
                </ProtectedRoute>
              } />
              <Route path="/leave-tracking" element={
                <ProtectedRoute allowedUserTypes={['centre']}>
                  <LeaveManagement />
                </ProtectedRoute>
              } />
              <Route path="/leave-tracking/daily" element={
                <ProtectedRoute allowedUserTypes={['centre']}>
                  <LeaveManagement />
                </ProtectedRoute>
              } />
              <Route path="/leave-tracking/monthly" element={
                <ProtectedRoute allowedUserTypes={['centre']}>
                  <MonthlyLeaveTrackingDashboard />
                </ProtectedRoute>
              } />
              {/* Admin-only routes - TRUE BLOCKING */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute allowedUserTypes={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/attendance-list" element={
                <ProtectedRoute allowedUserTypes={['admin']}>
                  <AdminAttendanceList />
                </ProtectedRoute>
              } />
              <Route path="/admin/monthly-attendance" element={
                <ProtectedRoute allowedUserTypes={['admin']}>
                  <AdminMonthlyAttendanceDashboard />
                </ProtectedRoute>
              } />
              {/* Catch-all route for authenticated users */}
              {isAuthenticated && (
                <Route path="*" element={
                  <Navigate to={userType === 'employee' ? '/' : userType === 'centre' ? '/dashboard' : userType === 'admin' ? '/admin/dashboard' : '/'} replace />
                } />
              )}
              {/* Public routes */}
              {!isAuthenticated && (
                <Route path="*" element={<LoginSelection />} />
              )}
              <Route path="/employee/forgot-password" element={<EmployeeForgotPassword />} />
              <Route path="/centre/forgot-password" element={<CentreForgotPassword />} />
            </Routes>
          )}
        </main>
      </div>
    </Router>
  );
}

export default App; 
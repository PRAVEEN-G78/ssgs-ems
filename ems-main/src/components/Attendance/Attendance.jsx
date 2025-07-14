import React, { useState, useRef, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import Webcam from 'react-webcam';
import './Attendance.css';
import { API_ENDPOINTS } from '../../config/api';

function Attendance() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCalendar, setShowCalendar] = useState(false);
  const [attendanceData, setAttendanceData] = useState({
    checkIn: '',
    checkOut: '',
    checkInDate: '',
    checkOutDate: ''
  });
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [message, setMessage] = useState('');

  // Face Auth & GPS state
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [locationError, setLocationError] = useState('');
  const [faceAuthMessage, setFaceAuthMessage] = useState('');
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [faceModalType, setFaceModalType] = useState(null); // 'checkin' or 'checkout'

  const [showExportSample, setShowExportSample] = useState(false);

  const [showMonthlyModal, setShowMonthlyModal] = useState(false);
  const [selectedMonthForModal, setSelectedMonthForModal] = useState(format(new Date(), 'yyyy-MM'));

  // Add state for toggling the Monthly View Report
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);

  // Sample monthly data (could be replaced with real data)
  const sampleMonthlyData = [
    { id: 1, date: '2024-03-01', checkIn: '09:00', checkOut: '18:00', status: 'Present', workingHours: 9, overtime: 0 },
    { id: 2, date: '2024-03-02', checkIn: '09:10', checkOut: '18:00', status: 'Late', workingHours: 8.83, overtime: 0 },
    { id: 3, date: '2024-03-03', checkIn: '09:00', checkOut: '17:00', status: 'Present', workingHours: 8, overtime: 0 },
    { id: 4, date: '2024-03-04', checkIn: '09:00', checkOut: '18:30', status: 'Present', workingHours: 9.5, overtime: 0.5 },
    { id: 5, date: '2024-03-05', checkIn: '09:30', checkOut: '18:00', status: 'Late', workingHours: 8.5, overtime: 0 },
    { id: 6, date: '2024-03-06', checkIn: '09:00', checkOut: '18:00', status: 'Present', workingHours: 9, overtime: 0 },
    { id: 7, date: '2024-03-07', checkIn: '09:00', checkOut: '18:00', status: 'Present', workingHours: 9, overtime: 0 },
  ];

  const [realTimeWorkingHours, setRealTimeWorkingHours] = useState('0');

  // Real-time working hours calculation for today
  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayRecord = attendanceRecords.find(r => r.date === today);
    let intervalId;

    function updateWorkingHours() {
      if (todayRecord && todayRecord.checkIn) {
        const checkInTime = todayRecord.checkIn;
        const checkOutTime = todayRecord.checkOut;
        const now = new Date();
        const [inHour, inMin] = checkInTime.split(':').map(Number);
        const checkInDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), inHour, inMin);
        let diffMs;
        if (checkOutTime) {
          const [outHour, outMin] = checkOutTime.split(':').map(Number);
          const checkOutDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), outHour, outMin);
          diffMs = checkOutDate - checkInDate;
        } else {
          diffMs = now - checkInDate;
        }
        if (diffMs > 0) {
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const mins = Math.floor((diffMs / (1000 * 60)) % 60);
          setRealTimeWorkingHours(`${hours}h ${mins}m`);
        } else {
          setRealTimeWorkingHours('0');
        }
      } else {
        setRealTimeWorkingHours('0');
      }
    }

    updateWorkingHours();
    if (todayRecord && todayRecord.checkIn && !todayRecord.checkOut) {
      intervalId = setInterval(updateWorkingHours, 1000);
    }
    return () => intervalId && clearInterval(intervalId);
  }, [attendanceRecords]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.employeeId) {
      setError('No employee ID found. Please log in again.');
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/attendance?employeeId=${user.employeeId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch attendance records');
        return res.json();
      })
      .then(data => {
        setAttendanceRecords(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleCheckIn = () => {
    setFaceModalType('checkin');
    setFaceModalOpen(true);
    // Automatically get location when modal opens
    getLocation();
  };

  const handleCheckOut = () => {
    setFaceModalType('checkout');
    setFaceModalOpen(true);
    // Automatically get location when modal opens
    getLocation();
  };

  const handleFaceCapture = async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      
      // Show processing message
      setFaceAuthMessage('Processing face authentication...');
      
      if (!location.lat || !location.lng) {
        setFaceAuthMessage('Location not available. Please allow location access and try again.');
        setTimeout(() => setFaceAuthMessage(''), 3000);
        return;
      }
      
      // Convert base64 image to Blob
      const blob = await (await fetch(imageSrc)).blob();
      const formData = new FormData();
      formData.append('file', blob, 'face.jpg');
      formData.append('latitude', location.lat);
      formData.append('longitude', location.lng);
      
      try {
        const res = await fetch(API_ENDPOINTS.FACE_AUTH_VALIDATE, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        
        if (data.face_matched && data.location_ok) {
          const now = new Date();
          const user = JSON.parse(localStorage.getItem('user'));
          const dateStr = now.toISOString().slice(0, 10);
          const timeStr = now.toTimeString().slice(0, 5); // 'HH:MM'
          if (faceModalType === 'checkin') {
            let attendancePayload = {
              employeeId: user.employeeId,
              date: dateStr,
              checkIn: timeStr,
              status: 'Present'
            };
            // Store attendance in backend (create new record)
            await fetch(API_ENDPOINTS.ATTENDANCE, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(attendancePayload)
            });
            setAttendanceData(prev => ({
              ...prev,
              checkIn: timeStr,
              checkInDate: dateStr
            }));
            setMessage('✅ Checked in successfully!');
          } else if (faceModalType === 'checkout') {
            // Find today's record to get check-in time
            const todayRecord = attendanceRecords.find(
              r => r.date === dateStr && r.employeeId === user.employeeId
            );
            let workingHours = 0;
            if (todayRecord && todayRecord.checkIn) {
              const [inHour, inMin] = todayRecord.checkIn.split(':').map(Number);
              const [outHour, outMin] = timeStr.split(':').map(Number);
              const checkInDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), inHour, inMin);
              const checkOutDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), outHour, outMin);
              const diffMs = checkOutDate - checkInDate;
              if (diffMs > 0) {
                workingHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // hours, rounded to 2 decimals
              }
            }
            let attendancePayload = {
              employeeId: user.employeeId,
              date: dateStr,
              checkOut: timeStr,
              workingHours
            };
            // Update attendance in backend (update existing record)
            await fetch(API_ENDPOINTS.ATTENDANCE, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(attendancePayload)
            });
            setAttendanceData(prev => ({
              ...prev,
              checkOut: timeStr,
              checkOutDate: dateStr
            }));
            setMessage('✅ Checked out successfully!');
          }
          setFaceModalOpen(false);
        } else {
          setFaceAuthMessage(data.status || '❌ Face or location validation failed. Please try again.');
        }
      } catch (err) {
        setFaceAuthMessage('❌ Face authentication server error. Please check your connection.');
      }
      
      setTimeout(() => {
        setMessage('');
        setFaceAuthMessage('');
        setCapturedImage(null);
      }, 3000);
    }
  };

  const handleModalClose = () => {
    setFaceModalOpen(false);
    setFaceAuthMessage('');
    setCapturedImage(null);
  };

  const handleExport = () => {
    // Show sample export modal
    setShowExportSample(true);
    setMessage('Exporting attendance report...');
    setTimeout(() => setMessage(''), 3000);
  };

  // Filter attendance records for the selected month
  const filteredRecords = attendanceRecords.filter(record => 
    record.date && record.date.startsWith(selectedMonth)
  );

  // Update stats calculation to use filteredRecords
  const calculateMonthlyStats = (records) => {
    const present = records.filter(r => r.status === 'Present').length;
    const late = records.filter(r => r.status === 'Late').length;
    const absent = records.filter(r => r.status === 'Absent').length;
    const halfDay = records.filter(r => r.status === 'Half Day').length;
    const totalWorkingHours = records.reduce((sum, r) => sum + r.workingHours, 0);
    const totalOvertime = records.reduce((sum, r) => sum + r.overtime, 0);
    return { present, late, absent, halfDay, totalWorkingHours, totalOvertime };
  };

  const stats = calculateMonthlyStats(filteredRecords);

  // Get GPS location
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationError('');
        },
        (err) => {
          setLocationError('Location access denied or unavailable.');
        }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser.');
    }
  };

  // Capture image from webcam
  const capture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      // Placeholder: Here you would send imageSrc to a backend or face recognition API
      setFaceAuthMessage('Face captured! (Authentication placeholder)');
      setTimeout(() => setFaceAuthMessage(''), 3000);
    }
  };

  // Helper to get all days in the selected month
  const getMonthDays = (month) => {
    const start = startOfMonth(new Date(month + '-01'));
    const end = endOfMonth(start);
    return eachDayOfInterval({ start, end });
  };

  // Add helper to export filtered records as CSV
  function exportToCSV(records, month) {
    if (!records.length) return;
    const header = ['Date', 'Check In', 'Check Out', 'Status', 'Working Hours', 'Overtime'];
    const rows = records.map(r => [r.date, r.checkIn, r.checkOut, r.status, r.workingHours, r.overtime]);
    const csvContent = [header, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_${month}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Helper to get unique months from attendance data
  const getAvailableMonths = (records) => {
    const months = new Set(records.map(r => r.date && r.date.slice(0, 7)));
    return Array.from(months).filter(Boolean).sort().reverse();
  };

  const availableMonths = getAvailableMonths(attendanceRecords);

  // Filter modal data by selectedMonthForModal
  const filteredModalRecords = attendanceRecords.filter(record => 
    record.date && record.date.startsWith(selectedMonthForModal)
  );

  // Helper to export daily attendance as CSV
  function exportMonthlyAttendanceCSV(records, month) {
    if (!records.length) return;
    const header = ['Date', 'Check In', 'Check Out', 'Status', 'Working Hours', 'Overtime'];
    const rows = records.map(r => [r.date, r.checkIn, r.checkOut, r.status, r.workingHours, r.overtime]);
    const csvContent = [header, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_${month}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="attendance-container">
      {/* Face Authentication Modal */}
      {faceModalOpen && (
        <div className="face-modal-overlay">
          <div className="face-modal-content" style={{ position: 'relative' }}>
            <button
              onClick={handleModalClose}
              style={{
                position: 'absolute',
                top: 0,
                right: 5,
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#fff',
                border: 'none',
                borderRadius: '50%',
                color: '#ff0000',
                fontSize: 45,
                cursor: 'pointer',
                zIndex: 1001
              }}
              aria-label="Close"
            >
              ×
            </button>
            <h2 style={{marginBottom: '1rem'}}>
              {faceModalType === 'checkin' ? 'Check In' : 'Check Out'} - Face Authentication
            </h2>
            
            {/* Date and Time Display */}
            <div style={{
              marginBottom: '1rem',
              padding: '0.5rem',
              borderRadius: '4px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #e9ecef',
              textAlign: 'center',
              fontSize: '0.9rem',
              fontWeight: '500',
              color: '#495057'
            }}>
              <div style={{
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#1976D2', 
                marginBottom: '0.2rem',
                textTransform: 'capitalize'
              }}>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div style={{fontSize: '1.1rem', fontWeight: '700', color: '#2196F3'}}>
                {new Date().toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit',
                  hour12: true 
                })}
              </div>
            </div>
            
            {/* Location Status */}
            <div style={{
              marginBottom: '1rem',
              padding: '0.5rem',
              borderRadius: '4px',
              backgroundColor: location.lat && location.lng ? '#e8f5e8' : '#fff3cd',
              color: location.lat && location.lng ? '#155724' : '#856404',
              fontSize: '0.9rem'
            }}>
              📍 {location.lat && location.lng ? 
                'Location captured successfully' : 
                'Getting your location... Please allow location access.'
              }
            </div>
            
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width={240}
              height={180}
              style={{borderRadius: 8, border: '1px solid #ddd'}}
            />
            
            <div style={{marginTop: 12, marginBottom: 8, fontSize: '0.9rem', color: '#666'}}>
              Position your face in the camera and click "Capture"
            </div>
            
            <div style={{marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center'}}>
              <button 
                className="button button-primary" 
                onClick={handleFaceCapture}
                disabled={!location.lat || !location.lng}
                style={{
                  opacity: (!location.lat || !location.lng) ? 0.6 : 1,
                  padding: '10px 24px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: 6,
                  border: 'none',
                  background: '#1976D2',
                  color: '#fff',
                  cursor: (!location.lat || !location.lng) ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                  boxShadow: '0 1px 4px rgba(25, 118, 210, 0.08)'
                }}
              >
                <i className="icon">📸</i> Capture 
              </button>
            </div>
            
            {faceAuthMessage && (
              <div style={{
                marginTop: 16, 
                padding: '0.75rem',
                borderRadius: '4px',
                backgroundColor: faceAuthMessage.includes('❌') ? '#f8d7da' : '#d1ecf1',
                color: faceAuthMessage.includes('❌') ? '#721c24' : '#0c5460',
                fontWeight: 500,
                fontSize: '0.9rem'
              }}>
                {faceAuthMessage}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="attendance-header">
        <h1 className="attendance-title">Attendance Management</h1>
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            className="button button-outlined"
            onClick={() => setShowCalendar(true)}
          >
            <i className="icon">📅</i>
            Calendar View
          </button>
          {/* Monthly Attendance Dropdown moved here */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontWeight: 600, color: '#1976D2' }}>Monthly Attendance:</label>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              style={{ fontSize: 16, padding: 4, border: '2px solid #1976D2', background: '#e3f2fd', borderRadius: 4 }}
            >
              {availableMonths.map(month => (
                <option key={month} value={month}>{format(new Date(month + '-01'), 'MMMM yyyy')}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <div className="quick-actions-card">
          <div className="quick-actions-content">
            <button
              className="button button-primary"
              onClick={handleCheckIn}
            >
              <i className="icon">⏰</i>
              Check In
            </button>
            <button
              className="button button-secondary"
              onClick={handleCheckOut}
            >
              <i className="icon">⏰</i>
              Check Out
            </button>
          </div>
        </div>
      </div>

      {/* Highlighted selected month and export button above stats/records */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 0 8px 0' }}>
        <h2 style={{ margin: 0, color: '#1976D2', fontWeight: 700 }}>
          Attendance for <span style={{ background: '#e3f2fd', borderRadius: 4, padding: '2px 8px', border: '1px solid #90caf9' }}>{format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}</span>
        </h2>
        <button
          className="button button-secondary"
          style={{ fontWeight: 600, background: '#1976D2', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 18px', marginLeft: 12 }}
          onClick={() => exportToCSV(filteredRecords, selectedMonth)}
          disabled={filteredRecords.length === 0}
        >
          Export CSV
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-container">
        <div className="stats-grid">
          <div className="stat-card stat-inline">
            <div className="stat-label">Present Days</div>
            <div className="stat-value">{stats.present}</div>
          </div>
          <div className="stat-card stat-inline">
            <div className="stat-label">Late Days</div>
            <div className="stat-value">{stats.late}</div>
          </div>
          <div className="stat-card stat-inline">
            <div className="stat-label">Half Days</div>
            <div className="stat-value">{stats.halfDay}</div>
          </div>
          <div className="stat-card stat-inline">
            <div className="stat-label">Absent Days</div>
            <div className="stat-value">{stats.absent}</div>
          </div>
          
          <div className="stat-card stat-inline">
            <div className="stat-label">Working Hours</div>
            <div className="stat-value">{realTimeWorkingHours}</div>
          </div>
          <div className="stat-card stat-inline">
            <div className="stat-label">Overtime Hours</div>
            <div className="stat-value">{stats.totalOvertime}</div>
          </div>
        </div>
      </div>

      {/* Monthly View Report Button */}
      <div style={{ margin: '24px 0', background: '#f5f7fa', borderRadius: 8, padding: 16 }}>
        <button
          className="button button-secondary"
          style={{ fontWeight: 600, background: '#1976D2', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 18px' }}
          onClick={() => setShowMonthlyReport(true)}
        >
          Monthly View Report
        </button>
      </div>

      {/* Monthly View Report Modal */}
      {showMonthlyReport && (
        <div className="face-modal-overlay" style={{zIndex: 3000}}>
          <div className="face-modal-content" id="monthly-report-modal-content" style={{ minWidth: 400, maxWidth: 600, background: '#fff', borderRadius: 8, padding: 24, position: 'relative' }}>
            <button
              onClick={() => setShowMonthlyReport(false)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f44336',
                border: 'none',
                borderRadius: '50%',
                color: '#fff',
                fontSize: 20,
                cursor: 'pointer',
                zIndex: 1001
              }}
              aria-label="Close"
            >
              ×
            </button>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <button
                className="button button-secondary"
                style={{ fontWeight: 600, background: '#1976D2', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 18px' }}
                onClick={() => exportMonthlyAttendanceCSV(filteredRecords, selectedMonth)}
                disabled={filteredRecords.length === 0}
              >
                Export CSV
              </button>
              <button
                className="button button-secondary"
                style={{ fontWeight: 600, background: '#1976D2', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 18px' }}
                onClick={() => {
                  const printContents = document.getElementById('monthly-report-modal-content').innerHTML;
                  const printWindow = window.open('', '', 'height=600,width=800');
                  printWindow.document.write('<html><head><title>Monthly View Report</title>');
                  printWindow.document.write('</head><body >');
                  printWindow.document.write(printContents);
                  printWindow.document.write('</body></html>');
                  printWindow.document.close();
                  printWindow.focus();
                  printWindow.print();
                  printWindow.close();
                }}
              >
                Print
              </button>
            </div>
            <h2 style={{ color: '#1976D2', marginBottom: 16 }}>Monthly View Report</h2>
            <table className="table" style={{ minWidth: 400, background: '#fff', borderRadius: 6 }}>
              <thead>
                <tr>
                  <th>Present Days</th>
                  <th>Late Days</th>
                  <th>Absent Days</th>
                  <th>Half Days</th>
                  <th>Total Working Hours</th>
                  <th>Total Overtime</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{stats.present}</td>
                  <td>{stats.late}</td>
                  <td>{stats.absent}</td>
                  <td>{stats.halfDay}</td>
                  <td>{stats.totalWorkingHours}</td>
                  <td>{stats.totalOvertime}</td>
                </tr>
              </tbody>
            </table>
            {/* Daily Attendance Table for the Month */}
            <h3 style={{ color: '#1976D2', margin: '24px 0 12px 0' }}>Daily Attendance for {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}</h3>
            <table className="table" style={{ minWidth: 400, background: '#fff', borderRadius: 6 }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                  <th>Working Hours</th>
                  <th>Overtime</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr><td colSpan="6" style={{textAlign: 'center'}}>No attendance data for this month.</td></tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record._id || record.id}>
                      <td>{record.date}</td>
                      <td>{record.checkIn}</td>
                      <td>{record.checkOut}</td>
                      <td>{record.status}</td>
                      <td>{record.workingHours}</td>
                      <td>{record.overtime}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance Records */}
      <div className="attendance-records">
        <div className="records-header">
          <h2 className="records-title">Attendance Records</h2>
          <div className="records-filters">
            <div className="form-group">
              <select
                className="form-input"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="half-day">Half Day</option>
                <option value="on-leave">Leave</option>
              </select>
            </div>
          </div>
        </div>
        {loading ? (
          <div style={{ padding: '1rem', textAlign: 'center' }}>Loading attendance records...</div>
        ) : error ? (
          <div style={{ color: 'red', padding: '1rem', textAlign: 'center' }}>{error}</div>
        ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Status</th>
                <th>Working Hours</th>
                <th>Overtime</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr><td colSpan="6" style={{textAlign: 'center'}}>No attendance data for this month.</td></tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record._id || record.id}>
                    <td>{record.date}</td>
                    <td>{record.checkIn}</td>
                    <td>{record.checkOut}</td>
                    <td>
                      <span className={`status-chip ${
                        record.status === 'On Leave' || record.status === 'Leave' ? 'status-leave' :
                        record.status === 'Half Day' ? 'status-half-day' :
                        'status-' + record.status.toLowerCase().replace(/\s/g, '-')
                      }`}>
                        {record.status === 'On Leave' ? 'Leave' : record.status}
                      </span>
                    </td>
                    <td>{record.workingHours}</td>
                    <td>{record.overtime}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Calendar Dialog */}
      {showCalendar && (
        <div className="calendar-dialog">
          <div className="calendar-content">
            <div className="calendar-header">
              <h2 className="calendar-title">Calendar View</h2>
              <button
                className="button button-secondary"
                onClick={() => setShowCalendar(false)}
              >
                Close
              </button>
            </div>
            {/* Month Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <button className="button button-secondary" onClick={() => setSelectedMonth(format(new Date(new Date(selectedMonth + '-01').setMonth(new Date(selectedMonth + '-01').getMonth() - 1)), 'yyyy-MM'))}>
                {'<'}
              </button>
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                style={{ fontSize: 16, padding: 4, border: '2px solid #1976D2', background: '#e3f2fd', borderRadius: 4 }}
              />
              <button className="button button-secondary" onClick={() => setSelectedMonth(format(new Date(new Date(selectedMonth + '-01').setMonth(new Date(selectedMonth + '-01').getMonth() + 1)), 'yyyy-MM'))}>
                {'>'}
              </button>
            </div>
            {/* Calendar Grid */}
            <div className="calendar-grid">
              {[...Array(7)].map((_, i) => (
                <div key={i} style={{ fontWeight: 600, textAlign: 'center' }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}
                </div>
              ))}
              {(() => {
                const days = getMonthDays(selectedMonth);
                const firstDay = days[0].getDay();
                const blanks = Array(firstDay).fill(null);
                const todayStr = format(new Date(), 'yyyy-MM-dd');
                return [
                  ...blanks.map((_, i) => <div key={'b'+i} className="calendar-day disabled"></div>),
                  ...days.map(day => {
                    const dayStr = format(day, 'yyyy-MM-dd');
                    const isToday = dayStr === todayStr;
                    const isSelected = dayStr === date;
                    return (
                      <div
                        key={dayStr}
                        className={`calendar-day${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}`}
                        onClick={() => setDate(dayStr)}
                        style={{ cursor: 'pointer', fontWeight: isToday ? 600 : 400 }}
                      >
                        {day.getDate()}
                      </div>
                    );
                  })
                ];
              })()}
            </div>
            <div style={{marginTop: 16}}>
              <b>Selected Date:</b> {date}
            </div>
          </div>
        </div>
      )}

      {/* Export Sample Modal */}
      {showExportSample && (
        <div className="face-modal-overlay" style={{zIndex: 2000}}>
          <div className="face-modal-content" style={{ maxWidth: 600, position: 'relative' }}>
            <button
              onClick={() => setShowExportSample(false)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f44336',
                border: 'none',
                borderRadius: '50%',
                color: '#ff0000',
                fontSize: 20,
                cursor: 'pointer',
                zIndex: 1001
              }}
              aria-label="Close"
            >
              ×
            </button>
            <h2 style={{marginBottom: 16}}>Sample Export Report</h2>
            <div style={{overflowX: 'auto'}}>
              <table className="table" style={{minWidth: 500}}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Status</th>
                    <th>Working Hours</th>
                    <th>Overtime</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.slice(0, 5).map((record) => (
                    <tr key={record._id || record.id}>
                      <td>{record.date}</td>
                      <td>{record.checkIn}</td>
                      <td>{record.checkOut}</td>
                      <td>{record.status}</td>
                      <td>{record.workingHours}</td>
                      <td>{record.overtime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{marginTop: 16, textAlign: 'right'}}>
              <button
                onClick={() => setShowExportSample(false)}
                style={{
                  padding: '8px 20px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: 6,
                  border: '1px solid #bbb',
                  background: '#fff',
                  color: '#333',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Attendance Modal */}
      {showMonthlyModal && (
        <div className="face-modal-overlay" style={{zIndex: 2000}}>
          <div className="face-modal-content" style={{ minWidth: 450, maxWidth: 650, maxHeight: '70vh', overflowY: 'auto', position: 'relative' }}>
            <button
              onClick={() => setShowMonthlyModal(false)}
              style={{
                position: 'absolute',
                top: 0,
                right: 5,
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#fff',
                border: 'none',
                borderRadius: '50%',
                color: '#ff0000',
                fontSize: 20,
                cursor: 'pointer',
                zIndex: 1001
              }}
              aria-label="Close"
            >
              ×
            </button>
            <h2 style={{marginBottom: 16}}>Monthly Attendance Data</h2>
            <div style={{marginBottom: 16}}>
              <label style={{fontWeight: 600, marginRight: 8}}>Select Month:</label>
              <select
                value={selectedMonthForModal}
                onChange={e => setSelectedMonthForModal(e.target.value)}
                style={{fontSize: 16, padding: 4, border: '2px solid #1976D2', background: '#e3f2fd', borderRadius: 4}}
              >
                {availableMonths.map(month => (
                  <option key={month} value={month}>{format(new Date(month + '-01'), 'MMMM yyyy')}</option>
                ))}
              </select>
            </div>
            <div style={{overflowX: 'auto'}}>
              <table className="table" style={{minWidth: 500}}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Status</th>
                    <th>Working Hours</th>
                    <th>Overtime</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredModalRecords.length > 0 ? filteredModalRecords.map((record) => (
                    <tr key={record._id || record.id}>
                      <td>{record.date}</td>
                      <td>{record.checkIn}</td>
                      <td>{record.checkOut}</td>
                      <td>{record.status}</td>
                      <td>{record.workingHours}</td>
                      <td>{record.overtime}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="6" style={{textAlign: 'center'}}>No data for this month.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Demo Sample Employee Attendance Section */}
            <div style={{marginTop: 32, background: '#f5f7fa', borderRadius: 8, padding: 16}}>
              <h3 style={{marginBottom: 12, color: '#1976D2'}}>Demo: Sample Employee Attendance</h3>
              <table className="table" style={{minWidth: 400}}>
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>EMP001</td>
                    <td>John Doe</td>
                    <td>2024-03-01</td>
                    <td>Present</td>
                  </tr>
                  <tr>
                    <td>EMP002</td>
                    <td>Jane Smith</td>
                    <td>2024-03-01</td>
                    <td>Late</td>
                  </tr>
                  <tr>
                    <td>EMP003</td>
                    <td>Alex Lee</td>
                    <td>2024-03-01</td>
                    <td>Absent</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{marginTop: 16, textAlign: 'right'}}>
              <button
                onClick={() => setShowMonthlyModal(false)}
                style={{
                  padding: '8px 20px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: 6,
                  border: '1px solid #bbb',
                  background: '#fff',
                  color: '#333',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Attendance; 
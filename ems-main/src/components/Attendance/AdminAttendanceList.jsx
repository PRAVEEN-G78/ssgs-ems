import React, { useState, useEffect } from 'react';
import './Attendance.css';

function AdminAttendanceList() {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [employeeIdFilter, setEmployeeIdFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [centerCodeFilter, setCenterCodeFilter] = useState('');
  const [centers, setCenters] = useState([]);

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/attendance', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('Failed to fetch attendance records');
        const data = await res.json();
        setAttendanceRecords(data);
      } catch (err) {
        setError(err.message || 'Error fetching attendance');
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/centers', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setCenters(data);
        } else {
          setCenters([]);
        }
      } catch (err) {
        setCenters([]);
      }
    };
    fetchCenters();
  }, []);

  // Filter records
  const filteredRecords = attendanceRecords.filter(r => {
    const matchesEmployee = employeeIdFilter ? (r.employeeId || '').toLowerCase().includes(employeeIdFilter.toLowerCase()) : true;
    const matchesDate = dateFilter ? (r.date && r.date.slice(0, 10) === dateFilter) : true;
    const matchesCenter = centerCodeFilter ? ((r.centreCode || r.centerCode || '').toLowerCase().includes(centerCodeFilter.toLowerCase())) : true;
    return matchesEmployee && matchesDate && matchesCenter;
  });

  // Today's stats
  const today = new Date().toISOString().slice(0, 10);
  const todayRecords = attendanceRecords.filter(r => r.date && r.date.slice(0, 10) === today);

  // Get unique center codes from all attendance records
  const allCenterCodes = Array.from(new Set(attendanceRecords.map(r => r.centreCode || r.centerCode || ''))).filter(Boolean);

  // Filter today's records by center code if selected
  const filteredTodayRecords = centerCodeFilter
    ? todayRecords.filter(r => (r.centreCode || r.centerCode || '').toLowerCase() === centerCodeFilter.toLowerCase())
    : todayRecords;

  // Stats for filtered center
  const present = filteredTodayRecords.filter(r => r.status === 'Present').length;
  const late = filteredTodayRecords.filter(r => r.status === 'Late').length;
  const absent = filteredTodayRecords.filter(r => r.status === 'Absent').length;
  const leave = filteredTodayRecords.filter(r => r.status === 'Leave').length;
  const halfday = filteredTodayRecords.filter(r => r.status === 'Half Day').length;

  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <h1 className="attendance-title">Attendance List (Admin)</h1>
      </div>
      {/* Center Code Filter */}
      <div style={{ margin: '16px 0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
        <label htmlFor="center-code-select" style={{ fontWeight: 600 }}>Center Code:</label>
        <select
          id="center-code-select"
          value={centerCodeFilter}
          onChange={e => setCenterCodeFilter(e.target.value)}
          style={{ padding: 8, borderRadius: 4, border: '1px solid #1976D2', minWidth: 120 }}
        >
          <option value="">All Centers</option>
          {centers.map(center => (
            <option key={center._id} value={center.centreCode || center.centerCode}>
              {center.centreCode || center.centerCode}
            </option>
          ))}
        </select>
      </div>
      {/* Today's Stats */}
      <div className="stats-container">
        <div className="stats-grid">
          <div className="stat-card stat-inline">
            <div className="stat-label">Present</div>
            <div className="stat-value">{present}</div>
          </div>
          <div className="stat-card stat-inline">
            <div className="stat-label">Late</div>
            <div className="stat-value">{late}</div>
          </div>
          <div className="stat-card stat-inline">
            <div className="stat-label">Absent</div>
            <div className="stat-value">{absent}</div>
          </div>
          <div className="stat-card stat-inline" style={{ background: '#e8f5e9', color: '#388e3c' }}>
            <div className="stat-label">Leave</div>
            <div className="stat-value">{leave}</div>
          </div>
          <div className="stat-card stat-inline" style={{ background: '#f3e5f5', color: '#7b1fa2' }}>
            <div className="stat-label">Half Day</div>
            <div className="stat-value">{halfday}</div>
          </div>
        </div>
      </div>
      {/* Today's Records Table */}
      <div className="attendance-records">
        <div className="records-header">
          <h2 className="records-title">Attendance Records (Today)</h2>
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div style={{ color: 'red' }}>{error}</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTodayRecords.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center' }}>No records found</td></tr>
                ) : filteredTodayRecords.map((record, idx) => (
                  <tr key={record._id || idx}>
                    <td>{record.employeeId}</td>
                    <td>{record.date ? record.date.slice(0, 10) : ''}</td>
                    <td>{record.checkIn && record.checkIn.length > 5 ? new Date(record.checkIn).toLocaleTimeString() : (record.checkIn || '-')}</td>
                    <td>{record.checkOut && record.checkOut.length > 5 ? new Date(record.checkOut).toLocaleTimeString() : (record.checkOut || '-')}</td>
                    <td>
                      <span className={`status-chip status-${(record.status || '').toLowerCase()}`}>{record.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminAttendanceList; 
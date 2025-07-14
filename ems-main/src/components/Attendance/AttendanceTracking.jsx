import React, { useState, useEffect } from 'react';
import './Attendance.css';

function AttendanceTracking() {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    employeeId: '',
    date: '',
    checkIn: '',
    checkOut: '',
    status: 'Present',
  });

  const [employeeIdFilter, setEmployeeIdFilter] = useState('');

  // Date and time state for real-time display
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Calendar view state
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 7);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Add state for Monthly View Report modal
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);

  // Helper to get all days in the selected month
  function getMonthDays(month) {
    const [year, monthNum] = month.split('-').map(Number);
    const start = new Date(year, monthNum - 1, 1);
    const end = new Date(year, monthNum, 0);
    const days = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  }

  // Helper to get unique months from attendance data
  function getAvailableMonths(records) {
    const months = new Set(records.map(r => r.date && r.date.slice(0, 7)));
    return Array.from(months).filter(Boolean).sort().reverse();
  }

  // Move demoRecords definition to the top, before any use
  const today = new Date().toISOString().slice(0, 10);
  const demoRecords = [
    { employeeId: 'EMP001', name: 'Alice Smith', date: today + 'T09:00:00Z', checkIn: today + 'T09:00:00Z', checkOut: today + 'T18:00:00Z', status: 'Present', workingHours: 9 },
    { employeeId: 'EMP002', name: 'Bob Johnson', date: today + 'T09:15:00Z', checkIn: today + 'T09:15:00Z', checkOut: today + 'T18:00:00Z', status: 'Late', workingHours: 8.75 },
    { employeeId: 'EMP003', name: 'Charlie Lee', date: today + 'T00:00:00Z', checkIn: '', checkOut: '', status: 'Absent', workingHours: 0 },
    { employeeId: 'EMP004', name: 'Diana Patel', date: today + 'T09:05:00Z', checkIn: today + 'T09:05:00Z', checkOut: today + 'T13:00:00Z', status: 'Half Day', workingHours: 4 },
    { employeeId: 'EMP005', name: 'Ethan Kim', date: today + 'T00:00:00Z', checkIn: '', checkOut: '', status: 'Leave', workingHours: 0 },
  ];

  // Use all records for month filtering
  const availableMonths = getAvailableMonths(attendanceRecords.length ? attendanceRecords : demoRecords);
  // Use selectedMonth for filtering
  const filteredMonthRecords = (attendanceRecords.length ? attendanceRecords : demoRecords).filter(r => r.date && r.date.startsWith(selectedMonth));

  // Calculate monthly stats
  const stats = {
    present: filteredMonthRecords.filter(r => r.status === 'Present').length,
    late: filteredMonthRecords.filter(r => r.status === 'Late').length,
    absent: filteredMonthRecords.filter(r => r.status === 'Absent').length,
    leave: filteredMonthRecords.filter(r => r.status === 'On Leave' || r.status === 'Leave').length,
    halfDay: filteredMonthRecords.filter(r => r.status === 'Half Day').length,
    totalWorkingHours: filteredMonthRecords.reduce((sum, r) => sum + (r.workingHours || 0), 0),
  };

  // Helper to export daily attendance as CSV
  function exportMonthlyAttendanceCSV(records, month) {
    if (!records.length) return;
    const header = ['Employee ID', 'Name', 'Date', 'Check In', 'Check Out', 'Status', 'Working Hours'];
    const rows = records.map(r => [r.employeeId, r.name, r.date ? r.date.slice(0, 10) : '', r.checkIn, r.checkOut, r.status, r.workingHours]);
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

  useEffect(() => {
    const interval = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch attendance records from backend
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

  // Calculate stats for today
  const todayRecords = attendanceRecords.filter(r => r.date && r.date.slice(0, 10) === today);

  // Use fetched records if available, otherwise demo data
  const recordsToShow = todayRecords.length > 0 ? todayRecords : demoRecords;
  // Filter records by Employee ID (case-insensitive, partial match)
  const filteredRecords = employeeIdFilter.trim() === ''
    ? recordsToShow
    : recordsToShow.filter(r =>
        r.employeeId && r.employeeId.toLowerCase().includes(employeeIdFilter.trim().toLowerCase())
      );
  const present = filteredRecords.filter(r => r.status === 'Present').length;
  const late = filteredRecords.filter(r => r.status === 'Late').length;
  const absent = filteredRecords.filter(r => r.status === 'Absent').length;
  const leave = filteredRecords.filter(r => r.status === 'On Leave' || r.status === 'Leave').length;
  const halfDay = filteredRecords.filter(r => r.status === 'Half Day').length;

  // Get userType from localStorage for conditional rendering
  const userType = (() => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user?.userType;
    } catch {
      return undefined;
    }
  })();


  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <h1 className="attendance-title">Attendance Tracking</h1>
        {/* Removed time and date display */}
        <button className="button button-outlined" style={{ marginTop: 8 }} onClick={() => setShowCalendar(true)}>
          <span role="img" aria-label="calendar">📅</span> Calendar View
        </button>
        {/* Monthly Attendance Dropdown removed */}
      </div>
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
          <div className="stat-card stat-inline">
            <div className="stat-label">Leave</div>
            <div className="stat-value">{leave}</div>
          </div>
          <div className="stat-card stat-inline half-day">
            <div className="stat-label">Half Day</div>
            <div className="stat-value">{halfDay}</div>
          </div>
        </div>
      </div>
      <div className="attendance-records">
        <div className="records-header">
          <h2 className="records-title"> Attendance Records</h2>
        </div>
        {/* Employee ID Filter */}
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Filter by Employee ID..."
            value={employeeIdFilter}
            onChange={e => setEmployeeIdFilter(e.target.value)}
            style={{ padding: '0.5rem', width: '250px', fontSize: '1rem' }}
          />
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
                  <th>Name</th>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                  <th>Working Hours</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record, idx) => (
                  <tr key={record._id || idx}>
                    <td>{record.employeeId}</td>
                    <td>{record.name || '-'}</td>
                    <td>{record.date ? record.date.slice(0, 10) : ''}</td>
                    <td>{record.checkIn || '-'}</td>
                    <td>{record.checkOut || '-'}</td>
                    <td>
                      <span className={`status-chip status-${(record.status || '').toLowerCase()}`}>
                        {record.status}
                      </span>
                    </td>
                    <td>{typeof record.workingHours === 'number' ? record.workingHours : '-'}</td>
                  </tr>
                ))}
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
              <button className="button button-secondary" onClick={() => setShowCalendar(false)}>
                Close
              </button>
            </div>
            {/* Month Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <button className="button button-secondary" onClick={() => setSelectedMonth(prev => {
                const [y, m] = prev.split('-').map(Number);
                const d = new Date(y, m - 2, 1);
                return d.toISOString().slice(0, 7);
              })}>{'<'}</button>
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                style={{ fontSize: 16, padding: 4 }}
              />
              <button className="button button-secondary" onClick={() => setSelectedMonth(prev => {
                const [y, m] = prev.split('-').map(Number);
                const d = new Date(y, m, 1);
                return d.toISOString().slice(0, 7);
              })}>{'>'}</button>
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
                const todayStr = new Date().toISOString().slice(0, 10);
                return [
                  ...blanks.map((_, i) => <div key={'b'+i} className="calendar-day disabled"></div>),
                  ...days.map(day => {
                    const dayStr = day.toISOString().slice(0, 10);
                    const isToday = dayStr === todayStr;
                    const isSelected = dayStr === selectedDate;
                    const isSunday = day.getDay() === 0;
                    return (
                      <div
                        key={dayStr}
                        className={`calendar-day${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}${isSunday ? ' sunday' : ''}`}
                        onClick={() => setSelectedDate(dayStr)}
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
              <b>Selected Date:</b> {selectedDate}
            </div>
          </div>
        </div>
      )}
      {/* Monthly View Report Modal */}
      {/* Removed Monthly View Report modal rendering */}
    </div>
  );
}

export default AttendanceTracking; 
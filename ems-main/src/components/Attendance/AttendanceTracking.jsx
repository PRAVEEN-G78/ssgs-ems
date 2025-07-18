import React, { useState, useEffect } from 'react';
import './Attendance.css';

function AttendanceTracking() {
  // Get userType from localStorage for conditional rendering (move to top)
  const userType = (() => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user?.userType;
    } catch {
      return undefined;
    }
  })();
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

  // Add filter type state for center users
  const [filterType, setFilterType] = useState('date'); // 'date' or 'month'

  // State for showing the monthly report modal
  const [showMonthlyReportModal, setShowMonthlyReportModal] = useState(false);

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

  // Filtered records for center users (move this above statsSource)
  let filteredAttendanceRecords = attendanceRecords.length ? attendanceRecords : demoRecords;
  if (userType === 'centre') {
    if (filterType === 'date') {
      filteredAttendanceRecords = filteredAttendanceRecords.filter(r => r.date && r.date.slice(0, 10) === selectedDate);
    } else if (filterType === 'month') {
      filteredAttendanceRecords = filteredAttendanceRecords.filter(r => r.date && r.date.startsWith(selectedMonth));
    }
  }

  // Calculate stats based on filteredAttendanceRecords for center users, otherwise use default logic
  const statsSource = userType === 'centre' ? filteredAttendanceRecords : filteredMonthRecords;
  const stats = {
    present: statsSource.filter(r => r.status === 'Present').length,
    late: statsSource.filter(r => r.status === 'Late').length,
    absent: statsSource.filter(r => r.status === 'Absent').length,
    leave: statsSource.filter(r => r.status === 'On Leave' || r.status === 'Leave').length,
    halfDay: statsSource.filter(r => r.status === 'Half Day').length,
    totalWorkingHours: statsSource.reduce((sum, r) => sum + (r.workingHours || 0), 0),
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
  // Remove unused present, late, absent, leave, halfDay (now handled by stats)


  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <h1 className="attendance-title">Attendance Tracking</h1>
        {/* Removed time and date display */}
        <button className="button button-outlined" style={{ marginTop: 8 }} onClick={() => setShowCalendar(true)}>
          <span role="img" aria-label="calendar">📅</span> Calendar View
        </button>
        {/* Monthly Attendance Report Button for center users */}
        {userType === 'centre' && (
          <button
            className="button button-secondary"
            style={{ marginTop: 8, marginLeft: 12, fontWeight: 600, background: '#1976D2', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 18px' }}
            onClick={() => setShowMonthlyReportModal(true)}
          >
            Monthly Attendance Report
          </button>
        )}
      </div>
      <div className="stats-container">
        <div className="stats-grid">
          <div className="stat-card stat-inline">
            <div className="stat-label">Present</div>
            <div className="stat-value">{stats.present}</div>
          </div>
          <div className="stat-card stat-inline">
            <div className="stat-label">Late</div>
            <div className="stat-value">{stats.late}</div>
          </div>
          <div className="stat-card stat-inline">
            <div className="stat-label">Absent</div>
            <div className="stat-value">{stats.absent}</div>
          </div>
          <div className="stat-card stat-inline">
            <div className="stat-label">Leave</div>
            <div className="stat-value">{stats.leave}</div>
          </div>
          <div className="stat-card stat-inline half-day">
            <div className="stat-label">Half Day</div>
            <div className="stat-value">{stats.halfDay}</div>
          </div>
        </div>
      </div>
      <div className="attendance-records">
        <div className="records-header">
          <h2 className="records-title"> Attendance Records</h2>
        </div>
        {/* Combined Filters Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, width: '100%' }}>
          {/* Employee ID Filter (left) */}
          <div>
            <input
              type="text"
              placeholder="Filter by Employee ID..."
              value={employeeIdFilter}
              onChange={e => setEmployeeIdFilter(e.target.value)}
              style={{ padding: '0.5rem', width: '250px', fontSize: '1rem' }}
            />
          </div>
          {/* Date/Month Filters for center users (right) */}
          {userType === 'centre' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <label htmlFor="filter-type" style={{ fontWeight: 600 }}>Filter By:</label>
              <select
                id="filter-type"
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                style={{ padding: 8, borderRadius: 4, border: '1px solid #1976D2' }}
              >
                <option value="date">Date</option>
                <option value="month">Month</option>
              </select>
              {filterType === 'date' && (
                <>
                  <label htmlFor="date-filter" style={{ fontWeight: 600 }}>Select Date:</label>
                  <input
                    id="date-filter"
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    style={{ padding: 8, borderRadius: 4, border: '1px solid #1976D2' }}
                    max={today}
                  />
                </>
              )}
              {filterType === 'month' && (
                <>
                  <label htmlFor="month-filter" style={{ fontWeight: 600 }}>Select Month:</label>
                  <select
                    id="month-filter"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    style={{ padding: 8, borderRadius: 4, border: '1px solid #1976D2' }}
                  >
                    {availableMonths.map(month => (
                      <option key={month} value={month}>{new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}</option>
                    ))}
                  </select>
                </>
              )}
            </div>
          )}
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
                {filteredAttendanceRecords.filter(r =>
                  employeeIdFilter.trim() === '' ||
                  (r.employeeId && r.employeeId.toLowerCase().includes(employeeIdFilter.trim().toLowerCase()))
                ).map((record, idx) => (
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
      {userType === 'centre' && showMonthlyReportModal && (
        <div className="modal-overlay modal-fade-in" onClick={() => setShowMonthlyReportModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '95vw', width: '800px' }}>
            <button className="modal-close" onClick={() => setShowMonthlyReportModal(false)}>&times;</button>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ marginBottom: 0, color: '#1976d2', flex: 1 }}>Monthly Attendance Report</h2>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
                <button
                  style={{ background: '#388e3c', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
                  onClick={() => {
                    const summary = document.getElementById('monthly-attendance-summary-table');
                    const table = document.getElementById('monthly-attendance-report-table');
                    if (table && summary) {
                      const printWindow = window.open('', '', 'width=900,height=700');
                      printWindow.document.write('<html><head><title>Monthly Attendance Report</title>');
                      printWindow.document.write('<style>body{font-family:sans-serif;} table{border-collapse:collapse;width:100%;margin-bottom:24px;} th,td{border:1px solid #ccc;padding:8px;} th{background:#f5f5f5;}</style>');
                      printWindow.document.write('</head><body >');
                      printWindow.document.write('<h2 style="color:#1976d2;">Monthly Attendance Report</h2>');
                      printWindow.document.write(summary.outerHTML);
                      printWindow.document.write(table.outerHTML);
                      printWindow.document.write('</body></html>');
                      printWindow.document.close();
                      printWindow.focus();
                      printWindow.print();
                    }
                  }}
                >
                  Print
                </button>
              </div>
            </div>
            {/* Summary Table for Monthly Stats */}
            <div style={{ marginBottom: 24 }}>
              <table id="monthly-attendance-summary-table" className="table" style={{ minWidth: 400, background: '#fff', borderRadius: 6, margin: '0 auto' }}>
                <thead>
                  <tr>
                    <th>Present</th>
                    <th>Late</th>
                    <th>Absent</th>
                    <th>Leave</th>
                    <th>Half Day</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{filteredAttendanceRecords.filter(r => r.date && r.date.startsWith(selectedMonth) && r.status === 'Present').length}</td>
                    <td>{filteredAttendanceRecords.filter(r => r.date && r.date.startsWith(selectedMonth) && r.status === 'Late').length}</td>
                    <td>{filteredAttendanceRecords.filter(r => r.date && r.date.startsWith(selectedMonth) && r.status === 'Absent').length}</td>
                    <td>{filteredAttendanceRecords.filter(r => r.date && r.date.startsWith(selectedMonth) && (r.status === 'On Leave' || r.status === 'Leave')).length}</td>
                    <td>{filteredAttendanceRecords.filter(r => r.date && r.date.startsWith(selectedMonth) && r.status === 'Half Day').length}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="table-container" style={{ overflowX: 'auto', overflowY: 'auto', maxWidth: '100%', maxHeight: '60vh' }}>
              <table className="table" id="monthly-attendance-report-table" style={{ minWidth: '600px' }}>
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
                  {filteredAttendanceRecords
                    .filter(r => r.date && r.date.startsWith(selectedMonth))
                    .map((record, idx) => (
                      <tr key={record._id || idx}>
                        <td>{record.employeeId}</td>
                        <td>{record.name || '-'}</td>
                        <td>{record.date ? record.date.slice(0, 10) : ''}</td>
                        <td>{record.checkIn || '-'}</td>
                        <td>{record.checkOut || '-'}</td>
                        <td>{record.status}</td>
                        <td>{typeof record.workingHours === 'number' ? record.workingHours : '-'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AttendanceTracking; 
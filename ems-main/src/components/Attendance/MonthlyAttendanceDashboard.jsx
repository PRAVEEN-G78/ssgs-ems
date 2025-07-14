import React, { useState, useEffect } from 'react';
// TODO: Replace with real data fetching from backend
// Remove sampleEmployees and sampleAttendance (demo data)
// Dynamically generate last 12 months including current and next year
function generateMonths() {
  const months = [];
  const currentDate = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const value = date.toISOString().slice(0, 7);
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    months.push({ value, label });
  }
  return months;
}
const months = generateMonths();

function getDaysInMonth(month) {
  const [year, m] = month.split('-');
  return new Date(year, m, 0).getDate();
}

function getAttendanceStats(attendance, employees, month) {
  const days = getDaysInMonth(month);
  let present = 0, absent = 0, late = 0, leave = 0, halfday = 0, total = 0;
  for (let d = 1; d <= days; d++) {
    const day = `${month}-${d.toString().padStart(2, '0')}`;
    if (attendance[day]) {
      employees.forEach(emp => {
        const status = attendance[day][emp.id];
        if (status === 'Present') present++;
        else if (status === 'Absent') absent++;
        else if (status === 'Late') late++;
        else if (status === 'Leave') leave++;
        else if (status === 'Half Day') halfday++;
        total++;
      });
    }
  }
  return { present, absent, late, leave, halfday, total };
}

// Helper to check if a date is Sunday
function isSunday(dateStr) {
  const d = new Date(dateStr);
  return d.getDay() === 0;
}

const MonthlyAttendanceDashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState(months[0].value);
  const [showCalendar, setShowCalendar] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get current user info
  const user = JSON.parse(localStorage.getItem('user'));
  const isEmployeeUser = user?.userType === 'employee';
  const isCenterUser = user?.userType === 'centre';
  const isAdminUser = user?.userType === 'admin';

  // Get logged-in employee from localStorage
  const employeeId = user?.employeeId || user?.id;
  const employeeName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';

  // Fetch employees and leaves from backend
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        if (isEmployeeUser && employeeId) {
          // Fetch only this employee's leaves
          const leavesRes = await fetch(`/api/leave/${employeeId}`, { headers });
          if (!leavesRes.ok) throw new Error('Failed to fetch leaves');
          const leavesData = await leavesRes.json();
          setLeaves(leavesData);
          console.log('Fetched leaves for employee', employeeId, leavesData);
          // Fetch attendance records for this employee and month
          const attRes = await fetch(`/api/attendance?employeeId=${employeeId}&month=${selectedMonth}`, { headers });
          if (!attRes.ok) throw new Error('Failed to fetch attendance');
          const attData = await attRes.json();
          setAttendanceRecords(attData);
          console.log('Fetched attendance for employee', employeeId, 'month', selectedMonth, attData);
          // Set employees to just this user
          setEmployees([{ employeeId, firstName: user.firstName, lastName: user.lastName, centreCode: user.centreCode || user.centerCode }]);
          console.log('Set employees (employee user):', [{ employeeId, firstName: user.firstName, lastName: user.lastName, centreCode: user.centreCode || user.centerCode }]);
        } else {
          // Fetch all employees
          const empRes = await fetch('/api/employees', { headers });
          if (!empRes.ok) throw new Error('Failed to fetch employees');
          const empData = await empRes.json();
          setEmployees(empData);
          console.log('Fetched all employees:', empData);
          // Fetch all leaves
          const leavesRes = await fetch('/api/leave', { headers });
          if (!leavesRes.ok) throw new Error('Failed to fetch leaves');
          const leavesData = await leavesRes.json();
          setLeaves(leavesData);
          console.log('Fetched all leaves:', leavesData);
          // Fetch all attendance records for the selected month
          const attRes = await fetch(`/api/attendance?month=${selectedMonth}`, { headers });
          if (!attRes.ok) throw new Error('Failed to fetch attendance');
          const attData = await attRes.json();
          setAttendanceRecords(attData);
          console.log('Fetched all attendance for month', selectedMonth, attData);
        }
      } catch (err) {
        setError(err.message || 'Error fetching data');
        console.error('Error in fetchData:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isEmployeeUser, employeeId, selectedMonth]);

  // Filter to only the logged-in employee for employee users, or show all for center/admin
  const filteredEmployees = isEmployeeUser 
    ? (employeeId ? employees.filter(e => e.employeeId === employeeId) : [])
    : employees;

  // Prepare table data
  const daysInMonth = getDaysInMonth(selectedMonth);
  const dayList = Array.from({ length: daysInMonth }, (_, i) => `${selectedMonth}-${(i+1).toString().padStart(2, '0')}`);

  // Helper: Get merged status for an employee on a given day
  function getDayStatus(employeeId, date) {
    const leave = leaves.find(l => l.employeeId === employeeId && l.status === 'Approved' && l.startDate <= date && l.endDate >= date);
    if (leave) {
      if (leave.type === 'Half Day') return 'Half Day';
      return 'Leave';
    }
    // Attendance record for this day
    const att = attendanceRecords.find(r => r.employeeId === employeeId && r.date && r.date.startsWith(date));
    return att ? att.status : '';
  }

  // Calculate stats
  function getAttendanceStats(employees, month) {
    const days = getDaysInMonth(month);
    let present = 0, absent = 0, late = 0, leave = 0, halfday = 0, total = 0;
    for (let d = 1; d <= days; d++) {
      const day = `${month}-${d.toString().padStart(2, '0')}`;
      employees.forEach(emp => {
        const status = getDayStatus(emp.employeeId, day);
        if (status === 'Present') present++;
        else if (status === 'Absent') absent++;
        else if (status === 'Late') late++;
        else if (status === 'Leave') leave++;
        else if (status === 'Half Day') halfday++;
        total++;
      });
    }
    return { present, absent, late, leave, halfday, total };
  }
  const stats = getAttendanceStats(filteredEmployees, selectedMonth);

  // Export to CSV
  const exportCSV = () => {
    let csv = '';
    if (!isEmployeeUser) {
      csv += 'S.NO,Employee ID,Employee Name,';
    }
    csv += dayList.join(',');
    if (!isEmployeeUser) {
      csv += ',Present,Absent,Late,Leave,Half Day';
    }
    csv += '\n';
    filteredEmployees.forEach((emp, idx) => {
      if (!isEmployeeUser) {
        csv += `${idx + 1},${emp.id},${emp.name},`;
      }
      csv += dayList.map(day => getDayStatus(emp.employeeId, day) || '').join(',');
      if (!isEmployeeUser) {
        // Calculate summary for CSV export
        let present = 0, absent = 0, late = 0, leave = 0, halfday = 0;
        dayList.forEach(day => {
          const status = getDayStatus(emp.employeeId, day);
          if (status === 'Present') present++;
          else if (status === 'Absent') absent++;
          else if (status === 'Late') late++;
          else if (status === 'Leave') leave++;
          else if (status === 'Half Day') halfday++;
        });
        csv += `,${present},${absent},${late},${leave},${halfday}`;
      }
      csv += '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monthly_attendance_${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print
  const printTable = () => {
    window.print();
  };

  // Calendar rendering helpers
  function renderCalendar(month) {
    const daysInMonth = getDaysInMonth(month);
    const firstDay = new Date(month + '-01').getDay(); // 0=Sun
    const weeks = [];
    let day = 1 - firstDay;
    for (let w = 0; w < 6; w++) {
      const week = [];
      for (let d = 0; d < 7; d++, day++) {
        if (day < 1 || day > daysInMonth) {
          week.push(null);
        } else {
          week.push(day);
        }
      }
      weeks.push(week);
      if (day > daysInMonth) break;
    }
    return weeks;
  }

  const calendarWeeks = renderCalendar(selectedMonth);
  // Remove reference to sampleEmployees in calendar demo

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ color: '#1976D2', marginBottom: 24 }}>Monthly Attendance Dashboard</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
        <label htmlFor="month-select" style={{ fontWeight: 600 }}>Select Month:</label>
        <select id="month-select" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ padding: 8, borderRadius: 4, border: '1px solid #1976D2' }}>
          {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <button onClick={() => setShowCalendar(true)} style={{ background: '#fff', color: '#1976D2', border: '1px solid #1976D2', borderRadius: 4, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>Calendar View</button>
        <button onClick={exportCSV} style={{ marginLeft: 'auto', background: '#1976D2', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>Export CSV</button>
        <button onClick={printTable} style={{ background: '#fff', color: '#1976D2', border: '1px solid #1976D2', borderRadius: 4, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>Print</button>
      </div>
      {/* Calendar Modal */}
      {showCalendar && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 8, maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, color: '#1976D2' }}>Calendar View - {selectedMonth}</h2>
              <button onClick={() => setShowCalendar(false)} style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: '#e3f2fd', padding: 8, borderRadius: 4 }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} style={{ padding: 8, textAlign: 'center', fontWeight: 600, background: '#fff' }}>{day}</div>
              ))}
              {calendarWeeks.flat().map((day, idx) => (
                <div key={idx} style={{ 
                  padding: 8, 
                  textAlign: 'center', 
                  background: '#fff', 
                  minHeight: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: day ? '#333' : '#ccc'
                }}>
                  {day || ''}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Statistics Cards */}
      <div style={{ display: 'flex', gap: 32, marginBottom: 32 }}>
        <div style={{ background: '#e3f2fd', borderRadius: 8, padding: 24, minWidth: 140, textAlign: 'center', boxShadow: '0 2px 8px rgba(33,150,243,0.08)' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#1976D2' }}>{stats.present}</div>
          <div style={{ fontWeight: 600, color: '#1976D2' }}>Present</div>
        </div>
        <div style={{ background: '#ffebee', borderRadius: 8, padding: 24, minWidth: 140, textAlign: 'center', boxShadow: '0 2px 8px rgba(244,67,54,0.08)' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#d32f2f' }}>{stats.absent}</div>
          <div style={{ fontWeight: 600, color: '#d32f2f' }}>Absent</div>
        </div>
        <div style={{ background: '#fffde7', borderRadius: 8, padding: 24, minWidth: 140, textAlign: 'center', boxShadow: '0 2px 8px rgba(255,235,59,0.08)' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#fbc02d' }}>{stats.late}</div>
          <div style={{ fontWeight: 600, color: '#fbc02d' }}>Late</div>
        </div>
        <div style={{ background: '#e8f5e9', borderRadius: 8, padding: 24, minWidth: 140, textAlign: 'center', boxShadow: '0 2px 8px rgba(56,142,60,0.08)' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#388e3c' }}>{stats.leave}</div>
          <div style={{ fontWeight: 600, color: '#388e3c' }}>Leave</div>
        </div>
        <div style={{ background: '#f3e5f5', borderRadius: 8, padding: 24, minWidth: 140, textAlign: 'center', boxShadow: '0 2px 8px rgba(123,31,162,0.08)' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#7b1fa2' }}>{stats.halfday}</div>
          <div style={{ fontWeight: 600, color: '#7b1fa2' }}>Half Day</div>
        </div>
      </div>
      <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(33,150,243,0.04)', padding: 16 }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 800 }}>
          <thead>
            <tr style={{ background: '#e3f2fd' }}>
              <th style={{ padding: 8, border: '1px solid #90caf9', fontWeight: 700 }} rowSpan={2}>Employee ID</th>
              <th style={{ padding: 8, border: '1px solid #90caf9', fontWeight: 700 }} rowSpan={2}>Employee Name</th>
              <th style={{ padding: 8, border: '1px solid #90caf9', fontWeight: 700 }} rowSpan={2}>Centre Code</th>
              {dayList.map(day => (
                <th key={day} style={{ padding: 8, border: '1px solid #90caf9', fontWeight: 700, background: isSunday(day) ? '#ffebee' : undefined, color: isSunday(day) ? '#d32f2f' : undefined }}>
                  {parseInt(day.split('-')[2], 10)}
                </th>
              ))}
              <th style={{ padding: 8, border: '1px solid #90caf9', fontWeight: 700, background: '#e3f2fd' }} colSpan={5} rowSpan={1}>Attendance Summary</th>
            </tr>
            <tr style={{ background: '#f5f5f5' }}>
              {dayList.map(day => {
                const dateObj = new Date(day);
                const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                return (
                  <th key={day + '-weekday'} style={{ padding: 4, border: '1px solid #90caf9', fontWeight: 400, fontSize: '0.95em', background: isSunday(day) ? '#ffebee' : undefined, color: isSunday(day) ? '#d32f2f' : undefined }}>
                    {weekday}
                  </th>
                );
              })}
              <th style={{ padding: 8, border: '1px solid #90caf9', fontWeight: 700, background: '#e3f2fd' }}>Present</th>
              <th style={{ padding: 8, border: '1px solid #90caf9', fontWeight: 700, background: '#e3f2fd' }}>Absent</th>
              <th style={{ padding: 8, border: '1px solid #90caf9', fontWeight: 700, background: '#e3f2fd' }}>Late</th>
              <th style={{ padding: 8, border: '1px solid #90caf9', fontWeight: 700, background: '#e3f2fd' }}>Leave</th>
              <th style={{ padding: 8, border: '1px solid #90caf9', fontWeight: 700, background: '#e3f2fd' }}>Half Day</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((emp) => {
              let present = 0, absent = 0, late = 0, leave = 0, halfday = 0;
              const empKey = emp.employeeId || emp.id || `${emp.firstName}-${emp.lastName}`;
              return (
                <tr key={empKey}>
                  <td style={{ padding: 8, border: '1px solid #e3f2fd' }}>{emp.employeeId || emp.id}</td>
                  <td style={{ padding: 8, border: '1px solid #e3f2fd' }}>{emp.firstName ? `${emp.firstName} ${emp.lastName || ''}` : emp.name}</td>
                  <td style={{ padding: 8, border: '1px solid #e3f2fd' }}>{emp.centreCode || emp.centerCode || '-'}</td>
                  {dayList.map(day => {
                    const status = getDayStatus(emp.employeeId || emp.id, day);
                    if (status === 'Present') present++;
                    else if (status === 'Absent') absent++;
                    else if (status === 'Late') late++;
                    else if (status === 'Leave') leave++;
                    else if (status === 'Half Day') halfday++;
                    return (
                      <td key={day} style={{ padding: 8, border: '1px solid #e3f2fd', textAlign: 'center', background: isSunday(day) ? '#ffebee' : undefined, color: isSunday(day) ? '#d32f2f' : undefined }}>
                        {status || ''}
                      </td>
                    );
                  })}
                  <td style={{ padding: 8, border: '1px solid #e3f2fd', textAlign: 'center', fontWeight: 600, color: '#1976D2' }}>{present}</td>
                  <td style={{ padding: 8, border: '1px solid #e3f2fd', textAlign: 'center', fontWeight: 600, color: '#d32f2f' }}>{absent}</td>
                  <td style={{ padding: 8, border: '1px solid #e3f2fd', textAlign: 'center', fontWeight: 600, color: '#fbc02d' }}>{late}</td>
                  <td style={{ padding: 8, border: '1px solid #e3f2fd', textAlign: 'center', fontWeight: 600, color: '#388e3c' }}>{leave}</td>
                  <td style={{ padding: 8, border: '1px solid #e3f2fd', textAlign: 'center', fontWeight: 600, color: '#7b1fa2' }}>{halfday}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* TODO: Integrate with backend API for real data */}
    </div>
  );
};

export default MonthlyAttendanceDashboard; 
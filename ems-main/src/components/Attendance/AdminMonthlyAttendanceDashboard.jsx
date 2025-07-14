import React, { useState, useEffect } from 'react';
import './Attendance.css';

const AdminMonthlyAttendanceDashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showCalendar, setShowCalendar] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCenterCode, setSelectedCenterCode] = useState('');
  const [centers, setCenters] = useState([]);

  // Generate available months (last 12 months)
  const generateMonths = () => {
    const months = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      months.push({ value, label });
    }
    return months;
  };

  const months = generateMonths();

  // Fetch attendance records and employees
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // Fetch attendance records
        const attendanceRes = await fetch('http://localhost:5000/api/attendance', {
          headers
        });
        if (!attendanceRes.ok) throw new Error('Failed to fetch attendance records');
        const attendanceData = await attendanceRes.json();

        // Fetch employees
        const employeesRes = await fetch('http://localhost:5000/api/employees', {
          headers
        });
        if (!employeesRes.ok) throw new Error('Failed to fetch employees');
        const employeesData = await employeesRes.json();

        // Fetch centers
        const centersRes = await fetch('http://localhost:5000/api/centers', {
          headers
        });
        if (!centersRes.ok) throw new Error('Failed to fetch centers');
        const centersData = await centersRes.json();

        setAttendanceRecords(attendanceData);
        setEmployees(employeesData);
        setCenters(centersData);
      } catch (err) {
        setError(err.message || 'Error fetching data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  function getDaysInMonth(month) {
    const [year, m] = month.split('-');
    return new Date(year, m, 0).getDate();
  }

  function getAttendanceStats(attendance, employees, month) {
    const days = getDaysInMonth(month);
    let present = 0, absent = 0, late = 0, leave = 0, halfday = 0, total = 0;
    
    for (let d = 1; d <= days; d++) {
      const day = `${month}-${d.toString().padStart(2, '0')}`;
      const dayRecords = attendance.filter(record => 
        record.date && record.date.startsWith(day)
      );
      
      employees.forEach(emp => {
        const record = dayRecords.find(r => r.employeeId === emp.employeeId);
        if (record) {
          const status = record.status;
          if (status === 'Present') present++;
          else if (status === 'Absent') absent++;
          else if (status === 'Late') late++;
          else if (status === 'On Leave') leave++;
          else if (status === 'Half Day') halfday++;
          total++;
        }
      });
    }
    return { present, absent, late, leave, halfday, total };
  }

  // Helper to check if a date is Sunday
  function isSunday(dateStr) {
    const d = new Date(dateStr);
    return d.getDay() === 0;
  }

  // Get attendance status for a specific employee and date
  function getAttendanceStatus(employeeId, date) {
    const record = attendanceRecords.find(r => 
      r.employeeId === employeeId && 
      r.date && 
      r.date.startsWith(date)
    );
    return record ? record.status : '';
  }

  // Filter employees by center code
  const filteredEmployees = selectedCenterCode 
    ? employees.filter(emp => 
        (emp.centreCode || emp.centerCode || '').toLowerCase() === selectedCenterCode.toLowerCase()
      )
    : employees;

  // Calculate stats
  const stats = getAttendanceStats(attendanceRecords, filteredEmployees, selectedMonth);

  // Prepare table data
  const daysInMonth = getDaysInMonth(selectedMonth);
  const dayList = Array.from({ length: daysInMonth }, (_, i) => `${selectedMonth}-${(i+1).toString().padStart(2, '0')}`);

  // Export to CSV
  const exportCSV = () => {
    let csv = 'Employee ID,Employee Name,Centre Code,' + dayList.join(',') + '\n';
    filteredEmployees.forEach(emp => {
      csv += `${emp.employeeId || ''},${emp.firstName} ${emp.lastName || ''},${emp.centreCode || emp.centerCode || ''},`;
      csv += dayList.map(day => getAttendanceStatus(emp.employeeId, day)).join(',');
      csv += '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin_monthly_attendance_${selectedMonth}.csv`;
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

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div className="loading"><div className="loading-spinner"></div></div>
        <p>Loading attendance data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ color: '#d32f2f', marginBottom: 16 }}>Error: {error}</div>
        <button 
          onClick={() => window.location.reload()} 
          style={{ 
            background: '#1976D2', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 4, 
            padding: '8px 16px', 
            cursor: 'pointer' 
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ color: '#1976D2', marginBottom: 24 }}>Monthly Attendance Dashboard</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
        <label htmlFor="month-select" style={{ fontWeight: 600 }}>Select Month:</label>
        <select 
          id="month-select" 
          value={selectedMonth} 
          onChange={e => setSelectedMonth(e.target.value)} 
          style={{ padding: 8, borderRadius: 4, border: '1px solid #1976D2' }}
        >
          {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        
        <label htmlFor="center-select" style={{ fontWeight: 600 }}>Center Code:</label>
        <select 
          id="center-select" 
          value={selectedCenterCode} 
          onChange={e => setSelectedCenterCode(e.target.value)} 
          style={{ padding: 8, borderRadius: 4, border: '1px solid #1976D2' }}
        >
          <option value="">Select Center</option>
          {centers.map(center => (
            <option key={center._id} value={center.centreCode || center.centerCode}>
              {center.centreCode || center.centerCode} - {center.centreName || center.centerName}
            </option>
          ))}
        </select>
        <button 
          onClick={() => setShowCalendar(true)} 
          style={{ 
            background: '#fff', 
            color: '#1976D2', 
            border: '1px solid #1976D2', 
            borderRadius: 4, 
            padding: '8px 16px', 
            fontWeight: 600, 
            cursor: 'pointer' 
          }}
        >
          Calendar View
        </button>
        <button 
          onClick={exportCSV} 
          style={{ 
            marginLeft: 'auto', 
            background: '#1976D2', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 4, 
            padding: '8px 16px', 
            fontWeight: 600, 
            cursor: 'pointer' 
          }}
        >
          Export CSV
        </button>
        <button 
          onClick={printTable} 
          style={{ 
            background: '#fff', 
            color: '#1976D2', 
            border: '1px solid #1976D2', 
            borderRadius: 4, 
            padding: '8px 16px', 
            fontWeight: 600, 
            cursor: 'pointer' 
          }}
        >
          Print
        </button>
      </div>

      {/* Calendar Modal */}
      {showCalendar && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          background: 'rgba(0,0,0,0.25)', 
          zIndex: 1000, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <div style={{ 
            background: '#fff', 
            borderRadius: 12, 
            padding: 32, 
            minWidth: 400, 
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)', 
            position: 'relative' 
          }}>
            <button 
              onClick={() => setShowCalendar(false)} 
              style={{ 
                position: 'absolute', 
                top: 16, 
                right: 16, 
                background: 'none', 
                border: 'none', 
                fontSize: 24, 
                color: '#1976D2', 
                cursor: 'pointer' 
              }}
            >
              &times;
            </button>
            <h2 style={{ color: '#1976D2', marginBottom: 16 }}>
              Calendar View ({months.find(m => m.value === selectedMonth)?.label})
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 40px)', gap: 4, marginBottom: 8 }}>
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day => (
                <div key={day} style={{ 
                  fontWeight: 700, 
                  color: day==='Sun'?'#d32f2f':'#1976D2', 
                  textAlign: 'center' 
                }}>
                  {day}
                </div>
              ))}
              {calendarWeeks.map((week, wi) => week.map((d, di) => (
                <div key={wi+'-'+di} style={{
                  height: 40, 
                  width: 40, 
                  borderRadius: 6, 
                  textAlign: 'center', 
                  lineHeight: '40px',
                  background: di===0 ? '#ffebee' : '#e3f2fd', 
                  color: di===0 ? '#d32f2f' : '#1976D2', 
                  fontWeight: 600, 
                  margin: 0, 
                  position: 'relative', 
                  opacity: d ? 1 : 0.3
                }}>
                  {d && d}
                </div>
              )))}
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div style={{ display: 'flex', gap: 32, marginBottom: 32, flexWrap: 'wrap' }}>
        <div style={{ 
          background: '#e3f2fd', 
          borderRadius: 8, 
          padding: 24, 
          minWidth: 140, 
          textAlign: 'center', 
          boxShadow: '0 2px 8px rgba(33,150,243,0.08)' 
        }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#1976D2' }}>{stats.present}</div>
          <div style={{ fontWeight: 600, color: '#1976D2' }}>Present</div>
        </div>
        <div style={{ 
          background: '#ffebee', 
          borderRadius: 8, 
          padding: 24, 
          minWidth: 140, 
          textAlign: 'center', 
          boxShadow: '0 2px 8px rgba(244,67,54,0.08)' 
        }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#d32f2f' }}>{stats.absent}</div>
          <div style={{ fontWeight: 600, color: '#d32f2f' }}>Absent</div>
        </div>
        <div style={{ 
          background: '#fffde7', 
          borderRadius: 8, 
          padding: 24, 
          minWidth: 140, 
          textAlign: 'center', 
          boxShadow: '0 2px 8px rgba(255,235,59,0.08)' 
        }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#fbc02d' }}>{stats.late}</div>
          <div style={{ fontWeight: 600, color: '#fbc02d' }}>Late</div>
        </div>
        <div style={{ 
          background: '#e8f5e9', 
          borderRadius: 8, 
          padding: 24, 
          minWidth: 140, 
          textAlign: 'center', 
          boxShadow: '0 2px 8px rgba(56,142,60,0.08)' 
        }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#388e3c' }}>{stats.leave}</div>
          <div style={{ fontWeight: 600, color: '#388e3c' }}>Leave</div>
        </div>
        <div style={{ 
          background: '#f3e5f5', 
          borderRadius: 8, 
          padding: 24, 
          minWidth: 140, 
          textAlign: 'center', 
          boxShadow: '0 2px 8px rgba(123,31,162,0.08)' 
        }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#7b1fa2' }}>{stats.halfday}</div>
          <div style={{ fontWeight: 600, color: '#7b1fa2' }}>Half Day</div>
        </div>
      </div>

      {/* Attendance Table */}
      <div style={{ 
        overflowX: 'auto', 
        background: '#fff', 
        borderRadius: 8, 
        boxShadow: '0 2px 8px rgba(33,150,243,0.04)', 
        padding: 16 
      }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 800 }}>
          <thead>
            <tr style={{ background: '#e3f2fd' }}>
              <th style={{ padding: 8, border: '1px solid #90caf9', fontWeight: 700 }} rowSpan={2}>Employee ID</th>
              <th style={{ padding: 8, border: '1px solid #90caf9', fontWeight: 700 }} rowSpan={2}>Employee Name</th>
              <th style={{ padding: 8, border: '1px solid #90caf9', fontWeight: 700 }} rowSpan={2}>Centre Code</th>
              {dayList.map(day => (
                <th key={day} style={{ 
                  padding: 8, 
                  border: '1px solid #90caf9', 
                  fontWeight: 700, 
                  background: isSunday(day) ? '#ffebee' : undefined, 
                  color: isSunday(day) ? '#d32f2f' : undefined 
                }}>
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
            {filteredEmployees.map(emp => {
              // Calculate per-employee totals
              let present = 0, absent = 0, late = 0, leave = 0, halfday = 0;
              dayList.forEach(day => {
                const status = getAttendanceStatus(emp.employeeId, day);
                if (status === 'Present') present++;
                else if (status === 'Absent') absent++;
                else if (status === 'Late') late++;
                else if (status === 'On Leave' || status === 'Leave') leave++;
                else if (status === 'Half Day') halfday++;
              });
              return (
                <tr key={emp._id}>
                  <td style={{ padding: 8, border: '1px solid #e3f2fd' }}>{emp.employeeId || '-'}</td>
                  <td style={{ padding: 8, border: '1px solid #e3f2fd' }}>{emp.firstName} {emp.lastName || ''}</td>
                  <td style={{ padding: 8, border: '1px solid #e3f2fd' }}>{emp.centreCode || emp.centerCode || '-'}</td>
                  {dayList.map(day => (
                    <td key={day} style={{ 
                      padding: 8, 
                      border: '1px solid #e3f2fd', 
                      textAlign: 'center', 
                      background: isSunday(day) ? '#ffebee' : undefined, 
                      color: isSunday(day) ? '#d32f2f' : undefined 
                    }}>
                      {getAttendanceStatus(emp.employeeId, day)}
                    </td>
                  ))}
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

      {filteredEmployees.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: 32, 
          color: '#666', 
          background: '#f5f5f5', 
          borderRadius: 8, 
          marginTop: 16 
        }}>
          {selectedCenterCode 
            ? `No employees found for center code: ${selectedCenterCode}. Please check the center code or add employees to this center.`
            : 'No employees found. Please add employees to view attendance data.'
          }
        </div>
      )}
    </div>
  );
};

export default AdminMonthlyAttendanceDashboard; 
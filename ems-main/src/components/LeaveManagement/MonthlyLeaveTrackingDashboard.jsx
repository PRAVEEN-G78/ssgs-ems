import React, { useState, useEffect } from 'react';
// import './LeaveTrackingStats.css';

const demoLeaveData = [
  { id: 1, employeeId: 'EMP001', name: 'John Doe', type: 'Annual Leave', startDate: '2024-06-10', endDate: '2024-06-12', status: 'Approved', reason: 'Vacation' },
  { id: 2, employeeId: 'EMP002', name: 'Jane Smith', type: 'Sick Leave', startDate: '2024-06-15', endDate: '2024-06-16', status: 'Pending', reason: 'Medical' },
  { id: 3, employeeId: 'EMP003', name: 'Alice Johnson', type: 'Emergency Leave', startDate: '2024-06-18', endDate: '2024-06-18', status: 'Approved', reason: 'Family emergency' },
  { id: 4, employeeId: 'EMP004', name: 'Bob Lee', type: 'Half Day', startDate: '2024-06-20', endDate: '2024-06-20', status: 'Rejected', reason: 'Personal work' },
  { id: 5, employeeId: 'EMP005', name: 'Sara Kim', type: 'Half Day', startDate: '2024-05-24', endDate: '2024-05-24', status: 'Pending', reason: 'Doctor appointment' },
];

const months = [
  { value: '2024-06', label: 'June 2024' },
  { value: '2024-05', label: 'May 2024' },
  { value: '2024-04', label: 'April 2024' },
];

const cardStyles = {
  base: {
    borderRadius: 12,
    padding: '1.5rem',
    boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
    border: '1px solid',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
    minWidth: 0,
    margin: 0,
    marginBottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    background: '#fff',
  },
  pending: {
    background: 'linear-gradient(135deg, #fff5e6 0%, #fff 100%)',
    borderColor: '#ffe0b2',
    boxShadow: '0 4px 12px rgba(255, 152, 0, 0.15)',
  },
  approved: {
    background: 'linear-gradient(135deg, #e8f5e8 0%, #fff 100%)',
    borderColor: '#c8e6c9',
    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.15)',
  },
  rejected: {
    background: 'linear-gradient(135deg, #ffebee 0%, #fff 100%)',
    borderColor: '#ffcdd2',
    boxShadow: '0 4px 12px rgba(244, 67, 54, 0.15)',
  },
  total: {
    background: 'linear-gradient(135deg, #e3f2fd 0%, #fff 100%)',
    borderColor: '#bbdefb',
    boxShadow: '0 4px 12px rgba(33, 150, 243, 0.15)',
  },
  halfDay: {
    background: 'linear-gradient(135deg, #f3e5f5 0%, #fff 100%)',
    borderColor: '#e1bee7',
    boxShadow: '0 4px 12px rgba(156, 39, 176, 0.15)',
  },
};

function MonthlyLeaveTrackingDashboard() {
  const user = JSON.parse(localStorage.getItem('user'));
  const isCenterUser = user?.userType === 'centre';
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [leaveData, setLeaveData] = useState([]); // for center users
  const [months, setMonths] = useState([]); // for center users
  const [loading, setLoading] = useState(false);

  // Fetch leave data and months for center users
  useEffect(() => {
    if (isCenterUser) {
      setLoading(true);
      fetch('/api/leave')
        .then(res => res.json())
        .then(data => {
          setLeaveData(data);
          // Extract unique months from leave data
          const monthSet = new Set();
          data.forEach(l => {
            if (l.startDate) monthSet.add(l.startDate.slice(0, 7));
            if (l.endDate) monthSet.add(l.endDate.slice(0, 7));
          });
          const monthArr = Array.from(monthSet).sort().reverse();
          setMonths(monthArr);
          setSelectedMonth(monthArr[0] || '');
        })
        .finally(() => setLoading(false));
    }
  }, [isCenterUser]);

  // For center users, filter leave data by selected month
  const filteredLeaves = isCenterUser
    ? leaveData.filter(l => (l.startDate && l.startDate.startsWith(selectedMonth)) || (l.endDate && l.endDate.startsWith(selectedMonth)))
    : demoLeaveData.filter(l => l.startDate.startsWith(selectedMonth) || l.endDate.startsWith(selectedMonth));

  // Calculate statistics for the selected month
  const pendingRequests = filteredLeaves.filter(req => req.status === 'Pending').length;
  const approvedRequests = filteredLeaves.filter(req => req.status === 'Approved').length;
  const rejectedRequests = filteredLeaves.filter(req => req.status === 'Rejected').length;
  const totalRequests = filteredLeaves.length;
  const halfDayLeaveRequests = filteredLeaves.filter(req => req.type === 'Half Day').length;

  // Get logged-in employee info
  const employeeId = user?.employeeId;

  // Calculate leave balance for the employee (demo logic, replace with real data if available)
  // For demo: 1 paid leave per month, count approved paid leaves (Annual, Casual, Sick, etc.)
  const paidLeaveTypes = ['Annual Leave', 'Casual Leave', 'Sick Leave'];
  const used = filteredLeaves.filter(req => req.status === 'Approved' && paidLeaveTypes.includes(req.type)).reduce((sum, req) => sum + (req.duration || 1), 0);
  const maxPaidLeaves = 1; // Demo: 1 per month
  const paidLeavesUsed = used > maxPaidLeaves ? maxPaidLeaves : used;
  const paidLeavesRemaining = Math.max(0, maxPaidLeaves - paidLeavesUsed);
  const lopHours = used > maxPaidLeaves ? (used - maxPaidLeaves) * 8 : 0; // 8 hours per day

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printContent = `
      <html>
        <head>
          <title>Monthly Leave Report - ${selectedMonth}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1976d2; text-align: center; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #e3f2fd; font-weight: bold; }
            .summary { margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
            .summary h3 { margin-top: 0; color: #1976d2; }
            .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 10px; }
            .stat-card { background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #1976d2; }
            .stat-label { font-size: 14px; color: #666; margin-bottom: 5px; }
            .stat-value { font-size: 24px; font-weight: bold; color: #1976d2; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Monthly Leave Report - ${selectedMonth}</h1>
          <div class="summary">
            <h3>Summary Statistics</h3>
            <div class="summary-grid">
              <div class="stat-card">
                <div class="stat-label">Pending Requests</div>
                <div class="stat-value">${pendingRequests}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Approved Requests</div>
                <div class="stat-value">${approvedRequests}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Rejected Requests</div>
                <div class="stat-value">${rejectedRequests}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Total Requests</div>
                <div class="stat-value">${totalRequests}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Half Day Leave</div>
                <div class="stat-value">${halfDayLeaveRequests}</div>
              </div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Employee Name</th>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              ${filteredLeaves.map(l => `
                <tr>
                  <td>${l.employeeId}</td>
                  <td>${l.name}</td>
                  <td>${l.type}</td>
                  <td>${l.startDate}</td>
                  <td>${l.endDate}</td>
                  <td>${l.status}</td>
                  <td>${l.reason}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div style={{ padding: 32, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ color: '#1976D2', marginBottom: 0 }}>Monthly Leave Tracking Dashboard</h1>
        <button
          style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 22px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
          onClick={() => setShowReport(true)}
        >
          Leave Reports
        </button>
      </div>
      {/* Leave Balance Card for Employees */}
      {user?.userType === "employee" && (
        <div className="paid-leave-balance-card" style={{ marginBottom: 32 }}>
          <div className="plb-title">Paid Leave Balance (This Month)</div>
          <div className="plb-stats-row">
            <div className="plb-stat">
              <span className="plb-icon" role="img" aria-label="used">✅</span>
              <span className="plb-label">Used</span>
              <span className="plb-pill">{paidLeavesUsed} / {maxPaidLeaves}</span>
            </div>
            <div className="plb-stat">
              <span className="plb-icon" role="img" aria-label="remaining">🟢</span>
              <span className="plb-label">Remaining</span>
              <span className="plb-pill" style={{ color: paidLeavesRemaining > 0 ? '#388e3c' : '#d32f2f', background: paidLeavesRemaining > 0 ? '#e8f5e9' : '#fffde7' }}>{paidLeavesRemaining}</span>
            </div>
            <div className="plb-stat">
              <span className="plb-icon" role="img" aria-label="lop">⏰</span>
              <span className="plb-label">LOP Hours</span>
              <span className="plb-pill" style={{ color: lopHours > 0 ? '#fbc02d' : '#1976d2', background: lopHours > 0 ? '#fffde7' : '#e3f2fd' }}>{lopHours}</span>
            </div>
          </div>
        </div>
      )}
      {/* Center user: Month select filter with new label and style */}
      {isCenterUser && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
          <label htmlFor="month-select" style={{ fontWeight: 700, color: '#1976D2', fontSize: 18 }}>Select Month to View (Center):</label>
          <select
            id="month-select"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            style={{ padding: 10, borderRadius: 6, border: '2px solid #1976D2', fontSize: 16, fontWeight: 600, background: '#e3f2fd' }}
          >
            {months.map(m => (
              <option key={m} value={m}>{new Date(m + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}</option>
            ))}
          </select>
        </div>
      )}
      {/* Loading indicator for center users */}
      {isCenterUser && loading && (
        <div style={{ textAlign: 'center', color: '#1976d2', fontWeight: 600, marginBottom: 24 }}>Loading leave data...</div>
      )}
      {/* Employee: old month select */}
      {!isCenterUser && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
          <label htmlFor="month-select" style={{ fontWeight: 600 }}>Select Month:</label>
          <select
            id="month-select"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            style={{ padding: 8, borderRadius: 4, border: '1px solid #1976D2' }}
          >
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      )}
      {/* Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ ...cardStyles.base, ...cardStyles.pending }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#e65100' }}>Pending Requests</h2>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f57c00' }}>{pendingRequests}</div>
        </div>
        <div style={{ ...cardStyles.base, ...cardStyles.approved }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#2e7d32' }}>Approved Requests</h2>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2e7d32' }}>{approvedRequests}</div>
        </div>
        <div style={{ ...cardStyles.base, ...cardStyles.rejected }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#c62828' }}>Rejected Requests</h2>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#c62828' }}>{rejectedRequests}</div>
        </div>
        <div style={{ ...cardStyles.base, ...cardStyles.total }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1565c0' }}>Total Requests</h2>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2196F3' }}>{totalRequests}</div>
        </div>
        <div style={{ ...cardStyles.base, ...cardStyles.halfDay }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#7b1fa2' }}>Half Day Leave</h2>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#7b1fa2' }}>{halfDayLeaveRequests}</div>
        </div>
      </div>
      <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(33,150,243,0.04)', padding: 16 }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 800 }}>
          <thead>
            <tr style={{ background: '#e3f2fd' }}>
              <th style={{ padding: 8, border: '1px solid #90caf9', fontWeight: 700 }}>Employee ID</th>
              <th style={{ padding: 8, border: '1px solid #90caf9', fontWeight: 700 }}>Employee Name</th>
              <th style={{ padding: 8, border: '1px solid #90caf9', fontWeight: 700 }}>Leave Type</th>
              <th style={{ padding: 8, border: '1px solid #90caf9', fontWeight: 700 }}>Start Date</th>
              <th style={{ padding: 8, border: '1px solid #90caf9', fontWeight: 700 }}>End Date</th>
              <th style={{ padding: 8, border: '1px solid #90caf9', fontWeight: 700 }}>Status</th>
              <th style={{ padding: 8, border: '1px solid #90caf9', fontWeight: 700 }}>Reason</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaves.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 16 }}>No leave records for this month.</td></tr>
            ) : (
              filteredLeaves.map(l => (
                <tr key={l.id}>
                  <td style={{ padding: 8, border: '1px solid #e3f2fd' }}>{l.employeeId}</td>
                  <td style={{ padding: 8, border: '1px solid #e3f2fd' }}>{l.name}</td>
                  <td style={{ padding: 8, border: '1px solid #e3f2fd' }}>{l.type}</td>
                  <td style={{ padding: 8, border: '1px solid #e3f2fd' }}>{l.startDate}</td>
                  <td style={{ padding: 8, border: '1px solid #e3f2fd' }}>{l.endDate}</td>
                  <td style={{ padding: 8, border: '1px solid #e3f2fd' }}>{l.status}</td>
                  <td style={{ padding: 8, border: '1px solid #e3f2fd' }}>{l.reason}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Leave Reports Modal */}
      {showReport && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 10, boxShadow: '0 4px 32px rgba(0,0,0,0.18)', minWidth: 340, maxWidth: '95vw', position: 'relative' }}>
            <button style={{ position: 'absolute', top: 10, right: 16, background: 'none', border: 'none', fontSize: '2rem', color: '#888', cursor: 'pointer' }} onClick={() => setShowReport(false)}>&times;</button>
            <h2 style={{ marginBottom: 16, color: '#1976d2' }}>Monthly Leave Report</h2>
            <div style={{ marginBottom: 20 }}>
              <button
                style={{ 
                  background: '#4caf50', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 6, 
                  padding: '10px 20px', 
                  fontWeight: 600, 
                  fontSize: 14, 
                  cursor: 'pointer',
                  marginRight: 10
                }}
                onClick={handlePrint}
              >
                Print Report
              </button>
            </div>
            <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 800 }}>
                <thead>
                  <tr style={{ background: '#e3f2fd' }}>
                    <th style={{ padding: 8, border: '1px solid #90caf9', fontWeight: 700 }}>Employee ID</th>
                    <th style={{ padding: 8, border: '1px solid #90caf9', fontWeight: 700 }}>Employee Name</th>
                    <th style={{ padding: 8, border: '1px solid #90caf9', fontWeight: 700 }}>Leave Type</th>
                    <th style={{ padding: 8, border: '1px solid #90caf9', fontWeight: 700 }}>Start Date</th>
                    <th style={{ padding: 8, border: '1px solid #90caf9', fontWeight: 700 }}>End Date</th>
                    <th style={{ padding: 8, border: '1px solid #90caf9', fontWeight: 700 }}>Status</th>
                    <th style={{ padding: 8, border: '1px solid #90caf9', fontWeight: 700 }}>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaves.map(l => (
                    <tr key={l.id}>
                      <td style={{ padding: 8, border: '1px solid #e3f2fd' }}>{l.employeeId}</td>
                      <td style={{ padding: 8, border: '1px solid #e3f2fd' }}>{l.name}</td>
                      <td style={{ padding: 8, border: '1px solid #e3f2fd' }}>{l.type}</td>
                      <td style={{ padding: 8, border: '1px solid #e3f2fd' }}>{l.startDate}</td>
                      <td style={{ padding: 8, border: '1px solid #e3f2fd' }}>{l.endDate}</td>
                      <td style={{ padding: 8, border: '1px solid #e3f2fd' }}>{l.status}</td>
                      <td style={{ padding: 8, border: '1px solid #e3f2fd' }}>{l.reason}</td>
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

export default MonthlyLeaveTrackingDashboard; 
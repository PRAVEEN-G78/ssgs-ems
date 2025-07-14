import React, { useState, useEffect } from 'react';
import './LeaveManagement.css';
import LeaveRequestForm from './LeaveRequestForm';

function LeaveManagement() {
  // Get current user info
  const user = JSON.parse(localStorage.getItem('user'));
  const isCenterUser = user?.userType === 'centre';
  const isEmployeeUser = user?.userType === 'employee';

  // Leave requests state (from backend)
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchLeaves() {
      setLoading(true);
      setError(null);
      try {
        let url = '/api/leave';
        if (isEmployeeUser && user?.employeeId) {
          url = `/api/leave/${user.employeeId}`;
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch leave requests');
        const data = await res.json();
        setLeaveRequests(data);
      } catch (err) {
        setError(err.message || 'Error loading leave requests');
      }
      setLoading(false);
    }
    fetchLeaves();
    // eslint-disable-next-line
  }, [isEmployeeUser, user?.employeeId]);

  const [showReport, setShowReport] = useState(false);
  const [showLeaveRequestForm, setShowLeaveRequestForm] = useState(false);

  // Add month filter state
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 7);
  });

  // Add date filter state for center users
  const [selectedDate, setSelectedDate] = useState('');

  // Helper to get unique months from leaveRequests
  const getAvailableMonths = (requests) => {
    const months = new Set();
    requests.forEach(r => {
      if (r.startDate) months.add(r.startDate.slice(0, 7));
      if (r.endDate) months.add(r.endDate.slice(0, 7));
    });
    return Array.from(months).sort().reverse();
  };
  const availableMonths = getAvailableMonths(leaveRequests);

  // Filter leave requests by selected month
  const filteredLeaveRequests = leaveRequests.filter(r =>
    (r.startDate && r.startDate.startsWith(selectedMonth)) ||
    (r.endDate && r.endDate.startsWith(selectedMonth))
  );

  // Filter leave requests by selected date for center users
  const filteredByDateLeaveRequests = isCenterUser && selectedDate
    ? leaveRequests.filter(r => {
        if (!r.startDate || !r.endDate) return false;
        return selectedDate >= r.startDate && selectedDate <= r.endDate;
      })
    : leaveRequests;

  // Statistics
  const statsSource = isEmployeeUser ? filteredLeaveRequests : leaveRequests;
  const pendingRequests = statsSource.filter(req => req.status === 'Pending').length;
  const approvedRequests = statsSource.filter(req => req.status === 'Approved').length;
  const rejectedRequests = statsSource.filter(req => req.status === 'Rejected').length;
  const totalRequests = statsSource.length;
  const halfDayLeaveRequests = statsSource.filter(req => req.type === 'Half Day').length;

  // Leave Balance Calculation for Employees
  let leaveBalance = null;
  if (isEmployeeUser) {
    // For demo: 1 paid leave per month, count approved paid leaves (Annual, Casual, Sick, etc.)
    const paidLeaveTypes = ['Annual Leave', 'Casual Leave', 'Sick Leave'];
    const used = filteredLeaveRequests.filter(req => req.status === 'Approved' && paidLeaveTypes.includes(req.type)).reduce((sum, req) => sum + req.duration, 0);
    const maxPaidLeaves = 1; // Demo: 1 per month
    const paidLeavesUsed = used > maxPaidLeaves ? maxPaidLeaves : used;
    const paidLeavesRemaining = Math.max(0, maxPaidLeaves - paidLeavesUsed);
    const lopHours = used > maxPaidLeaves ? (used - maxPaidLeaves) * 8 : 0; // 8 hours per day
    leaveBalance = { paidLeavesUsed, paidLeavesRemaining, lopHours };
  }

  // Approve/Reject leave handler
  const handleLeaveStatus = async (leaveId, newStatus) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/leave/${leaveId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          approvedBy: user?.username || user?.firstName || '',
          approvedDate: new Date().toISOString().slice(0, 10),
        }),
      });
      if (!res.ok) throw new Error('Failed to update leave status');
      // Refresh leave requests
      let url = '/api/leave';
      if (isEmployeeUser && user?.employeeId) {
        url = `/api/leave/${user.employeeId}`;
      }
      const refreshed = await fetch(url);
      setLeaveRequests(await refreshed.json());
    } catch (err) {
      setError(err.message || 'Error updating leave status');
    }
    setLoading(false);
  };

  return (
    <div className="leave-management-container">
      {/* Loading/Error Feedback */}
      {loading && (
        <div style={{ textAlign: 'center', margin: '24px 0', color: '#1976d2', fontWeight: 600 }}>
          Loading leave requests...
        </div>
      )}
      {error && (
        <div style={{ textAlign: 'center', margin: '24px 0', color: '#c62828', fontWeight: 600 }}>
          {error}
        </div>
      )}
      {/* Leave Balance Card for Employees */}
      {user?.userType === "employee" && leaveBalance && (
        <div className="leave-balance-card" style={{ marginBottom: 24, background: '#e3f2fd', borderRadius: 8, padding: 20, boxShadow: '0 2px 8px #0001', maxWidth: 500 }}>
          <h2 style={{ color: '#1976d2', marginBottom: 12 }}>Paid Leave Balance (This Month)</h2>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <div>
              <b>Used:</b> {leaveBalance.paidLeavesUsed} / 1
            </div>
            <div>
              <b>Remaining:</b> {leaveBalance.paidLeavesRemaining}
            </div>
            <div>
              <b>LOP Hours:</b> {leaveBalance.lopHours || 0}
            </div>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="leave-management-title">Leave Tracking</h1>
        {/* Month Filter and Leave Reports Button for Employees - top right */}
        {isEmployeeUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              style={{ background: '#388e3c', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
              onClick={() => setShowLeaveRequestForm(true)}
            >
              Leave Request
            </button>
            <button
              style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
              onClick={() => setShowReport(true)}
            >
              Leave Reports
            </button>
            <label htmlFor="month-select" style={{ fontWeight: 600, marginLeft: 8 }}>Select Month:</label>
            <select
              id="month-select"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              style={{ padding: 8, borderRadius: 4, border: '1px solid #1976D2' }}
            >
              {availableMonths.map(month => (
                <option key={month} value={month}>{new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      {/* Leave Reports Modal */}
      {showReport && (
        <div className="modal-overlay modal-fade-in" onClick={() => setShowReport(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '95vw', width: '1400px' }}>
            <button className="modal-close" onClick={() => setShowReport(false)}>&times;</button>
            <div style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ marginBottom: 0, color: '#1976d2' }}>Leaves Report</h2>
              <button
                style={{ background: '#388e3c', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
                onClick={() => {
                  const table = document.getElementById('leave-report-table');
                  if (table) {
                    const printWindow = window.open('', '', 'width=900,height=700');
                    printWindow.document.write('<html><head><title>Leaves Report</title>');
                    printWindow.document.write('<style>body{font-family:sans-serif;} table{border-collapse:collapse;width:100%;} th,td{border:1px solid #ccc;padding:8px;} th{background:#f5f5f5;}</style>');
                    printWindow.document.write('</head><body >');
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
            <div className="table-container" style={{ overflowX: 'auto', maxWidth: '100%' }}>
              <table className="table" id="leave-report-table" style={{ minWidth: '1200px' }}>
                <thead>
                  <tr>
                    <th>S.NO</th>
                    {!isEmployeeUser && <th>Employee ID</th>}
                    {!isEmployeeUser && <th>Employee Name</th>}
                    <th>Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Duration (Days)</th>
                    <th>Applied Date</th>
                    <th>Status</th>
                    <th>Approved Date</th>
                    <th>Approved By</th>
                    <th>Reason</th>
                    <th>Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {(isEmployeeUser ? filteredLeaveRequests : leaveRequests).map((request, idx) => (
                    <tr key={request.id}>
                      <td>{idx + 1}</td>
                      {!isEmployeeUser && <td>{request.employeeId}</td>}
                      {!isEmployeeUser && <td>{request.employeeName}</td>}
                      <td>{request.type}</td>
                      <td>{request.startDate}</td>
                      <td>{request.endDate}</td>
                      <td>{request.duration}</td>
                      <td>{request.appliedDate}</td>
                      <td>
                        <span className={`status-chip status-${request.status.toLowerCase()}`}>
                          {request.status}
                        </span>
                      </td>
                      <td>{request.approvedDate || '-'}</td>
                      <td>{request.approvedBy || '-'}</td>
                      <td>{request.reason}</td>
                      <td>{request.comments}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* Leave Request Form Modal */}
      {showLeaveRequestForm && (
        <div className="face-modal-overlay" style={{zIndex: 3000}}>
          <div className="face-modal-content" style={{ minWidth: 400, maxWidth: 600, background: '#fff', borderRadius: 8, padding: 24, position: 'relative' }}>
            <button
              onClick={() => setShowLeaveRequestForm(false)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
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
            <LeaveRequestForm onClose={() => setShowLeaveRequestForm(false)} />
          </div>
        </div>
      )}
      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h2 className="stat-title">Pending Requests</h2>
          <div className="stat-value pending">{pendingRequests}</div>
        </div>
        <div className="stat-card">
          <h2 className="stat-title">Approved Requests</h2>
          <div className="stat-value approved">{approvedRequests}</div>
        </div>
        <div className="stat-card">
          <h2 className="stat-title">Rejected Requests</h2>
          <div className="stat-value rejected">{rejectedRequests}</div>
        </div>
        <div className="stat-card">
          <h2 className="stat-title">Total Requests</h2>
          <div className="stat-value total">{totalRequests}</div>
        </div>
        <div className="stat-card">
          <h2 className="stat-title">Half Day Leave</h2>
          <div className="stat-value halfday-leave">{halfDayLeaveRequests}</div>
        </div>
      </div>
      {/* Table: Demo Data with Employee ID and Name */}
      {/* Date Filter for Center Users */}
      {isCenterUser && (
        <div style={{ margin: '16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <label htmlFor="date-filter" style={{ fontWeight: 600 }}>Select Date:</label>
          <input
            id="date-filter"
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ padding: 8, borderRadius: 4, border: '1px solid #1976D2' }}
          />
        </div>
      )}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>S.NO</th>
              {!isEmployeeUser && <th>Employee ID</th>}
              {!isEmployeeUser && <th>Employee Name</th>}
              <th>Type</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Duration (Days)</th>
              <th>Leave Applied Date</th>
              <th>Status</th>
              <th>Reason</th>
              {isCenterUser && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {(isEmployeeUser ? filteredLeaveRequests : filteredByDateLeaveRequests).map((request, idx) => (
              <tr key={request.id}>
                <td>{idx + 1}</td>
                {!isEmployeeUser && <td>{request.employeeId}</td>}
                {!isEmployeeUser && <td>{request.employeeName}</td>}
                <td>{request.type}</td>
                <td>{request.startDate}</td>
                <td>{request.endDate}</td>
                <td>{request.duration}</td>
                <td>{request.appliedDate}</td>
                <td>
                  <span className={`status-chip status-${request.status.toLowerCase()}`}>
                    {request.status}
                  </span>
                </td>
                <td>{request.reason}</td>
                {isCenterUser && (
                  <td style={{ textAlign: 'center' }}>
                    {request.status === 'Pending' ? (
                      <>
                        <button
                          style={{ marginRight: 8, padding: '4px 12px', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                          onClick={() => handleLeaveStatus(request._id, 'Approved')}
                          disabled={loading}
                        >
                          Approve
                        </button>
                        <button
                          style={{ padding: '4px 12px', background: '#c62828', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                          onClick={() => handleLeaveStatus(request._id, 'Rejected')}
                          disabled={loading}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LeaveManagement; 
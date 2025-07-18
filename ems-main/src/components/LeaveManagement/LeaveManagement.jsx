import React, { useState, useEffect } from 'react';
import './LeaveManagement.css';
import LeaveRequestForm from './LeaveRequestForm';
import { API_ENDPOINTS, apiCall } from '../../config/api';
import { FaTimesCircle } from 'react-icons/fa';

// Helper to get time difference in minutes
function getMinutesDiff(date1, date2) {
  return Math.abs((date1.getTime() - date2.getTime()) / (1000 * 60));
}

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
  const [showCenterReport, setShowCenterReport] = useState(false);

  // Add month filter state
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 7);
  });

  // Add date filter state for center users
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Filter type state for center users
  const [filterType, setFilterType] = useState('date'); // 'date', 'month'

  // Employee ID filter for center users
  const [employeeIdFilter, setEmployeeIdFilter] = useState('');

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

  // Filter leave requests for center users based on filter type
  let filteredByDateLeaveRequests = leaveRequests;
  if (isCenterUser) {
    if (filterType === 'date') {
      const dateToUse = selectedDate || todayStr;
      filteredByDateLeaveRequests = leaveRequests.filter(r => {
        if (!r.startDate || !r.endDate) return false;
        return dateToUse >= r.startDate && dateToUse <= r.endDate;
      });
    } else if (filterType === 'month' && selectedMonth) {
      filteredByDateLeaveRequests = leaveRequests.filter(r =>
        (r.startDate && r.startDate.startsWith(selectedMonth)) ||
        (r.endDate && r.endDate.startsWith(selectedMonth))
      );
    }
  }

  // Statistics
  let statsSource = isEmployeeUser ? filteredLeaveRequests : leaveRequests;
  if (isCenterUser) {
    if (filterType === 'date') {
      statsSource = filteredByDateLeaveRequests;
    } else if (filterType === 'month') {
      statsSource = filteredByDateLeaveRequests;
    }
  }
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
    // Only count approved leaves
    const approvedPaidLeaves = filteredLeaveRequests.filter(req => req.status === 'Approved' && paidLeaveTypes.includes(req.type));
    const totalApprovedPaidLeaveDays = approvedPaidLeaves.reduce((sum, req) => sum + req.duration, 0);
    const maxPaidLeaves = 1; // 1 paid leave day per month
    const paidLeavesUsed = Math.min(totalApprovedPaidLeaveDays, maxPaidLeaves);
    const paidLeavesRemaining = Math.max(0, maxPaidLeaves - paidLeavesUsed);
    // LOP hours: only for extra days beyond the first approved paid leave day
    const lopHours = totalApprovedPaidLeaveDays > maxPaidLeaves ? (totalApprovedPaidLeaveDays - maxPaidLeaves) * 8 : 0;
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

  // Cancel leave handler for employees
  const handleCancelLeave = async (leaveId) => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) return;
    setLoading(true);
    setError(null);
    try {
      await apiCall(`/api/leave/${leaveId}/cancel`, { method: 'PUT' });
      // Refresh leave requests
      let url = '/api/leave';
      if (isEmployeeUser && user?.employeeId) {
        url = `/api/leave/${user.employeeId}`;
      }
      const refreshed = await fetch(url);
      setLeaveRequests(await refreshed.json());
    } catch (err) {
      setError(err.message || 'Error canceling leave');
    }
    setLoading(false);
  };

  // Action modal state
  const [actionModal, setActionModal] = useState({ open: false, leave: null });
  const [actionError, setActionError] = useState(null);

  // When a leave is approved/rejected, backend sets actionTimestamp
  const handleLeaveStatusWithTime = async (leaveId, newStatus, leaveObj) => {
    await handleLeaveStatus(leaveId, newStatus);
  }

  // Handler for Action button
  const handleActionClick = (leave) => {
    setActionError(null);
    setActionModal({ open: true, leave });
  };

  // Handler for modal status change (calls backend change-status endpoint)
  const handleActionModalChange = async (newStatus) => {
    if (!actionModal.leave) return;
    setActionError(null);
    try {
      await apiCall(`${API_ENDPOINTS.LEAVE_CHANGE_STATUS}/${actionModal.leave._id}/change-status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: newStatus,
          approvedBy: user?.username || user?.firstName || '',
          approvedDate: new Date().toISOString().slice(0, 10),
        }),
      });
      // Refresh leave requests
      let url = '/api/leave';
      if (isEmployeeUser && user?.employeeId) {
        url = `/api/leave/${user.employeeId}`;
      }
      const refreshed = await fetch(url);
      setLeaveRequests(await refreshed.json());
      setActionModal({ open: false, leave: null });
    } catch (err) {
      setActionError(err.message || 'Failed to change action');
    }
  };

  // Handler to close modal
  const handleCloseActionModal = () => {
    setActionError(null);
    setActionModal({ open: false, leave: null });
  };

  // Add handler for editing leave
  const handleEditLeave = (leave) => {
    // This function will open a modal or form to update the leave dates
    // For now, we'll just log it to the console
    console.log('Editing leave:', leave);
    // Example: setShowLeaveRequestForm(true); // Assuming LeaveRequestForm can handle editing
  };

  // Add modal or form for editing leave (to be implemented)

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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h1 className="leave-management-title" style={{ margin: 0, color: '#1976d2',fontSize:'35px' }}>Leave Tracking Dashboard</h1>
        {isCenterUser && (
          <button
            style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginLeft: 16 }}
            onClick={() => setShowCenterReport(true)}
          >
            Leave Report
          </button>
        )}
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
      {/* Leave Balance Card for Employees */}
      {user?.userType === "employee" && leaveBalance && (
        <div className="paid-leave-balance-card" style={{ marginBottom: 32 }}>
          <div className="plb-title">Paid Leave Balance (This Month)</div>
          <div className="plb-stats-row">
            <div className="plb-stat">
              <span className="plb-icon" role="img" aria-label="used">✅</span>
              <span className="plb-label">Used</span>
              <span className="plb-pill">{leaveBalance.paidLeavesUsed} / 1</span>
            </div>
            <div className="plb-stat">
              <span className="plb-icon" role="img" aria-label="remaining">🟢</span>
              <span className="plb-label">Remaining</span>
              <span className="plb-pill" style={{ color: leaveBalance.paidLeavesRemaining > 0 ? '#388e3c' : '#d32f2f', background: leaveBalance.paidLeavesRemaining > 0 ? '#e8f5e9' : '#fffde7' }}>{leaveBalance.paidLeavesRemaining}</span>
            </div>
            <div className="plb-stat">
              <span className="plb-icon" role="img" aria-label="lop">⏰</span>
              <span className="plb-label">LOP Hours</span>
              <span className="plb-pill" style={{ color: leaveBalance.lopHours > 0 ? '#fbc02d' : '#1976d2', background: leaveBalance.lopHours > 0 ? '#fffde7' : '#e3f2fd' }}>{leaveBalance.lopHours || 0}</span>
            </div>
          </div>
        </div>
      )}
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
            {/* Summary Table for Leave Report */}
            <div style={{ marginBottom: 24 }}>
              <table className="table" style={{ minWidth: 400, background: '#fff', borderRadius: 6, margin: '0 auto' }}>
                <thead>
                  <tr>
                    <th>Pending Requests</th>
                    <th>Approved Requests</th>
                    <th>Rejected Requests</th>
                    <th>Total Requests</th>
                    <th>Half Day Leave</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{filteredByDateLeaveRequests.filter(r => r.status === 'Pending').length}</td>
                    <td>{filteredByDateLeaveRequests.filter(r => r.status === 'Approved').length}</td>
                    <td>{filteredByDateLeaveRequests.filter(r => r.status === 'Rejected').length}</td>
                    <td>{filteredByDateLeaveRequests.length}</td>
                    <td>{filteredByDateLeaveRequests.filter(r => r.type === 'Half Day').length}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="table-container" style={{ overflowX: 'auto', overflowY: 'auto', maxWidth: '100%', maxHeight: '60vh' }}>
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
                    <th>Approve/Reject</th>
                    <th>Approved By</th>
                    <th>Reason</th>
                    <th>Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {(isEmployeeUser ? filteredLeaveRequests : leaveRequests).map((request, idx) => (
                    <tr key={request._id}>
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
      {/* Center User: Leave Report Modal */}
      {isCenterUser && showCenterReport && (
        <div className="modal-overlay modal-fade-in" onClick={() => setShowCenterReport(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '95vw', width: '1400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: '#1976d2', marginRight: 20 }}>Leaves Report</h2>
              <button
                style={{ background: '#388e3c', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginRight: 20 }}
                onClick={() => {
                  const summary = document.getElementById('center-leave-report-summary-table');
                  const table = document.getElementById('center-leave-report-table');
                  if (table && summary) {
                    const printWindow = window.open('', '', 'width=900,height=700');
                    printWindow.document.write('<html><head><title>Leaves Report</title>');
                    printWindow.document.write('<style>body{font-family:sans-serif;} table{border-collapse:collapse;width:100%;margin-bottom:24px;} th,td{border:1px solid #ccc;padding:8px;} th{background:#f5f5f5;}</style>');
                    printWindow.document.write('</head><body >');
                    printWindow.document.write('<h2 style="color:#1976d2;">Leaves Report</h2>');
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
              <div style={{ flex: 1 }}></div>
              <button className="modal-close" onClick={() => setShowCenterReport(false)}>&times;</button>
            </div>
            {/* Summary Table for Leave Report */}
            <div style={{ marginBottom: 24 }}>
              <table id="center-leave-report-summary-table" className="table" style={{ minWidth: 400, background: '#fff', borderRadius: 6, margin: '0 auto' }}>
                <thead>
                  <tr>
                    <th>Pending Requests</th>
                    <th>Approved Requests</th>
                    <th>Rejected Requests</th>
                    <th>Total Requests</th>
                    <th>Half Day Leave</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{filteredByDateLeaveRequests.filter(r => r.status === 'Pending').length}</td>
                    <td>{filteredByDateLeaveRequests.filter(r => r.status === 'Approved').length}</td>
                    <td>{filteredByDateLeaveRequests.filter(r => r.status === 'Rejected').length}</td>
                    <td>{filteredByDateLeaveRequests.length}</td>
                    <td>{filteredByDateLeaveRequests.filter(r => r.type === 'Half Day').length}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="table-container" style={{ overflowX: 'auto', overflowY: 'auto', maxWidth: '100%', maxHeight: '60vh' }}>
              <table className="table" id="center-leave-report-table" style={{ minWidth: '600px' }}>
                <thead>
                  <tr>
                    <th>S.NO</th>
                    <th>Employee ID</th>
                    <th>Employee Name</th>
                    <th>Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Duration (Days)</th>
                    <th>Applied Date</th>
                    <th>Status</th>
                    <th>Approved/Rejected </th>
                    <th>Approve/Reject By</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredByDateLeaveRequests.map((request, idx) => (
                    <tr key={request._id}>
                      <td>{idx + 1}</td>
                      <td>{String(request.employeeId)}</td>
                      <td>{String(request.employeeName)}</td>
                      <td>{String(request.type)}</td>
                      <td>{String(request.startDate)}</td>
                      <td>{String(request.endDate)}</td>
                      <td>{String(request.duration)}</td>
                      <td>{String(request.appliedDate)}</td>
                      <td>
                        <span className={`status-chip status-${request.status.toLowerCase()}`}>{String(request.status)}</span>
                      </td>
                      <td>{String(request.approvedDate) || '-'}</td>
                      <td>{String(request.approvedBy) || '-'}</td>
                      <td>{String(request.reason)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
      {/* Date/Month Filter for Center Users */}
      {isCenterUser && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, width: '100%' }}>
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
                max={todayStr}
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
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>S.NO</th>
              {/* Always render Employee ID and Name columns for alignment */}
              {isEmployeeUser && <th key="empty1"></th>}
              {isEmployeeUser && <th key="empty2"></th>}
              {!isEmployeeUser && <th key="id">Employee ID</th>}
              {!isEmployeeUser && <th key="name">Employee Name</th>}
              <th>Type</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Duration (Days)</th>
              <th>Leave Applied Date</th>
              <th>Status</th>
              <th>Reason</th>
              {/* Approve/Rejects column for both center and employee users */}
              <th>Approve/Rejects</th>
              {/* Always render Action column for alignment */}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {(isEmployeeUser ? filteredLeaveRequests : filteredByDateLeaveRequests.filter(r =>
              employeeIdFilter.trim() === '' ||
              (r.employeeId && r.employeeId.toLowerCase().includes(employeeIdFilter.trim().toLowerCase()))
            )).map((request, idx) => {
              console.log('Rendering leave request row:', request);
              // Defensive: ensure status is a string
              const statusString = typeof request.status === 'string' ? request.status : (request.status ? JSON.stringify(request.status) : '');
              Object.entries(request).forEach(([key, value]) => {
                if (typeof value === 'object' && value !== null && !Array.isArray(value) && !React.isValidElement(value)) {
                  console.warn('Non-primitive value in request:', key, value);
                }
              });
              return (
                <tr key={request._id}>
                  <td>{idx + 1}</td>
                  {isEmployeeUser && <td key="empty1"></td>}
                  {isEmployeeUser && <td key="empty2"></td>}
                  {!isEmployeeUser && <td key="id">{String(request.employeeId)}</td>}
                  {!isEmployeeUser && <td key="name">{String(request.employeeName)}</td>}
                  <td>{String(request.type)}</td>
                  <td>{String(request.startDate)}</td>
                  <td>{String(request.endDate)}</td>
                  <td>{String(request.duration)}</td>
                  <td>{String(request.appliedDate)}</td>
                  <td>
                    <span className={`status-chip status-${statusString.toLowerCase()}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      {statusString}
                      {isEmployeeUser && statusString === 'Pending' && (
                        <FaTimesCircle
                          style={{ color: '#c62828', cursor: 'pointer', fontSize: 18 }}
                          title="Cancel Leave Request"
                          onClick={() => handleCancelLeave(request._id)}
                        />
                      )}
                    </span>
                  </td>
                  <td>{String(request.reason)}</td>
                  {/* Approve/Rejects column for both center and employee users */}
                  <td style={{ textAlign: 'center' }}>
                    {(statusString === 'Approved' || statusString === 'Rejected')
                      ? (request.actionTimestamp
                          ? new Date(request.actionTimestamp).toLocaleString()
                          : (request.approvedDate || '-'))
                      : '-'}
                  </td>
                  {/* Always render Action column for alignment */}
                  <td style={{ textAlign: 'center' }}>
                    {isEmployeeUser ? (
                      statusString === 'Pending' ? (
                        <div style={{ display: 'inline-flex', gap: 8 }}>
                          <button
                            style={{ padding: '4px 12px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                            onClick={() => handleEditLeave(request)}
                            disabled={loading}
                          >
                            Edit
                          </button>
                          <button
                            style={{ padding: '4px 12px', background: '#c62828', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                            onClick={() => handleCancelLeave(request._id)}
                            disabled={loading}
                          >
                            Self Reject
                          </button>
                        </div>
                      ) : null
                    ) : isCenterUser ? (
                      statusString === 'Pending' ? (
                        <div style={{ display: 'inline-flex', gap: 8 }}>
                          <button
                            style={{ padding: '4px 12px', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                            onClick={() => handleLeaveStatusWithTime(request._id, 'Approved', request)}
                            disabled={loading}
                          >
                            Approve
                          </button>
                          <button
                            style={{ padding: '4px 12px', background: '#c62828', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                            onClick={() => handleLeaveStatusWithTime(request._id, 'Rejected', request)}
                            disabled={loading}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <button
                          style={{ padding: '4px 12px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                          onClick={() => handleActionClick(request)}
                          disabled={
                            !request.actionTimestamp ||
                            getMinutesDiff(new Date(), new Date(request.actionTimestamp)) > 60
                          }
                          title={
                            !request.actionTimestamp
                              ? 'Take an action first'
                              : getMinutesDiff(new Date(), new Date(request.actionTimestamp)) > 60
                                ? 'Action can only be changed within 1 hour'
                                : 'Change your decision'
                          }
                        >
                          Action
                        </button>
                      )
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Action Modal for changing status within 1 hour */}
      {actionModal.open && (
        <div className="modal-overlay modal-fade-in" onClick={handleCloseActionModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ minWidth: 320, maxWidth: 400, textAlign: 'center' }}>
            <button className="modal-close" onClick={handleCloseActionModal} style={{ position: 'absolute', top: 10, right: 16 }}>&times;</button>
            <h2 style={{ color: '#1976d2', marginBottom: 16 }}>Change Decision</h2>
            <p style={{ marginBottom: 24 }}>You can change your decision for this leave request. Select a new status:</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
              <button
                style={{ background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
                onClick={() => handleActionModalChange('Approved')}
              >
                Approve
              </button>
              <button
                style={{ background: '#c62828', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
                onClick={() => handleActionModalChange('Rejected')}
              >
                Reject
              </button>
            </div>
            {actionError && <div style={{ color: '#c62828', marginBottom: 8 }}>{actionError}</div>}
            <div style={{ color: '#888', fontSize: 13 }}>You can only change your decision within 1 hour of the last action.</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeaveManagement; 
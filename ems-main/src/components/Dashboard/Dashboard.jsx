import React, { useState, useEffect } from 'react';
import './Dashboard.css';

// Modal for editing documents
function EditDocumentsModal({ show, onClose, employee, onSave }) {
  const [documents, setDocuments] = useState(employee?.documents || []);
  const [newDocs, setNewDocs] = useState([]);

  useEffect(() => {
    setDocuments(employee?.documents || []);
    setNewDocs([]);
  }, [employee, show]);

  if (!show) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Edit Documents</h2>
        <ul style={{marginBottom:16}}>
          {documents.length === 0 && <li>No documents uploaded</li>}
          {documents.map((doc, i) => (
            <li key={i} style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              <span>{doc.type || 'Document'}</span>
              <span className="doc-actions">
                {doc.url && (
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="view-doc-btn">View</a>
                )}
                <button className="remove-doc-btn" title="Remove" onClick={() => setDocuments(docs => docs.filter((_, idx) => idx !== i))}><span className="remove-icon">✖️</span></button>
              </span>
            </li>
          ))}
        </ul>
        <label>Upload New Documents
          <input type="file" multiple onChange={e => setNewDocs([...e.target.files])} />
        </label>
        <div style={{marginTop:16}}>
          <button type="button" className="edit-doc-save-btn" onClick={() => onSave(documents, newDocs)}>Save</button>
          <button type="button" className="edit-doc-cancel-btn" onClick={onClose} style={{marginLeft:8}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [validationNote, setValidationNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [centers, setCenters] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [centreCodeFilter, setCentreCodeFilter] = useState('');
  const [showEditDocsModal, setShowEditDocsModal] = useState(false);

  // Get current user's centre code (for centre login)
  const user = JSON.parse(localStorage.getItem('user'));
  const userCentreCode = user?.centreCode || user?.centerCode || '';

  useEffect(() => {
    // Fetch both centers and employees
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        
        // Fetch centers
        const centersResponse = await fetch('http://localhost:5000/api/centers', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Fetch employees
        const employeesResponse = await fetch('http://localhost:5000/api/employees', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (centersResponse.ok) {
          const centersData = await centersResponse.json();
          setCenters(centersData);
        }

        if (employeesResponse.ok) {
          const employeesData = await employeesResponse.json();
          setEmployees(employeesData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setCenters([]);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleViewCenter = (center) => {
    setSelectedCenter(center);
    setSelectedEmployee(null);
    setOpenDialog(true);
  };

  const handleViewEmployee = (employee) => {
    setSelectedEmployee(employee);
    setSelectedCenter(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCenter(null);
    setSelectedEmployee(null);
    setValidationNote('');
  };

  const handleApprove = async () => {
    if (!selectedEmployee) return;
    try {
      const response = await fetch(`http://localhost:5000/api/employees/${selectedEmployee._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'Approved' }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve employee');
      }

      const updatedEmployee = await response.json();

      setEmployees(employees.map(emp => 
        emp._id === selectedEmployee._id ? updatedEmployee : emp
      ));
      handleCloseDialog();
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  const handleReject = async () => {
    if (!selectedEmployee) return;

    if (!validationNote.trim()) {
      alert('Validation note is required for rejection.');
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/employees/${selectedEmployee._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'Rejected', validationNote }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject employee');
      }
      
      const updatedEmployee = await response.json();

      setEmployees(employees.map(emp => 
        emp._id === selectedEmployee._id ? updatedEmployee : emp
      ));
      handleCloseDialog();
    } catch (err) {
      console.error('Rejection failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout" style={{ display: 'flex' }}>
      <nav className="sidebar" style={{ width: 220, minHeight: '100vh', background: '#f5f7fa', padding: '2rem 1rem', borderRight: '1px solid #e0e0e0' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li style={{ marginBottom: 24 }}>
            <a href="/dashboard" style={{ textDecoration: 'none', color: '#333', fontWeight: 600, fontSize: 18 }}>
              Dashboard
            </a>
          </li>
          <li style={{ marginBottom: 24 }}>
            <div style={{ position: 'relative' }}>
              <a href="/attendance-list" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 600, fontSize: 18, display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: 6 }}>Attendance</span>
                <span style={{ fontSize: 12, color: '#888' }}>▼</span>
              </a>
              <ul style={{ listStyle: 'none', paddingLeft: 24, margin: 0, marginTop: 6, background: '#f0f4fa', borderLeft: '3px solid #1976d2', borderRadius: 4 }}>
                <li style={{ marginBottom: 8 }}>
                  <a href="/monthly-attendance-dashboard" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 500, fontSize: 16, paddingLeft: 8, display: 'block' }}>
                    Monthly Attendance
                  </a>
                </li>
              </ul>
            </div>
          </li>
          <li style={{ marginBottom: 24 }}>
            <a href="/attendance-tracking" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 600, fontSize: 18 }}>
              Attendance Tracking
            </a>
          </li>
          <li style={{ marginBottom: 24 }}>
            <div style={{ position: 'relative' }}>
              <a href="/leave-tracking" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 600, fontSize: 18, display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: 6 }}>Leave Tracking</span>
                <span style={{ fontSize: 12, color: '#888' }}>▼</span>
              </a>
              <ul style={{ listStyle: 'none', paddingLeft: 24, margin: 0, marginTop: 6, background: '#f0f4fa', borderLeft: '3px solid #1976d2', borderRadius: 4 }}>
                <li style={{ marginBottom: 8 }}>
                  <a href="/leave-tracking/daily" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 500, fontSize: 16, paddingLeft: 8, display: 'block' }}>
                    Daily Leave Tracking
                  </a>
                </li>
                <li>
                  <a href="/leave-tracking/monthly" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 500, fontSize: 16, paddingLeft: 8, display: 'block' }}>
                    Monthly Leave Tracking
                  </a>
                </li>
              </ul>
            </div>
          </li>
          <li style={{ marginBottom: 24 }}>
            <a href="/employee/login" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 600, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20, display: 'inline-block', verticalAlign: 'middle' }}>👤</span>
              Employee Login
            </a>
          </li>
        </ul>
      </nav>
      <div style={{ flex: 1 }}>
        <div className="dashboard-top-buttons">
        </div>
        {/* Highlighted Center Name and Code */}
        {user && (user.centreName || user.centerName || userCentreCode) && (
          <div style={{
            background: '#e3f2fd',
            padding: '18px 24px 10px 24px',
            borderRadius: '0 0 12px 12px',
            marginBottom: 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(25, 118, 210, 0.07)'
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1976d2', marginBottom: 2, textAlign: 'center' }}>
              {user.centreName || user.centerName || 'Center'}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#333', textAlign: 'center' }}>
              Center Code: <span style={{ color: '#1976d2' }}>{userCentreCode}</span>
            </div>
          </div>
        )}
        <div className="dashboard-container">
          <h1 className="dashboard-title">Center Management Dashboard</h1>

          {/* Statistics Overview */}
          <div className="stats-container">
            {/* <div className="stat-card">
              <div className="stat-icon">
                <i className="icon">🏢</i>
              </div>
              <div className="stat-value">{centers.length}</div>
              <div className="stat-label">Total Centers</div>
            </div> */}

            <div className="stat-card">
              <div className="stat-icon">
                <i className="icon">👥</i>
              </div>
              <div className="stat-value">{employees.length}</div>
              <div className="stat-label">Total Employees</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <i className="icon">✅</i>
              </div>
              <div className="stat-value">
                {employees.filter(emp => emp.status === 'Approved').length}
              </div>
              <div className="stat-label">Approved Employees</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <i className="icon">⏳</i>
              </div>
              <div className="stat-value">
                {employees.filter(emp => emp.status === 'Pending').length}
              </div>
              <div className="stat-label">Pending Employees</div>
            </div>
          </div>

          {/* Employee List */}
          <div className="card">
            <div className="card-content">
              <h2>Employee Records</h2>
              <input
                type="text"
                placeholder="Filter by Centre Code"
                value={centreCodeFilter}
                onChange={e => setCentreCodeFilter(e.target.value)}
                style={{ marginBottom: 16, padding: 8, borderRadius: 4, border: '1px solid #ccc', width: 220 }}
              />
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Name</th>
                      <th>Centre Code</th>
                      <th>Position</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Join Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(centreCodeFilter
                      ? employees.filter(emp => (emp.centreCode || emp.centerCode || '').toLowerCase().includes(centreCodeFilter.toLowerCase()))
                      : (userCentreCode
                          ? employees.filter(emp => (emp.centreCode || emp.centerCode || '').toLowerCase() === userCentreCode.toLowerCase())
                          : employees)
                    ).map((employee) => (
                      <tr key={employee._id}>
                        <td>{employee.employeeId || '-'}</td>
                        <td>{employee.firstName} {employee.lastName}</td>
                        <td>{employee.centreCode || employee.centerCode || '-'}</td>
                        <td>{employee.position || '-'}</td>
                        <td>{employee.email || '-'}</td>
                        <td>
                          <span className={`status-chip status-${(employee.status || 'Pending').toLowerCase()}`}>
                            {employee.status || 'Pending'}
                          </span>
                        </td>
                        <td>{employee.createdAt ? new Date(employee.createdAt).toLocaleDateString() : '-'}</td>
                        <td>
                          <button
                            className="icon-button"
                            onClick={() => handleViewEmployee(employee)}
                          >
                            <i className="icon">👁️</i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Employee Details Dialog */}
          {openDialog && selectedEmployee && (
            <div className="dialog-overlay">
              <div className="dialog">
                <h2 className="dialog-title">Employee Details</h2>
                <div className="dialog-content">
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <div>{selectedEmployee.firstName} {selectedEmployee.lastName}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Position</label>
                    <div>{selectedEmployee.position || '-'}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <div>{selectedEmployee.email || '-'}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <div>
                      <span className={`status-chip status-${(selectedEmployee.status || 'Pending').toLowerCase()}`}>
                        {selectedEmployee.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Documents</label>
                    <ul>
                      {(selectedEmployee.documents || []).length === 0 && <li>No documents uploaded</li>}
                      {(selectedEmployee.documents || []).map((doc, index) => (
                        <li key={index} style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                          <span>{doc.type || 'Document'}</span>
                          <span className="employee-doc-actions">
                            {doc.url && (
                              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="view-doc-btn">View</a>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <button className="edit-documents-btn" style={{marginTop:8}} onClick={() => setShowEditDocsModal(true)}>Edit Documents</button>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Validation Note</label>
                    <textarea
                      className="form-input"
                      value={validationNote}
                      onChange={(e) => setValidationNote(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <div className="dialog-actions">
                  <button
                    className="button button-secondary"
                    onClick={handleCloseDialog}
                  >
                    Close
                  </button>
                  <button
                    className="button button-primary"
                    onClick={handleApprove}
                  >
                    Approve
                  </button>
                  <button
                    className="button button-secondary"
                    onClick={handleReject}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Center Details Dialog */}
          {openDialog && selectedCenter && (
            <div className="dialog-overlay">
              <div className="dialog">
                <h2 className="dialog-title">Center Details</h2>
                <div className="dialog-content">
                  <div className="form-group">
                    <label className="form-label">Center Name</label>
                    <div>{selectedCenter.centreName}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Center Code</label>
                    <div>{selectedCenter.centreCode}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <div>{selectedCenter.username}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <div>{selectedCenter.email}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <div>
                      <span className={`status-chip status-${selectedCenter.role === 'admin' ? 'admin' : 'centre'}`}>{selectedCenter.role}</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Registration Date</label>
                    <div>{selectedCenter.createdAt ? new Date(selectedCenter.createdAt).toLocaleString() : '-'}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Updated</label>
                    <div>{selectedCenter.updatedAt ? new Date(selectedCenter.updatedAt).toLocaleString() : '-'}</div>
                  </div>
                </div>
                <div className="dialog-actions">
                  <button className="button button-secondary" onClick={handleCloseDialog}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Edit Documents Modal */}
          <EditDocumentsModal show={showEditDocsModal} onClose={() => setShowEditDocsModal(false)} employee={selectedEmployee} onSave={(docs, newDocs) => {
            // TODO: Connect to backend to save document changes
            setShowEditDocsModal(false);
          }} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 
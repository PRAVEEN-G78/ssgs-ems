import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';
import CentreLogin from '../Auth/CentreLogin';
import EmployeeLogin from '../Auth/EmployeeLogin';

function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saveError, setSaveError] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [editAdminDialogOpen, setEditAdminDialogOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: user?.name || '', email: user?.email || '', adminId: user?.adminId || '' });
  const [adminSaveError, setAdminSaveError] = useState('');
  const [adminSaveLoading, setAdminSaveLoading] = useState(false);
  const [centers, setCenters] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [openCenterDialog, setOpenCenterDialog] = useState(false);
  const [editCenterDialogOpen, setEditCenterDialogOpen] = useState(false);
  const [editCenter, setEditCenter] = useState(null);
  const [editCenterForm, setEditCenterForm] = useState({});
  const [centerSaveLoading, setCenterSaveLoading] = useState(false);
  const [centerSaveError, setCenterSaveError] = useState('');

  const [centerCodeFilter, setCenterCodeFilter] = useState("");
  const [employeeIdFilter, setEmployeeIdFilter] = useState("");
  const [editDocumentIndex, setEditDocumentIndex] = useState(null);
  const [editDocumentFile, setEditDocumentFile] = useState(null);
  const [addingDocument, setAddingDocument] = useState(false);
  const [newDocType, setNewDocType] = useState("");
  const [newDocFile, setNewDocFile] = useState(null);
  const [showCenterLogin, setShowCenterLogin] = useState(false);
  const [showEmployeeLogin, setShowEmployeeLogin] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(!!localStorage.getItem('originalAdmin'));

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/employees', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (res.ok) {
          const data = await res.json();
          setEmployees(data);
        } else {
          setEmployees([]);
        }
      } catch (err) {
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const fetchCenters = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/centers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
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

  useEffect(() => {
    fetchCenters();
  }, []);

  const handleEditClick = (employee) => {
    setEditEmployee(employee);
    setEditForm({ ...employee });
    setEditDialogOpen(true);
    setSaveError('');
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/employees', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || 'Failed to save changes');
        setSaveLoading(false);
        return;
      }
      setEmployees((prev) => prev.map(emp => emp._id === data._id ? data : emp));
      setEditDialogOpen(false);
      setEditEmployee(null);
    } catch (err) {
      setSaveError('Network error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setEditEmployee(null);
    setEditForm({});
    setSaveError('');
  };

  const handleDelete = async () => {
    if (!editEmployee) return;
    if (!window.confirm('Are you sure you want to delete this employee? This action cannot be undone.')) return;
    setSaveLoading(true);
    setSaveError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/employees/${editEmployee._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.error || 'Failed to delete employee');
        setSaveLoading(false);
        return;
      }
      setEmployees((prev) => prev.filter(emp => emp._id !== editEmployee._id));
      setEditDialogOpen(false);
      setEditEmployee(null);
    } catch (err) {
      setSaveError('Network error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAdminEditOpen = () => {
    setAdminForm({ name: user?.name || '', email: user?.email || '', adminId: user?.adminId || '' });
    setEditAdminDialogOpen(true);
    setAdminSaveError('');
  };

  const handleAdminEditChange = (e) => {
    setAdminForm({ ...adminForm, [e.target.name]: e.target.value });
  };

  const handleAdminEditSave = async (e) => {
    e.preventDefault();
    setAdminSaveLoading(true);
    setAdminSaveError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(adminForm)
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminSaveError(data.error || 'Failed to save changes');
        setAdminSaveLoading(false);
        return;
      }
      localStorage.setItem('user', JSON.stringify(data));
      setEditAdminDialogOpen(false);
    } catch (err) {
      setAdminSaveError('Network error');
    } finally {
      setAdminSaveLoading(false);
    }
  };

  const handleAdminEditDialogClose = () => {
    setEditAdminDialogOpen(false);
    setAdminSaveError('');
  };

  const handleViewCenter = (center) => {
    setSelectedCenter(center);
    setOpenCenterDialog(true);
  };

  const handleCloseCenterDialog = () => {
    setOpenCenterDialog(false);
    setSelectedCenter(null);
  };



  const handleEditCenterChange = (e) => {
    setEditCenterForm({ ...editCenterForm, [e.target.name]: e.target.value });
  };

  const handleEditCenterSave = async (e) => {
    e.preventDefault();
    setCenterSaveLoading(true);
    setCenterSaveError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/centers/${editCenter._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editCenterForm)
      });
      const data = await res.json();
      if (!res.ok) {
        setCenterSaveError(data.error || 'Failed to save changes');
        setCenterSaveLoading(false);
        return;
      }
      setCenters((prev) => prev.map(c => c._id === data._id ? data : c));
      setEditCenterDialogOpen(false);
      setEditCenter(null);
    } catch (err) {
      setCenterSaveError('Network error');
    } finally {
      setCenterSaveLoading(false);
    }
  };

  const handleEditCenterDialogClose = () => {
    setEditCenterDialogOpen(false);
    setEditCenter(null);
    setEditCenterForm({});
    setCenterSaveError('');
  };



  const handleApproveCenter = async () => {
    if (!editCenter) return;
    setCenterSaveLoading(true);
    setCenterSaveError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/centers/${editCenter._id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'Approved' })
      });
      const data = await res.json();
      if (!res.ok) {
        setCenterSaveError(data.error || 'Failed to approve center');
        setCenterSaveLoading(false);
        return;
      }
      setCenters((prev) => prev.map(c => c._id === data._id ? data : c));
      setEditCenterDialogOpen(false);
      setEditCenter(null);
    } catch (err) {
      setCenterSaveError('Network error');
    } finally {
      setCenterSaveLoading(false);
    }
  };

  const handleRejectCenter = async () => {
    if (!editCenter) return;
    setCenterSaveLoading(true);
    setCenterSaveError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/centers/${editCenter._id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'Rejected' })
      });
      const data = await res.json();
      if (!res.ok) {
        setCenterSaveError(data.error || 'Failed to reject center');
        setCenterSaveLoading(false);
        return;
      }
      setCenters((prev) => prev.map(c => c._id === data._id ? data : c));
      setEditCenterDialogOpen(false);
      setEditCenter(null);
    } catch (err) {
      setCenterSaveError('Network error');
    } finally {
      setCenterSaveLoading(false);
    }
  };

  const handleEditDocumentClick = (index) => {
    setEditDocumentIndex(index);
    setEditDocumentFile(null);
  };

  const handleCancelDocumentEdit = () => {
    setEditDocumentIndex(null);
    setEditDocumentFile(null);
  };

  const handleDocumentFileChange = (e, index) => {
    if (e.target.files && e.target.files[0]) {
      setEditDocumentFile(e.target.files[0]);
    }
  };

  const handleSaveDocumentEdit = async (index) => {
    if (!editDocumentFile) return;
    // Simulate upload and update document URL (replace with real upload logic)
    const url = URL.createObjectURL(editDocumentFile); // For demo only
    setEditEmployee(prev => {
      const docs = [...prev.documents];
      docs[index] = { ...docs[index], url };
      return { ...prev, documents: docs };
    });
    setEditDocumentIndex(null);
    setEditDocumentFile(null);
  };

  const handleAddDocumentClick = () => {
    setAddingDocument(true);
    setNewDocType("");
    setNewDocFile(null);
  };

  const handleCancelAddDocument = () => {
    setAddingDocument(false);
    setNewDocType("");
    setNewDocFile(null);
  };

  const handleNewDocTypeChange = (e) => setNewDocType(e.target.value);

  const handleNewDocFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setNewDocFile(e.target.files[0]);
  };

  const handleSaveNewDocument = () => {
    if (!newDocType || !newDocFile) return;
    const url = URL.createObjectURL(newDocFile); // Replace with real upload logic
    setEditEmployee(prev => ({
      ...prev,
      documents: [...(prev.documents || []), { type: newDocType, url }]
    }));
    setAddingDocument(false);
    setNewDocType("");
    setNewDocFile(null);
  };

  const handleRemoveDocument = (index) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    setEditEmployee(prev => {
      const docs = [...prev.documents];
      docs.splice(index, 1);
      return { ...prev, documents: docs };
    });
    if (editDocumentIndex === index) {
      setEditDocumentIndex(null);
      setEditDocumentFile(null);
    }
  };

  // Helper: Only super-admins can impersonate
  const isSuperAdmin = user?.role === 'super-admin';

  // Impersonation logic: store original admin session
  function handleImpersonate(userType, userObj) {
    if (!isImpersonating) {
      localStorage.setItem('originalAdmin', localStorage.getItem('user'));
    }
    localStorage.setItem('user', JSON.stringify(userObj));
    setIsImpersonating(true);
    window.location.reload();
  }

  // Restore admin session
  function handleBackToAdmin() {
    const original = localStorage.getItem('originalAdmin');
    if (original) {
      localStorage.setItem('user', original);
      localStorage.removeItem('originalAdmin');
      setIsImpersonating(false);
      window.location.reload();
    }
  }

  return (
    <div className="dashboard-layout" style={{ display: 'flex' }}>
      <nav className="sidebar" style={{ width: 220, minHeight: '100vh', background: '#f5f7fa', padding: '2rem 1rem', borderRight: '1px solid #e0e0e0' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li style={{ marginBottom: 24 }}>
            <a href="/admin-dashboard" style={{ textDecoration: 'none', color: '#333', fontWeight: 600, fontSize: 18 }}>
              Dashboard
            </a>
          </li>
          <li style={{ marginBottom: 24 }}>
            <button 
              style={{ 
                textDecoration: 'none', 
                color: '#1976d2', 
                fontWeight: 600, 
                fontSize: 18, 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                padding: 0
              }} 
              onClick={() => navigate('/login-selection')}
            >
              Login
            </button>
          </li>
          <li style={{ marginBottom: 24 }}>
            <button 
              style={{ 
                textDecoration: 'none', 
                color: '#1976d2', 
                fontWeight: 600, 
                fontSize: 18, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                padding: 0
              }} 
              onClick={() => {
              const input = document.getElementById('center-code-filter-input');
              if (input) {
                input.focus();
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                input.classList.add('highlight-input');
                setTimeout(() => input.classList.remove('highlight-input'), 1200);
              }
              }}
            >
              <span style={{ fontSize: 20, display: 'inline-block', verticalAlign: 'middle' }}>🔍</span>
              Center Code Search
            </button>
          </li>
        </ul>
      </nav>
      <div style={{ flex: 1 }}>
        <div className="dashboard-container">
          {/* Back to Admin button if impersonating */}
          {isImpersonating && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button className="button button-secondary" onClick={handleBackToAdmin}>Back to Admin</button>
            </div>
          )}
          {/* Only show impersonation options for super-admins */}
          {isSuperAdmin && !isImpersonating && (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'flex-end' }}>
              <button className="button button-primary" onClick={() => setShowCenterLogin(true)}>Login as Center</button>
              <button className="button button-primary" onClick={() => setShowEmployeeLogin(true)}>Login as Employee</button>
            </div>
          )}
          <h1 className="dashboard-title">Admin Dashboard</h1>
          {/* Overall Dashboard Summary */}
          <div className="stats-container" style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <div className="stat-card">
              <div className="stat-icon"><i className="icon">🏢</i></div>
              <div className="stat-value">{centers.length}</div>
              <div className="stat-label">Total Centers</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><i className="icon">👥</i></div>
              <div className="stat-value">{employees.length}</div>
              <div className="stat-label">Total Employees</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon"><i className="icon">✅</i></div>
              <div className="stat-value">{employees.filter(emp => emp.status === 'Approved').length}</div>
              <div className="stat-label">Approved Employees</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><i className="icon">⏳</i></div>
              <div className="stat-value">{employees.filter(emp => emp.status === 'Pending').length}</div>
              <div className="stat-label">Pending Employees</div>
            </div>
          </div>
          <div className="card">
            <div className="card-content">
              <h2>Welcome, {user?.name || 'Admin'}!</h2>
              <p style={{ margin: '16px 0' }}>This is your admin dashboard. Here you can manage the application, view statistics, and perform admin-specific actions.</p>
              <div style={{ marginTop: '24px' }}>
                <strong>Admin Info:</strong>
                <ul style={{ marginTop: '8px', lineHeight: '1.7' }}>
                  <li><b>Admin ID:</b> {user?.adminId}</li>
                  <li><b>Email:</b> {user?.email}</li>
                  <li><b>Role:</b> {user?.role}</li>
                  {user?.centreCode && (
                    <li><b>Centre Code:</b> {user.centreCode}</li>
                  )}
                </ul>
                <button className="button button-primary" style={{ marginTop: 16 }} onClick={handleAdminEditOpen}>
                  Edit Admin Profile
                </button>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: '2rem' }}>
            <div className="card-content">
              <h2>All Employees</h2>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <input
                  type="text"
                  placeholder="Filter by Employee ID"
                  value={employeeIdFilter}
                  onChange={e => setEmployeeIdFilter(e.target.value)}
                  style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', width: 220 }}
                />
                <input
                  type="text"
                  placeholder="Filter by Centre Code"
                  value={centerCodeFilter}
                  onChange={e => setCenterCodeFilter(e.target.value)}
                  style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', width: 220 }}
                />
              </div>
              {loading ? (
                <div className="loading"><div className="loading-spinner"></div></div>
              ) : (
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
                      {employees
                        .filter(emp =>
                          (!employeeIdFilter || (emp.employeeId || '').toLowerCase().includes(employeeIdFilter.toLowerCase())) &&
                          (!centerCodeFilter || (emp.centreCode || emp.centerCode || '').toLowerCase().includes(centerCodeFilter.toLowerCase()))
                        )
                        .map((employee) => (
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
                              <button className="icon-button" onClick={() => handleEditClick(employee)}>
                                <i className="icon">✏️</i>
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ marginTop: '2rem' }}>
            <div className="card-content">
              <h2>Registered Centers</h2>
              <input
                id="center-code-filter-input"
                type="text"
                placeholder="Filter by Center Code"
                value={centerCodeFilter}
                onChange={e => setCenterCodeFilter(e.target.value)}
                style={{ marginBottom: 16, padding: 8, borderRadius: 4, border: '1px solid #ccc', width: 220 }}
              />
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Center Name</th>
                      <th>Center Code</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Registration Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(centerCodeFilter
                      ? centers.filter(center => (center.centreCode || '').toLowerCase().includes(centerCodeFilter.toLowerCase()))
                      : centers
                    ).map((center) => (
                      <tr key={center._id}>
                        <td>{center.centreName}</td>
                        <td>{center.centreCode}</td>
                        <td>{center.username}</td>
                        <td>{center.email}</td>
                        <td>
                          <span className={`status-chip status-${center.role === 'admin' ? 'admin' : 'centre'}`}>{center.role}</span>
                        </td>
                        <td>{center.createdAt ? new Date(center.createdAt).toLocaleDateString() : '-'}</td>
                        <td>
                          <button className="icon-button" onClick={() => handleViewCenter(center)} title="View"><i className="icon">👁️</i></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Edit Employee Dialog */}
          {editDialogOpen && editEmployee && (
            <div className="dialog-overlay">
              <div className="dialog">
                <h2 className="dialog-title">Edit Employee</h2>
                <form className="dialog-content" onSubmit={handleEditSave}>
                  <div className="form-group">
                    <label className="form-label">Employee ID</label>
                    <input className="form-input" name="employeeId" value={editForm.employeeId || ''} readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Centre Code</label>
                    <input className="form-input" name="centreCode" value={editForm.centreCode || editEmployee.centreCode || editEmployee.centerCode || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Centre Name</label>
                    <input className="form-input" name="centreName" value={editForm.centreName || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input className="form-input" name="firstName" value={editForm.firstName || ''} onChange={handleEditChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input className="form-input" name="lastName" value={editForm.lastName || ''} onChange={handleEditChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Father Name</label>
                    <input className="form-input" name="fatherName" value={editForm.fatherName || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mother Name</label>
                    <input className="form-input" name="motherName" value={editForm.motherName || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-input" name="status" value={editForm.status || 'Pending'} onChange={handleEditChange}>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Validation Note</label>
                    <input className="form-input" name="validationNote" value={editForm.validationNote || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Highest Qualification</label>
                    <input className="form-input" name="highestQualification" value={editForm.highestQualification || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">DOB (Certificate)</label>
                    <input className="form-input" name="dobAsPerCertificate" type="date" value={editForm.dobAsPerCertificate ? editForm.dobAsPerCertificate.substring(0,10) : ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">DOB (Celebration)</label>
                    <input className="form-input" name="dobAsPerCelebration" type="date" value={editForm.dobAsPerCelebration ? editForm.dobAsPerCelebration.substring(0,10) : ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Marital Status</label>
                    <select className="form-input" name="maritalStatus" value={editForm.maritalStatus || ''} onChange={handleEditChange}>
                      <option value="">Select</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Spouse Name</label>
                    <input className="form-input" name="spouseName" value={editForm.spouseName || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Spouse DOB</label>
                    <input className="form-input" name="spouseDateOfBirth" type="date" value={editForm.spouseDateOfBirth ? editForm.spouseDateOfBirth.substring(0,10) : ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Wedding Date</label>
                    <input className="form-input" name="weddingDate" type="date" value={editForm.weddingDate ? editForm.weddingDate.substring(0,10) : ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Spouse Email</label>
                    <input className="form-input" name="spouseEmail" value={editForm.spouseEmail || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Blood Group</label>
                    <input className="form-input" name="bloodGroup" value={editForm.bloodGroup || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" name="email" type="email" value={editForm.email || ''} readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" name="phone" value={editForm.phone || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Address</label>
                    <input className="form-input" name="address" value={editForm.address || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input className="form-input" name="city" value={editForm.city || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input className="form-input" name="state" value={editForm.state || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pincode</label>
                    <input className="form-input" name="pincode" value={editForm.pincode || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Experience</label>
                    <input className="form-input" name="experience" value={editForm.experience || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Current Salary</label>
                    <input className="form-input" name="currentSalary" type="number" value={editForm.currentSalary || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Position</label>
                    <input className="form-input" name="position" value={editForm.position || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">UAN Number</label>
                    <input className="form-input" name="uanNumber" value={editForm.uanNumber || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ESI Number</label>
                    <input className="form-input" name="esiNumber" value={editForm.esiNumber || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Aadhar Number</label>
                    <input className="form-input" name="aadharNumber" value={editForm.aadharNumber || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Names as on Aadhar</label>
                    <input className="form-input" name="namesAsOnAadhar" value={editForm.namesAsOnAadhar || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">PAN Number</label>
                    <input className="form-input" name="panNumber" value={editForm.panNumber || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Names as on PAN</label>
                    <input className="form-input" name="namesAsOnPan" value={editForm.namesAsOnPan || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bank Account Number</label>
                    <input className="form-input" name="bankAccountNumber" value={editForm.bankAccountNumber || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Names as per Bank Details</label>
                    <input className="form-input" name="namesAsPerBankDetails" value={editForm.namesAsPerBankDetails || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bank Name</label>
                    <input className="form-input" name="bankName" value={editForm.bankName || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Branch Name</label>
                    <input className="form-input" name="branchName" value={editForm.branchName || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">IFSC Code</label>
                    <input className="form-input" name="ifscCode" value={editForm.ifscCode || ''} onChange={handleEditChange} />
                  </div>
                  {/* Documents Section for Admin */}
                  <div className="form-group">
                    <label className="form-label">Documents</label>
                    <ul className="document-list-view">
                      {Array.isArray(editEmployee.documents) && editEmployee.documents.length > 0 ? (
                        editEmployee.documents.map((doc, i) => (
                          <li key={i}>
                            <span>{doc.type}</span>
                            <span className="document-actions">
                              {doc.url ? (
                                <a href={doc.url} className="file-link" target="_blank" rel="noopener noreferrer" style={{ marginRight: 8 }}>
                                  View
                                </a>
                              ) : (
                                <span style={{ marginRight: 8, color: '#aaa' }}>Not uploaded</span>
                              )}
                              <button
                                type="button"
                                className="button button-secondary"
                                style={{ fontSize: '0.92em', padding: '2px 8px' }}
                                onClick={() => handleEditDocumentClick(i)}
                              >
                                Edit
                              </button>
                              {editDocumentIndex !== i && (
                                <button
                                  type="button"
                                  className="button button-secondary"
                                  style={{ fontSize: '1.1em', padding: '2px 8px', color: 'red', borderColor: 'red', marginLeft: 4 }}
                                  title="Remove Document"
                                  onClick={() => handleRemoveDocument(i)}
                                >
                                  ✖️
                                </button>
                              )}
                              {editDocumentIndex === i && (
                                <>
                                  <input
                                    type="file"
                                    accept="application/pdf,image/*"
                                    className="document-file-input compact-file-input"
                                    onChange={e => handleDocumentFileChange(e, i)}
                                    style={{ width: 110, fontSize: '0.90em', padding: '2px 4px' }}
                                  />
                                  <button
                                    type="button"
                                    className="button button-primary"
                                    style={{ fontSize: '0.92em', padding: '2px 8px' }}
                                    onClick={() => handleSaveDocumentEdit(i)}
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    className="button button-secondary"
                                    style={{ fontSize: '0.92em', padding: '2px 8px', color: 'red', borderColor: 'red' }}
                                    onClick={handleCancelDocumentEdit}
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                            </span>
                          </li>
                        ))
                      ) : (
                        <li>No documents uploaded</li>
                      )}
                    </ul>
                  </div>
                  {!addingDocument ? (
                    <button
                      type="button"
                      className="button button-primary"
                      style={{ marginTop: 10, fontSize: '0.95em', padding: '4px 16px' }}
                      onClick={handleAddDocumentClick}
                    >
                      + Add Document
                    </button>
                  ) : (
                    <div className="document-actions" style={{ marginTop: 10 }}>
                      <input
                        type="text"
                        placeholder="Document Type"
                        value={newDocType}
                        onChange={handleNewDocTypeChange}
                        style={{ width: 140, marginRight: 8, fontSize: '0.95em', padding: '2px 6px', borderRadius: 4, border: '1px solid #bdbdbd' }}
                      />
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        className="document-file-input compact-file-input"
                        onChange={handleNewDocFileChange}
                        style={{ width: 110, fontSize: '0.90em', padding: '2px 4px', marginRight: 8 }}
                      />
                      <button
                        type="button"
                        className="button button-primary"
                        style={{ fontSize: '0.92em', padding: '2px 8px' }}
                        onClick={handleSaveNewDocument}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="button button-secondary"
                        style={{ fontSize: '0.92em', padding: '2px 8px', color: 'red', borderColor: 'red' }}
                        onClick={handleCancelAddDocument}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {saveError && <div className="login-error bouncy-error" style={{ marginBottom: 8 }}>{saveError}</div>}
                  <div className="dialog-actions">
                    <button type="button" className="button button-secondary" onClick={handleEditDialogClose}>
                      Cancel
                    </button>
                    <button type="submit" className="button button-primary" disabled={saveLoading}>
                      {saveLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" className="button button-secondary" style={{ color: 'red', borderColor: 'red' }} onClick={handleDelete} disabled={saveLoading}>
                      Delete
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Admin Dialog */}
          {editAdminDialogOpen && (
            <div className="dialog-overlay">
              <div className="dialog">
                <h2 className="dialog-title">Edit Admin Profile</h2>
                <form className="dialog-content" onSubmit={handleAdminEditSave}>
                  <div className="form-group">
                    <label className="form-label">Admin ID</label>
                    <input
                      className="form-input"
                      name="adminId"
                      value={adminForm.adminId}
                      readOnly
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input
                      className="form-input"
                      name="name"
                      value={adminForm.name}
                      onChange={handleAdminEditChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      className="form-input"
                      name="email"
                      type="email"
                      value={adminForm.email}
                      onChange={handleAdminEditChange}
                      required
                    />
                  </div>
                  {adminSaveError && <div className="login-error bouncy-error" style={{ marginBottom: 8 }}>{adminSaveError}</div>}
                  <div className="dialog-actions">
                    <button type="button" className="button button-secondary" onClick={handleAdminEditDialogClose}>
                      Cancel
                    </button>
                    <button type="submit" className="button button-primary" disabled={adminSaveLoading}>
                      {adminSaveLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Center Details Dialog */}
          {openCenterDialog && selectedCenter && (
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
                      <span className={`status-chip status-${selectedCenter.role === 'admin' ? 'admin' : 'centre'}`}>
                        {selectedCenter.role}
                      </span>
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
                  <button
                    className="button button-secondary"
                    onClick={handleCloseCenterDialog}
                  >
                    Close
                  </button>
                  <button
                    className="button button-primary"
                    onClick={() => {
                      setEditCenter(selectedCenter);
                      setEditCenterForm({ ...selectedCenter });
                      setEditCenterDialogOpen(true);
                      setOpenCenterDialog(false);
                    }}
                    style={{ marginLeft: 8 }}
                  >
                    Edit
                  </button>
                  {selectedCenter.status !== 'Approved' && (
                    <button
                      className="button button-primary"
                      style={{ backgroundColor: 'green', marginLeft: 8 }}
                      onClick={async () => {
                        setEditCenter(selectedCenter);
                        await handleApproveCenter();
                        setOpenCenterDialog(false);
                      }}
                    >
                      Approve
                    </button>
                  )}
                  {selectedCenter.status !== 'Rejected' && (
                    <button
                      className="button button-secondary"
                      style={{ color: 'orange', borderColor: 'orange', marginLeft: 8 }}
                      onClick={async () => {
                        setEditCenter(selectedCenter);
                        await handleRejectCenter();
                        setOpenCenterDialog(false);
                      }}
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Edit Center Dialog */}
          {editCenterDialogOpen && editCenter && (
            <div className="dialog-overlay">
              <div className="dialog">
                <h2 className="dialog-title">Edit Center</h2>
                <form className="dialog-content" onSubmit={handleEditCenterSave}>
                  <div className="form-group">
                    <label className="form-label">Center Name</label>
                    <input className="form-input" name="centreName" value={editCenterForm.centreName || ''} onChange={handleEditCenterChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Center Code</label>
                    <input className="form-input" name="centreCode" value={editCenterForm.centreCode || ''} onChange={handleEditCenterChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input className="form-input" name="username" value={editCenterForm.username || ''} onChange={handleEditCenterChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" name="email" type="email" value={editCenterForm.email || ''} onChange={handleEditCenterChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <input className="form-input" name="role" value={editCenterForm.role || ''} onChange={handleEditCenterChange} required />
                  </div>
                  {centerSaveError && <div className="login-error bouncy-error" style={{ marginBottom: 8 }}>{centerSaveError}</div>}
                  <div className="dialog-actions">
                    <button type="button" className="button button-secondary" onClick={handleEditCenterDialogClose}>Cancel</button>
                    <button type="submit" className="button button-primary" disabled={centerSaveLoading}>{centerSaveLoading ? 'Saving...' : 'Save Changes'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
        {/* Center Login Modal */}
        {showCenterLogin && isSuperAdmin && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <button style={{ float: 'right', fontSize: 20, border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => setShowCenterLogin(false)}>✖️</button>
              <CentreLogin
                onSuccess={userObj => {
                  setShowCenterLogin(false);
                  handleImpersonate('center', userObj);
                }}
              />
            </div>
          </div>
        )}
        {/* Employee Login Modal */}
        {showEmployeeLogin && isSuperAdmin && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <button style={{ float: 'right', fontSize: 20, border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => setShowEmployeeLogin(false)}>✖️</button>
              <EmployeeLogin
                onSuccess={userObj => {
                  setShowEmployeeLogin(false);
                  handleImpersonate('employee', userObj);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard; 
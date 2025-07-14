// API Configuration
const API_CONFIG = {
  // Development
  development: {
    baseURL: 'http://localhost:5000',
    timeout: 30000
  },
  // Production (update this when deploying)
  production: {
    baseURL: 'https://your-production-server.com',
    timeout: 30000
  }
};

// Get current environment
const environment = process.env.NODE_ENV || 'development';

// Export the appropriate configuration
export const API_BASE_URL = API_CONFIG[environment].baseURL;
export const API_TIMEOUT = API_CONFIG[environment].timeout;

// Helper function to build API URLs
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

// Common API endpoints
export const API_ENDPOINTS = {
  // Authentication
  EMPLOYEE_LOGIN: '/api/employee/login',
  EMPLOYEE_REGISTER: '/api/employee/register',
  CENTRE_LOGIN: '/api/centre/login',
  CENTRE_REGISTER: '/api/centre/register',
  ADMIN_LOGIN: '/api/admin/login',
  
  // Password Reset
  EMPLOYEE_REQUEST_RESET: '/api/employee/request-reset',
  EMPLOYEE_VERIFY_RESET: '/api/employee/verify-reset',
  CENTRE_REQUEST_RESET: '/api/centre/request-reset',
  CENTRE_VERIFY_RESET: '/api/centre/verify-reset',
  
  // Employee Management
  EMPLOYEES: '/api/employees',
  EMPLOYEE_RECORD: '/api/employee/record',
  EMPLOYEE_INFO: '/api/employee/info',
  EMPLOYEE_ONBOARDING_STATUS: '/api/employee/onboarding-status',
  EMPLOYEE_REFRESH: '/api/employee/refresh',
  
  // Center Management
  CENTERS: '/api/centers',
  CENTRE_REFRESH: '/api/centre/refresh',
  
  // Admin Management
  ADMIN_REFRESH: '/api/admin/refresh',
  ADMIN_PROFILE: '/api/admin/profile',
  
  // Attendance
  ATTENDANCE: '/api/attendance',
  ATTENDANCE_VALIDATE: '/api/attendance/validate',
  
  // Face Authentication
  FACE_AUTH_VALIDATE: '/api/face-auth/validate',
  FACE_AUTH_HEALTH: '/api/face-auth/health',
  
  // File Uploads
  UPLOAD_ONBOARDING: '/api/upload',
  UPLOAD_PASSPORT: '/api/upload-passport',
  DELETE_ONBOARDING: '/api/upload',
  DELETE_PASSPORT: '/api/upload-passport',
};

// Helper function for API calls
export const apiCall = async (endpoint, options = {}) => {
  const url = buildApiUrl(endpoint);
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  // Add authorization header if token exists
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}; 
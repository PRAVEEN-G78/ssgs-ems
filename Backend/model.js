import mongoose from 'mongoose';
import { loginDB, employeeDB } from './db.js';

const EmployeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  centerCode: { type: String },
  firstName: { type: String, required: true },
  lastName: { type: String },
  fatherName: { type: String },
  motherName: { type: String },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  validationNote: { type: String },
  highestQualification: { type: String },
  dobAsPerCertificate: { type: Date },
  dobAsPerCelebration: { type: Date },
  maritalStatus: { type: String, enum: ['', 'Single', 'Married', 'Divorced', 'Widowed'], default: 'Single' },
  spouseName: { type: String },
  spouseDateOfBirth: { type: Date },
  weddingDate: { type: Date },
  spouseEmail: { type: String },
  bloodGroup: { type: String },
  email: { type: String, unique: true },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: Number },
  experience: { type: String },
  currentSalary: { type: Number },
  position: { type: String },
  uanNumber: { type: String },
  esiNumber: { type: String },
  aadharNumber: { type: String },
  namesAsOnAadhar: { type: String },
  panNumber: { type: String },
  namesAsOnPan: { type: String },
  bankAccountNumber: { type: String },
  namesAsPerBankDetails: { type: String },
  bankName: { type: String },
  branchName: { type: String },
  ifscCode: { type: String },
  documents: [
    {
      type: { type: String },
      url: { type: String },
      key: { type: String }
    }
  ],
  emergencyContact: [
    {
      name: { type: String },
      relationship: { type: String },
      phone: { type: String }
    }
  ]
}, { timestamps: true });

const EmployeeLoginSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  centerCode: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['employee', 'admin'], default: 'employee' },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
}, { timestamps: true });

const CentreLoginSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  centreName: { type: String, required: true },
  centreCode: { type: String, required: true, unique: true },
  role: { type: String, enum: ['centre', 'admin'], default: 'centre' },
}, { timestamps: true });

const AdminLoginSchema = new mongoose.Schema({
  adminId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['admin', 'super-admin'], default: 'admin' }
}, { timestamps: true });

// Attendance Schema
const AttendanceSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    date: { type: String, required: true }, // Store as YYYY-MM-DD string
    checkIn: { type: String }, // Store as HH:MM string
    checkOut: { type: String }, // Store as HH:MM string
    status: {
      type: String,
      enum: ["Present", "Absent", "On Leave", "Half Day", "Late"],
      default: "Present",
    },
    workingHours: { type: Number, default: 0 }, // Store working hours as number
    overtime: { type: Number, default: 0 }, // Store overtime hours as number
  },
  { timestamps: true }
);

// Leave Schema
const LeaveSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  type: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  reason: { type: String },
  appliedDate: { type: String, required: true },
  approvedDate: { type: String },
  approvedBy: { type: String },
  duration: { type: Number, required: true },
  comments: { type: String }
}, { timestamps: true });

// Use employeeDB for Employee model (employeeRecords database)
export const Employee = employeeDB.model('Employee', EmployeeSchema);

// Use loginDB for Employee Login model (logins database)
export const EmployeeLogin = loginDB.model('EmployeeLogin', EmployeeLoginSchema, 'employeeLogins');

// Use loginDB for Centre Login model (logins database)
export const CentreLogin = loginDB.model('CentreLogin', CentreLoginSchema, 'centreLogins');

export const AdminLogin = loginDB.model('AdminLogin', AdminLoginSchema, 'adminLogins');

// Use employeeDB for Attendance model (attendance collection)
export const Attendance = employeeDB.model('Attendance', AttendanceSchema, 'attendance');

// Use employeeDB for Leave model (leaves collection)
export const Leave = employeeDB.model('Leave', LeaveSchema, 'leaves');

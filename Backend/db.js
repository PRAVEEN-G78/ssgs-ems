import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI environment variable is not set');
  process.exit(1);
}

// Create separate connections for different databases
const createConnection = (dbName) => {
  return mongoose.createConnection(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: dbName
  });
};

// Create connections for both databases
const loginDB = createConnection('logins');
const employeeDB = createConnection('employeeRecords');

// Handle connection events for login database
loginDB.on('connected', () => {
  console.log('MongoDB logins database connected...');
});

loginDB.on('error', (err) => {
  console.error('MongoDB logins connection error:', err);
});

// Handle connection events for employee database
employeeDB.on('connected', () => {
  console.log('MongoDB employeeRecords database connected...');
});

employeeDB.on('error', (err) => {
  console.error('MongoDB employeeRecords connection error:', err);
});

const connectDB = async () => {
  try {
    // Test both connections
    await Promise.all([
      loginDB.asPromise(),
      employeeDB.asPromise()
    ]);
    console.log('All MongoDB databases connected successfully');
  } catch (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
};

export { connectDB, loginDB, employeeDB }; 
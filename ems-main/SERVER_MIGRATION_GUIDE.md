# Server Migration Guide

## Overview
This guide explains how to move your server folder to a separate location and update the frontend configuration accordingly.

## ✅ **Server Independence Confirmed**

Your server is **completely self-contained** and can be moved without any dependency issues:

### **Self-Contained Files**
```
server/
├── package.json          ✅ All dependencies listed
├── package-lock.json     ✅ Dependency lock file
├── server.js            ✅ Main server file
├── db.js                ✅ Database connection
├── model.js             ✅ MongoDB models
├── .env                 ✅ Environment variables
├── uploads/             ✅ File upload directory
├── public/              ✅ Static files
└── node_modules/        ✅ Installed dependencies
```

### **No External Dependencies**
- ✅ Uses relative imports (`./db.js`, `./model.js`)
- ✅ All dependencies in package.json
- ✅ Environment variables in .env file
- ✅ No references to parent folder structure

## 🚀 **Migration Steps**

### **Step 1: Choose New Location**
```bash
# Example locations:
C:\Users\srinu\OneDrive\Desktop\backend\
C:\Users\srinu\OneDrive\Desktop\ems-backend\
C:\Users\srinu\Projects\ems-server\
```

### **Step 2: Copy Server Files**
```bash
# Copy entire server folder to new location
cp -r ems-main/server/* C:\Users\srinu\OneDrive\Desktop\backend\
```

### **Step 3: Update Frontend Configuration**

#### **Option A: Update API Configuration (Recommended)**
Edit `ems-main/src/config/api.js`:
```javascript
const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:5000', // Keep same if port unchanged
    timeout: 30000
  },
  production: {
    baseURL: 'https://your-production-server.com',
    timeout: 30000
  }
};
```

#### **Option B: Update All Frontend Files**
If you change the server port or URL, update all references:
```bash
# Search and replace in all JSX files
find ems-main/src -name "*.jsx" -exec sed -i 's/localhost:5000/your-new-url/g' {} \;
```

### **Step 4: Test the Migration**

#### **Start Server in New Location**
```bash
cd C:\Users\srinu\OneDrive\Desktop\backend
npm install  # Install dependencies
npm start    # Start server
```

#### **Test Frontend**
```bash
cd ems-main
npm start    # Start frontend
```

## 🔧 **Configuration Options**

### **Option 1: Same Port (Easiest)**
- Keep server on port 5000
- No frontend changes needed
- Just move the folder

### **Option 2: Different Port**
- Change server port in `server.js`
- Update frontend API configuration
- Example: `const PORT = process.env.PORT || 3001;`

### **Option 3: Different Host**
- Run server on different machine/VM
- Update frontend to point to new host
- Example: `http://192.168.1.100:5000`

## 📁 **Recommended Project Structure**

### **Option A: Separate Repositories**
```
Desktop/
├── ems-frontend/          # React frontend
│   ├── src/
│   ├── package.json
│   └── ...
└── ems-backend/           # Node.js server
    ├── server.js
    ├── package.json
    └── ...
```

### **Option B: Monorepo Structure**
```
ems-project/
├── frontend/              # React app
├── backend/               # Node.js server
├── shared/                # Shared utilities
└── README.md
```

## 🛠️ **Environment Variables**

### **Required .env File**
```env
# Database
MONGODB_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret

# AWS
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
S3_BUCKET=your_s3_bucket_name

# Server
PORT=5000
NODE_ENV=development
```

## 🔄 **Development Workflow**

### **Before Migration**
```bash
# Terminal 1: Frontend
cd ems-main
npm start

# Terminal 2: Backend
cd ems-main/server
npm start
```

### **After Migration**
```bash
# Terminal 1: Frontend
cd ems-main
npm start

# Terminal 2: Backend
cd C:\Users\srinu\OneDrive\Desktop\backend
npm start
```

## ✅ **Benefits of Separation**

### **1. Better Organization**
- Clear separation of concerns
- Easier to maintain and scale
- Independent version control

### **2. Team Development**
- Frontend and backend teams can work independently
- Different deployment cycles
- Separate testing strategies

### **3. Deployment Flexibility**
- Deploy frontend to CDN (Vercel, Netlify)
- Deploy backend to cloud (AWS, Heroku, DigitalOcean)
- Independent scaling

### **4. Technology Flexibility**
- Can change frontend framework without affecting backend
- Can change backend language/framework without affecting frontend
- Microservices architecture possibility

## 🚨 **Important Considerations**

### **CORS Configuration**
Ensure your server allows requests from the frontend:
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
```

### **Environment Variables**
- Copy `.env` file to new server location
- Update any absolute paths in environment variables
- Ensure database connection strings are correct

### **File Uploads**
- Ensure `uploads/` directory exists in new location
- Update any absolute file paths in server code
- Test file upload functionality

### **Static Files**
- Copy `public/` folder to new server location
- Test face authentication page: `http://localhost:5000/face-auth`

## 🔍 **Troubleshooting**

### **Common Issues**

#### **1. Module Not Found**
```bash
# Solution: Install dependencies in new location
cd new-server-location
npm install
```

#### **2. Database Connection Failed**
```bash
# Solution: Check .env file and MongoDB connection
# Ensure MONGODB_URI is correct
```

#### **3. CORS Errors**
```bash
# Solution: Update CORS configuration in server.js
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}));
```

#### **4. Port Already in Use**
```bash
# Solution: Change port in server.js
const PORT = process.env.PORT || 3001;
```

## 📋 **Migration Checklist**

- [ ] Copy server folder to new location
- [ ] Copy `.env` file to new location
- [ ] Install dependencies in new location
- [ ] Test server starts successfully
- [ ] Update frontend API configuration (if needed)
- [ ] Test all API endpoints
- [ ] Test file uploads
- [ ] Test face authentication
- [ ] Update documentation
- [ ] Update deployment scripts (if any)

## 🎉 **Success Indicators**

- ✅ Server starts without errors
- ✅ Frontend connects to backend successfully
- ✅ All API endpoints work
- ✅ File uploads work
- ✅ Face authentication works
- ✅ Database operations work
- ✅ No CORS errors in browser console 
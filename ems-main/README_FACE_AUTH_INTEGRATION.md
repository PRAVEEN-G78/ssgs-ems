# Face Authentication Integration

## Overview
The face authentication functionality has been successfully integrated into the main server, eliminating the need for a separate FastAPI server.

## What's Been Integrated

### 1. **New Endpoints Added to Main Server**
- `POST /api/face-auth/validate` - Face and location validation
- `GET /api/face-auth/health` - Health check for face authentication service
- `GET /face-auth` - Face authentication web interface

### 2. **Features**
- **Face Recognition**: Uses AWS Rekognition to compare captured images with stored employee photos
- **Location Validation**: Geo-fence checking to ensure user is within authorized area
- **Real-time Processing**: Immediate validation results
- **Web Interface**: User-friendly HTML interface for face authentication

## How to Use

### 1. **Access the Face Authentication Interface**
```
http://localhost:5000/face-auth
```

### 2. **API Endpoints**
```javascript
// Face validation
POST http://localhost:5000/api/face-auth/validate
Content-Type: multipart/form-data

// Health check
GET http://localhost:5000/api/face-auth/health
```

### 3. **Required Environment Variables**
Make sure these are set in your `.env` file:
```
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
S3_BUCKET=your_s3_bucket_name
```

### 4. **S3 Bucket Structure**
Ensure your S3 bucket has employee photos in the `emp-imges/` folder:
```
your-bucket/
└── emp-imges/
    ├── employee1.jpg
    ├── employee2.jpg
    └── ...
```

## Integration Benefits

### ✅ **Single Server**
- No need to run separate FastAPI server
- All functionality in one Node.js server
- Simplified deployment and maintenance

### ✅ **Unified Authentication**
- Same JWT tokens and session management
- Consistent API structure
- Integrated with existing user management

### ✅ **Better Performance**
- Reduced network overhead
- Single point of failure
- Easier monitoring and logging

## Usage Examples

### Frontend Integration
```javascript
// Example: Using face authentication in your React app
const validateFace = async (imageBlob, latitude, longitude) => {
  const formData = new FormData();
  formData.append('file', imageBlob, 'photo.jpg');
  formData.append('latitude', latitude);
  formData.append('longitude', longitude);

  const response = await fetch('http://localhost:5000/api/face-auth/validate', {
    method: 'POST',
    body: formData
  });

  return await response.json();
};
```

### Response Format
```json
{
  "face_matched": true,
  "matched_with": "emp-imges/employee123.jpg",
  "similarity": 95.5,
  "location_ok": true,
  "distance_m": 45.2,
  "status": "✅ Face matched & inside geo-fence"
}
```

## Migration from Separate Server

### Before (Separate FastAPI Server)
- Run FastAPI server on port 8000
- Run Node.js server on port 5000
- Two separate processes to manage

### After (Integrated)
- Single Node.js server on port 5000
- All functionality in one place
- Simplified development and deployment

## Testing

1. **Start the server**:
   ```bash
   cd ems-main/server
   npm start
   ```

2. **Access face authentication**:
   ```
   http://localhost:5000/face-auth
   ```

3. **Test API directly**:
   ```bash
   curl -X GET http://localhost:5000/api/face-auth/health
   ```

## Troubleshooting

### Common Issues
1. **AWS Credentials**: Ensure AWS credentials are properly configured
2. **S3 Bucket**: Verify bucket exists and contains employee photos
3. **CORS**: CORS is enabled for all origins in development
4. **File Uploads**: Ensure `uploads/` directory exists and is writable

### Error Messages
- `"No employee photos found in S3"` - Upload employee photos to S3
- `"S3 error"` - Check AWS credentials and bucket configuration
- `"Face not matched"` - Employee photo not found or similarity too low

## Security Considerations

- **Geo-fencing**: Location validation prevents remote authentication
- **Similarity Threshold**: 90% similarity required for face match
- **File Cleanup**: Uploaded files are automatically deleted after processing
- **HTTPS**: Use HTTPS in production for secure data transmission 
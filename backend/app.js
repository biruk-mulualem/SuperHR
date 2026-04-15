// backend/app.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();

// Debug: Check if env loaded
console.log('=== ENVIRONMENT VARIABLES ===');
console.log('JWT_SECRET loaded:', process.env.JWT_SECRET ? 'YES' : 'NO');
console.log('JWT_SECRET value:', process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 10) + '...' : 'MISSING');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('===============================');

// ============================================================================
// CREATE UPLOADS DIRECTORY IF NOT EXISTS
// ============================================================================
const uploadDirs = [
  'uploads/profiles',
  'uploads/documents/id_cards',
  'uploads/documents/cv_resumes',
  'uploads/documents/degrees',
  'uploads/documents/guarantees'
];

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// ============================================================================
// IMPORT ROUTES
// ============================================================================
const userRoutes = require('./routes/userRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const settingRoutes = require('./routes/settingRoutes');
// ============================================================================
// GLOBAL MIDDLEWARE
// ============================================================================
// REMOVED requestId, requestMonitor, trackError - they don't exist
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logger (optional)
app.use((req, res, next) => {
  console.log(`📤 ${req.method} ${req.url}`);
  next();
});


// Add this temporarily to your employeeRoutes.js or app.js for debugging
app.get('/api/debug/files/:employeeId', async (req, res) => {
  const { EmployeeDocument } = require('./models');
  const documents = await EmployeeDocument.findAll({
    where: { employeeId: req.params.employeeId },
    attributes: ['documentId', 'documentType', 'fileUrl']
  });
  res.json({
    success: true,
    baseUrl: `${req.protocol}://${req.get('host')}`,
    documents
  });
});

// ============================================================================
// STATIC FILES (for uploaded images and documents)
// ============================================================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================================
// ROUTES
// ============================================================================
app.use('/api/users', userRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/settings', settingRoutes);

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// ============================================================================
// GLOBAL ERROR HANDLER
// ============================================================================
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  
  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ 
      success: false, 
      error: 'File too large. Max size is 5MB.' 
    });
  }
  
  if (err.message && err.message.includes('Only image files')) {
    return res.status(400).json({ 
      success: false, 
      error: err.message 
    });
  }
  
  if (err.message && err.message.includes('Only PDF, DOC, DOCX')) {
    return res.status(400).json({ 
      success: false, 
      error: err.message 
    });
  }
  
  res.status(500).json({ 
    success: false, 
    error: 'Something went wrong!' 
  });
});

// ============================================================================
// 404 HANDLER
// ============================================================================
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: `Endpoint not found: ${req.method} ${req.url}` 
  });
});

module.exports = app;
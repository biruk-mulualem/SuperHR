const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Create all required directories on startup
const createDirectories = () => {
  const dirs = [
    'uploads/profiles',
    'uploads/documents/id_cards',
    'uploads/documents/cv_resumes',
    'uploads/documents/degrees',
    'uploads/documents/guarantees'
  ];
  dirs.forEach(dir => ensureDirectoryExists(dir));
};
createDirectories();

// ============================================================================
// PROFILE PICTURE STORAGE - FIXED
// ============================================================================
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/profiles/';
    ensureDirectoryExists(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {  // ✅ FIXED: (req, file, cb) not (req, res, cb)
    const employeeCode = req.body.employeeCode || req.params.id || Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${employeeCode}-profile${ext}`);
  }
});

// ============================================================================
// DOCUMENT STORAGE - FIXED
// ============================================================================
const getDocumentFolder = (documentType) => {
  const folders = {
    'id_card': 'id_cards',
    'cv': 'cv_resumes',
    'degree': 'degrees',
    'guarantee_letter': 'guarantees'
  };
  return folders[documentType] || 'others';
};

const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const documentType = req.params.type || req.body.documentType || 'other';
    const folder = getDocumentFolder(documentType);
    const dir = `uploads/documents/${folder}/`;
    ensureDirectoryExists(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {  // ✅ FIXED: (req, file, cb) not (req, res, cb)
    const employeeCode = req.body.employeeCode || req.params.id || Date.now();
    const documentType = req.params.type || req.body.documentType || 'document';
    const ext = path.extname(file.originalname);
    
    if (documentType === 'guarantee_letter') {
      const counter = Date.now();
      cb(null, `${employeeCode}-guarantee-${counter}${ext}`);
    } else {
      cb(null, `${employeeCode}-${documentType}${ext}`);
    }
  }
});

// ============================================================================
// FILE FILTERS
// ============================================================================
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

const documentFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|jpg|jpeg|png|xls|xlsx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, DOCX, XLS, XLSX, and image files are allowed'));
  }
};

// ============================================================================
// UPLOAD CONFIGURATIONS
// ============================================================================
const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: imageFilter
});

const uploadDocument = multer({
  storage: documentStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: documentFilter
});

// ============================================================================
// MIDDLEWARE EXPORTS
// ============================================================================
const uploadSingleProfile = (req, res, next) => {
  console.log('=== uploadSingleProfile called ===');
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Request URL:', req.originalUrl);
  console.log('Request method:', req.method);
  
  uploadProfile.single('profilePicture')(req, res, (err) => {
    if (err) {
      console.error('Multer error details:', err);
      return res.status(400).json({ success: false, error: err.message });
    }
    console.log('Multer success - req.file:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    } : 'NO FILE');
    console.log('req.body after multer:', req.body);
    next();
  });
};

const uploadSingleDocument = (req, res, next) => {
  uploadDocument.single('document')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    next();
  });
};

const uploadMultipleDocuments = (req, res, next) => {
  uploadDocument.array('documents', 10)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    next();
  });
};






















// Add to your existing uploadConfig.js file

// ============================================================================
// ATTENDANCE IMPORT STORAGE
// ============================================================================
const attendanceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/attendance/';
    ensureDirectoryExists(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'attendance-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const attendanceFileFilter = (req, file, cb) => {
  const allowedTypes = /csv|xlsx|xls/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV and Excel files are allowed (.csv, .xlsx, .xls)'));
  }
};

const uploadAttendance = multer({
  storage: attendanceStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: attendanceFileFilter
});

const uploadSingleAttendance = (req, res, next) => {
  uploadAttendance.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    next();
  });
};

// Export the new upload middleware
module.exports = {
  uploadSingleProfile,
  uploadSingleDocument,
  uploadMultipleDocuments,
  uploadProfile,
  uploadDocument,
  uploadSingleAttendance,  // Add this
  uploadAttendance          // Add this
};


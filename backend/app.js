// backend/app.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const app = express();

// Debug: Check if env loaded
console.log("=== ENVIRONMENT VARIABLES ===");
console.log("JWT_SECRET loaded:", process.env.JWT_SECRET ? "YES" : "NO");
console.log(
  "JWT_SECRET value:",
  process.env.JWT_SECRET
    ? process.env.JWT_SECRET.substring(0, 10) + "..."
    : "MISSING",
);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);
console.log("===============================");

// ============================================================================
// CREATE ALL UPLOADS DIRECTORY IF NOT EXISTS
// ============================================================================
const uploadDirs = [
  // Profile pictures
  "uploads/profiles",
  
  // Basic documents
  "uploads/documents/national_id",
  "uploads/documents/spouse",
  "uploads/documents/children",
  "uploads/documents/education",
  "uploads/documents/training",
  "uploads/documents/work_experience",
  "uploads/documents/guarantees",
  "uploads/documents/parent_support",
  "uploads/documents/nationality",
  "uploads/documents/health",
  "uploads/documents/legal",
  
  // Legacy document folders (keep for existing files)
  "uploads/documents/id_cards",
  "uploads/documents/cv_resumes",
  "uploads/documents/degrees",
  
  // Attendance
  "uploads/attendance/",
  

 // Item specifications
  "uploads/items/specifications",

    // ============================================
  // STORE BALANCE - ADD THIS
  // ============================================
  "uploads/balances/",
  "uploads/balances/imports",
  "uploads/balances/exports",

  // Temp uploads
  "uploads/temp/"
];

// Serve static files from uploads directory
app.use("/uploads", express.static("uploads"));

uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// ============================================================================
// IMPORT ROUTES
// ============================================================================
const userRoutes = require("./routes/userRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const settingRoutes = require("./routes/settingRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const payrollRoutes = require("./routes/payrollRoutes");
const penalityRoutes = require("./routes/penalityRoutes");
const storeRoutes  = require("./routes/storeRoutes");
const penaltySummaryRoutes = require('./routes/penaltySummaryRoutes');
const itemRoutes=require('./routes/itemRoutes');
const groupRoutes = require('./routes/groupRoutes');
const storeToStoreRelationshipRoutes = require('./routes/storeToStoreRelationshipRoutes');
const itemRequestRoutes = require('./routes/itemRequestRoutes');


const balanceRoutes = require('./routes/balanceRoutes');

// Charity module 
const charityTeamRoutes        = require("./routes/charity/teamRoutes");
const charityBeneficiaryRoutes = require("./routes/charity/beneficiaryRoutes");
const charitySettingRoutes     = require("./routes/charity/settingRoutes");
const charityDashboardRoutes   = require("./routes/charity/dashboardRoutes");
const backupRoutes = require('./routes/backupRoutes');
const letterTemplateRoutes = require("./routes/letterTemplateRoutes");

// ============================================================================
// GLOBAL MIDDLEWARE
// ============================================================================
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Simple request logger
app.use((req, res, next) => {
  console.log(`📤 ${req.method} ${req.url}`);
  next();
});

// Debug endpoint (keep as is)
app.get("/api/debug/files/:employeeId", async (req, res) => {
  const { EmployeeDocument } = require("./models");
  const documents = await EmployeeDocument.findAll({
    where: { employeeId: req.params.employeeId },
    attributes: ["documentId", "documentType", "fileUrl"],
  });
  res.json({
    success: true,
    baseUrl: `${req.protocol}://${req.get("host")}`,
    documents,
  });
});

// ============================================================================
// STATIC FILES (for uploaded images and documents)
// ============================================================================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ============================================================================
// ROUTES
// ============================================================================
app.use("/api/users", userRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/penalties", penalityRoutes);
app.use('/api/penalty-summary', penaltySummaryRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/store-to-store-relationships', storeToStoreRelationshipRoutes);

// Charity Module Routes
app.use("/api/charity/teams",        charityTeamRoutes);
app.use("/api/charity/beneficiaries",charityBeneficiaryRoutes);
app.use("/api/charity/settings",     charitySettingRoutes);
app.use("/api/charity/dashboard",    charityDashboardRoutes);
app.use("/api/letter-templates", letterTemplateRoutes);


app.use('/api/item-requests', itemRequestRoutes);
app.use('/api/balances', balanceRoutes);



// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ============================================================================
// GLOBAL ERROR HANDLER
// ============================================================================
app.use((err, req, res, next) => {
  console.error("Global error:", err);

  // Handle multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      error: "File too large. Max size is 5MB.",
    });
  }

  if (err.message && err.message.includes("Only image files")) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  if (err.message && err.message.includes("Only PDF, DOC, DOCX")) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  res.status(500).json({
    success: false,
    error: "Something went wrong!",
  });
});

// ============================================================================
// START CRON JOBS (Only in production/development, not in test)
// ============================================================================
if (process.env.NODE_ENV !== "test") {
  try {
    const { startAttendanceJobs } = require("./jobs");
    startAttendanceJobs();
  } catch (error) {
    console.error("Failed to start cron jobs:", error.message);
  }

  try {
    const { startScheduledBackup } = require("./utils/scheduledBackup");
    startScheduledBackup();
  } catch (error) {
    console.error("Failed to start scheduled backup:", error.message);
  }
}

// ============================================================================
// 404 HANDLER
// ============================================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.url}`,
  });
});

module.exports = app;
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
console.log("PUBLIC_BASE_URL:", process.env.PUBLIC_BASE_URL);
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
  
  // ========== NEW: OTHER DOCUMENTS ==========
  "uploads/documents/employment_letters",
  "uploads/documents/other_documents",
  
  // Legacy document folders (keep for existing files)
  "uploads/documents/id_cards",
  "uploads/documents/cv_resumes",
  "uploads/documents/degrees",
  
  // Attendance
  "uploads/attendance/",
  
  // Item specifications
  "uploads/items/specifications",

  // Store Balance
  "uploads/balances/",
  "uploads/balances/imports",
  "uploads/balances/exports",

  // Temp uploads
  "uploads/temp/",

  // ========== NEW: BACKUP DIRECTORY ==========
  "uploads/backups/",

  // ========== NEW: POST IMAGES ==========
  "uploads/posts",
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
const transactionRoutes = require('./routes/transactionRoutes');
const auditRoutes = require('./routes/auditRoutes');
const balanceRoutes = require('./routes/balanceRoutes');
const itemCostRoutes = require('./routes/itemCostRoutes');
const StoreDashboardRoutes = require('./routes/StoreDashboardRoutes');
const checkerDashboardRoutes=require('./routes/checkerDashboardRoutes');
const costDashboardRoutes = require('./routes/costDashboardRoutes');
const stockCardRoutes = require('./routes/stockCardRoutes');
const finishedGoodRoutes = require('./routes/finishedGoodRoutes');
const convertedBalanceRoutes = require('./routes/convertedBalanceRoutes');
const purchaseFollowUpRoutes = require('./routes/purchaseFollowUpRoutes');
// ========== NEW: BACKUP ROUTES ==========
const backupRoutes = require("./routes/backupRoutes");
const formulationRoutes = require('./routes/formulationRoutes');
const orderRoutes = require('./routes/orderRoutes');
const purchasingGroupRoutes = require("./routes/purchasingGroupRoutes");
const purchaseRequestRoutes = require('./routes/purchaseRequestRoutes');

// ==========Mobile Route ==========
const mobilePurchaserRoutes = require('./routes/Mobile/mobilePurchaserRoutes');
const mobileStoreListRoutes = require('./routes/Mobile/mobileStoreListRoutes');
const mobileItemListRoutes = require('./routes/Mobile/mobileItemListRoutes');
const mobileLowStockRoutes = require('./routes/Mobile/mobileLowStockRoutes');
const mobileManagerBalanceAudit = require('./routes/Mobile/mobileManagerBalanceAudit');
const mobileManagerStoreDashboardRoutes = require('./routes/Mobile/mobileManagerStoreDashboardRoutes');
const mobileManagerDashboardRoutes = require('./routes/Mobile/mobileManagerDashboardRoutes');
const mobileDetailRoutes = require('./routes/Mobile/mobileDetailRoutes');
const mobileNotificationRoutes = require('./routes/Mobile/mobileNotificationRoutes');
app.use('/api/mobile/notifications', mobileNotificationRoutes);
// ========== NEW: Posts / Groups mobile routes ==========
const mobileGroupRoutes = require('./routes/Mobile/mobileGroupRoutes');
const mobilePostRoutes  = require('./routes/Mobile/mobilePostRoutes');

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
app.use('/api/groups', groupRoutes);
app.use('/api/store-to-store-relationships', storeToStoreRelationshipRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/item-requests', itemRequestRoutes);
app.use('/api/balances', balanceRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/item-costs', itemCostRoutes);
app.use('/api/store-dashboard', StoreDashboardRoutes);
app.use('/api/cost-dashboard', costDashboardRoutes);
app.use('/api/checker-dashboard', checkerDashboardRoutes);
app.use('/api/stock-card', stockCardRoutes);
app.use('/api/finished-goods', finishedGoodRoutes);
app.use('/api/formulations', formulationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/converted-balances', convertedBalanceRoutes);
app.use('/api/purchasing-groups', purchasingGroupRoutes);
app.use('/api/purchase-follow-ups', purchaseFollowUpRoutes);
// ========== NEW: BACKUP ROUTES ==========
app.use("/api/backup", backupRoutes);
app.use('/api/purchase-requests', purchaseRequestRoutes);
// ========== NEW: Mobile Routes ==========
app.use('/api/mobile/manager-dashboard', mobileManagerDashboardRoutes);
app.use('/api/mobile/purchaser', mobilePurchaserRoutes);
app.use('/api/mobile/store-list', mobileStoreListRoutes);
app.use('/api/mobile/item-list', mobileItemListRoutes);
app.use('/api/mobile/low-stock', mobileLowStockRoutes);
app.use('/api/mobile/manager/balance-audit', mobileManagerBalanceAudit);
app.use('/api/mobile/manager/store-dashboard', mobileManagerStoreDashboardRoutes);
app.use('/api/mobile', mobileDetailRoutes);

// ========== NEW: Posts / Groups ==========
app.use('/api/mobile/groups', mobileGroupRoutes);
app.use('/api/mobile/posts',  mobilePostRoutes);

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

// ─── TEMPORARY DEBUG ROUTE — REMOVE AFTER DEBUGGING ───
app.get('/api/debug/files', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const dir = path.join(process.cwd(), 'uploads', 'purchase-requests', 'approved');

  let files = [];
  let error = null;
  try {
    files = fs.readdirSync(dir).map((name) => {
      const stat = fs.statSync(path.join(dir, name));
      return { name, size: stat.size };
    });
  } catch (e) {
    error = e.message;
  }

  res.json({
    cwd: process.cwd(),
    lookingIn: dir,
    dirExists: fs.existsSync(dir),
    fileCount: files.length,
    files: files.slice(-20),
    error,
  });
});

app.get('/api/debug/file-exists', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const target = req.query.path || '';
  const full = path.join(process.cwd(), 'uploads', target);
  res.json({
    cwd: process.cwd(),
    lookingFor: full,
    exists: fs.existsSync(full),
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
// START CRON JOBS
// ============================================================================
if (process.env.NODE_ENV !== "test") {
  try {
    const { startAttendanceJobs } = require("./jobs");
    startAttendanceJobs();
  } catch (error) {
    console.error("Failed to start cron jobs:", error.message);
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
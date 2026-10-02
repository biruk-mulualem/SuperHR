// backend/jobs/index.js
'use strict';

const { startStockAlertJob, runStockAlertScan } = require('./stockAlertJob');

module.exports = {
  startStockAlertJob,
  runStockAlertScan,
};
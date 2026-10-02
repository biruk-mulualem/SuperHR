// backend/jobs/stockAlertJob.js
'use strict';

const cron = require('node-cron');
const { runStockAlertCheck } = require('../services/stockAlertService');

// ⚠️ TEST ONLY — switch back to '*/30 * * * *' for production
const CRON_SCHEDULE = '*/30 * * * *';

async function runStockAlertScan() {
  const startTime = Date.now();
  try {
    const result = await runStockAlertCheck();
    const durationMs = Date.now() - startTime;

    console.log(
      `🔔 stockAlertJob done: checked ${result.checked}, ` +
        `triggered ${result.triggered.length}, ` +
        `fired ${result.fired ? 1 : 0} summary in ${durationMs}ms`
    );
  } catch (e) {
    console.error('❌ stockAlertJob failed:', e);
  }
}

function startStockAlertJob() {
  cron.schedule(CRON_SCHEDULE, runStockAlertScan);
  console.log(`🔔 stockAlertJob scheduled (${CRON_SCHEDULE})`);
}

module.exports = {
  startStockAlertJob,
  runStockAlertScan,
};
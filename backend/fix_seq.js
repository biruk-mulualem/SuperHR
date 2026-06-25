require('dotenv').config();
const { sequelize } = require('./models');

async function fixSeq() {
  try {
    const q = "SELECT setval('system_settings_setting_id_seq', COALESCE((SELECT MAX(setting_id) FROM system_settings), 1) + 1, false)";
    await sequelize.query(q);
    console.log("Sequence fixed!");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

fixSeq();

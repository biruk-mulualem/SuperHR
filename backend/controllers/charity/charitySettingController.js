'use strict';
const { CharitySetting, CharityBeneficiary, CharityLog, User, sequelize } = require('../../models');

const logAction = async (action, module, targetId, details, userId) => {
  try {
    await CharityLog.create({ action, module, targetId, details, userId });
  } catch (err) {
    console.error('Charity Log Error:', err);
  }
};

// ─── GET /  — get main settings row (creates default if missing) ──────────────
exports.getSettings = async (req, res) => {
  try {
    let setting = await CharitySetting.findOne({
      where: { settingKey: 'main' },
      include: [{ model: User, as: 'lastUpdatedBy', attributes: ['userId', 'fullName'] }],
    });

    if (!setting) {
      setting = await CharitySetting.create({
        settingKey: 'main',
        distributionRelease: [],
        defaults: { 
          monthly_allocation: 3000, 
          payment_method: 'bank',
          beneficiaries_special_cases: ['Elderly', 'Disabled', 'Single Parent']
        }
      });
    }

    const settingData = setting.get({ plain: true });

    // Back-fill missing special cases key for existing data
    if (settingData.defaults && !settingData.defaults.beneficiaries_special_cases) {
      settingData.defaults.beneficiaries_special_cases = [];
    }

    // Fetch usage counts for each release
    if (settingData.distributionRelease && settingData.distributionRelease.length > 0) {
      const [counts] = await sequelize.query(`
        SELECT 
          (elem->>'distribution_release_id')::bigint as release_id, 
          COUNT(*)::int as usage_count
        FROM charity_beneficiaries, jsonb_array_elements(deliveries) as elem
        WHERE deleted_at IS NULL
        GROUP BY (elem->>'distribution_release_id')::bigint
      `);

      const countMap = counts.reduce((acc, row) => {
        acc[row.release_id] = row.usage_count;
        return acc;
      }, {});

      settingData.distributionRelease = settingData.distributionRelease.map(rel => ({
        ...rel,
        usageCount: countMap[rel.distribution_release_id] || 0
      }));
    }

    res.json({ success: true, data: settingData });
  } catch (err) {
    console.error('getSettings:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── PUT /  — update settings (admin/charity_admin only) ───────────────────────
exports.updateSettings = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    if (!['admin', 'charity_admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Only admins can update settings' });
    }

    const { distributionRelease, defaults } = req.body;

    let setting = await CharitySetting.findOne({ where: { settingKey: 'main' }, transaction: t });

    // ── Completion and Removal Checks ──────────────────────────────────────
    if (setting && distributionRelease !== undefined) {
      const oldReleases = setting.distributionRelease || [];
      const newIds = (distributionRelease || []).map(r => r.distribution_release_id);
      
      // 1. Removal Check
      const removedReleases = oldReleases.filter(r => !newIds.includes(r.distribution_release_id));
      for (const rel of removedReleases) {
        const [usage] = await sequelize.query(
          `SELECT beneficiary_id FROM charity_beneficiaries 
           WHERE deleted_at IS NULL AND deliveries @> :match LIMIT 1`,
          {
            replacements: { match: JSON.stringify([{ distribution_release_id: rel.distribution_release_id }]) },
            transaction: t
          }
        );
        if (usage.length > 0) {
          await t.rollback();
          return res.status(400).json({ success: false, error: `Cannot remove release "${new Date(rel.date).toLocaleDateString()}" linked to deliveries.` });
        }
      }

      // 2. Completion Check (Only if a release is being transitioned to is_completed: true)
      for (const newRel of distributionRelease) {
        const oldRel = oldReleases.find(r => r.distribution_release_id === newRel.distribution_release_id);
        
        // If it's now completed, but wasn't before
        if (newRel.is_completed && (!oldRel || !oldRel.is_completed)) {
          // Count total active beneficiaries
          const activeCount = await CharityBeneficiary.count({ where: { isActive: true }, transaction: t });
          
          // Count active beneficiaries with a delivery note for this release
          const [delivered] = await sequelize.query(
            `SELECT COUNT(*)::int as count FROM charity_beneficiaries 
             WHERE is_active = true AND deleted_at IS NULL 
             AND deliveries @> :match`,
            {
              replacements: { match: JSON.stringify([{ distribution_release_id: newRel.distribution_release_id }]) },
              transaction: t
            }
          );
          
          const deliveredCount = delivered[0].count;

          if (deliveredCount < activeCount) {
            await t.rollback();
            return res.status(400).json({ 
              success: false, 
              error: `Cannot complete release. Only ${deliveredCount} of ${activeCount} active beneficiaries have delivery notes for "${new Date(newRel.date).toLocaleDateString()}".` 
            });
          }
        }
      }
    }

    if (!setting) {
      setting = await CharitySetting.create(
        {
          settingKey: 'main',
          distributionRelease: distributionRelease || [],
          defaults: defaults || { monthly_allocation: 3000, payment_method: 'bank' },
          updatedBy: req.user.userId
        },
        { transaction: t }
      );
    } else {
      const updates = { updatedBy: req.user.userId };
      if (distributionRelease !== undefined) updates.distributionRelease = distributionRelease;
      if (defaults            !== undefined) updates.defaults            = defaults;
      await setting.update(updates, { transaction: t });
    }

    await logAction('UPDATE', 'setting', setting.settingId, { distributionRelease, defaults }, req.user.userId);

    await t.commit();
    res.json({ success: true, message: 'Settings updated', data: setting });
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

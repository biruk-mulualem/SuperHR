// utils/itemStatusInfo.js
"use strict";
const db = require("../models");
const { ItemStatusRule, ItemStatusTake, Store, Department, User } = db;
const { Op } = require("sequelize");

function computeRuleStatus(rule, takes, at = new Date()) {
  const freq = Number(rule.frequencyDays) || 0;
  const maxQty = Number(rule.maxQuantity) || 0;
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  // ---- 1. Normalize: drop invalid dates, sort newest-first ----
  const normalized = (takes || [])
    .map((t) => ({
      date: t.takenAt,
      quantity: Number(t.quantity) || 0,
      uomCode: t.uomCode || null,
    }))
    .filter((t) => t.date && !isNaN(new Date(t.date).getTime()))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const last = normalized[0] || null;

  // ---- 2. THRESHOLD window = calendar days [midnight(freq days ago), end of today] ----
  //   Calendar-day anchoring guarantees a take recorded at ANY time today counts.
  const windowStart = new Date(at);
  windowStart.setHours(0, 0, 0, 0);
  windowStart.setDate(windowStart.getDate() - freq);

  const windowEnd = new Date(at);
  windowEnd.setHours(23, 59, 59, 999);

  const inWindow = normalized.filter((t) => {
    const d = new Date(t.date);
    return d >= windowStart && d <= windowEnd;
  });

  const total = inWindow.reduce((s, t) => s + t.quantity, 0);
  const isBlocked = total >= maxQty;

  // ---- 3. RELEASE date = last take + freq days ----
  //   "We take 100 today → we can take again 7 days from today."
  let nextAllowedAt = null;
  if (isBlocked && last) {
    nextAllowedAt = new Date(new Date(last.date).getTime() + freq * MS_PER_DAY);
  }

  const scope = rule.departmentId ? "department" : "store";
  return {
    ruleId: rule.id,
    scope,
    scopeName:
      scope === "department"
        ? rule.department?.name || `Department #${rule.departmentId}`
        : rule.store?.name || `Store #${rule.storeId}`,
    maxQuantity: maxQty,
    frequencyDays: freq,
    totalInWindow: total,
    isBlocked,
    nextAllowedAt: nextAllowedAt ? nextAllowedAt.toISOString() : null,
    lastTakenAt: last ? last.date : null,
    lastTakenQuantity: last ? last.quantity : 0,
    uomCode: rule.uomCode || last?.uomCode || null,
    reason: rule.reason || null,
  };
}

async function getStatusInfoForRequest(request) {
  if (!request?.supplyingStoreId) return {};

  const items = request.items || [];
  if (items.length === 0) return {};

  const supplyingStoreId = parseInt(request.supplyingStoreId);

  // Resolve requester's department (only needed for department rules)
  let requesterDeptId = request.requestingDepartmentId || null;
  if (!requesterDeptId && request.requestedById) {
    const u = await User.findByPk(request.requestedById, {
      attributes: ["userId", "departmentId"],
    });
    requesterDeptId = u?.departmentId || null;
  }

  const out = {}; // { [itemId]: summary[] }

  for (const it of items) {
    const itemId = parseInt(it.itemId);
    if (!itemId) continue;

    const scopeClauses = [{ storeId: supplyingStoreId }];
    if (requesterDeptId) scopeClauses.push({ departmentId: requesterDeptId });

    const rules = await ItemStatusRule.findAll({
      where: {
        itemId,
        status: "Active",
        [Op.or]: scopeClauses,
      },
      include: [
        { model: Store, as: "store", attributes: ["name", "code"] },
        { model: Department, as: "department", attributes: ["name", "code"] },
      ],
    });

    if (rules.length === 0) {
      out[itemId] = [];
      continue;
    }

    const summaries = [];
    for (const rule of rules) {
      const takes = await ItemStatusTake.findAll({
        where: { ruleId: rule.id },
        attributes: ["takenAt", "quantity", "uomCode"],
        order: [["takenAt", "DESC"]],
      });
      summaries.push(computeRuleStatus(rule, takes));
    }
    out[itemId] = summaries;
  }

  return out;
}

module.exports = { getStatusInfoForRequest, computeRuleStatus };
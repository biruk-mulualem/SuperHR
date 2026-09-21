// backend/utils/buildFileUrl.js
const BASE = (process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');

function buildFileUrl(relativePath) {
  if (!relativePath) return null;
  if (/^https?:\/\//i.test(relativePath)) return relativePath;
  const p = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${BASE}${p}`;
}

module.exports = { buildFileUrl };
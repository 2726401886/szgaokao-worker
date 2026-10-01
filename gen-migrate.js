// 从 Node 版 codes.json 生成 D1 迁移 SQL
const fs = require('fs');
const list = JSON.parse(fs.readFileSync('C:/Users/27264/WorkBuddy/2026-09-26-21-53-51/szgaokao-web/data/codes.json', 'utf8'));
const esc = s => String(s == null ? '' : s).replace(/'/g, "''");
const vals = list.map(c => {
  const usedBy = Array.isArray(c.usedBy) ? c.usedBy : (c.usedBy ? [c.usedBy] : []);
  const acts = usedBy.length;
  const days = c.plan === 'annual' ? 365 : (c.plan === 'semester' ? 180 : 'NULL');
  return "('" + esc(c.code) + "','" + esc(c.plan) + "'," + days + "," + (c.maxActs || 1) + "," + acts + ",'" + esc(JSON.stringify(usedBy)) + "'," + (c.usedAt || 'NULL') + "," + (c.createdAt || Date.now()) + ")";
});
const sql = "-- 迁移现有授权码（保留已用状态）\nINSERT OR REPLACE INTO codes (code, plan, days, max_acts, acts, used_by, used_at, created_at) VALUES\n" + vals.join(',\n') + ';';
fs.writeFileSync(__dirname + '/migrate-codes.sql', sql);
console.log(sql);

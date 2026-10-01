// 选项随机打乱：正确答案内容不变，只调位置；按"每部分内均衡"分配答案位置
// 策略：每个 part 内生成打乱过的均衡目标序列（如 10 题 → 3/3/4 分布随机排列），学生无法摸规律
const fs = require('fs');
const crypto = require('crypto');
const ri = (n) => crypto.randomInt(n);
function shuffledSeq(n) {
  const seq = [];
  for (let i = 0; i < n; i++) seq.push(i % 3);
  for (let i = seq.length - 1; i > 0; i--) { const j = ri(i + 1); [seq[i], seq[j]] = [seq[j], seq[i]]; }
  return seq;
}

const quiz = JSON.parse(fs.readFileSync(__dirname + '/src/quiz.json', 'utf8'));
let total = 0, checked = 0;
const before = {}, after = {};

quiz.volumes.forEach(v => {
  (v.parts || []).forEach(p => {
    const qs = (p.questions || []).filter(x => Array.isArray(x.options) && typeof x.answer === 'number' && x.options.length === 3);
    if (!qs.length) return;
    const seq = shuffledSeq(qs.length);
    qs.forEach((x, i) => {
      const pos = seq[i];
      const beforeKey = 'ABC'[x.answer]; before[beforeKey] = (before[beforeKey] || 0) + 1;
      const correct = x.options[x.answer];
      const distractors = x.options.filter((_, k) => k !== x.answer);
      for (let k = distractors.length - 1; k > 0; k--) { const j = ri(k + 1); [distractors[k], distractors[j]] = [distractors[j], distractors[k]]; }
      const next = [];
      let d = 0;
      for (let s = 0; s < 3; s++) next.push(s === pos ? correct : distractors[d++]);
      x.options = next;
      x.answer = pos;
      const afterKey = 'ABC'[x.answer]; after[afterKey] = (after[afterKey] || 0) + 1;
      // 自校验：正确答案内容必须保持不变
      if (x.options[x.answer] === correct) checked++;
      total++;
    });
  });
});

fs.writeFileSync(__dirname + '/src/quiz.json', JSON.stringify(quiz, null, 2));
console.log('打乱题数:', total, '| 正确内容保持不变:', checked, total === checked ? '✓ 全部通过' : '✗ 有错误!');
console.log('打乱前答案分布:', JSON.stringify(before));
console.log('打乱后答案分布:', JSON.stringify(after));

// 按卷×部分细分明细（确认每部分都均衡）
const detail = {};
quiz.volumes.forEach(v => {
  (v.parts || []).forEach(p => {
    const qs = (p.questions || []).filter(x => typeof x.answer === 'number');
    if (!qs.length) return;
    const c = { A: 0, B: 0, C: 0 };
    qs.forEach(x => c['ABC'[x.answer]]++);
    detail[v.id + '-P' + p.part] = c;
  });
});
Object.entries(detail).forEach(([k, c]) => console.log(k, JSON.stringify(c)));

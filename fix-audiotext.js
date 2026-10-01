// 修复 quiz.json：Part A/B/D 的 audioText 被误写成音频路径，从音频脚本 markdown 找回原文
const fs = require('fs');
const M = 'C:/Users/27264/WorkBuddy/2026-09-26-21-53-51/english-edu-company/03交付素材库/听说试卷包';
const quiz = JSON.parse(fs.readFileSync(__dirname + '/src/quiz.json', 'utf8'));

function extractSection(md, title) {
  // 兼容 "### Part A" 与 "**Part A" 两种标题格式：按 Part X 关键字分段
  const re = /Part\s+([A-E])\b/g;
  const starts = {};
  let m;
  while ((m = re.exec(md))) { if (!(m[1] in starts)) starts[m[1]] = m.index; }
  const order = Object.keys(starts).sort((a, b) => starts[a] - starts[b]);
  const i = order.indexOf(title.split(' ')[1]);
  if (i < 0) return '';
  const from = starts[title.split(' ')[1]];
  const to = i + 1 < order.length ? starts[order[i + 1]] : md.length;
  return md.slice(from, to);
}

let stats = { words: 0, sents: 0, monos: 0, patchedA: 0, patchedB: 0, patchedD: 0 };
quiz.volumes.forEach(v => {
  const num = v.id.replace('v', ''); // 01..06
  const md = fs.readFileSync(`${M}/中考听说专项-试卷${num}-音频脚本与生词表.md`, 'utf8');

  // Part A：表格行 | N | word | ...
  const secA = extractSection(md, 'Part A');
  const words = [];
  (secA.match(/^\|\s*\d+\s*\|\s*([A-Za-z][^|\n]*)/gm) || []).forEach(line => {
    const w = line.split('|')[2].trim();
    words.push(w);
  });
  stats.words += words.length;

  // Part B：编号句，去掉 → 后面的连读提示
  const secB = extractSection(md, 'Part B');
  const sents = [];
  (secB.match(/^\d+\.\s*.+$/gm) || []).forEach(line => {
    let s = line.replace(/^\d+\.\s*/, '').split('→')[0].trim();
    sents.push(s);
  });
  stats.sents += sents.length;

  // Part D：优先取引号中的独白；无引号则取正文（去 markdown 符号）
  const secD = extractSection(md, 'Part D');
  const dm = secD.match(/"([^"]+)"/);
  let mono = dm ? dm[1] : '';
  if (!mono) {
    mono = secD.replace(/^Part\s+D[^\n]*\n?/, '')
      .replace(/\*\*/g, '').replace(/[#>*`]/g, '')
      .replace(/\s+/g, ' ').trim();
  }
  if (mono) stats.monos++;

  // Part C：对话行 "- C1 W: ... M: ..." → 按双空格拆成两句
  const secC = extractSection(md, 'Part C');
  const dias = [];
  (secC.match(/C\d+\s+[WM]:[^\n]*/g) || []).forEach(line => {
    const body = line.replace(/^C\d+\s+/, '').trim();
    const turns = body.split(/\s{2,}(?=M:)/).map(s => s.trim()).filter(Boolean);
    dias.push(turns.length > 1 ? turns : body);
  });
  stats.dias = (stats.dias || 0) + dias.length;

  // 回填
  (v.parts || []).forEach(p => {
    const part = String(p.part || '').toUpperCase();
    const qs = (p.questions || []).slice().sort((a, b) => a.id.localeCompare(b.id));
    qs.forEach((q, i) => {
      const at = Array.isArray(q.audioText) ? q.audioText.join(' ') : String(q.audioText || '');
      if (!/\/audio\/|\.mp3/.test(at)) return; // 只修被路径污染的
      if (part === 'A' && words[i]) { q.audioText = words[i]; stats.patchedA++; }
      else if (part === 'B' && sents[i]) { q.audioText = sents[i]; stats.patchedB++; }
      else if (part === 'C' && dias[i]) { q.audioText = dias[i]; stats.patchedC = (stats.patchedC || 0) + 1; }
      else if (part === 'D' && mono) { q.audioText = mono; stats.patchedD++; }
    });
  });
});

fs.writeFileSync(__dirname + '/src/quiz.json', JSON.stringify(quiz, null, 2));
console.log('脚本提取：A词=' + stats.words + ' B句=' + stats.sents + ' D独白=' + stats.monos);
console.log('回填修复：A=' + stats.patchedA + ' B=' + stats.patchedB + ' D=' + stats.patchedD);

// 复检：还有没有路径残留
let bad = 0;
quiz.volumes.forEach(v => v.parts.forEach(p => (p.questions || []).forEach(x => {
  const at = Array.isArray(x.audioText) ? x.audioText.join(' ') : String(x.audioText ?? '');
  if (/\/audio\/|\.mp3/.test(at)) bad++;
})));
console.log('复检路径残留：' + bad);

// 抽样对照
const v1 = quiz.volumes[0];
v1.parts.forEach(p => {
  const qs = (p.questions || []).slice().sort((a, b) => a.id.localeCompare(b.id));
  if (['A', 'B'].includes(String(p.part).toUpperCase())) {
    console.log('卷01 Part' + p.part + ' 抽样: ' + qs[0].id + ' -> ' + String(qs[0].audioText).slice(0, 50));
  }
  if (String(p.part).toUpperCase() === 'D') {
    console.log('卷01 PartD 抽样: ' + qs[0].id + ' -> ' + String(qs[0].audioText).slice(0, 50) + '...');
  }
});

// 顺带检查答案分布（内容质量提示）
const dist = {};
quiz.volumes.forEach(v => v.parts.forEach(p => (p.questions || []).forEach(x => {
  if (typeof x.answer === 'number') dist[x.answer] = (dist[x.answer] || 0) + 1;
})));
console.log('全库答案分布(下标:次数):', JSON.stringify(dist));

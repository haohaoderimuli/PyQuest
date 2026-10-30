/**
 * 静态资源自检（不需要浏览器，毫秒级）
 *
 *   node tests/check_assets.mjs
 *
 * 它防的是这类"改了代码没改数据"的事故：
 *   - 关卡声明的包，lock 里有但 wheel 没下载到 → 进关直接 ModuleNotFoundError
 *   - 包清单漏了某个依赖 → 下载进度算不准，或者少下一个包
 *   - PKG_SIZE 表没覆盖新加的包 → 进度条分母是 0，直接不动
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PYODIDE = path.join(ROOT, 'pyodide');

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const js = html.match(/<script>([\s\S]*?)<\/script>/)[1];

// 从页面里抠出 PKG_SIZE 和关卡声明的 packages
const sizeSrc = js.match(/const PKG_SIZE = \{([\s\S]*?)\};/)[1];
const PKG_SIZE = {};
for (const m of sizeSrc.matchAll(/'([^']+)':\s*([\d.]+)/g)) PKG_SIZE[m[1]] = parseFloat(m[2]);

const wanted = new Set();
for (const m of js.matchAll(/packages:\s*\[([^\]]*)\]/g)) {
  for (const q of m[1].matchAll(/'([^']+)'/g)) wanted.add(q[1]);
}

const lock = JSON.parse(fs.readFileSync(path.join(PYODIDE, 'pyodide-lock.json'), 'utf8'));
const pkgs = lock.packages;

const fail = [];
const need = new Set();
const stack = [...wanted];
while (stack.length) {
  const n = stack.pop();
  if (need.has(n)) continue;
  if (!pkgs[n]) { fail.push('lock 里没有这个包：' + n); continue; }
  need.add(n);
  (pkgs[n].depends || []).forEach(d => stack.push(d));
}

let totalMB = 0;
const rows = [];
for (const n of [...need].sort()) {
  const file = pkgs[n].file_name;
  const p = path.join(PYODIDE, file);
  const exists = fs.existsSync(p);
  const realMB = exists ? fs.statSync(p).size / 1048576 : 0;
  totalMB += realMB;
  const hasSize = PKG_SIZE[n] > 0;
  const drift = hasSize ? Math.abs(PKG_SIZE[n] - realMB) : 0;
  if (!exists) fail.push('缺 wheel：' + file);
  if (!hasSize) fail.push('PKG_SIZE 里没有：' + n + '（进度条会算不准）');
  if (hasSize && drift > 1.0) fail.push(`PKG_SIZE 写的 ${PKG_SIZE[n]}MB，实际 ${realMB.toFixed(1)}MB：${n}`);
  rows.push(`  ${exists ? 'ok' : '✗ '} ${n.padEnd(20)} ${realMB.toFixed(2).padStart(6)}MB  声明 ${hasSize ? PKG_SIZE[n] : '—'}`);
}

console.log('关卡声明的包：' + [...wanted].join('、'));
console.log('含依赖共 ' + need.size + ' 个，合计 ' + totalMB.toFixed(1) + 'MB');
console.log(rows.join('\n'));

if (fail.length) {
  console.log('\n✗ 有问题：');
  fail.forEach(f => console.log('  - ' + f));
  process.exit(1);
}
console.log('\n✓ 资源齐备，体积声明和实际一致');

/**
 * PyQuest 回归测试
 *
 * 用法：
 *   node tests/run_levels.mjs
 *
 * 它做三件事：
 *   1. 从 index.html 里抽出 PREAMBLE 和 LEVELS——测的就是页面正在用的那份逻辑，
 *      不是另写一套糊弄自己。
 *   2. 用项目自带的 pyodide/ 运行时（不联网、不走 CDN）跑全部关卡参考解，比对 expect 或执行 check 断言。
 *   3. 跑一批"故意写错"的答案，确认它们不会蒙混过关。
 *
 * 什么时候该跑：改关卡、改 expect、改 PREAMBLE、改 normalize、升级 Pyodide 之后。
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { SOLUTIONS, WRONG_CASES } from './solutions.mjs';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PYODIDE_DIR = path.join(ROOT, 'pyodide');

/* ---------- 1. 从 index.html 抽逻辑 ---------- */

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error('✗ 在 index.html 里没找到内联 <script>');
  process.exit(1);
}
const inlineJs = scriptMatch[1];

function extractExpr(src, name) {
  const key = 'const ' + name + ' = ';
  const at = src.indexOf(key);
  if (at < 0) throw new Error('在 index.html 里找不到 ' + name);
  let i = at + key.length;
  const start = i;
  let depth = 0, quote = null, escaped = false;
  for (; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (c === '\\') { escaped = true; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '[' || c === '{' || c === '(') depth++;
    else if (c === ']' || c === '}' || c === ')') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error(name + ' 的括号不配对，可能改坏了');
}

const PREAMBLE = eval(extractExpr(inlineJs, 'PREAMBLE')).join('\n');
const LEVELS = eval(extractExpr(inlineJs, 'LEVELS'));

/* ---------- 2. 和页面一致的归一化 ---------- */

function normalize(text) {
  const lines = String(text).replace(/\r/g, '').split('\n').map(l => l.replace(/[ \t]+$/g, ''));
  while (lines.length && lines[lines.length - 1] === '') lines.pop();
  while (lines.length && lines[0] === '') lines.shift();
  return lines;
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* ---------- 3. 启动本地 Pyodide ---------- */

console.log('启动本地 Pyodide…');
const t0 = Date.now();

const pyodidePkg = require(path.join(PYODIDE_DIR, 'pyodide.js'));
const loadPyodide = pyodidePkg.loadPyodide || pyodidePkg;
const py = await loadPyodide({ indexURL: PYODIDE_DIR.replace(/\\/g, '/') + '/' });

function run(code, limit) {
  py.globals.set('__src', code);
  py.globals.set('__limit', limit || 3);
  py.runPython(PREAMBLE);
  return {
    out: String(py.globals.get('__res_out') || ''),
    err: String(py.globals.get('__res_err') || ''),
    exited: !!py.globals.get('__res_exited')
  };
}

/* ---------- 数据关支持 ---------- */

const CHECK_PREAMBLE = eval(extractExpr(inlineJs, 'CHECK_PREAMBLE')).join('\n');
const loadedPkgs = new Set();

async function ensurePkg(list) {
  const need = (list || []).filter(p => !loadedPkgs.has(p));
  if (!need.length) return;
  await py.loadPackage(need);
  need.forEach(p => loadedPkgs.add(p));
}

function injectFiles(paths) {
  for (const p of paths || []) {
    const src = path.join(ROOT, p);
    if (!fs.existsSync(src)) throw new Error('数据文件不存在: ' + p);
    const target = '/home/pyodide/' + p;
    const dir = target.slice(0, target.lastIndexOf('/'));
    try { py.FS.mkdirTree(dir); } catch (e) {}
    const buf = fs.readFileSync(src);
    // 字体是二进制，不能按 utf8 读，否则字节被破坏、FT2Font 加载失败
    if (/\.(otf|ttf|woff2?|png|jpg|wasm)$/i.test(p)) {
      py.FS.writeFile(target, new Uint8Array(buf));
    } else {
      py.FS.writeFile(target, buf.toString('utf8'));
    }
  }
}

function runCheck(src) {
  py.globals.set('__check_src', src);
  py.runPython(CHECK_PREAMBLE);
  return {
    ok: !!py.globals.get('__check_ok'),
    msg: String(py.globals.get('__check_msg') || '')
  };
}

/* 画图关：和页面一样，先把中文字体挂上去 */
let mplDone = false;
function setupMpl() {
  if (mplDone) return;
  py.runPython([
    'import matplotlib',
    'matplotlib.use("Agg")',
    'from matplotlib import font_manager as _fm',
    '_fm.fontManager.addfont("/home/pyodide/data/NotoSansSC-Subset.otf")',
    '_cn = [f.name for f in _fm.fontManager.ttflist if "Noto Sans CJK SC" in f.name]',
    'matplotlib.rcParams["font.sans-serif"] = _cn + ["DejaVu Sans"]',
    'matplotlib.rcParams["axes.unicode_minus"] = False'
  ].join('\n'));
  mplDone = true;
}

function prepareLevel(lv) {
  return (async () => {
    await ensurePkg(lv.packages);
    injectFiles(lv.dataFiles);
    if ((lv.packages || []).includes('matplotlib')) setupMpl();
  })();
}

console.log('就绪，用时 ' + ((Date.now() - t0) / 1000).toFixed(1) + 's\n');

/* ---------- 4. 跑全部关卡参考解 ---------- */

console.log('='.repeat(58));
console.log('参考解');
console.log('='.repeat(58));

let pass = 0;
const failures = [];

for (const lv of LEVELS) {
  const code = SOLUTIONS[lv.id];
  if (typeof code !== 'string') {
    console.log('  ✗ ' + lv.id + '  没有参考解');
    failures.push(lv.id + ' 缺参考解');
    continue;
  }

  const isCheck = lv.mode === 'check';
  if (isCheck) await prepareLevel(lv);

  const r = run(code, isCheck ? 20 : 3);

  if (r.err.trim()) {
    const lastLine = r.err.trim().split('\n').filter(Boolean).pop();
    console.log('  ✗ ' + lv.id + '  抛异常: ' + lastLine);
    failures.push(lv.id + ' 运行异常');
    continue;
  }

  // 数据关：判的是 result 对不对，不是打印了什么
  if (isCheck) {
    const c = runCheck(lv.check);
    if (c.ok) {
      console.log('  ok ' + lv.id + '  (check 通过)');
      pass++;
    } else {
      console.log('  ✗ ' + lv.id + '  check 未通过: ' + c.msg.split('\n').pop());
      failures.push(lv.id + ' check 未通过');
    }
    continue;
  }

  const got = normalize(r.out);
  if (same(got, lv.expect)) {
    console.log('  ok ' + lv.id + '  ' + JSON.stringify(got));
    pass++;
  } else {
    console.log('  ✗ ' + lv.id);
    console.log('      得到 ' + JSON.stringify(got));
    console.log('      期望 ' + JSON.stringify(lv.expect));
    failures.push(lv.id + ' 输出不匹配');
  }
}

/* ---------- 5. 反例不应该通过 ---------- */

console.log('');
console.log('='.repeat(58));
console.log('反例（应该被判为不通过）');
console.log('='.repeat(58));

let caught = 0;
for (const w of WRONG_CASES) {
  const lid = w.idAlias || w.id;
  const lv = LEVELS.find(l => l.id === lid);
  if (!lv) { console.log('  ? ' + lid + '  关卡不存在'); continue; }

  const isCheck = lv.mode === 'check';
  if (isCheck) await prepareLevel(lv);

  const r = run(w.code, isCheck ? 20 : 3);
  const got = normalize(r.out);
  const cr = isCheck && !r.err.trim() ? runCheck(lv.check) : null;
  const wronglyPassed = isCheck
    ? (!r.err.trim() && cr && cr.ok)
    : (!r.err.trim() && same(got, lv.expect));

  if (wronglyPassed) {
    console.log('  ✗ ' + lid + '  「' + w.why + '」竟然判过了');
    failures.push(lid + ' 反例漏判');
  } else {
    console.log('  ok ' + lid + '  「' + w.why + '」已拦下');
    caught++;
  }
}

/* ---------- 5.5 特殊行为：exit() 不能被当成引擎故障 ---------- */

console.log('');
console.log('='.repeat(58));
console.log('特殊行为');
console.log('='.repeat(58));

for (const src of ['print("before")\nexit()', 'import sys\nprint("before")\nsys.exit(0)']) {
  const label = src.includes('sys.exit') ? 'sys.exit(0)' : 'exit()';
  const r = run(src);
  if (r.err.trim()) {
    console.log('  ✗ ' + label + ' 被当成异常: ' + r.err.trim().split('\n').pop());
    failures.push(label + ' 被当成异常');
  } else if (!r.exited) {
    console.log('  ✗ ' + label + ' 没有被识别为提前退出');
    failures.push(label + ' 未识别');
  } else if (normalize(r.out).join('') !== 'before') {
    console.log('  ✗ ' + label + ' 之前打印的内容丢了: ' + JSON.stringify(r.out));
    failures.push(label + ' 输出丢失');
  } else {
    console.log('  ok ' + label + ' 识别为提前退出，输出保留');
  }
}

/* ---------- 6. 汇总 ---------- */

console.log('');
console.log('='.repeat(58));
console.log('参考解 ' + pass + '/' + LEVELS.length + ' 通过，反例 ' + caught + '/' + WRONG_CASES.length + ' 拦下');

if (failures.length) {
  console.log('失败项：');
  failures.forEach(f => console.log('  - ' + f));
  console.log('='.repeat(58));
  process.exit(1);
}

console.log('全部通过');
console.log('='.repeat(58));
process.exit(0);

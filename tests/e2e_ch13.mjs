/**
 * 第 13 章（FastAPI）浏览器实测。
 *
 * 这一章和前面所有关卡不一样：判分在服务端，所以要真的点「提交并实测」，
 * 等后端把 app 装配起来、发完请求、把逐条回执画到右栏。
 *
 * 前置：python serve.py 已在 8770；api-lab/venv 装好 fastapi。
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const URL = 'http://127.0.0.1:8770/index.html';
const ROOT = path.resolve(process.cwd());
const LAB = path.join(ROOT, 'api-lab');

const EXPECT_LEVELS = 48;
const EXPECT_CHAPTERS = 13;

let pass = 0;
const fails = [];
const log = (ok, name, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`);
  ok ? pass++ : fails.push(name);
};

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
page.on('console', m => m.type() === 'error' && errs.push(m.text().slice(0, 160)));

// 全部解锁，否则后面的关卡是锁着的
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);
const ids = await page.evaluate(() => LEVELS.map(l => l.id));
await ctx.addInitScript(list => {
  const cleared = {};
  list.forEach(i => { cleared[i] = true; });   // 全解锁：顺序解锁会挡住直接点 13-3
  localStorage.setItem('pyquest.v1', JSON.stringify({ cleared, current: '13-1', xp: 0, streak: 0 }));
}, ids);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);

log(ids.length === EXPECT_LEVELS, `关卡总数 ${EXPECT_LEVELS}`, `实际 ${ids.length}`);
log(ids.slice(-4).join(',') === '13-1,13-2,13-3,13-4', '末四关是第 13 章', ids.slice(-4).join(','));
log((await page.locator('#nav .ch').count()) === EXPECT_CHAPTERS, `章节数 ${EXPECT_CHAPTERS}`);

// ---------- 逐关：参考解应通过 ----------
const SOL = {};
for (const lv of ['13-1', '13-2', '13-3', '13-4']) {
  SOL[lv] = fs.readFileSync(path.join(LAB, 'solutions', lv + '.py'), 'utf-8');
}

for (const lv of ['13-1', '13-2', '13-3', '13-4']) {
  await page.evaluate(() => document.querySelectorAll('.win, .mask, .modal').forEach(e => e.remove()));
  await page.click(`#nav .lv[data-id="${lv}"]`);
  await page.waitForTimeout(600);

  // 接口清单要看得见（判据透明，别让人猜）
  const apiRows = await page.locator('.api-row').count();
  log(apiRows >= 3, `${lv} 显示接口清单`, `${apiRows} 条`);

  const btnText = (await page.locator('#runBtn').innerText()).trim();
  log(btnText.includes('提交并实测'), `${lv} 按钮是「提交并实测」`, btnText);

  await page.fill('#code', SOL[lv]);
  await page.waitForTimeout(150);
  await page.click('#runBtn');
  await page.waitForFunction(
    () => !/运行中|提交中/.test(document.querySelector('#verdict')?.textContent || ''),
    { timeout: 90000 }
  );
  const r = await page.evaluate(() => ({
    verdict: (document.querySelector('#verdict')?.textContent || '').trim(),
    cls: document.querySelector('#verdict')?.className || '',
    checks: document.querySelectorAll('.api-chk').length,
    bad: document.querySelectorAll('.api-chk.bad').length,
    term: (document.querySelector('#term')?.innerText || '').replace(/\s+/g, ' ').slice(0, 120),
  }));
  log(r.verdict.includes('通过') && !/bad/.test(r.cls),
    `${lv} 参考解判通过`, `${r.verdict} · ${r.checks} 条回执 · 失败 ${r.bad}`);
  log(r.checks >= 7, `${lv} 逐条回执都画出来了`, `${r.checks} 行`);
}

// ---------- 反例：错误写法不许过，且要指出哪条不过 ----------
await page.evaluate(() => document.querySelectorAll('.win, .mask, .modal').forEach(e => e.remove()));
await page.click('#nav .lv[data-id="13-4"]');
await page.waitForTimeout(500);
await page.fill('#code', fs.readFileSync(path.join(LAB, 'wrong', '13-4_header_required.py'), 'utf-8'));
await page.click('#runBtn');
await page.waitForFunction(
  () => !/运行中|提交中/.test(document.querySelector('#verdict')?.textContent || ''),
  { timeout: 90000 }
);
const bad = await page.evaluate(() => ({
  verdict: (document.querySelector('#verdict')?.textContent || '').trim(),
  badRows: [...document.querySelectorAll('.api-chk.bad')].map(e => e.innerText.replace(/\s+/g, ' ').slice(0, 60)),
  term: (document.querySelector('#term')?.innerText || '').replace(/\s+/g, ' ').slice(0, 160),
}));
log(bad.verdict.includes('未通过'), '13-4 反例被判未通过', bad.verdict);
log(bad.badRows.some(t => /X-Token/.test(t)), '失败项指名到判据', bad.badRows[0] || '(无)');
log(/422/.test(bad.term) || bad.badRows.some(t => /422/.test(t)), '提示里点出了 401 vs 422 的坑',
  bad.badRows[0] || bad.term);

// ---------- 语法错要走「第 N 行」而不是整段 traceback ----------
await page.evaluate(() => document.querySelectorAll('.win, .mask, .modal').forEach(e => e.remove()));
await page.click('#nav .lv[data-id="13-1"]');
await page.waitForTimeout(500);
await page.fill('#code', 'def broken(:\n    pass\n');
await page.click('#runBtn');
await page.waitForFunction(
  () => !/运行中|提交中/.test(document.querySelector('#verdict')?.textContent || ''),
  { timeout: 60000 }
);
const syn = await page.evaluate(() => (document.querySelector('#term')?.innerText || '').replace(/\s+/g, ' '));
log(/第 1 行/.test(syn), '语法错定位到行号', syn.slice(0, 90));

// ---------- 白名单：判分器与参考解都不许下载 ----------
const WL = [
  ['/api-lab/README.md', 200],
  ['/api-lab/requirements.txt', 200],
  ['/api-lab/run_checks.py', 404],
  ['/api-lab/level_checks.py', 404],
  ['/api-lab/solutions/13-1.py', 404],
  ['/api-lab/wrong/13-4_header_required.py', 404],
  ['/api-lab/venv/pyvenv.cfg', 404],
];
for (const [p, want] of WL) {
  const r = await page.request.get('http://127.0.0.1:8770' + p);
  log(r.status() === want, `白名单 ${p} → ${want}`, String(r.status()));
}

await page.screenshot({ path: 'E:/WorkBuddy/temp/audit/shots/pq-ch13.png', fullPage: false });
log(errs.length === 0, '无控制台错误', errs.slice(0, 2).join(' ;; '));

await browser.close();
console.log(`\n结果：${pass} 通过 / ${fails.length} 失败`);
if (fails.length) { console.log(fails.map(f => '  - ' + f).join('\n')); process.exit(1); }

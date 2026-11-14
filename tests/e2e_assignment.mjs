/** PyQuest · 企业第一周作业的浏览器端到端验收
 * 用法：node tests/e2e_assignment.mjs（需先用新版 serve.py 启动 8770）
 * 验页面、下载、自评隔离、静态白名单与路径穿越，以及窄屏与控制台。
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:8770/index.html';

let pass = 0, fail = 0;
const log = (ok, name, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`);
  ok ? pass++ : fail++;
};

/** 用原始 path 发请求，不让客户端把 .. 规范化掉 —— 这样才能真测穿越。 */
function rawGet(p) {
  return new Promise(resolve => {
    const req = http.request({ host: '127.0.0.1', port: 8770, path: '/' + p, method: 'GET' }, res => {
      res.resume();
      resolve(res.statusCode);
    });
    req.on('error', () => resolve(0));
    req.setTimeout(5000, () => { req.destroy(); resolve(0); });
    req.end();
  });
}

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const page = await ctx.newPage();
const errs = [];
page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
page.on('pageerror', e => errs.push('PAGEERROR ' + String(e).slice(0, 200)));

try {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);

  log((await page.locator('#viewTabs button').count()) === 5, '五个视图入口');
  await page.click('#viewTabs button[data-view="assignment"]');
  await page.waitForTimeout(300);
  log(await page.locator('#pane-assignment').isVisible(), '第一周作业视图可切换');
  log((await page.locator('#pane-assignment article').count()) === 4, '四张任务卡');

  const txt = await page.locator('#pane-assignment').innerText();
  log(txt.includes('code .') && txt.includes('python check.py'), '给出本机 VS Code 起步命令');
  log(txt.includes('变异测试') && txt.includes('不写通关记录'), '写清真跑验收与自评边界');
  log(txt.includes('卡住 20 分钟再看'), '参考解标注使用时机');

  const links = await page.locator('#pane-assignment a[download]').count();
  log(links >= 12, '任务书 / 验收脚本 / 参考解下载入口齐全', String(links));

  for (const [href, want] of [
    ['assignment/TASKS/01-first-script.md', /01-first-script\.md/],
    ['assignment/check.py', /check\.py/],
    ['assignment/solution/daily_report.py', /daily_report\.py/],
  ]) {
    const dl = page.waitForEvent('download', { timeout: 6000 }).catch(() => null);
    await page.click(`#pane-assignment a[href="${href}"]`);
    const f = await dl;
    log(!!f && want.test(f.suggestedFilename()), `${href} 可真下载`,
      f ? f.suggestedFilename() : '无下载事件');
  }

  // 自评必须独立于通关记录
  const before = await page.evaluate(() => {
    const raw = localStorage.getItem('pyquest.v1');
    return raw ? Object.keys(JSON.parse(raw).cleared || {}).length : 0;
  });
  await page.locator('#pane-assignment input[data-asg="1"]').check();
  await page.waitForTimeout(250);
  const state = await page.evaluate(() => {
    let s = {};
    try { s = JSON.parse(localStorage.getItem('pyquest.assignment.self') || '{}'); } catch (e) {}
    const raw = localStorage.getItem('pyquest.v1');
    return { checked: !!s['1'], cleared: raw ? Object.keys(JSON.parse(raw).cleared || {}).length : 0 };
  });
  log(state.checked, '作业自评写入独立 localStorage');
  log(state.cleared === before, '自评不写通关记录 / 不加 XP', `${before} → ${state.cleared}`);
  log(/1\/4/.test(await page.locator('#pq-asg').innerText()), '进度显示 1/4');
  await page.click('#pq-asg-reset');
  await page.waitForTimeout(200);
  log((await page.locator('#pq-asg input:checked').count()) === 0, '清空自评生效');

  await page.screenshot({ path: path.join(OUT, 'assignment-week-one.png'), fullPage: true });

  // 静态白名单：作业包内放行，根目录与源码拒绝，路径穿越必须堵住
  const allow = [
    'assignment/README.md', 'assignment/check.py', 'assignment/DELIVERY.md',
    'assignment/TASKS/01-first-script.md', 'assignment/TASKS/04-delivery.md',
    'assignment/workspace/README.md', 'assignment/workspace/data/orders.csv',
    'assignment/solution/daily_report.py', 'assignment/solution/.gitignore',
    'assignment/solution/Makefile', 'toolkits/README.md', 'toolkits/cli/daily_report.py',
    'pyodide/pyodide-lock.json',
  ];
  const deny = [
    'README.md', 'serve.py', 'package.json', 'tests/run_levels.mjs',
    '.git/config', 'toolkits/cli/__pycache__/daily_report.cpython-313.pyc',
    'assignment/workspace/.git/config', 'assignment/',
    'toolkits/../serve.py', 'assignment/../serve.py',
    'toolkits/../README.md', 'assignment/../.git/config',
  ];
  for (const p of allow) {
    const code = await rawGet(p);
    log(code === 200, `放行 ${p}`, String(code));
  }
  for (const p of deny) {
    const code = await rawGet(p);
    log(code === 404, `拦截 ${p}`, String(code));
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  log(overflow <= 2, '390px 不横向溢出', '溢出 ' + overflow + 'px');
  log(errs.length === 0, '0 控制台错误', errs.slice(0, 3).join(' | '));
} catch (e) {
  log(false, 'E2E 异常', String(e).slice(0, 240));
} finally {
  console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
  await browser.close();
  process.exit(fail ? 1 : 0);
}

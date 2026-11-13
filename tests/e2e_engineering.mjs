/** PyQuest · 工程化扩展的浏览器端到端验收
 * 用法：node tests/e2e_engineering.mjs（需先启动 serve.py）
 * 只验新视图与闭环，不重复 run_levels.mjs 已覆盖的 Pyodide 判题。
 */
import fs from 'node:fs';
import path from 'node:path';
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

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const page = await ctx.newPage();
const errs = [];
page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
page.on('pageerror', e => errs.push('PAGEERROR ' + String(e).slice(0, 200)));

try {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);

  log((await page.locator('#viewTabs button').count()) === 4, '四个视图入口');
  log((await page.locator('#nav .lv').count()) === 39, '导航渲染 39 关',
    String(await page.locator('#nav .lv').count()));
  log((await page.locator('#nav .ch').count()) === 11, '导航渲染 11 章');
  log((await page.locator('#progText').innerText()).includes('/ 39'), '进度总数跟着关卡变');

  // 知识库
  await page.click('#viewTabs button[data-view="library"]');
  await page.waitForTimeout(250);
  log((await page.locator('#pane-library article').count()) === 8, '知识库 8 篇');
  log((await page.locator('#pane-library').innerText()).includes('虚拟环境与依赖'), '工程环境篇可见');

  // 真工具实操 + 下载 + 自评
  await page.click('#viewTabs button[data-view="toolkits"]');
  await page.waitForTimeout(250);
  log((await page.locator('#pane-toolkits article').count()) === 6, '实操台 6 组工具');
  log((await page.locator('#pane-toolkits a[download]').count()) >= 15, '真实文件下载入口齐全',
    String(await page.locator('#pane-toolkits a[download]').count()));

  const dl = page.waitForEvent('download', { timeout: 6000 }).catch(() => null);
  await page.click('#pane-toolkits a[href="toolkits/cli/daily_report.py"]');
  const file = await dl;
  log(!!file && /daily_report\.py/.test(file.suggestedFilename()), 'CLI 脚本可真下载',
    file ? file.suggestedFilename() : '无下载事件');

  const clearedBefore = await page.evaluate(() => {
    const raw = localStorage.getItem('pyquest.v1');
    return raw ? Object.keys(JSON.parse(raw).cleared || {}).length : 0;
  });
  await page.click('#pq-self [data-tk="venv"]');
  await page.waitForTimeout(250);
  const selfState = await page.evaluate(() => {
    let s = {};
    try { s = JSON.parse(localStorage.getItem('pyquest.toolkits.self') || '{}'); } catch (e) {}
    const raw = localStorage.getItem('pyquest.v1');
    return { checked: !!s.venv, cleared: raw ? Object.keys(JSON.parse(raw).cleared || {}).length : 0 };
  });
  log(selfState.checked, '自评写入独立 localStorage');
  log(selfState.cleared === clearedBefore, '自评不写通关记录',
    `${clearedBefore} → ${selfState.cleared}`);
  await page.click('#pq-self-reset');
  await page.waitForTimeout(200);
  log((await page.locator('#pq-self input:checked').count()) === 0, '清空自评生效');

  // 交付链 + 导出
  await page.click('#viewTabs button[data-view="pipeline"]');
  await page.waitForTimeout(250);
  log((await page.locator('#pane-pipeline article').count()) === 7, '交付链 7 步');
  log((await page.locator('#pane-pipeline').innerText()).includes('可交付脚本'), 'BOSS 步在链上');
  const dl2 = page.waitForEvent('download', { timeout: 6000 }).catch(() => null);
  await page.click('#pq-export');
  const archive = await dl2;
  if (archive) {
    const html = fs.readFileSync(await archive.path(), 'utf8');
    log(html.includes('参数入口') && html.includes('可交付脚本'), '导出清单含七步');
  } else {
    log(false, '导出清单含七步', '无下载事件');
  }
  await page.screenshot({ path: path.join(OUT, 'engineering-chain.png'), fullPage: true });

  // 回到闯关视图，确认布局恢复
  await page.click('#viewTabs button[data-view="levels"]');
  await page.waitForTimeout(250);
  log(await page.locator('.layout').isVisible(), '切回闯关视图布局恢复');
  log((await page.locator('#nav .lv').count()) === 39, '关卡列表未受影响');

  // 390px
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

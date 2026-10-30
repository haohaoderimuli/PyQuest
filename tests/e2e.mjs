/**
 * PyQuest 浏览器端 E2E
 *
 * 用法：
 *   npm i -D playwright-core     # 只需要一次
 *   node tests/e2e.mjs
 *
 * 它会自己起 serve.py 再关掉，不用手动开服务。
 * 覆盖四件事：
 *   1. 1024px 窄屏下结果区还在、编辑器完整可见（曾经 display:none 过）
 *   2. exit() 显示"未通过 + 提示"，不是"引擎坏了"
 *   3. 数据关 6-1 能真的读出 CSV 并通过断言
 *   4. CSV 404 时提示"数据文件读不到"，不是引擎故障
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawn } from 'node:child_process';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

/* ---------- 加载 playwright-core ---------- */

function loadPlaywright() {
  const tries = [
    () => require('playwright-core'),
    () => require(path.join(ROOT, 'node_modules', 'playwright-core')),
    () => require(path.join(process.env.PQ_MODULES || '/nonexistent', 'playwright-core'))
  ];
  for (const t of tries) {
    try { return t(); } catch (e) { /* 继续试下一个 */ }
  }
  console.error('\n找不到 playwright-core。先装一下：\n');
  console.error('  cd ' + ROOT);
  console.error('  npm i -D playwright-core\n');
  process.exit(1);
}
const { chromium } = loadPlaywright();

/* ---------- 起本地服务 ---------- */

function startServer() {
  return new Promise((resolve, reject) => {
    const py = process.platform === 'win32' ? 'python' : 'python3';
    // -u：不缓冲输出，否则拿不到启动时打印的地址（管道下 print 是块缓冲的）
    const child = spawn(py, ['-u', 'serve.py'], {
      cwd: ROOT,
      env: { ...process.env, PYQUEST_NO_BROWSER: '1' }
    });
    let buf = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('服务 20 秒内没起来'));
    }, 20000);

    child.stdout.on('data', d => {
      buf += d.toString();
      // 只匹配 URL，不依赖中文（控制台是 GBK，读进来会乱码）
      const m = buf.match(/(http:\/\/127\.0\.0\.1:\d+\/index\.html)/);
      if (m) {
        clearTimeout(timer);
        resolve({ child, url: m[1] });
      }
    });
    child.stderr.on('data', d => process.stderr.write(d));
    child.on('error', reject);
  });
}

/* ---------- 断言 ---------- */

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log((ok ? '  ok ' : '  ✗ ') + name + (detail ? '  — ' + detail : ''));
}

async function waitReady(page, timeout = 120000) {
  await page.waitForFunction(
    () => document.getElementById('dot').classList.contains('ready'),
    null, { timeout }
  );
}

async function toCode(page) {
  const hidden = await page.evaluate(() => {
    const p = document.getElementById('pane-code');
    return !p || p.classList.contains('hidden');
  });
  if (hidden) { await page.click('.tab[data-tab="code"]'); await page.waitForTimeout(250); }
}

async function runAndWait(page, timeout = 120000) {
  await page.click('#runBtn');
  await page.waitForFunction(() => {
    const v = document.getElementById('verdict').textContent;
    return v === '通过' || v === '未通过' || v === '报错' || v === '离线' || v === '缺数据' || v === '缺依赖';
  }, null, { timeout }).catch(() => {});
  return (await page.textContent('#verdict')).trim();
}

/* ---------- 主流程 ---------- */

(async () => {
  console.log('启动本地服务…');
  const { child, url } = await startServer();
  console.log('服务地址 ' + url + '\n');

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const errors = [];

  try {
    /* ---- 1. 1024px 布局 ---- */
    console.log('1. 窄屏布局');
    {
      const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
      page.on('pageerror', e => errors.push('pageerror: ' + e.message));
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await waitReady(page);
      await page.waitForTimeout(400);
      // 新关卡默认停在「理论」页签，先切到「动手」才有编辑器可测
      await toCode(page);
      await page.waitForTimeout(300);

      const layout = await page.evaluate(() => {
        const r = document.querySelector('.right');
        const ta = document.getElementById('code');
        const rb = r.getBoundingClientRect();
        const tb = ta ? ta.getBoundingClientRect() : null;
        return {
          rightVisible: rb.height > 0 && getComputedStyle(r).display !== 'none',
          collapsed: r.classList.contains('collapsed'),
          rightHeight: Math.round(rb.height),
          editorVisible: !!(tb && tb.height > 150 && tb.bottom <= window.innerHeight + 2)
        };
      });

      check('结果区未隐藏', layout.rightVisible, '高度 ' + layout.rightHeight + 'px');
      check('进关卡时默认收起', layout.collapsed);
      check('编辑器完整可见', layout.editorVisible);

      await page.click('.rhead');
      await page.waitForTimeout(400);
      const expanded = await page.evaluate(() =>
        Math.round(document.querySelector('.right').getBoundingClientRect().height));
      check('点标题栏后展开', expanded > 150, expanded + 'px');
      await page.close();
    }

    /* ---- 2. exit() ---- */
    console.log('\n2. exit() 处理');
    {
      const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
      page.on('pageerror', e => errors.push('pageerror: ' + e.message));
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await waitReady(page);
      await toCode(page);

      await page.fill('#code', 'print("before")\nexit()');
      const verdict = await runAndWait(page);
      const term = (await page.textContent('#term')).replace(/\s+/g, ' ');

      check('exit() 不显示"离线"', verdict !== '离线' && verdict !== '缺依赖', '判定=' + verdict);
      check('exit() 有明确提示', term.includes('exit()'));
      await page.close();
    }

    /* ---- 2.5 错误提示语义化 ---- */
    console.log('\n2.5 错误提示');
    {
      const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
      page.on('pageerror', e => errors.push('pageerror: ' + e.message));
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await waitReady(page);
      await toCode(page);

      await page.fill('#code', 'if True:\nprint("x")');
      const verdict = await runAndWait(page);
      const term = (await page.textContent('#term')).replace(/\s+/g, ' ');
      check('缩进错误判为报错', verdict === '报错', '判定=' + verdict);
      check('给出了缩进相关的提示', term.includes('缩进'));
      check('原始 traceback 仍然保留', term.includes('IndentationError'));
      await page.close();
    }

    /* ---- 3. 数据关 6-1 ---- */
    console.log('\n3. 数据关 6-1');
    {
      const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
      page.on('pageerror', e => errors.push('pageerror: ' + e.message));
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => {
        const s = { cleared: {}, current: '6-1', hints: {} };
        ['1-1','1-2','1-3','1-4','2-1','2-2','2-3','2-4','3-1','3-2','3-3','3-4',
         '4-1','4-2','4-3','4-4','5-1','5-2','5-3','5-4'].forEach(id => s.cleared[id] = true);
        localStorage.setItem('pyquest.v1', JSON.stringify(s));
      });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await waitReady(page);
      await toCode(page);

      const t0 = Date.now();
      await page.fill('#code',
        'import pandas as pd\ndf = pd.read_csv("data/orders.csv")\ndone = df[df["status"] == "已完成"]\nresult = round(done["amount"].sum(), 2)');
      const verdict = await runAndWait(page, 150000);
      check('6-1 参考解通过', verdict === '通过',
        verdict + '，用时 ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
      await page.close();
    }

    /* ---- 4. CSV 404 提示 ---- */
    console.log('\n4. 数据文件缺失');
    {
      const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
      page.on('pageerror', e => errors.push('pageerror: ' + e.message));
      await page.route('**/data/*.csv', route => route.fulfill({ status: 404, body: 'not found' }));
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => {
        const s = { cleared: {}, current: '6-1', hints: {} };
        ['1-1','1-2','1-3','1-4','2-1','2-2','2-3','2-4','3-1','3-2','3-3','3-4',
         '4-1','4-2','4-3','4-4','5-1','5-2','5-3','5-4'].forEach(id => s.cleared[id] = true);
        localStorage.setItem('pyquest.v1', JSON.stringify(s));
      });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await waitReady(page);
      await toCode(page);

      await page.fill('#code', 'import pandas as pd\nresult = 0');
      const verdict = await runAndWait(page);
      const term = (await page.textContent('#term')).replace(/\s+/g, ' ');

      check('404 判定为缺数据', verdict === '缺数据', '判定=' + verdict);
      check('提示说的是数据文件不是引擎', term.includes('数据文件读不到') && !term.includes('引擎没能加载'));
      await page.close();
    }
    /* ---- 5. 进度菜单 ---- */
    console.log('\n5. 进度导出菜单');
    {
      const page = await browser.newPage({ viewport: { width: 1500, height: 950 }, acceptDownloads: true });
      page.on('pageerror', e => errors.push('pageerror: ' + e.message));
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await waitReady(page);

      await page.click('#menuBtn');
      await page.waitForSelector('.menu-pop', { timeout: 3000 });
      const items = await page.$$eval('.menu-pop [data-m]', els => els.map(e => e.dataset.m));
      check('菜单三个入口都在', items.join(',') === 'export,import,clear', items.join(','));

      const [dl] = await Promise.all([
        page.waitForEvent('download', { timeout: 8000 }).catch(() => null),
        page.click('.menu-pop [data-m="export"]')
      ]);
      check('导出能触发下载', !!dl, dl ? dl.suggestedFilename() : '没拿到下载事件');
      await page.close();
    }
  } finally {
    await browser.close();
    child.kill();
  }

  const failed = results.filter(r => !r.ok);
  console.log('\n' + '='.repeat(52));
  console.log('E2E ' + (results.length - failed.length) + '/' + results.length + ' 通过');
  if (errors.length) {
    console.log('页面错误：');
    errors.forEach(e => console.log('  ' + e));
  }
  console.log('='.repeat(52));
  process.exit(failed.length || errors.length ? 1 : 0);
})().catch(e => {
  console.error('E2E 异常：' + e.message);
  process.exit(1);
});

/** 第 12 章 4 关的浏览器实测：参考解必须判通过 */
import { chromium } from 'playwright-core';

let pass = 0, fail = 0;
const log = (ok, n, d) => { console.log(`${ok ? 'PASS' : 'FAIL'} | ${n}${d ? ' | ' + d : ''}`); ok ? pass++ : fail++; };

const SOL = {
  '12-1': [
    'def iter_amounts(path):',
    '    with open(path, encoding="utf-8") as f:',
    '        next(f, None)',
    '        for line in f:',
    '            line = line.strip()',
    '            if not line:',
    '                continue',
    '            parts = line.split(",")',
    '            if len(parts) < 2:',
    '                continue',
    '            try:',
    '                yield float(parts[1])',
    '            except ValueError:',
    '                continue',
    '',
    '',
    'def total_revenue(path):',
    '    total = 0.0',
    '    for a in iter_amounts(path):',
    '        total += a',
    '    return round(total, 2)'
  ].join('\n'),

  '12-2': [
    'import functools',
    'import time',
    '',
    'CALLS = []',
    '',
    '',
    'def timed(fn):',
    '    @functools.wraps(fn)',
    '    def wrapper(*args, **kwargs):',
    '        t0 = time.time()',
    '        try:',
    '            return fn(*args, **kwargs)',
    '        finally:',
    '            CALLS.append((fn.__name__, (time.time() - t0) * 1000))',
    '    return wrapper'
  ].join('\n'),

  '12-3': [
    'import re',
    '',
    'ORDER_RE = re.compile(r"SO-\\d{8}-\\d{4}")',
    'PHONE_RE = re.compile(r"(1[3-9]\\d)\\d{4}(\\d{4})")',
    '',
    '',
    'def extract_orders(text):',
    '    return list(dict.fromkeys(ORDER_RE.findall(text)))',
    '',
    '',
    'def mask_phone(text):',
    '    return PHONE_RE.sub(r"\\1****\\2", text)'
  ].join('\n'),

  '12-4': [
    'import asyncio',
    '',
    '',
    'async def fetch_order(oid):',
    '    await asyncio.sleep(0.01)',
    '    return {"id": oid, "status": "ok"}',
    '',
    '',
    'async def fetch_all(ids):',
    '    coros = [fetch_order(i) for i in ids]',
    '    return await asyncio.gather(*coros)'
  ].join('\n')
};

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });

try {
  await page.goto('http://127.0.0.1:8770/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  const ids = await page.evaluate(() => LEVELS.map(l => l.id));
  log(ids.length === 48, '关卡总数 48', String(ids.length));

  // 解锁：把存档写成全部通关（否则新关卡是锁的）
  await ctx.addInitScript((list) => {
    const cleared = {};
    list.forEach(i => { cleared[i] = true; });
    localStorage.setItem('pyquest.v1', JSON.stringify({ cleared, current: '1-1', xp: 0, streak: 0 }));
  }, ids);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(9000);

  for (const [id, code] of Object.entries(SOL)) {
    // 上一关通过会弹「过关」窗，挡住导航，先清掉
    await page.evaluate(() => document.querySelectorAll('.win, .modal, .mask').forEach(e => e.remove()));
    await page.click('#nav .lv[data-id="' + id + '"]');
    await page.waitForTimeout(900);
    const ta = await page.$('#code');
    if (!ta) { log(false, id + ' 编辑器存在', '没找到 #code'); continue; }
    await ta.fill(code);
    await page.waitForTimeout(200);
    await page.click('#runBtn');
    await page.waitForTimeout(6000);
    const r = await page.evaluate(() => ({
      verdict: (document.querySelector('.verdict')?.textContent || '').trim(),
      cls: document.querySelector('.verdict')?.className || '',
      term: (document.querySelector('#term')?.innerText || '').replace(/\s+/g, ' ').slice(0, 120),
    }));
    const ok = r.verdict.includes('通过') && !/bad/.test(r.cls);
    log(ok, id + ' 参考解判通过', r.verdict + (ok ? '' : ' ← ' + r.term.slice(0, 90)));
  }

  log(errs.length === 0, '无控制台错误', errs.slice(0, 2).join(' ;; '));
  await page.screenshot({ path: 'E:/WorkBuddy/temp/audit/shots/pq-ch12.png' });
} finally {
  await browser.close();
}
console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);

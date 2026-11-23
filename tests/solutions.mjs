/**
 * 各关的参考解（数量随关卡增长，不用改这里）。
 *
 * 为什么不写进 index.html：答案放在页面里，用户按 F12 就能看到，
 * 关卡就失去意义了。测试要跑它们，所以单独放这里。
 *
 * 改关卡 expect 的时候，记得同步改这里，否则 run_levels.mjs 会立刻报出来。
 */
export const SOLUTIONS = {
  '1-1': 'print("Hello, Python")',
  '1-2': 'x = 7\ny = 5\nprint(x + y)',
  '1-3': 'name = "Python"\nprint("I love " + name)',
  '1-4': 'r = 3\npi = 3.14\narea = pi * r ** 2\nprint(round(area, 1))',
  '2-1': 'n = 7\nif n % 2 == 0:\n    print("even")\nelse:\n    print("odd")',
  '2-2': 'score = 86\nif score >= 90:\n    print("A")\nelif score >= 80:\n    print("B")\nelif score >= 70:\n    print("C")\nelse:\n    print("D")',
  '2-3': 'year = 2024\nprint((year % 4 == 0 and year % 100 != 0) or year % 400 == 0)',
  '2-4': 'a, b, c = 3, 9, 5\nbig = a\nif b > big:\n    big = b\nif c > big:\n    big = c\nprint(big)',
  '3-1': 'for i in range(1, 6):\n    print(i)',
  '3-2': 'total = 0\nfor i in range(1, 101):\n    total = total + i\nprint(total)',
  '3-3': 'parts = []\nn = 3\nwhile n < 20:\n    parts.append(str(n))\n    n = n + 3\nprint(",".join(parts))',
  '3-4': 'for i in range(1, 5):\n    print("*" * i)',
  '4-1': 'nums = [3, 8, 2, 9, 5]\nbig = nums[0]\nfor x in nums:\n    if x > big:\n        big = x\nprint(big)',
  '4-2': 'nums = [3, 8, 2, 9, 5]\nprint(nums[:3])',
  '4-3': 'words = ["apple", "banana", "apple", "cherry", "apple"]\ncounts = {}\nfor w in words:\n    counts[w] = counts.get(w, 0) + 1\nprint(counts["apple"])',
  '4-4': 'print([x * x for x in range(1, 11) if x % 2 == 0])',
  '5-1': 'def square(n):\n    return n * n\n\nprint(square(7))',
  '5-2': 'def greet(name, greeting="Hello"):\n    return greeting + ", " + name\n\nprint(greet("Ann"))\nprint(greet("Bob", "Hi"))',
  '5-3': 'def fact(n):\n    if n <= 1:\n        return 1\n    return n * fact(n - 1)\n\nprint(fact(6))',
  '5-4': 'parts = []\nfor i in range(1, 16):\n    if i % 15 == 0:\n        parts.append("FizzBuzz")\n    elif i % 3 == 0:\n        parts.append("Fizz")\n    elif i % 5 == 0:\n        parts.append("Buzz")\n    else:\n        parts.append(str(i))\nprint(",".join(parts))',

  /* ---- 第 6 章：数据分析（check 模式，判的是 result 而不是 stdout） ---- */
  '6-1': 'import pandas as pd\ndf = pd.read_csv("data/orders.csv")\ndone = df[df["status"] == "已完成"]\nresult = round(done["amount"].sum(), 2)',

  '6-2': 'import pandas as pd\ndf = pd.read_csv("data/orders.csv")\nmask = (df["channel"] == "App") & (df["amount"] > 500) & (df["status"] == "已完成")\nresult = list(df[mask].sort_values("amount", ascending=False).head(3)["order_id"])',

  '6-3': 'import pandas as pd\ndf = pd.read_csv("data/dirty_orders.csv")\ndf = df.drop_duplicates()\nfor c in ["status", "channel", "category", "city"]:\n    df[c] = df[c].str.strip()\ndf["amount"] = pd.to_numeric(df["amount"], errors="coerce")\nresult = df.dropna()',

  '6-4': 'import pandas as pd\ndf = pd.read_csv("data/orders.csv")\ndone = df[df["status"] == "已完成"]\nresult = (done.groupby("category")["amount"]\n          .agg(["count", "sum"])\n          .sort_values("sum", ascending=False)\n          .reset_index()\n          .rename(columns={"count": "orders", "sum": "revenue"}))',

  /* ---- 第 7 章：多表与透视 ---- */
  '7-1': 'import pandas as pd\no = pd.read_csv("data/orders.csv")\np = pd.read_csv("data/products.csv")\ndone = o[o["status"] == "已完成"]\nm = pd.merge(done, p, on="product_id", how="left")\nresult = round((m["amount"] - m["cost"] * m["quantity"]).sum(), 2)',

  '7-2': 'import pandas as pd\ndf = pd.read_csv("data/orders.csv")\ndone = df[df["status"] == "已完成"]\nresult = pd.pivot_table(done, index="category", columns="channel", values="amount", aggfunc="sum", fill_value=0)',

  '7-3': 'import pandas as pd\ndf = pd.read_csv("data/orders.csv")\ndf["order_time"] = pd.to_datetime(df["order_time"])\ndone = df[df["status"] == "已完成"]\ndone = done.assign(month=done["order_time"].dt.strftime("%Y-%m"))\nresult = done.groupby("month")["amount"].sum().reset_index().rename(columns={"amount": "revenue"})',

  '7-4': 'import pandas as pd\ndf = pd.read_csv("data/orders.csv")\ndf["is_refund"] = (df["status"] == "已退款").astype(int)\ng = df.groupby("category").agg(orders=("order_id", "count"), refunds=("is_refund", "sum")).reset_index()\ng["rate"] = (g["refunds"] / g["orders"]).round(4)\nresult = g.sort_values("rate", ascending=False).reset_index(drop=True)',

  /* ---- 第 8 章：可视化（判的是 Figure 结构，不是像素） ---- */
  '8-1': 'import matplotlib\nmatplotlib.use("Agg")\nimport matplotlib.pyplot as plt\nimport pandas as pd\n\ndf = pd.read_csv("data/orders.csv")\ndf["order_time"] = pd.to_datetime(df["order_time"])\ndone = df[df["status"] == "已完成"]\ng = done.assign(m=done["order_time"].dt.strftime("%Y-%m")).groupby("m")["amount"].sum()\n\nfig, ax = plt.subplots(figsize=(6, 3.6))\nax.plot(list(g.index), list(g.values), marker="o")\nax.set_title("月度收入趋势")\nax.set_xlabel("月份")\nax.set_ylabel("收入（元）")\nresult = fig',

  '8-2': 'import matplotlib\nmatplotlib.use("Agg")\nimport matplotlib.pyplot as plt\nimport pandas as pd\n\ndf = pd.read_csv("data/orders.csv")\nrev = df[df["status"] == "已完成"].groupby("category")["amount"].sum().sort_values(ascending=False)\n\nfig, ax = plt.subplots(figsize=(6, 3.4))\nax.bar(list(rev.index), list(rev.values))\nax.set_title("各类目收入")\nax.set_ylabel("金额（元）")\nresult = fig',

  '8-3': 'import matplotlib\nmatplotlib.use("Agg")\nimport matplotlib.pyplot as plt\nimport pandas as pd\n\ndf = pd.read_csv("data/orders.csv")\ndf["order_time"] = pd.to_datetime(df["order_time"])\ndf["m"] = df["order_time"].dt.strftime("%Y-%m")\ndone = df[df["status"] == "已完成"].groupby("m")["amount"].sum()\nrefund = df[df["status"] == "已退款"].groupby("m")["amount"].sum()\n\nfig, ax = plt.subplots(figsize=(6, 3.6))\nax.plot(list(done.index), list(done.values), marker="o", label="已完成")\nax.plot(list(refund.index), list(refund.values), marker="s", label="已退款")\nax.set_title("完成 vs 退款金额对比")\nax.set_xlabel("月份")\nax.set_ylabel("金额（元）")\nax.legend()\nresult = fig',

  /* ---- 第 9 章：项目实战（多个产出一起判） ---- */
  '9-1': 'import matplotlib\nmatplotlib.use("Agg")\nimport matplotlib.pyplot as plt\nimport pandas as pd\n\ndf = pd.read_csv("data/orders.csv")\ndone = df[df["status"] == "已完成"]\n\ngmv = round(float(done["amount"].sum()), 2)\norders = int(len(done))\naov = round(gmv / orders, 2)\nrefund_rate = round(int((df["status"] == "已退款").sum()) / len(df), 4)\n\ncg = done.groupby("category")["amount"].agg(["sum", "count"])\ncg["aov"] = cg["sum"] / cg["count"]\ntop_category = cg["sum"].idxmax()\nbest_aov_category = cg["aov"].idxmax()\n\nm = done.assign(m=pd.to_datetime(done["order_time"]).dt.strftime("%Y-%m"))\nmg = m.groupby("m")["amount"].sum()\nmonthly = [round(float(v), 2) for v in mg]\n\nfig, ax = plt.subplots(figsize=(6, 3.6))\nax.plot(list(mg.index), monthly, marker="o")\nax.set_title("月度 GMV 走势")\nax.set_xlabel("月份")\nax.set_ylabel("GMV（元）")\n\nreport = {\n    "gmv": gmv,\n    "orders": orders,\n    "aov": aov,\n    "refund_rate": refund_rate,\n    "top_category": top_category,\n    "best_aov_category": best_aov_category,\n    "monthly": monthly,\n}',
  /* ---- 第 10–11 章：脚本工程化与交付（真跑 Python 标准库） ---- */
  '10-1': 'import argparse\n\ndef build_parser():\n    p = argparse.ArgumentParser(description="每日渠道报表")\n    p.add_argument("--channel", default="all")\n    p.add_argument("--limit", type=int, default=10)\n    p.add_argument("--verbose", action="store_true")\n    return p',

  '10-2': 'import json\nfrom pathlib import Path\n\ndef save_report(data, path):\n    Path(path).write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")\n\ndef load_report(path):\n    return json.loads(Path(path).read_text(encoding="utf-8"))',

  '10-3': 'import logging\n\nlogger = logging.getLogger(__name__)\n\nclass CalcError(Exception):\n    pass\n\ndef safe_div(a, b):\n    if b == 0:\n        raise CalcError("除数不能为 0")\n    return a / b\n\ndef compute(values):\n    total = 0.0\n    for v in values:\n        try:\n            total += safe_div(100, v)\n        except CalcError as e:\n            logger.warning("跳过非法值: %s", e)\n    return round(total, 2)',

  '10-4': 'from dataclasses import dataclass\n\n@dataclass\nclass Order:\n    order_no: str\n    channel: str\n    qty: int\n    price: float\n\n    def total(self) -> float:\n        return round(self.qty * self.price, 2)\n\ndef format_order(o: Order) -> str:\n    return "%s | %s | %.2f" % (o.order_no, o.channel, o.total())',

  '11-1': 'import unittest\n\ndef normalize_name(s):\n    return s.strip().lower()\n\nclass TestNormalize(unittest.TestCase):\n    def test_strip(self):\n        self.assertEqual(normalize_name("  Ann  "), "ann")\n    def test_empty(self):\n        self.assertEqual(normalize_name(""), "")\n    def test_case(self):\n        self.assertEqual(normalize_name("PyThOn"), "python")',

  '11-2': 'import argparse\n\ndef run(argv=None):\n    p = argparse.ArgumentParser(description="每日渠道报表")\n    p.add_argument("--channel", default="all")\n    p.add_argument("--limit", type=int, default=10)\n    try:\n        a = p.parse_args(argv)\n    except SystemExit:\n        return ("参数错误，用法：--channel X --limit N", 2)\n    if a.limit < 0:\n        return ("参数错误：limit 不能为负", 2)\n    return ("channel=%s limit=%d" % (a.channel, a.limit), 0)',

  '11-3': 'import argparse\nimport json\nimport logging\nfrom pathlib import Path\n\nlogger = logging.getLogger("daily_report")\n\nclass ReportError(Exception):\n    pass\n\ndef process(data, limit):\n    rows = data[:limit]\n    return {\n        "orders": len(rows),\n        "revenue": round(sum(float(r["amount"]) for r in rows), 2),\n        "channel_count": len({r["channel"] for r in rows}),\n    }\n\ndef main(argv=None):\n    p = argparse.ArgumentParser(description="每日渠道报表")\n    p.add_argument("--input")\n    p.add_argument("--output")\n    p.add_argument("--limit", type=int, default=10)\n    try:\n        a = p.parse_args(argv)\n        if not a.input or not a.output:\n            return 2\n        raw = Path(a.input).read_text(encoding="utf-8")\n        data = json.loads(raw)\n        if not isinstance(data, list):\n            raise ReportError("输入必须是列表")\n        rep = process(data, a.limit)\n        Path(a.output).write_text(json.dumps(rep, ensure_ascii=False), encoding="utf-8")\n        logger.info("报告已生成: %s", a.output)\n        return 0\n    except (SystemExit, OSError, ValueError, KeyError, ReportError) as e:\n        logger.error("生成失败: %s", e)\n        return 2\n\nif __name__ == "__main__":\n    main()',
  '11-4': 'def summarize(rows):\n    total = 0.0\n    for r in rows:\n        total += float(r["amount"])\n    return (len(rows), round(total, 2))',

  /* ---- 第 12 章：织网之厅（生成器 / 装饰器 / 正则 / 并发） ---- */
  '12-1': 'def iter_amounts(path):\n    with open(path, encoding="utf-8") as f:\n        next(f, None)\n        for line in f:\n            line = line.strip()\n            if not line:\n                continue\n            parts = line.split(",")\n            if len(parts) < 2:\n                continue\n            try:\n                yield float(parts[1])\n            except ValueError:\n                continue\n\n\ndef total_revenue(path):\n    total = 0.0\n    for a in iter_amounts(path):\n        total += a\n    return round(total, 2)',

  '12-2': 'import functools\nimport time\n\nCALLS = []\n\n\ndef timed(fn):\n    @functools.wraps(fn)\n    def wrapper(*args, **kwargs):\n        t0 = time.time()\n        try:\n            return fn(*args, **kwargs)\n        finally:\n            CALLS.append((fn.__name__, (time.time() - t0) * 1000))\n    return wrapper',

  '12-3': 'import re\n\nORDER_RE = re.compile(r"SO-\\d{8}-\\d{4}")\nPHONE_RE = re.compile(r"(1[3-9]\\d)\\d{4}(\\d{4})")\n\n\ndef extract_orders(text):\n    return list(dict.fromkeys(ORDER_RE.findall(text)))\n\n\ndef mask_phone(text):\n    return PHONE_RE.sub(r"\\1****\\2", text)',

  '12-4': 'import asyncio\n\n\nasync def fetch_order(oid):\n    await asyncio.sleep(0.01)\n    return {"id": oid, "status": "ok"}\n\n\nasync def fetch_all(ids):\n    coros = [fetch_order(i) for i in ids]\n    return await asyncio.gather(*coros)'
};

/**
 * 反例：这些代码应该被判为不通过。用来确认判题不会放过错误答案。
 */
export const WRONG_CASES = [
  { id: '1-1', code: 'print("hello, python")', why: '大小写不一致' },
  { id: '1-2', code: 'x = 7\ny = 5\nprint(x - y)', why: '运算符写错' },
  { id: '3-1', code: 'for i in range(5):\n    print(i)', why: 'range 起点错，输出 0~4' },
  { id: '3-2', code: 'total = 0\nfor i in range(1, 100):\n    total = total + i\nprint(total)', why: '差一错误，少算 100' },
  { id: '4-2', code: 'nums = [3, 8, 2, 9, 5]\nprint(nums[:2])', why: '切片截少了' },
  { id: '5-3', code: 'def fact(n):\n    return n\nprint(fact(6))', why: '没实现阶乘，只返回原值' },
  { id: '6-1', code: 'import pandas as pd\ndf = pd.read_csv("data/orders.csv")\nresult = round(df["amount"].sum(), 2)', why: '没筛「已完成」，把退款单也算进去了' },
  { id: '6-1b', idAlias: '6-1', code: 'import pandas as pd\ndf = pd.read_csv("data/orders.csv")\ndone = df[df["status"] == "已完成"]\nresult = done["amount"]', why: '忘了 .sum()，交上去一个 Series' },
  { id: '6-2', code: 'import pandas as pd\ndf = pd.read_csv("data/orders.csv")\nmask = (df["channel"] == "App") & (df["amount"] > 500) & (df["status"] == "已完成")\nresult = list(df[mask].head(3)["order_id"])', why: '忘了按金额排序，取的是原顺序前三条' },
  { id: '6-3', code: 'import pandas as pd\ndf = pd.read_csv("data/dirty_orders.csv")\nresult = df.drop_duplicates().dropna()', why: '没把文字金额转成数字，amount 还是 object' },
  { id: '6-4', code: 'import pandas as pd\ndf = pd.read_csv("data/orders.csv")\nresult = (df.groupby("category")["amount"].agg(["count", "sum"]).sort_values("sum", ascending=False).reset_index().rename(columns={"count": "orders", "sum": "revenue"}))', why: '没筛「已完成」，指标全偏大' },
  { id: '7-1', code: 'import pandas as pd\no = pd.read_csv("data/orders.csv")\np = pd.read_csv("data/products.csv")\ndone = o[o["status"] == "已完成"]\nm = pd.merge(done, p, on="product_id", how="left")\nresult = round((m["amount"] - m["cost"]).sum(), 2)', why: '成本没乘数量，只减了一次' },
  { id: '7-2', code: 'import pandas as pd\ndf = pd.read_csv("data/orders.csv")\ndone = df[df["status"] == "已完成"]\nresult = pd.pivot_table(done, index="channel", columns="category", values="amount", aggfunc="sum", fill_value=0)', why: '行和列写反了（变成 4×5）' },
  { id: '7-3', code: 'import pandas as pd\ndf = pd.read_csv("data/orders.csv")\ndf["order_time"] = pd.to_datetime(df["order_time"])\ndone = df.assign(month=df["order_time"].dt.strftime("%Y-%m"))\nresult = done.groupby("month")["amount"].sum().reset_index().rename(columns={"amount": "revenue"})', why: '没筛「已完成」，每月金额偏大' },
  { id: '7-4', code: 'import pandas as pd\ndf = pd.read_csv("data/orders.csv")\ndone = df[df["status"] == "已完成"]\ndone = done.assign(refunded=(done["status"] == "已退款").astype(int))\ng = done.groupby("category").agg(orders=("order_id", "count"), refunds=("refunded", "sum")).reset_index()\ng["rate"] = (g["refunds"] / g["orders"]).round(4)\nresult = g.sort_values("rate", ascending=False).reset_index(drop=True)', why: '先筛了已完成，分母口径错了（退款率全变 0）' },

  /* ---- 判分松紧的反例：结果"看起来对"但细节错，必须被拦下 ---- */
  { id: '6-3b', idAlias: '6-3', code: 'import pandas as pd\ndf = pd.read_csv("data/dirty_orders.csv")\ndf = df.drop_duplicates()\ndf["amount"] = pd.to_numeric(df["amount"], errors="coerce")\nresult = df.dropna()', why: '没清尾空格，status 里还留着 "已完成  "' },
  { id: '6-4b', idAlias: '6-4', code: 'import pandas as pd\ndf = pd.read_csv("data/orders.csv")\ndone = df[df["status"] == "已完成"]\nt = done.groupby("category")["amount"].agg(["count", "sum"]).sort_values("sum", ascending=False).reset_index().rename(columns={"count": "orders", "sum": "revenue"})\nt["orders"] = 0\nresult = t', why: 'orders 全填 0，总额却还对' },
  { id: '7-2b', idAlias: '7-2', code: 'import pandas as pd\ndf = pd.read_csv("data/orders.csv")\ndone = df[df["status"] == "已完成"]\nt = pd.pivot_table(done, index="category", columns="channel", values="amount", aggfunc="sum", fill_value=0)\nc0, c1 = t.columns[0], t.columns[1]\ntmp = t[c0].copy()\nt[c0] = t[c1]\nt[c1] = tmp\nresult = t', why: '两个渠道整列互换，总额不变' },
  { id: '7-3b', idAlias: '7-3', code: 'import pandas as pd\ndf = pd.read_csv("data/orders.csv")\ndf["order_time"] = pd.to_datetime(df["order_time"])\ndone = df[df["status"] == "已完成"]\ndone = done.assign(month=done["order_time"].dt.strftime("%Y-%m"))\nt = done.groupby("month")["amount"].sum().reset_index().rename(columns={"amount": "revenue"})\nt.loc[[0, 1], "revenue"] = t.loc[[1, 0], "revenue"].values\nresult = t', why: '1 月和 2 月的金额互换，总额不变' },

  /* ---- 第 8 章：图结构错 ---- */
  { id: '8-1', code: 'import matplotlib\nmatplotlib.use("Agg")\nimport matplotlib.pyplot as plt\nimport pandas as pd\ndf = pd.read_csv("data/orders.csv")\ndf["order_time"] = pd.to_datetime(df["order_time"])\ndone = df[df["status"] == "已完成"]\ng = done.assign(m=done["order_time"].dt.strftime("%Y-%m")).groupby("m")["amount"].sum()\nfig, ax = plt.subplots(figsize=(6, 3.6))\nax.plot(list(g.index), list(g.values), marker="o")\nresult = fig', why: '图画对了但没加标题和轴标签' },
  { id: '8-2', code: 'import matplotlib\nmatplotlib.use("Agg")\nimport matplotlib.pyplot as plt\nimport pandas as pd\ndf = pd.read_csv("data/orders.csv")\nrev = df[df["status"] == "已完成"].groupby("category")["amount"].sum()\nfig, ax = plt.subplots(figsize=(6, 3.4))\nax.bar(list(rev.index), list(rev.values))\nax.set_title("各类目收入")\nax.set_ylabel("金额（元）")\nresult = fig', why: '柱状图没排序' },
  { id: '8-3', code: 'import matplotlib\nmatplotlib.use("Agg")\nimport matplotlib.pyplot as plt\nimport pandas as pd\ndf = pd.read_csv("data/orders.csv")\ndf["order_time"] = pd.to_datetime(df["order_time"])\ndf["m"] = df["order_time"].dt.strftime("%Y-%m")\ndone = df[df["status"] == "已完成"].groupby("m")["amount"].sum()\nrefund = df[df["status"] == "已退款"].groupby("m")["amount"].sum()\nfig, ax = plt.subplots(figsize=(6, 3.6))\nax.plot(list(done.index), list(done.values), marker="o", label="已完成")\nax.plot(list(refund.index), list(refund.values), marker="s", label="已退款")\nax.set_title("完成 vs 退款金额对比")\nax.set_xlabel("月份")\nax.set_ylabel("金额（元）")\nresult = fig', why: '写了 label 但没调 legend()，图例不出现' },

  /* ---- 第 9 章：项目关的典型错误 ---- */
  { id: '9-1', code: 'import matplotlib\nmatplotlib.use("Agg")\nimport matplotlib.pyplot as plt\nimport pandas as pd\ndf = pd.read_csv("data/orders.csv")\ndone = df[df["status"] == "已完成"]\ngmv = round(float(done["amount"].sum()), 2)\norders = int(len(done))\naov = round(gmv / len(df), 2)\nrefund_rate = round(int((df["status"] == "已退款").sum()) / len(df), 4)\ncg = done.groupby("category")["amount"].agg(["sum", "count"])\ncg["aov"] = cg["sum"] / cg["count"]\ntop_category = cg["sum"].idxmax()\nbest_aov_category = cg["aov"].idxmax()\nm = done.assign(m=pd.to_datetime(done["order_time"]).dt.strftime("%Y-%m"))\nmg = m.groupby("m")["amount"].sum()\nmonthly = [round(float(v), 2) for v in mg]\nfig, ax = plt.subplots(figsize=(6, 3.6))\nax.plot(list(mg.index), monthly, marker="o")\nax.set_title("月度 GMV")\nreport = {"gmv": gmv, "orders": orders, "aov": aov, "refund_rate": refund_rate, "top_category": top_category, "best_aov_category": best_aov_category, "monthly": monthly}', why: '客单价用全部订单当分母，口径错了' },
  { id: '9-1b', idAlias: '9-1', code: 'import matplotlib\nmatplotlib.use("Agg")\nimport matplotlib.pyplot as plt\nimport pandas as pd\ndf = pd.read_csv("data/orders.csv")\ndone = df[df["status"] == "已完成"]\ngmv = round(float(done["amount"].sum()), 2)\norders = int(len(done))\naov = round(gmv / orders, 2)\nrefund_rate = round(int((df["status"] == "已退款").sum()) / len(df), 4)\ncg = done.groupby("category")["amount"].agg(["sum", "count"])\ncg["aov"] = cg["sum"] / cg["count"]\ntop_category = cg["sum"].idxmax()\nbest_aov_category = top_category\nm = done.assign(m=pd.to_datetime(done["order_time"]).dt.strftime("%Y-%m"))\nmg = m.groupby("m")["amount"].sum()\nmonthly = [round(float(v), 2) for v in mg]\nfig, ax = plt.subplots(figsize=(6, 3.6))\nax.plot(list(mg.index), monthly, marker="o")\nax.set_title("月度 GMV")\nreport = {"gmv": gmv, "orders": orders, "aov": aov, "refund_rate": refund_rate, "top_category": top_category, "best_aov_category": best_aov_category, "monthly": monthly}', why: '把「GMV 最高」直接当成「客单价最高」，两个指标混为一谈' },

  /* ---- 第 10–11 章：工程化关卡的反例 ---- */
  { id: '10-1', code: 'import argparse\n\ndef build_parser():\n    p = argparse.ArgumentParser()\n    p.add_argument("--channel", default="all")\n    p.add_argument("--limit", default="10")\n    p.add_argument("--verbose", action="store_true")\n    return p', why: '--limit 忘了 type=int，解析出来是字符串 "3"' },
  { id: '10-2', code: 'import json\nfrom pathlib import Path\n\ndef save_report(data, path):\n    Path(path).write_text(json.dumps(data), encoding="utf-8")\n\ndef load_report(path):\n    return json.loads(Path(path).read_text(encoding="utf-8"))', why: '中文被转成 \\uXXXX，人没法直接读文件' },
  { id: '10-3', code: 'import logging\n\nlogger = logging.getLogger("x")\n\nclass CalcError(Exception):\n    pass\n\ndef safe_div(a, b):\n    if b == 0:\n        raise CalcError("除数不能为 0")\n    return a / b\n\ndef compute(values):\n    total = 0.0\n    for v in values:\n        try:\n            total += safe_div(100, v)\n        except CalcError as e:\n            print("跳过", e)\n    return round(total, 2)', why: '用 print 代替 logging，日志没有级别也收不走' },
  { id: '10-4', code: 'from dataclasses import dataclass\n\n@dataclass\nclass Order:\n    order_no: str\n    channel: str\n    qty: int\n    price: float\n\n    def total(self) -> float:\n        return round(self.qty * self.price, 2)\n\ndef format_order(o):\n    return "%s | %s | %.2f" % (o.order_no, o.channel, o.total())', why: 'format_order 没有类型注解，函数签名不再自解释' },
  { id: '11-1', code: 'import unittest\n\ndef normalize_name(s):\n    return s.strip().lower()\n\nclass TestNormalize(unittest.TestCase):\n    def test_strip(self):\n        self.assertEqual(normalize_name("  Ann  "), "ann")', why: '只写 1 个测试方法，边界和空值都没覆盖' },
  { id: '11-2', code: 'import argparse\n\ndef run(argv=None):\n    p = argparse.ArgumentParser()\n    p.add_argument("--channel", default="all")\n    p.add_argument("--limit", type=int, default=10)\n    a = p.parse_args(argv)\n    return ("channel=%s limit=%d" % (a.channel, a.limit), 0)', why: '参数非法时让 argparse 抛 SystemExit，调度器收到的是 traceback 不是退出码 2' },
  { id: '11-3', code: 'import argparse\nimport json\nimport logging\nfrom pathlib import Path\n\nlogger = logging.getLogger("daily_report")\n\nclass ReportError(Exception):\n    pass\n\ndef process(data, limit):\n    rows = data[:limit]\n    return {"orders": len(rows), "revenue": round(sum(float(r["amount"]) for r in rows), 2), "channel_count": len({r["channel"] for r in rows})}\n\ndef main(argv=None):\n    p = argparse.ArgumentParser()\n    p.add_argument("--input")\n    p.add_argument("--output")\n    p.add_argument("--limit", type=int, default=10)\n    a = p.parse_args(argv)\n    data = json.loads(Path(a.input).read_text(encoding="utf-8"))\n    rep = process(data, a.limit)\n    with open(a.output, "a", encoding="utf-8") as f:\n        f.write(json.dumps(rep, ensure_ascii=False))\n    return 0\n\nif __name__ == "__main__":\n    main()', why: '追加写文件，重跑两次结果翻倍，破坏幂等；文件不存在也没处理' },
  { id: '11-4', code: 'def summarize(rows):\n    total = 0\n    for r in rows:\n        try:\n            total += float(r["amount"])\n        except Exception:\n            pass\n    return (len(rows), total)', why: '用 except 把 KeyError 吞掉：字段依然拼错，坏数据被静默跳过，报表少算还不报错' },

  /* ---- 第 12 章：织网之厅的反例 ---- */
  { id: '12-1', code: 'def iter_amounts(path):\n    rows = []\n    with open(path, encoding="utf-8") as f:\n        for line in f.readlines()[1:]:\n            parts = line.strip().split(",")\n            if len(parts) >= 2:\n                try:\n                    rows.append(float(parts[1]))\n                except ValueError:\n                    continue\n    return rows\n\n\ndef total_revenue(path):\n    return round(sum(iter_amounts(path)), 2)', why: '用 readlines() 把整份文件读进内存，还返回列表——生成器白学了' },
  { id: '12-2', code: 'import time\n\nCALLS = []\n\n\ndef timed(fn):\n    def wrapper(*args, **kwargs):\n        t0 = time.time()\n        r = fn(*args, **kwargs)\n        CALLS.append((fn.__name__, (time.time() - t0) * 1000))\n        return r\n    return wrapper', why: '没加 functools.wraps，函数名变成 wrapper；也没 try/finally，报错时一条都不记' },
  { id: '12-2b', idAlias: '12-2', code: 'import functools\nimport time\n\nCALLS = []\n\n\ndef timed(fn):\n    @functools.wraps(fn)\n    def wrapper(*args, **kwargs):\n        t0 = time.time()\n        r = fn(*args, **kwargs)\n        CALLS.append((fn.__name__, (time.time() - t0) * 1000))\n        return r\n    return wrapper', why: '有 wraps 但没用 finally：函数一抛异常，这条耗时记录就丢了，失败率永远算不出来' },
  { id: '12-3', code: 'def extract_orders(text):\n    out = []\n    for tok in text.split():\n        if tok.startswith("SO-") and tok not in out:\n            out.append(tok)\n    return out\n\n\ndef mask_phone(text):\n    return text', why: '用 split 按空格切，标点粘在单号上就带出来了；mask_phone 根本没实现' },
  { id: '12-3b', idAlias: '12-3', code: 'import re\n\ndef extract_orders(text):\n    return list(dict.fromkeys(re.findall(r"\\d+-\\d+", text)))\n\ndef mask_phone(text):\n    return re.sub(r"1[3-9]\\d{9}", lambda m: m.group(0)[:3] + "****" + m.group(0)[-4:], text)', why: '只按数字-数字抠，没有 SO- 前缀约束，会把日期和别的编号一起捞出来' },
  { id: '12-4', code: 'import asyncio\n\nasync def fetch_order(oid):\n    await asyncio.sleep(0.01)\n    return {"id": oid, "status": "ok"}\n\nasync def fetch_all(ids):\n    out = []\n    for i in ids:\n        out.append(await fetch_order(i))\n    return out', why: 'for 循环里逐个 await 就是串行，30 个还是 6 秒，等于没并发' },
  { id: '12-4b', idAlias: '12-4', code: 'import time\n\ndef fetch_order(oid):\n    time.sleep(0.01)\n    return {"id": oid, "status": "ok"}\n\ndef fetch_all(ids):\n    return [fetch_order(i) for i in ids]', why: '写成了普通函数，连协程都不是，asyncio 一点没用上' }
];

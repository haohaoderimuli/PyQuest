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
  '9-1': 'import matplotlib\nmatplotlib.use("Agg")\nimport matplotlib.pyplot as plt\nimport pandas as pd\n\ndf = pd.read_csv("data/orders.csv")\ndone = df[df["status"] == "已完成"]\n\ngmv = round(float(done["amount"].sum()), 2)\norders = int(len(done))\naov = round(gmv / orders, 2)\nrefund_rate = round(int((df["status"] == "已退款").sum()) / len(df), 4)\n\ncg = done.groupby("category")["amount"].agg(["sum", "count"])\ncg["aov"] = cg["sum"] / cg["count"]\ntop_category = cg["sum"].idxmax()\nbest_aov_category = cg["aov"].idxmax()\n\nm = done.assign(m=pd.to_datetime(done["order_time"]).dt.strftime("%Y-%m"))\nmg = m.groupby("m")["amount"].sum()\nmonthly = [round(float(v), 2) for v in mg]\n\nfig, ax = plt.subplots(figsize=(6, 3.6))\nax.plot(list(mg.index), monthly, marker="o")\nax.set_title("月度 GMV 走势")\nax.set_xlabel("月份")\nax.set_ylabel("GMV（元）")\n\nreport = {\n    "gmv": gmv,\n    "orders": orders,\n    "aov": aov,\n    "refund_rate": refund_rate,\n    "top_category": top_category,\n    "best_aov_category": best_aov_category,\n    "monthly": monthly,\n}'
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
  { id: '9-1b', idAlias: '9-1', code: 'import matplotlib\nmatplotlib.use("Agg")\nimport matplotlib.pyplot as plt\nimport pandas as pd\ndf = pd.read_csv("data/orders.csv")\ndone = df[df["status"] == "已完成"]\ngmv = round(float(done["amount"].sum()), 2)\norders = int(len(done))\naov = round(gmv / orders, 2)\nrefund_rate = round(int((df["status"] == "已退款").sum()) / len(df), 4)\ncg = done.groupby("category")["amount"].agg(["sum", "count"])\ncg["aov"] = cg["sum"] / cg["count"]\ntop_category = cg["sum"].idxmax()\nbest_aov_category = top_category\nm = done.assign(m=pd.to_datetime(done["order_time"]).dt.strftime("%Y-%m"))\nmg = m.groupby("m")["amount"].sum()\nmonthly = [round(float(v), 2) for v in mg]\nfig, ax = plt.subplots(figsize=(6, 3.6))\nax.plot(list(mg.index), monthly, marker="o")\nax.set_title("月度 GMV")\nreport = {"gmv": gmv, "orders": orders, "aov": aov, "refund_rate": refund_rate, "top_category": top_category, "best_aov_category": best_aov_category, "monthly": monthly}', why: '把「GMV 最高」直接当成「客单价最高」，两个指标混为一谈' }
];

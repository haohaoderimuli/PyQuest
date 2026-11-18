# 蛇之塔 · PyQuest

一个跑在浏览器里的 Python 闯关游戏。**40 关 11 章**，从 `print` 一路到 `pandas` 分组分析、`matplotlib` 画图，再到**脚本工程化**：argparse、pathlib、异常与 logging、dataclass、unittest、退出码与幂等、可交付 CLI。最后一关产出一份可下载的分析报告，工程化七关另串成一条可导出的交付链。

另有**岗位知识库 8 篇**与**真工具实操包**（venv / pytest / ruff / CI / 打包的逐步手册与真实配置文件），补的是「写代码片段」和「写能交付的脚本」之间的距离。

还有一份**「企业第一周」作业包 `assignment/`**：给你一份工单、一份脏数据和一个空目录，用 VS Code 从零写出一个能让调度器每天跑的渠道日报脚本，四关累加（写脚本 → 上测试 → 抗故障 → 交给别人）。`check.py` 在本机真跑你的代码逐条判，不靠自评；详见下面专门一节。

**没有后端、没有构建步骤、没有网络依赖。** 代码在你本机的 Python 运行时里真跑，判题是真的执行结果，不是字符串匹配。

---

## 怎么打开

双击 **`启动游戏.bat`**。

它会起一个本地静态服务并自动打开浏览器。关掉黑窗口就等于停止。

> 为什么不用双击 `index.html`：那样浏览器读不到同目录的 `pyodide/`（跨目录读取被 CORS 拦），只能联网从 CDN 下载运行时，首次要等二十多秒。用 bat 是本地读取，1.9 秒就绪。

手动起的等价命令：

```bash
python serve.py
```

端口从 8770 开始找，被占用会自动往后挪。

**在线版**：<https://haohaoderimuli.github.io/PyQuest/>（GitHub Pages，`serve.py` 和 bat 都不需要上传）。

---

## 目录里都有什么

```
index.html          整个游戏（HTML + CSS + JS 全内联，含 40 关 / 理论卡 / 知识库 / 工具台 / 交付链 / 第一周作业）
serve.py            本地静态服务器，带正确的 MIME、缓存策略与静态白名单
启动游戏.bat        Windows 启动入口
package.json        只有 devDependencies，运行时零依赖
pyodide/            Python 运行时 + 各库的 wheel（约 72MB）
toolkits/           真工具实操包：6 组逐步手册 + 19 个真实配置/脚本文件
assignment/         企业第一周作业包
  README.md           总说明：场景、四阶段、怎么开始
  TASKS/              四份任务书（工单原文 / 要交什么 / 怎么判）
  workspace/          空工作区：只有说明和 data/，代码由学习者自己写
  check.py            本机真跑验收（21 条检查）
  solution/           完整参考解 + 交付文件示例，卡住再看
  DELIVERY.md         交付记录模板
data/               关卡用的数据文件
  orders.csv          2400 条合成电商订单
  products.csv        40 个商品（成本、库存、上架时间）
  dirty_orders.csv    815 行故意弄脏的表，给清洗关用
  NotoSansSC-Subset.otf  中文字体子集，给 matplotlib 用
tests/
  run_levels.mjs      跑所有关卡参考解 + 反例
  solutions.mjs       参考解和反例的代码
  e2e.mjs             浏览器端端到端测试
  e2e_engineering.mjs 工程化扩展的浏览器验收（新视图 / 下载 / 自评 / 交付链）
  e2e_assignment.mjs  作业包浏览器验收（下载 / 自评隔离 / 白名单 / 路径穿越）
  check_assignment.py 验收脚本的自检：参考解全绿、六种破坏各被拦下
```

---

## 关卡内容

| 章 | 主题 | 关数 |
|---|---|---|
| 1 火种之厅 | 输出与变量 | 4 |
| 2 岔路口 | 条件分支 | 4 |
| 3 轮回阶梯 | 循环 | 4 |
| 4 容器回廊 | 列表与字典 | 4 |
| 5 造物工坊 | 函数 | 4 |
| 6 数据初探 | pandas 读表、筛选、清洗、分组 | 4 |
| 7 联结之桥 | merge、pivot_table、日期、综合 | 4 |
| 8 绘图台 | matplotlib 折线、柱状、双系列 + 图例 | 3 |
| 9 结算台 | **项目实战**：从需求到清洗、分析、出图、生成报告 | 1 |
| 10 脚本工坊 | **工程化基础**：argparse / pathlib 与编码 / 异常与 logging / dataclass 与类型注解 | 4 |
| 11 交付之门 | **可维护的脚本**：unittest / 退出码与幂等 / BOSS 可交付 CLI | 3 |

每一关都是「理论 / 动手」两个页签：

- **理论**：3 张知识卡，每张配一段可运行的示例，点「运行看效果」当场出结果（画图示例会直接显示图），也可以「抄进编辑器」拿去改。
- **动手**：写代码 → 运行 → 判题。

判题有三种模式：

- **输出比对**（第 1–5 章）：执行代码，抓标准输出，逐行和期望结果比。不匹配会指出第几行开始不一样。
- **断言判题**（第 6–7 章）：不看打印了什么，而是在同一个命名空间里跑隐藏断言，直接检查 `result` 的数据结构。答错时告诉你「列名不对」「行数不对」「少了 3 个空值没处理」这种具体原因。
- **图表判题**（第 8 章）：检查 `Figure` 对象的结构——几条线、每个点的数值、标题、轴标签、图例文字，而不是比对像素。通过后把图画出来给你看。
- **多产出判题**（第 9 章）：同时校验一个 `report` 字典里的 7 个指标和一张图，每项独立报错。通过后把你算的数字和图拼成一份 HTML 报告，可以直接下载存档。
- **工程化断言判题**（第 10–11 章）：在同一个命名空间里真跑标准库——`argparse` 解析参数、`pathlib` 写文件再读回、`logging` 捕获 warning、`dataclasses.fields` 检查结构、`unittest.TestLoader` 真跑你写的测试、同一参数调两次比结果验幂等。判的是脚本行为，不是打印了什么。

---

## 工程化扩展：从代码段到能交付的脚本

前 32 关回答「这段 Python 会不会写」，后面这层回答「写出来的东西能不能交给别人跑」。

**四个新视图**（顶栏切换，不影响闯关进度）：

| 视图 | 内容 |
| --- | --- |
| 知识库 | 8 篇岗位内容：脚本与代码段、venv 与依赖、项目结构、配置与密钥、异常与日志、测试与覆盖率、类型与静态检查、Git/CI 与打包。每篇标了对应关卡与配套文件 |
| 真工具实操 | 6 组工具的逐步手册 + 19 个真实文件下载（`requirements.txt`、`pyproject.toml`、`pytest.ini`、`.ruff.toml`、`.pre-commit-config.yaml`、`daily_report.py`、`logging_config.py`、`python-ci.yml`、`Makefile`、交付清单等）。勾选是**自评**，只存 localStorage，不写通关记录、不加 XP |
| 交付链 | 把工程化七关串成一条链，状态直接读 `state.cleared`，可导出独立 HTML 清单当作品附件 |
| 第一周作业 | 一份工单、四关任务书、本机验收脚本与参考解的下载入口；自评同样只存 localStorage，真正判分在本机 `check.py` |

**七关真跑什么**：`10-1` argparse 解析、`10-2` pathlib + UTF-8 往返、`10-3` 自定义异常 + logging.warning 真被捕获、`10-4` dataclass 与返回注解、`11-1` unittest 真跑你写的测试类、`11-2` 退出码 0/2 与幂等、`11-3` BOSS 把入口/处理/落盘/日志/退出码组装起来。参考解与 7 个反例都在 `tests/solutions.mjs`，由 `run_levels.mjs` 在**项目自带的 Pyodide** 里真跑验证。

**`toolkits/cli/daily_report.py` 只用标准库**，可以在本机直接跑（不需要 pandas）：

```bash
python toolkits/cli/daily_report.py --help
python toolkits/cli/daily_report.py --input data/orders.csv --output out/report.json --limit 100
python -m unittest discover -s toolkits/testing -p "test_*.py" -v
```

**静态白名单**：`serve.py` 只放行游戏运行所需后缀；`.md/.py/.toml/.ini/.yaml/.yml` 等**仅在 `toolkits/` 与 `assignment/` 目录内**放行，`Makefile` / `.gitignore` 按文件名特例放行，`.json` 只给 `pyodide/pyodide-lock.json`。判断后缀前先做 `..` 与 `realpath + commonpath` 校验，堵住 `/toolkits/../serve.py` 这类穿越。根目录 `serve.py`、`README.md`、`package.json`、`tests/`、`.git` 一律 404，目录列表关闭。

**边界，说清楚**：PyQuest 在浏览器里跑的是 Python 代码片段，**装不了 venv、pytest、ruff、pre-commit、CI**。这些工具的手册与配置文件已做静态校验，`daily_report.py` 与 `test_channel_report.py` 在本机真跑过（CLI 退出码 0/2、5 项 unittest 通过）；其余要你在自己的环境里按手册跑通，留下的测试报告、日志与提交历史才是完整证据。

---

## 企业第一周作业包（`assignment/`）

前 40 关是「给你题目，写一段能跑的代码」；`toolkits/` 是「照着手册把真工具装起来」。这一份是**工单**：一份需求、一份脏数据、一个空目录，交付一个别人敢让调度器每天跑的脚本。码在你本机 VS Code 写，平台不替你判。

| 关卡 | 时点 | 交付 | 企业里对应的动作 |
| --- | --- | --- | --- |
| TASK 01 | 周一上午 | `daily_report.py` | 把含糊的需求问成口径，写参数入口与输出契约 |
| TASK 02 | 周一下午 | `test_daily_report.py` | 证明口径没写错，让以后改代码的人立刻知道改坏了 |
| TASK 03 | 周二 | 异常 / 日志 / 退出码 / 幂等 | 让无人值守的调度器敢调，补跑不翻倍 |
| TASK 04 | 周三～周五 | README / Makefile / 依赖 / Git 历史 / 交付记录 | 换个人接得住，一次改动一次提交 |

四关累加，不是四个小脚本；TASK 04 验收会连带重跑前三关。

```bash
cd assignment/workspace
code .                        # 用 VS Code 打开空目录
python -m venv .venv
cd ..
python check.py --task 1      # 边写边验；全跑就是 python check.py
```

**`check.py` 真的执行你写的代码**（21 条检查，退出码 0 / 1）：

- 用两份不同数据跑 CLI，逐个数比对 JSON —— 写死答案过不了
- 真跑 `unittest`，并把你的模块里 `"paid"` 改坏一次再跑，**测试必须变红**（变异测试，证明用例在守口径）
- 造「文件不存在 / 金额非数字 / CSV 缺列」三种故障，查退出码 2 与可读错误信息
- 同参数跑两次比对输出字节（幂等），`import` 一次查有没有副作用
- 查真实 `git log` 提交次数、README / Makefile / `.gitignore` / 交付记录的内容

`solution/` 是完整可跑的参考解（21/21 全绿），标注「卡住 20 分钟再看」。`tests/check_assignment.py` 是**验收脚本的自检**：复制参考解到临时工作区应全绿；写死答案、假测试、追加写、`--help` 返回 2、删掉 `.git` 这六种破坏，都必须被对应检查拦下。这样能证明 `check.py` 不是数文件存在就给过。

**边界**：不模拟真实调度器、不接数据库、不联网上传你的代码；站内勾选是自评，不写通关记录、不加 XP。`assignment/workspace/` 里学生写的代码、测试和自建 `.git` 都被根 `.gitignore` 排除，不进 PyQuest 仓库。

---

## 开发与测试

```bash
# 资源自检（毫秒级）：wheel 是否齐、体积声明和实际是否一致
node tests/check_assets.mjs

# 关卡逻辑回归（不需要浏览器，用项目自带的 pyodide 跑）
node tests/run_levels.mjs

# 浏览器端 E2E
# 第一次跑之前必须先装依赖，否则会报「找不到 playwright-core」
npm install
python serve.py                         # 另开一个终端，默认 8770
node tests/e2e.mjs
node tests/e2e_engineering.mjs           # 工程化扩展的新视图验收
node tests/e2e_assignment.mjs            # 作业包：下载 / 自评隔离 / 白名单 / 路径穿越

# 作业验收脚本的自检（不需要浏览器，约 30 秒）
python tests/check_assignment.py
```

`package.json` 里只有 `devDependencies: playwright-core` 一项，游戏本身零依赖。

`run_levels.mjs` 会从 `index.html` 里抽取 `PREAMBLE` 和 `LEVELS` 来跑——测的就是页面正在用的那份逻辑，不是另写一套。

`check_assets.mjs` 防的是「改了代码没改数据」：关卡声明了某个包、但 wheel 没下载到，或者 `PKG_SIZE` 里漏了它（进度条分母会算错）。跑一次几十毫秒。

期望输出：

```
参考解 40/40 通过，反例 32/32 拦下
```

反例是 31 个「故意写错」的答案（大小写不一致、差一错误、忘了汇总、分母口径错、两个格子互换但总额不变、图画对了但没标题、柱状图没排序、把「GMV 最高」当成「客单价最高」……以及工程化关里 `--limit` 忘了 `type=int`、中文写成 `\uXXXX`、用 print 代替 logging、只写 1 个测试、参数错抛 SystemExit、追加写文件破坏幂等），用来确认判题不会把它们放过去。

改关卡、改 `expect`、改 `PREAMBLE` 之后都该跑一遍。

---

## 技术说明

**执行引擎**：Pyodide 0.26.4（CPython 3.12 编译成 WebAssembly）。运行时和各库的 wheel 都在本地 `pyodide/` 目录，不联网也能用。

**超时保护**：用 `sys.settrace` 注入 deadline，死循环会在 3 秒后被掐断（数据/画图关放宽到 20 秒，因为首次 `import pandas` 本身就要几秒）。代价是这期间页面会卡住——执行前会先让浏览器把「运行中」这一帧画出来。

**按需加载**：打开只加载 13MB 运行时；进第 6 章装 pandas 及其依赖（约 36MB），进第 8 章再装 matplotlib 那一套（再约 23MB）。这些都在**进关卡时就开始后台下载**，读理论卡的工夫基本装完了，点「运行」直接出结果。不假装离线支持没装的东西。

**本地缓存**：wheel 下载后会存进 IndexedDB（`pyquest-assets`）。GitHub Pages 只给 10 分钟 HTTP 缓存，隔天再来那 58MB 就得重下；有了这一层，第二次起直接读本地，限速 1.5MB/s 下实测 60.5s → 10.9s。缓存的包长度和声明值对不上（差超过 64KB 或 2%）就当坏的，重新下；装载失败也会把这次用到的缓存清掉重来。

**加载进度是真字节数**：Pyodide 只在整包装完时发一条消息，而且它驱动下载时会占住主线程——等它的话进度条会长时间停在 0，然后一跳到底。所以这里顺着依赖顺序自己拉 wheel，边拉边按字节报进度（`正在下载 matplotlib（15.0MB）· 总进度 12.3 / 58.3 MB`），拉到的内容直接回喂给它，不会多下一遍。下载期间顶栏还有一条 2px 细线，停在「理论」页签也看得见。

**中文字体**：matplotlib 自带字体没有中文字形，直接写中文标题会变方块。这里预装了 Noto Sans CJK SC 的子集（3.3MB，GB2312 全字集）并设成默认，所以关卡里可以直接写中文标签。

**进度存储**：通关记录、每关写的代码、展开到第几条提示，都放在浏览器 `localStorage`。顶栏「⋯」菜单可以导出/导入/清空。

---

## 已知限制

- 首次进数据关要下 36MB（pandas 及依赖），进画图关再下 23MB（matplotlib 那一套）。都在进关卡时后台下载，右侧有真实字节进度，顶栏有细进度线。下过一次就存进 IndexedDB，之后不用再下。
- 死循环会让页面冻结 3 秒（无法在浏览器主线程里中途打断 Python）。
- 通过预览面板打开时用的是映射路径，读不到本地 `pyodide/`，会退化成联网模式。**用 bat 打开。**
- 项目关（9-1）的报告是自动拼的：数字来自你的 `report`，结论句是模板化的，不是 AI 写的。想加自己的解读，改 `index.html` 里的 `buildReportHtml`。
- 进度存在浏览器 localStorage 里，没有云同步。换设备或换浏览器时，用顶栏「⋯」→「导出进度」存成 JSON，在新环境里「导入进度」即可。
- 进度是按**网址**存的。`serve.py` 端口从 8770 往后找，如果 8770 被占用而挪到 8771，浏览器会当成另一个站点，进度看着像丢了——关掉占用的那个实例再开即可。
- 工程化扩展里的 venv / pytest / ruff / pre-commit / CI **不在浏览器里跑**：`toolkits/` 给的是逐步手册与真实配置文件，其中 `daily_report.py`（标准库 CLI）和 `test_channel_report.py`（5 项 unittest）已在本机真跑过，其余需要你在自己的环境里按手册跑通。页面里的自评勾选只存 localStorage，不写通关记录、不加 XP。
- `assignment/` 的作业**必须在本机 VS Code 里做**：平台能下载任务书与验收脚本，但看不到你的工作区，也不会替你判分或收作业。`check.py` 只在本机执行、不联网；变异测试会在 `workspace/.mutant/` 临时复制并改坏你的模块，跑完立刻删除，不改动源文件。作业不模拟真实调度器、不接数据库、不发邮件。

---

## 许可与来源

本项目自身的代码可自由使用、修改。

内置的第三方组件：

| 组件 | 版本 | 许可证 |
|---|---|---|
| Pyodide | 0.26.4 | MPL-2.0 |
| CPython（打包在 Pyodide 内） | 3.12 | PSF License |
| pandas | 2.2.0 | BSD-3-Clause |
| numpy | 1.26.4 | BSD-3-Clause |
| matplotlib | 3.5.2 | PSF-based（matplotlib license） |
| Pillow | 10.2.0 | HPND |
| fonttools | 4.51.0 | MIT |
| python-dateutil | 2.9.0 | Apache-2.0 / BSD-3-Clause |
| pytz | 2024.1 | MIT |
| six | 1.16.0 | MIT |
| Noto Sans CJK SC（字体子集） | — | SIL Open Font License 1.1 |

各项目的完整许可证文本见其官方仓库。对外分发时请保留这些声明。

**数据**：`data/` 下的 CSV 全部是程序合成的假数据（固定随机种子生成），不含任何真实用户或交易信息。

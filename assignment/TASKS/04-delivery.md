# TASK 04 · 交给别人（周三～周五）

## 工单原文

> 脚本我看了，能跑。周五之前整理一下，我要交给接手的人：怎么装、怎么跑、怎么测、出错找谁、改过几次。顺便把提交历史理清楚，别一个 commit 塞一周的活。

这一关**几乎不写代码**，但它是"能跑"和"能交付"的分界线。企业第一周被 review 最多的往往就是这些。

## 要交什么（都在 `workspace/` 里）

| 文件 | 要求 |
| --- | --- |
| `README.md` | 把工作区自带的那份 `README.md` **改写成项目 README**：一句话说明脚本干嘛；一条最小运行命令；`--input` / `--output` 参数说明；退出码表（0 / 2 各代表什么）；怎么跑测试 |
| `requirements.txt` | 本次只用标准库，可以只写注释说明"无第三方依赖"，但**文件必须存在** |
| `Makefile` | 至少 `run:` 和 `test:` 两个目标，把长命令收起来 |
| `.gitignore` | 至少忽略 `__pycache__/`、`.venv/`、`out/`、`*.pyc` |
| `.git/` | 真实提交历史，**不少于 3 次提交** |
| `DELIVERY.md` | 从 `assignment/DELIVERY.md` 复制过来填写，附 `python check.py` 全绿输出 |

## Git 提交怎么分

一次改动一次提交，信息写业务原因，别写 `update` / `111`：

```
git init
git add daily_report.py data/ README.md
git commit -m "feat: 渠道日报脚本，只统计已支付订单"          # 周一上午
git add test_daily_report.py
git commit -m "test: 覆盖 paid 口径、空输入与坏数据"           # 周一下午
git add daily_report.py
git commit -m "fix: 故障输入返回退出码 2 并保证幂等"            # 周二
git add README.md Makefile requirements.txt .gitignore DELIVERY.md
git commit -m "docs: 补运行说明、依赖清单与交付记录"            # 周五
```

**先 `git add .gitignore` 再提交代码**，别把 `.venv/` 和 `__pycache__/` 加进去 —— 几万个文件进仓库是新人最常犯的错。`git status --short` 随时看。

验收用 `git -C workspace log --oneline` 数真实提交，不是看你写了几句 "commit"。

## README 里必须写清的一件事

**口径**。TASK 01 里组长那句「只算已支付的订单，按渠道拆金额」要落成白纸黑字：

> 只统计 `status == "paid"` 的行；`refunded` 与 `pending` 不计入。`revenue` 为这些行 `amount` 之和（保留 2 位小数），`channels` 按渠道分组求和。

半年后有人问「为什么报表和财务对不上」，答案就在这段话里。没写，就得重新翻代码，还是别人翻。

## 验收会怎么判（`python check.py`）

1. `.git` 是真实仓库，`log --oneline` ≥ 3 条
2. `requirements.txt` 存在
3. `README.md` 含 `daily_report.py`、`--input` 和「退出码」字样
4. `Makefile` 含 `run:` 与 `test:`
5. `.gitignore` 含 `__pycache__` 与 `.venv`
6. `DELIVERY.md` 已填写（含 `TASK 01` 且贴了验收输出）
7. **连带重跑 TASK 01–03**， refactoring 不许把前面的功能改坏

## 最后一遍自检

```
cd assignment
python check.py
```

全绿之后，把输出贴进 `workspace/DELIVERY.md`，再补一次提交。这份清单 + 一个能换人跑的仓库，就是你第一周交得出来的东西 —— 面试时可以直接讲：需求怎么问清的、口径怎么定的、测试怎么抓回归、故障怎么暴露、历史怎么分的。

## 这一关不验的事

不检查你的 commit message 写得好不好，也不检查 README 排版。真实代码评审会看，机器看不出来 —— 自己按上面那几条对一遍。

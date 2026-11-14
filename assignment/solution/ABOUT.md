# 参考解说明 · 卡住 20 分钟再看

这个目录是**完整可跑的一份答案**，四关全部能通过 `python check.py`。它有两个用途：

1. 你卡住时对照思路，然后关掉自己重写。照抄能让验收全绿，但学不到东西。
2. `tests/check_assignment.py` 用它自检验收脚本本身：把这里的文件复制进临时 workspace、建好 Git 历史，`check.py` 必须全绿；再故意破坏几处，对应检查必须变红。

## 文件对应哪几关

| 文件 | 关卡 |
| --- | --- |
| `daily_report.py` | TASK 01 + 03（参数、口径、异常、退出码、幂等、main 守卫） |
| `test_daily_report.py` | TASK 02（8 条 unittest，其中 `test_only_paid` 会抓住变异） |
| `README.md` / `requirements.txt` / `Makefile` / `.gitignore` / `DELIVERY.md` | TASK 04 |

## 第四关的 Git 历史怎么建

参考解不含 `.git`，要自己来（一次改动一次提交，别一次塞完）：

```
cd workspace
git init
git add .gitignore
git commit -m "chore: 忽略虚拟环境与缓存"
git add daily_report.py data/
git commit -m "feat: 渠道日报脚本，只统计已支付订单"
git add test_daily_report.py
git commit -m "test: 覆盖 paid 口径、空输入与坏数据"
git add README.md Makefile requirements.txt DELIVERY.md
git commit -m "docs: 补运行说明、依赖清单与交付记录"
git log --oneline
```

## 几个故意做对的地方

- `parse_args` 的 `SystemExit` 单独接住，`--help` 返回 0 而不是被当成错误统一转 2。
- `logging.basicConfig` 放在 `main()` 里，模块被 import 时不配置全局日志、不写任何文件。
- `json.dumps(..., sort_keys=True)` + 覆盖写 + 输出里不带时间戳，三者合起来才幂等。
- `read_rows` 把「文件不存在 / 缺列 / 金额非数字」统一抛 `ReportError`，`main` 只在最外层捕一次，库函数里没有 `sys.exit()`，测试才能直接调。
- `process()` 里 `status != "paid"` 是字面量比较，变异测试能改坏它；测试里 `test_only_paid` 断言具体数值，改坏后立刻变红。

# 渠道日报脚本 · 交付记录（示例）

| 项 | 内容 |
| --- | --- |
| 交付人 | 参考解 |
| 交付日期 | 第一周周五 |
| 需求来源 | 组长：「下游看板每天早上读 report.json，写个脚本从订单 CSV 直接出」 |
| 口径确认 | 只统计 `status == "paid"`；`refunded` / `pending` 不计入；按渠道分组求和 |
| 运行命令 | `python daily_report.py --input data/orders.csv --output out/report.json` |
| 依赖 | 仅 Python 标准库，见 `requirements.txt` |

## 四关完成情况

- [x] TASK 01 · 让脚本跑起来 —— `daily_report.py`，参数入口与输出契约
- [x] TASK 02 · 给脚本上测试 —— 8 条 unittest，变异测试能抓到口径回归
- [x] TASK 03 · 让调度器敢调 —— 退出码 / 错误信息 / 幂等 / main 守卫
- [x] TASK 04 · 交给别人 —— README / Makefile / 依赖 / Git 历史 / 本清单

## 验收输出

```
PASS | daily_report.py 已创建
PASS | --help 正常且列出 --input / --output
PASS | 主数据跑通：退出码 0、自动建目录、生成 JSON
PASS | 主数据三项数值全对（只算 paid）
PASS | 换一份数据仍然算对（防写死答案）
PASS | 存在 test_*.py 测试文件
PASS | unittest 真跑且全绿
PASS | 测试数量 >= 4（从 Ran N tests 读）
PASS | 测试真的 import 了 daily_report 且含断言
PASS | 变异测试：改坏「只算 paid」后测试必须变红
PASS | 输入文件不存在 → 退出码 2 + 可读错误
PASS | 金额不是数字 → 退出码 2 + 可读错误
PASS | CSV 缺列 → 退出码 2 + 可读错误
PASS | 同参数跑两次输出字节一致（幂等）
PASS | 被 import 时不产生任何文件（main 守卫）
PASS | 真实 Git 仓库且提交历史 >= 3 次
PASS | requirements.txt 存在
PASS | README 含最小命令 / 参数 / 退出码说明
PASS | Makefile 含 run: 与 test: 目标
PASS | .gitignore 忽略 __pycache__ 与 .venv
PASS | DELIVERY.md 已填并贴了全绿输出
```

## 自己复盘三句

1. 「只算已支付」是问出来的，不在原始工单里；没问就会把 8 单全算进去。
2. 变异测试抓出过一次「测试只断言 orders 不为 0」—— 口径改坏了测试还绿。
3. 接手的人最可能卡在退出码：`--help` 被当成 `SystemExit` 统一转 2，README 里专门写了 0/2 的含义。

# 渠道日报脚本 · 交付记录

> 从 `assignment/DELIVERY.md` 复制到 `workspace/` 后填写。填完连同 `python check.py` 的全绿输出一起提交。

| 项 | 内容 |
| --- | --- |
| 交付人 | |
| 交付日期 | |
| 需求来源 | 组长：「下游看板每天早上读 report.json，写个脚本从订单 CSV 直接出」 |
| 口径确认 | 只统计 `status == "paid"`；`refunded` / `pending` 不计入；按渠道分组求和 |
| 运行命令 | |
| 依赖 | 仅 Python 标准库，见 `requirements.txt` |

## 四关完成情况

- [ ] TASK 01 · 让脚本跑起来 —— `daily_report.py`，参数入口与输出契约
- [ ] TASK 02 · 给脚本上测试 —— 至少 4 条 unittest，变异测试能抓到口径回归
- [ ] TASK 03 · 让调度器敢调 —— 退出码 / 错误信息 / 幂等 / main 守卫
- [ ] TASK 04 · 交给别人 —— README / Makefile / 依赖 / Git 历史 / 本清单

## 验收输出

在 `assignment/` 目录执行 `python check.py`，把**完整输出**贴在这里（占位符要替换掉）：

```
[把 python check.py 的输出粘贴到这一行]
```

## 自己复盘三句

1. 需求里哪一句最容易理解错？我怎么确认的？
2. 哪一个 bug 是被测试 / 验收抓出来的，而不是我自己看出来的？
3. 接手的人最可能卡在哪一步？README 里写清了吗？

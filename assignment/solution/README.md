# 渠道日报脚本

每天从订单 CSV 生成下游看板要读的 `report.json`。

## 口径（改之前先读这段）

只统计 `status == "paid"` 的订单；`refunded` 与 `pending` 不计入。
`revenue` 是这些行 `amount` 之和（保留 2 位小数），`channels` 按渠道分组求和，键按字母序排。

半年后有人问「为什么报表和财务对不上」，答案就在这段话里。

## 安装

仅用 Python 标准库，无需第三方依赖。建议还是建一个虚拟环境：

```
python -m venv .venv
.venv\Scripts\activate
```

## 运行

```
python daily_report.py --input data/orders.csv --output out/report.json
```

或用 Makefile：`make run`。

| 参数 | 说明 |
| --- | --- |
| `--input` | 输入 CSV，需含 `channel` / `amount` / `status` 列 |
| `--output` | 输出 JSON 路径，父目录不存在会自动创建 |
| `--verbose` | 多打一行明细日志 |
| `--help` | 查看完整参数说明 |

输出示例：`{"channels": {"App": 300.0, "Web": 300.5}, "orders": 5, "revenue": 600.5}`

## 退出码

| 码 | 含义 |
| --- | --- |
| `0` | 成功生成报告；`--help` 也是 0 |
| `2` | 参数用法错 / 输入文件不存在 / CSV 缺列 / amount 不是数字 |

调度器靠退出码判断成败，错误原因写在 stderr 的日志里。

## 测试

```
python -m unittest discover -s . -p "test_*.py" -v
```

或 `make test`。上层目录的 `python ../check.py` 会做完整四关验收（含变异测试与幂等检查）。

## 重跑

同参数重复跑，输出字节一致（覆盖写、无时间戳、键有序）。补跑历史数据不会产生重复金额。

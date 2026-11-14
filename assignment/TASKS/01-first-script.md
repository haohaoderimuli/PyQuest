# TASK 01 · 让脚本跑起来（周一上午）

## 工单原文

> 下游看板每天早上读 `report.json`。你写个脚本，从订单 CSV 直接出。

组长没说口径。你去问了一句，得到回复：**只算已支付的订单，按渠道拆金额**。这句话就是你的全部需求，把它写进 README（TASK 04 会查）。

## 输入：`data/orders.csv`

| 列 | 说明 |
| --- | --- |
| `order_no` | 订单号，字符串 |
| `channel` | 渠道，如 `App` / `Web` |
| `amount` | 金额，字符串形式的数字，两位小数 |
| `status` | `paid` / `refunded` / `pending` |
| `order_date` | 下单日期，本关用不到 |

`data/orders_alt.csv` 是同格式的另一份数据。验收会用它再跑一次 —— **写死答案一定挂**。

## 要交什么

`workspace/daily_report.py`，一个命令行脚本，至少支持：

```
python daily_report.py --input data/orders.csv --output out/report.json
```

- `--input`、`--output` 必填；要有 `--help`（argparse 自带，别手写 sys.argv）。
- 输出目录不存在时自己创建。
- 用 `csv.DictReader` 读，明确指定 `encoding`。
- 输出 JSON 用 UTF-8，`ensure_ascii=False`（虽然本例全是 ASCII，但这是团队约定）。

## 输出契约（钉死，下游按这个解析）

```json
{
  "orders": 5,
  "revenue": 600.5,
  "channels": {"App": 300.0, "Web": 300.5}
}
```

- `orders`：**只数 `status == "paid"` 的行**
- `revenue`：这些行的 `amount` 求和，四舍五入到 2 位小数
- `channels`：按 `channel` 分组求和，同样只算 paid；键按字母序排
- `data/orders_alt.csv` 的期望结果是 `orders=2, revenue=30.0, channels={"App": 10.0, "Web": 20.0}`

自己先手算一遍上面两组数，再写代码。对不上说明口径理解错了，别急着调代码。

## 验收会怎么判（`python check.py --task 1`）

1. `--help` 能跑，且列出 `--input` / `--output`
2. 主数据跑出退出码 0、JSON 文件真的生成
3. 三个字段逐个比对，金额容差 0.005
4. 换成 `orders_alt.csv` 再跑一次，值仍然对

## 提示（不是答案）

- 「只算已支付」这个条件漏掉，主数据会算成 8 单 / 800.50 —— 验收第二组数据也会跟着错。
- 金额用 `float` 还是 `Decimal` 都行，但求和后要 `round(..., 2)`，否则 `50.5 + 75 + 175` 可能给你一长串浮点尾数。
- `json.dumps(..., sort_keys=True)` 能让输出稳定，后面 TASK 03 的幂等检查会谢你。

## 做完之前别做

别急着写测试、别建 Git 仓库。这一关只有一个文件，跑通了就停，去接 TASK 02。

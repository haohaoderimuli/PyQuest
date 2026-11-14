# TASK 03 · 让调度器敢调（周二）

## 工单原文

> 昨晚调度器第一次跑就挂了，还是静默失败，看板拿到的是前天的旧文件。你补一下：出错要让调度器知道、要能从日志看出为什么、重跑别把数据翻倍。

这一关不新增业务功能，**只把 TASK 01 的脚本改成无人值守能跑的样子**。

## 要补的四件事

### 1. 明确的退出码

| 情况 | 退出码 |
| --- | --- |
| 成功生成报告 | `0` |
| 参数用法错 / 输入文件不存在 / CSV 缺列 / 金额不是数字 / limit 非法 | `2` |

`main()` 返回整数，文件末尾 `sys.exit(main())`。别在库函数里散落 `sys.exit()`，否则 TASK 02 的测试没法调用。

验收会造三种故障：`data/nope.csv`（不存在）、`data/orders_bad.csv`（amount 非数字）、`data/orders_nocol.csv`（缺 `amount` 列），要求都是退出码 2。

### 2. 人能看懂的错误信息

用 `logging`（不是 `print`）：

```python
logger = logging.getLogger(__name__)
logger.error("生成失败：%s。用法见 --help", exc)
```

错误信息里要有**原因**，不能只有一个 `Error`。`logging.basicConfig` 默认输出到 stderr，调度器会收走。别在日志里打印订单明细或任何客户信息。

### 3. 幂等

同一组参数连续跑两次，输出文件**字节完全一致**。要点：

- 覆盖写（`Path.write_text`），不是 `open(..., "a")` 追加
- 输出里不要塞时间戳、随机数、`datetime.now()`
- JSON 的键顺序稳定（`sort_keys=True`）

企业里补跑昨天的数据是日常操作，不幂等就会把金额翻倍。

### 4. main 守卫

```python
if __name__ == "__main__":
    sys.exit(main())
```

被别的模块 `import daily_report` 时**不许产生任何文件、不许执行业务逻辑**。验收会真的 `import` 一次，然后检查临时输出目录是不是仍然空的。

## 可选（不验，但值得做）

- `--limit N`：只处理前 N 行，方便排查。加了就要处理 `N < 0`。
- `--verbose`：多打一行调试日志。
- 自定义异常类 `ReportError`，把「可预期的业务错误」和真 bug 分开。

## 验收会怎么判（`python check.py --task 3`）

1. 三种故障输入，退出码都是 2，且 stderr 有非空错误信息
2. 同参数跑两次，输出文件字节一致
3. `python -c "import daily_report"` 后不产生输出文件
4. `--help` 仍可用

## 常见坑

- `except Exception: pass` —— 错误被吞掉，调度器以为成功，看板静默用旧数据。这是最危险的一种写法。
- 用 `sys.exit(2)` 直接写在 `read_rows()` 里 → 单元测试一调用就退出整个进程。
- 输出里加 `"generated_at": "2026-..."` 觉得挺贴心 → 幂等检查立刻挂。
- 只 `print` 不 `logging`，后面想按级别收日志、轮转文件都没法做。

跑通后执行 `python check.py --task 1,2,3`，确认前两关没被这轮重构改坏。

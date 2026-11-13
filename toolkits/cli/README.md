# CLI 脚本 / logging · 逐步操作手册

> 目标：把一段 notebook 代码，变成同事和调度器都能直接跑的命令行脚本。

## 1. 逐步操作

```bash
cd toolkits/cli
python daily_report.py --help
python daily_report.py --input ../../data/orders.csv --output out/report.json --limit 100
echo $?        # Windows: echo %errorlevel%
```

注意 `daily_report.py` 只用标准库（csv / json / argparse / logging / pathlib），**不需要装 pandas**，拿过去就能跑。

## 2. 一个能交付的脚本要有六样东西

| 件 | 在文件里 | 没有会怎样 |
|---|---|---|
| 参数入口 | `build_parser()` + `--help` | 换数据要改代码 |
| main 守卫 | `if __name__ == "__main__":` | 被 import 时顺手执行业务 |
| 业务与流程分离 | `process()` 只算、`main()` 只调度 | 没法单独测逻辑 |
| 日志 | `setup_logging()` + `logger.info/error` | 半夜挂了没线索 |
| 异常处理 | `except (OSError, ValueError)` → 返回 2 | 抛 traceback 给调度器 |
| 幂等落盘 | `Path.write_text` 覆盖写 | 重跑两次数据翻倍 |

## 3. 退出码约定

- `0`：成功，报告已写出。
- `2`：用法/输入错误（文件不存在、CSV 缺列、limit 非法）。日志里写明原因和正确用法。
- 其他非 0：未预期的异常（保留 traceback 便于排查）。

CI / crontab / Airflow 只认退出码，不读你打印的中文。

## 4. 跑通判据

- [ ] `--help` 列出所有参数且说明清楚。
- [ ] 正常参数退出码 0，`out/report.json` 存在且能被 `json.loads` 读回。
- [ ] 文件不存在时退出码 2，日志有一条可读的 ERROR，不抛 traceback。
- [ ] 同样参数跑两次，输出文件内容完全一致。
- [ ] `python -c "import daily_report"` 不会写出任何文件（main 守卫生效）。

## 5. 常见坑

- 用 `open(path, "a")` 追加写 → 破坏幂等。
- 在库函数里 `sys.exit()` → 测试没法直接调用。
- 路径用字符串拼 → Windows 分隔符出错；用 `pathlib`。
- 日志里打印 token / 手机号 → 合规事故，先脱敏。

## 6. 校验说明

`daily_report.py` 与 `logging_config.py` 已通过 Python 语法编译，并可用上面命令在**本机真跑**（只用标准库）。平台里的 Pyodide 关卡是同一套思路的教学版。

对应站内：PRACTICE 10-1 / 10-2 / 10-3 / 11-2 / 11-3。

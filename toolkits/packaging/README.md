# 打包与交付 · 逐步操作手册

> 目标：换一台干净机器，照 README 三条命令就能跑通并拿到报告。

## 1. 逐步操作

```bash
python -m venv .venv && .venv\Scripts\activate     # macOS/Linux: source .venv/bin/activate
python -m pip install -e .
python -m daily_report --input data/orders.csv --output out/report.json --limit 100
```

目录建议：

```text
project/
├─ daily_report.py          # 业务逻辑 + main()
├─ logging_config.py        # 日志配置
├─ __main__.py              # from daily_report import main; sys.exit(main())
├─ pyproject.toml           # 元数据 / 依赖 / [project.scripts]
├─ requirements.txt         # 锁版本
├─ tests/                   # pytest / unittest
├─ Makefile                 # 常用命令收口
└─ README.md                # 安装 + 最小运行 + 参数 + 出错怎么办
```

`__main__.py` 让 `python -m daily_report` 能跑；`[project.scripts]` 再生成一个 `daily-report` 命令，两种入口任选。

## 2. README 里必须有的四段

1. **安装**：Python 版本、venv、一条 pip 命令。
2. **最小运行**：复制粘贴就能成功的那条命令，带上示例数据。
3. **参数说明**：每个参数的默认值、含义、非法值会怎样。
4. **出错怎么办**：常见退出码、日志在哪、找谁。

少一段，别人就得来问你，脚本就还不算交付。

## 3. 跑通判据

- [ ] 干净 venv 里 `pip install -e .` 成功，`daily-report --help` 能出帮助。
- [ ] 最小运行命令拿到报告文件，退出码 0。
- [ ] 同参数重跑结果一致；文件不存在时退出码 2 且日志有说明。
- [ ] CI 跑通，测试与覆盖率门禁生效。
- [ ] 换一台机器照 README 走一遍，不用来问人。

## 4. 常见坑

- **依赖写在 README 里而不是文件里**：别人装不全。
- **路径依赖当前工作目录**：换个目录就找不到输入；用参数传绝对路径或 `Path(__file__)` 定位。
- **没有 `--help`**：调度器同事只能翻源码。
- **把示例数据当真实数据发布**：先脱敏。

## 5. 校验说明

`Makefile` 与 `DELIVERY_CHECKLIST.md` 是文本模板；**本机没为实操包单独建可发布包**，按上面目录在你自己项目里落地。

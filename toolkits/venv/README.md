# venv / pip / 依赖 · 逐步操作手册

> 目标：在一台干净机器上，一条命令装好依赖并 import 自己的包，不污染全局 Python。

## 1. 逐步操作（Windows / macOS / Linux）

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate     macOS/Linux: source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m pip install -e .          # 可编辑安装自己的包，改代码不用重装
python -c "import daily_report; print(daily_report.__file__)"
```

`.gitignore` 里必须有 `.venv/`、`__pycache__/`、`*.pyc`。把虚拟环境提交进仓库是最常见的新手事故。

## 2. 三个文件各管什么

| 文件 | 作用 | 什么时候改 |
|---|---|---|
| `requirements.txt` | 锁死运行依赖及版本 | 加/升级一个库就改一次，单独提交 |
| `pyproject.toml` | 项目元数据、顶层依赖、工具配置（pytest/ruff/black） | 建项目时写，之后按工具调整 |
| `.python-version`（可选） | 声明 Python 版本 | 换解释器时 |

`pip freeze > requirements.txt` 会把间接依赖也全写进去，适合「完全复现」；手写顶层依赖更可读，但要记得锁版本。两者选一种，别混着维护。

## 3. 跑通判据

- [ ] 激活后 `which python` / `where python` 指向 `.venv` 里的解释器。
- [ ] `pip list` 里的版本和 `requirements.txt` 一致。
- [ ] `pip install -e .` 后能在任意目录 `import` 自己的包。
- [ ] 删掉 `.venv` 重建，跑同一条命令结果一致（可复现）。
- [ ] `git status` 里看不到 `.venv/`。

## 4. 常见坑

- **装到全局**：忘了激活 venv，包装到系统 Python，换台机器就缺。
- **不锁版本**：`pandas` 升大版本，脚本里的 API 全变。
- **把密钥写进 requirements / 代码**：用环境变量，见知识库《配置与密钥》。
- **CI 里不用同一份依赖**：本地绿、CI 红，查半天是版本差。

## 5. 校验说明

`requirements.txt` 与 `pyproject.toml` 已按文本校验；**本机没有为这个实操包单独建 venv**（PyQuest 本身零依赖），真跑按上面四条命令在你自己机器上做。

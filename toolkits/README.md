# PyQuest · 真工具实操包

PyQuest 在浏览器里用 Pyodide 真跑 Python，但**装不了 venv、pytest、ruff、pre-commit、CI**。平台能教的是「写出能被这些工具接住的代码」；这个目录补的是「怎么在自己机器上把工具真的装起来、跑通、留下证据」。

## 六组工具

| 组 | 形态 | 这里给什么 | 谁验证跑通 |
|---|---|---|---|
| venv / pip / 依赖 | 命令行 | 逐步手册 + `requirements.txt` + `pyproject.toml` | 本机可真跑 |
| unittest / pytest / coverage | 命令行 | 手册 + 真实测试文件 + `pytest.ini` | 本机可真跑 |
| ruff / black / pre-commit | 静态检查 | 手册 + `.ruff.toml` + 钩子配置 | 装工具后真跑 |
| CLI 脚本 / logging | Python 脚本 | 手册 + 完整 `daily_report.py` + 日志配置 | 脚本已过语法校验；真跑要本机 |
| Git / GitHub Actions | 协作流水线 | 手册 + `python-ci.yml` + Git 工作流 | 要仓库与账号 |
| 打包与交付清单 | 可交给别人 | 手册 + `Makefile` + `DELIVERY_CHECKLIST.md` | 照 README 换台机器跑 |

## 怎么用

1. 先做站内第 10–11 章（7 关工程化实操），它们会在 Pyodide 里真跑你写的 Python。
2. 打开「知识库」看对应那篇，再进「真工具实操」下载文件。
3. 按每组手册的「逐步操作」在本机做一遍，用末尾的**跑通判据**自查。
4. 站内「交付链」把七关串成一条链，状态直接读通关记录，可导出 HTML 清单当作品附件。

## 边界，说清楚

- 平台**不会安装或打开**这些工具，也不自动判定你在本机跑通了。「真工具实操」页里的勾选是**自评**，只存 localStorage，不写通关记录、不加 XP。
- 文件只做了静态校验（YAML/TOML/INI 文本、Python 语法）；**没真跑 pytest / ruff / CI**。
- 静态服务只为 `toolkits/` 放行 `.md/.py/.toml/.ini/.yaml/.yml/.txt` 等后缀；根目录 `serve.py`、`README.md`、`tests/`、`.git` 仍返回 404。
- 别把 token、生产库密码、含用户信息的明细提交进仓库；日志与报告先脱敏再外发。

## 和关卡怎么接

| 关卡 | 对应工具 |
|---|---|
| 10-1 argparse | `cli/daily_report.py`、`venv/requirements.txt` |
| 10-2 pathlib / 编码 | `cli/daily_report.py` 的读写段 |
| 10-3 异常与 logging | `cli/logging_config.py` |
| 10-4 类型与 dataclass | `linting/.ruff.toml`、mypy 说明 |
| 11-1 unittest | `testing/test_channel_report.py` |
| 11-2 退出码与幂等 | `cli/daily_report.py` 的 main() |
| 11-3 BOSS | `packaging/DELIVERY_CHECKLIST.md`、`ci/python-ci.yml` |

# Git / GitHub Actions · 逐步操作手册

> 目标：push 之后自动跑 lint + 测试 + 覆盖率门禁，失败就阻断合并。

## 1. 逐步操作

1. 把 `python-ci.yml` 放到仓库的 `.github/workflows/` 目录（文件名保持一致）。
2. 把 `requirements.txt` / `pyproject.toml` 放根目录，保证 CI 和本地装同一份依赖。
3. 提交并 push，到仓库的 Actions 页看这次 run：
   ```bash
   git add . && git commit -m "ci: 加 lint / pytest / coverage 门禁" && git push
   ```
4. 故意把某个测试改红再 push，确认 workflow 变红；在分支保护里勾上「Require status checks to pass」，红的时候 PR 就合不了。
5. 在 workflow 里 `actions/upload-artifact` 把 `test-results/`、`coverage.xml` 存档，失败时也能下载排查。

## 2. 流水线该有的四段

| 阶段 | 命令 | 失败意味着 |
|---|---|---|
| 装依赖 | `pip install -r requirements.txt` | 环境没锁好 |
| 静态检查 | `ruff check .` / `black --check .` | 明显错误或格式不一致 |
| 测试 | `pytest --junitxml=...` | 行为被改坏了 |
| 覆盖率门禁 | `pytest --cov --cov-fail-under=80` | 新代码没被测到 |

四段都要跑，只跑格式化等于没验过。

## 3. 跑通判据

- [ ] push 后 Actions 里出现一次绿色 run，四个阶段都在。
- [ ] 故意改错函数 / 删掉一个断言，run 变红且日志指出具体用例。
- [ ] 覆盖率低于阈值时 run 失败。
- [ ] 红的时候 PR 被分支保护拦下。
- [ ] 产物（junit.xml / coverage.xml）能下载。

## 4. 常见坑

- **只在主分支跑**：PR 阶段才发现，太晚；要配 `pull_request`。
- **CI 用最新版 Python、本地用旧的**：矩阵里写死版本，和 `requires-python` 一致。
- **把密钥写进 workflow**：用 repository secrets，别提交 `.env`。
- **workflow 里不 pin action 版本**：上游一改，流水线突然全红。

## 5. 校验说明

`python-ci.yml` 已按 YAML 文本校验；**本机没有 GitHub 仓库，未真跑 workflow**。放到你自己的仓库里按上面步骤验。

对应站内：知识库《Git、CI 与打包》、PRACTICE 11-1 / 11-3。

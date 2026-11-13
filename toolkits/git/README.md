# Git · 脚本项目的版本管理

> 目标：能回答「这一版结论是哪次改动算出来的」，并能定位哪次改坏了。

## 1. 最小命令集

```bash
git init
git add . && git commit -m "chore: 建立每日报表脚本基线"
git commit -am "fix: 收入口径改为只算已支付"      # 一次口径变更一次提交
git log --oneline
git diff HEAD~1 -- daily_report.py                 # 看这次改了哪几行
git bisect start && git bisect bad && git bisect good <commit>   # 定位哪次算错
git checkout -b fix/encoding && git merge --no-ff fix/encoding
```

## 2. 提交粒度比命令更重要

- **一次提交只做一件事**：改口径、加测试、修日志分开提交。
- **信息写业务原因**：`fix: 写入显式 utf-8，修 Windows 中文乱码`，而不是 `update`。
- **要提交**：源码、测试、配置、README、依赖声明、CI workflow。
- **别提交**：`.venv/`、含用户信息的明细 CSV、`__pycache__/`、`.env`、token、notebook 的大输出。

`.gitignore` 示例：

```text
.venv/
__pycache__/
*.py[cod]
.pytest_cache/
.coverage
.env
out/
logs/
```

## 3. 跑通判据

- [ ] `git log --oneline` 能看出按主题分阶段的提交，不是一个 `init` 包打天下。
- [ ] 能 `git diff` 看出某次口径变更改了哪几行，并说清为什么改。
- [ ] 故意把报表逻辑改错并提交，用 `git bisect` 定位到那次提交。
- [ ] 开过分支、合并过一次，能解释 `--no-ff` 为什么保留合并记录。
- [ ] `git status` 干净，`.env` 与数据文件没被跟踪。

## 4. 常见坑

- **提交含手机号 / 身份证的明细**：合规事故，脱敏或只提交聚合层。
- **一个提交塞几百行**：出问题无法定位，Review 也没人看得下去。
- **notebook 直接进版本库**：JSON diff 没法读；把逻辑抽成 `.py` 再提交。
- **只在本机不推远端**：硬盘一坏，历史全没了。

# ruff / black / pre-commit · 逐步操作手册

> 目标：把「格式争论」交给工具，把明显错误拦在提交之前。

## 1. 逐步操作

```bash
python -m pip install ruff black pre-commit

ruff check .                 # 查未用 import、未定义名、危险写法
ruff check . --fix           # 能自动修的让它修
black --check .              # 只看不改；black . 才真正格式化
pre-commit install           # 装 Git 钩子
pre-commit run --all-files   # 手动跑一遍全部文件
```

把 `.ruff.toml` 和 `.pre-commit-config.yaml` 放到项目根目录，提交进仓库，团队里每个人跑的是同一套规则。

## 2. 三层检查各管什么

| 工具 | 管什么 | 不该指望它做什么 |
|---|---|---|
| ruff | 未用变量、未定义名、裸 except、import 顺序等静态问题 | 判断业务逻辑对不对 |
| black | 统一格式（行宽、引号、换行） | 改代码结构 |
| mypy / type hints | 类型是否一致、签名是否自解释 | 运行时校验（注解不会阻止你传错类型） |

站内 PRACTICE 10-4 写的 `def format_order(o: Order) -> str` 就是第三层的起点。

## 3. 跑通判据

- [ ] `ruff check .` 对干净代码零报错；故意加一个未用 import 会立刻报出来。
- [ ] `black --check .` 通过；改乱缩进后 `black .` 能修回。
- [ ] `pre-commit install` 后，提交含未用 import 的文件会被钩子拦下。
- [ ] CI 里跑的是同一份配置，本地绿 = CI 绿。

## 4. 常见坑

- **只在本地跑不进 CI**：别人提交时不检查，规则形同虚设。
- **把 lint 当测试**：格式全对但逻辑错了照样上线，CI 必须同时跑 pytest。
- **一次性 --fix 全仓库**：diff 里混进几百行格式改动，Review 没法看；单独一次提交。
- **规则不锁版本**：工具升级后规则变了，全仓库突然飘红。

## 5. 校验说明

`.ruff.toml` / `.pre-commit-config.yaml` 已按 TOML / YAML 文本校验；**本机没装 ruff / black / pre-commit，未真跑**。命令与配置按常见版本写，以你装的版本为准。

对应站内：知识库《类型、风格与静态检查》、PRACTICE 10-4 / 11-1。

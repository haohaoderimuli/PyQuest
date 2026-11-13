# unittest / pytest / coverage · 逐步操作手册

> 目标：改一行代码，用一条命令证明没把别处改坏；覆盖率不够时让 CI 变红。

## 1. 逐步操作

```bash
# 标准库路线：零依赖
python -m unittest discover -s tests -v

# pytest 路线（推荐）
python -m pip install pytest pytest-cov
python -m pytest -q
python -m pytest --cov=daily_report --cov-report=term-missing --cov-fail-under=80

# 生成机器可读报告给 CI 消费
python -m pytest --junitxml=test-results/junit.xml --cov-report=xml:coverage.xml
```

`pytest.ini` 里固定了测试目录与常用参数；CI 里只要 `pytest` 一条命令，不用记一长串 flag。

## 2. 一份好测试长什么样

- **命名**：`test_<行为>_<条件>`，一眼看出在验什么。
- **三段的顺序**：准备数据 → 调用 → 断言，别把断言塞进循环里。
- **边界优先**：空列表、0、None、坏数据、文件不存在，比正常路径更容易出事。
- **不碰外部**：用 `tmp_path` / `unittest.mock`，测试不能连真实数据库或生产接口。
- **一个用例一个理由**：失败信息要能直接指出哪条规则破了。

## 3. 覆盖率不是质量总分

`coverage` 只告诉你**哪一行没被执行**，不告诉你断言写得对不对。100% 覆盖但断言全是 `assert True` 毫无意义。把它当「找没测到的分支」的工具，配一条下限门禁（示例里 80%）即可。

## 4. 跑通判据

- [ ] `python -m unittest discover -s tests -v` 全部通过（标准库零依赖）。
- [ ] `pytest --cov --cov-fail-under=80` 通过；故意删掉一个分支，覆盖率下降能被看见。
- [ ] 故意把被测函数改错，测试立刻变红且失败信息指出具体断言。
- [ ] 生成了 `junit.xml` / `coverage.xml`，能交给 CI 解析。
- [ ] 测试跑完不留下脏文件（用 `tmp_path` 而不是写项目根目录）。

## 5. 常见坑

- **只测正常输入**：边界与异常全漏，上线才炸。
- **测试之间共享状态**：A 用例写了文件，B 用例读到脏数据，单跑能过、全跑就红。
- **靠 sleep 等异步**：改成显式等待或 mock。
- **覆盖率当 KPI**：为了凑数字写无意义断言。

## 6. 校验说明

`test_channel_report.py` 已通过 Python 语法编译；**本机没为这个实操包单独装 pytest**（PyQuest 自带的是浏览器内 Pyodide），真跑按上面命令在你自己的 venv 里做。

对应站内：知识库《测试与覆盖率门禁》、PRACTICE 11-1。

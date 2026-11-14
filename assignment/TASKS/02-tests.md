# TASK 02 · 给脚本上测试（周一下午）

## 工单原文

> 昨天那个脚本我准备挂到调度器上。你怎么证明「只算已支付」这个口径没写错？以后有人改代码，怎么立刻知道改坏了？

## 要交什么

`workspace/test_daily_report.py`（或任意 `test_*.py`），用标准库 `unittest`，**至少 4 个测试方法**，覆盖：

1. **只算 paid**：混进 `refunded` / `pending` 的行，结果里不能出现它们的金额
2. **按渠道拆**：两个渠道各一笔，分组金额正确
3. **空输入**：一行数据都没有时，返回 `orders=0, revenue=0, channels={}`，不能抛异常
4. **坏数据**：`amount` 不是数字时，要么抛明确异常要么跳过，行为要和测试断言一致（自己定，写进注释）
5. 建议再加一个：**金额精度**（`0.1 + 0.2` 这类，验证 `round`）

测试要 `import daily_report` 直接调你写的函数，不是 `subprocess` 跑一遍 CLI 然后 `print` —— 后者不算单元测试。这意味着你在 TASK 01 里最好把「读 CSV」和「算指标」拆成两个函数（比如 `read_rows(path)` / `process(rows)`），否则这一关很难写。

允许回头重构 TASK 01 的代码。**改完再跑一次 `--task 1`，确认没把功能改坏** —— 这就是测试存在的理由。

## 验收会怎么判（`python check.py --task 2`）

1. 找到至少一个 `test_*.py`
2. 真跑 `python -m unittest discover -s . -p "test_*.py" -v`，要求全绿
3. 测试数量 ≥ 4（从 `Ran N tests` 读，不是数你写了几个 `def`）
4. 测试源码里真的 `import daily_report` 且含 `assert`
5. **变异测试**：把你的 `daily_report.py` 复制到临时目录，把里面所有 `"paid"` 改成一个绝不存在的状态，再跑一遍你的测试。**必须至少有一条测试变红。**

第 5 条是重点：它证明你的测试真的在测口径，而不是写了四个 `self.assertTrue(True)`。如果改坏口径后测试还全绿，说明「只算已支付」这条需求根本没被测到，这一关不通过。

变异测试在 `workspace/.mutant/` 临时目录里做，跑完立刻删掉，**不会改你的源文件**。

## 常见坑

- 只测正常输入，不测空值和脏数据 —— 调度器凌晨跑到的恰恰是这些。
- 测试之间共享文件：A 用例写了 `out/report.json`，B 用例读到脏数据，单跑能过、全跑就红。用 `tempfile.TemporaryDirectory()`。
- 测试里连真实 `data/orders.csv` 是可以的，但别依赖它的绝对路径；换台机器就跑不了。
- 断言写成 `assert result is not None` 没意义。要断言**具体数值**。

## 这一关不给参考答案结构

怎么组织测试、要不要抽 fixture，你自己定。`solution/` 里的版本只是其中一种写法。

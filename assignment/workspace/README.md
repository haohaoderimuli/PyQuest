# 你的工作区（从空目录开始）

这里是你自己的项目目录。除了这份说明和 `data/` 下的样例数据，**什么都没有** —— 代码、测试、README、Git 仓库都要你自己建。

```
assignment/
├── check.py              验收脚本（别改，改了就不算自己过了）
├── TASKS/                四份任务书，按 01 → 04 顺序做
├── solution/             参考解。卡住 20 分钟以上再看，别一开始就翻
└── workspace/            ← 你在这里
    ├── data/             样例输入（只读，别改）
    └── README.md         本文件
```

## 开始之前

1. 用 VS Code 打开**这个目录**：`code .`（或在 VS Code 里「文件 → 打开文件夹」选 `workspace`）。
2. 建一个虚拟环境（本次作业只用标准库，但这是入职第一周该养成的习惯）：
   ```
   python -m venv .venv
   .venv\Scripts\activate        # Windows；macOS/Linux 用 source .venv/bin/activate
   ```
3. 先读 `TASKS/01-first-script.md`，再动手写第一个文件。

## 怎么验收

在 `assignment/` 目录下跑（注意不是 workspace 目录）：

```
python check.py              # 跑全部四关
python check.py --task 1     # 只跑第一关
python check.py --task 1,2   # 跑前两关
```

`check.py` 会**真的执行你写的脚本和测试**：换两份数据跑、故意改坏你的代码做变异测试、检查错误退出码与幂等、查 Git 提交历史。它不看你写了多少注释，也不看文件存不存在就给过。

输出是一张逐条 PASS / FAIL 的表，最后给退出码（0 全过、1 有挂）。做完后把全绿的输出贴进 `workspace/DELIVERY.md`，那是你交给组长的东西。

## 边界

- `data/` 里的样例数据是只读的。验收会用同样格式但不同内容的数据跑，写死答案过不了。
- 别改 `check.py`。想确认它是不是真的在验，可以看 `tests/check_assignment.py` —— 那是它的自检。
- 这是一个人一周的活，分四次提交。别一次写完所有文件再补提交记录。

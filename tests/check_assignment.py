# -*- coding: utf-8 -*-
"""验收脚本的自检：证明 check.py 真的在验，不是数文件。

跑法：python -m unittest discover -s tests -p "check_assignment.py" -v
或：  python tests/check_assignment.py

六组用例：
  1. 完整参考解 → 全部 PASS
  2. 写死答案  → 换数据那一条必须 FAIL
  3. 假测试    → 变异测试必须 FAIL
  4. 追加写    → 幂等必须 FAIL
  5. --help 当错误 → help 检查必须 FAIL
  6. 删掉 .git → 交付关必须 FAIL

每组都在独立的临时副本里做，不碰真实 workspace。
"""
from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSIGNMENT = ROOT / "assignment"
SOLUTION = ASSIGNMENT / "solution"


def git(cwd, *args):
    return subprocess.run(
        ["git", "-C", str(cwd), *args], capture_output=True,
        text=True, encoding="utf-8", errors="replace", timeout=20,
    )


class CheckAssignmentSelfTest(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.sandbox = Path(tempfile.mkdtemp(prefix="pq-asg-base-"))
        cls.base = cls.sandbox / "assignment"
        shutil.copytree(ASSIGNMENT, cls.base,
                        ignore=shutil.ignore_patterns("__pycache__", ".mutant"))
        ws = cls.base / "workspace"
        for f in SOLUTION.iterdir():
            if f.is_file():
                shutil.copy2(f, ws / f.name)
        git(ws, "init", "-q")
        git(ws, "add", "-A")
        for msg in ("feat: 渠道日报脚本", "test: 补口径测试",
                    "fix: 故障退出码", "docs: 交付说明"):
            git(ws, "-c", "user.name=Learner", "-c", "user.email=learner@local",
                "commit", "-q", "--allow-empty", "-m", msg)

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.sandbox, ignore_errors=True)

    def setUp(self):
        self.case = Path(tempfile.mkdtemp(prefix="pq-asg-case-"))
        self.root = self.case / "assignment"
        shutil.copytree(self.base, self.root)
        self.ws = self.root / "workspace"

    def tearDown(self):
        shutil.rmtree(self.case, ignore_errors=True)

    def run_check(self, *args):
        return subprocess.run(
            [sys.executable, "check.py", *args], cwd=str(self.root),
            capture_output=True, text=True, encoding="utf-8",
            errors="replace", timeout=180,
        )

    def patch(self, rel, old, new):
        p = self.ws / rel
        src = p.read_text(encoding="utf-8")
        self.assertIn(old, src, "找不到待替换片段：%s" % old[:40])
        p.write_text(src.replace(old, new, 1), encoding="utf-8")

    @staticmethod
    def failed(out, keyword):
        return any(("FAIL" in line and keyword in line) for line in out.splitlines())

    # ---------------------------------------------------------------- 用例
    def test_01_reference_solution_is_all_green(self):
        r = self.run_check()
        self.assertEqual(r.returncode, 0, r.stdout[-1200:])
        self.assertIn("0 失败", r.stdout)
        self.assertNotIn("FAIL", r.stdout)

    def test_02_hardcoded_answer_fails_on_alt_data(self):
        marker = '    """只算已支付，按渠道拆金额。rows 是 dict 列表。"""'
        self.patch("daily_report.py", marker, marker +
                   '\n    return {"orders": 5, "revenue": 600.5, "channels": {"App": 300.0, "Web": 300.5}}')
        r = self.run_check("--task", "1")
        self.assertEqual(r.returncode, 1, r.stdout[-1200:])
        self.assertTrue(self.failed(r.stdout, "换一份数据"), r.stdout[-1200:])

    def test_03_fake_tests_fail_mutation(self):
        (self.ws / "test_daily_report.py").write_text(
            "import unittest\nimport daily_report\n\n"
            "class T(unittest.TestCase):\n"
            + "".join("    def test_%d(self):\n        self.assertTrue(True)\n" % i
                      for i in range(4)),
            encoding="utf-8",
        )
        r = self.run_check("--task", "2")
        self.assertEqual(r.returncode, 1, r.stdout[-1200:])
        self.assertTrue(self.failed(r.stdout, "变异测试"), r.stdout[-1200:])

    def test_04_append_write_fails_idempotency(self):
        old = ('        out.write_text(\n'
               '            json.dumps(report, ensure_ascii=False, sort_keys=True),\n'
               '            encoding="utf-8",\n'
               '        )')
        new = ('        with out.open("a", encoding="utf-8") as _f:\n'
               '            _f.write(json.dumps(report, ensure_ascii=False, sort_keys=True))')
        self.patch("daily_report.py", old, new)
        r = self.run_check("--task", "3")
        self.assertEqual(r.returncode, 1, r.stdout[-1200:])
        self.assertTrue(self.failed(r.stdout, "幂等"), r.stdout[-1200:])

    def test_05_help_must_exit_zero(self):
        self.patch("daily_report.py", "return 0 if exc.code == 0 else 2", "return 2")
        r = self.run_check("--task", "1")
        self.assertEqual(r.returncode, 1, r.stdout[-1200:])
        self.assertTrue(self.failed(r.stdout, "--help"), r.stdout[-1200:])

    def test_06_missing_git_history_fails_delivery(self):
        # Windows 上 .git/objects 里有只读文件，别硬删；改名即可让 check 找不到仓库
        (self.ws / ".git").rename(self.ws / ".git_disabled")
        r = self.run_check("--task", "4")
        self.assertEqual(r.returncode, 1, r.stdout[-1200:])
        self.assertTrue(self.failed(r.stdout, "Git 仓库"), r.stdout[-1200:])


if __name__ == "__main__":
    unittest.main(verbosity=2)

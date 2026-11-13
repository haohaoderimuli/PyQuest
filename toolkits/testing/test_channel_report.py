"""PyQuest 工程化示例 · 可真跑的测试文件。

跑法：
    python -m unittest discover -s tests -v      # 标准库，零依赖
    python -m pytest -q                          # 或 pytest

被测函数写在同一个文件里，方便直接照着改；真实项目里应拆成
daily_report.py + tests/test_daily_report.py 两处。
"""
from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path


def summarize(rows, limit=10):
    """按 limit 取前 N 条，返回订单数、收入合计与渠道数。"""
    picked = list(rows)[:limit]
    return {
        "orders": len(picked),
        "revenue": round(sum(float(r["amount"]) for r in picked), 2),
        "channel_count": len({r["channel"] for r in picked}),
    }


def write_report(report, path):
    """覆盖写而不是追加：重跑结果一致（幂等）。"""
    Path(path).write_text(json.dumps(report, ensure_ascii=False), encoding="utf-8")
    return path


class TestSummarize(unittest.TestCase):
    def setUp(self):
        self.rows = [
            {"channel": "App", "amount": 100},
            {"channel": "Web", "amount": 50},
            {"channel": "App", "amount": 25},
        ]

    def test_limit(self):
        out = summarize(self.rows, limit=2)
        self.assertEqual(out["orders"], 2)
        self.assertEqual(out["revenue"], 150.0)
        self.assertEqual(out["channel_count"], 2)

    def test_empty(self):
        out = summarize([], limit=3)
        self.assertEqual(out, {"orders": 0, "revenue": 0, "channel_count": 0})

    def test_limit_larger_than_rows(self):
        self.assertEqual(summarize(self.rows, limit=99)["orders"], 3)

    def test_round_trip_is_idempotent(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "report.json"
            write_report(summarize(self.rows, 2), p)
            first = p.read_text(encoding="utf-8")
            write_report(summarize(self.rows, 2), p)
            self.assertEqual(p.read_text(encoding="utf-8"), first)
            self.assertEqual(json.loads(first)["orders"], 2)

    def test_chinese_not_escaped(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "report.json"
            write_report({"channel": "自然搜索"}, p)
            self.assertIn("自然搜索", p.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main(verbosity=2)

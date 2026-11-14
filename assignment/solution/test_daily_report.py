"""渠道日报脚本 · 参考解测试（TASK 02）。

跑法：python -m unittest discover -s . -p "test_*.py" -v

重点看 test_only_paid：验收的变异测试会把 daily_report.py 里的 "paid"
改成一个不存在的状态，这一条必须变红，才说明测试真的守着口径。
"""
import tempfile
import unittest
from pathlib import Path

import daily_report


def row(channel, amount, status="paid"):
    return {"order_no": "X", "channel": channel, "amount": amount, "status": status}


class TestProcess(unittest.TestCase):

    def test_only_paid(self):
        rows = [
            row("App", 100.0, "paid"),
            row("Web", 50.5, "paid"),
            row("App", 25.0, "refunded"),
            row("Web", 10.0, "pending"),
        ]
        got = daily_report.process(rows)
        self.assertEqual(got["orders"], 2)
        self.assertEqual(got["revenue"], 150.5)
        self.assertEqual(got["channels"], {"App": 100.0, "Web": 50.5})

    def test_group_by_channel(self):
        rows = [row("App", 10.0), row("Web", 20.0), row("App", 5.0)]
        got = daily_report.process(rows)
        self.assertEqual(got["orders"], 3)
        self.assertEqual(got["channels"], {"App": 15.0, "Web": 20.0})

    def test_empty_input(self):
        got = daily_report.process([])
        self.assertEqual(got, {"orders": 0, "revenue": 0, "channels": {}})

    def test_rounding(self):
        got = daily_report.process([row("App", 0.1), row("App", 0.2)])
        self.assertEqual(got["revenue"], 0.3)

    def test_status_other_than_paid_is_ignored(self):
        rows = [row("App", 999.0, "refunded"), row("Web", 888.0, "pending")]
        got = daily_report.process(rows)
        self.assertEqual(got["orders"], 0)
        self.assertEqual(got["channels"], {})


class TestReadRows(unittest.TestCase):

    def _write(self, text):
        d = tempfile.TemporaryDirectory()
        p = Path(d.name) / "in.csv"
        p.write_text(text, encoding="utf-8")
        return d, p

    def test_bad_amount_raises(self):
        d, p = self._write("order_no,channel,amount,status\nX1,App,not_a_number,paid\n")
        try:
            with self.assertRaises(daily_report.ReportError):
                daily_report.read_rows(p)
        finally:
            d.cleanup()

    def test_missing_column_raises(self):
        d, p = self._write("order_no,channel,total,status\nX1,App,99.00,paid\n")
        try:
            with self.assertRaises(daily_report.ReportError):
                daily_report.read_rows(p)
        finally:
            d.cleanup()

    def test_missing_file_raises(self):
        d, p = self._write("order_no,channel,amount,status\n")
        try:
            with self.assertRaises(daily_report.ReportError):
                daily_report.read_rows(Path(d.name) / "nope.csv")
        finally:
            d.cleanup()


if __name__ == "__main__":
    unittest.main()

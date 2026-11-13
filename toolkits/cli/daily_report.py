"""PyQuest 工程化示例 · 可交付的 CLI 脚本（只用标准库）。

跑法：
    python daily_report.py --help
    python daily_report.py --input orders.csv --output out/report.json --limit 100

退出码：0 成功；2 参数/输入错误。重跑结果一致（覆盖写，不追加）。
"""
from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

from logging_config import setup_logging

logger = setup_logging("daily_report")


class ReportError(Exception):
    """可预期的业务错误：缺列、坏数据、limit 非法。"""


def build_parser():
    p = argparse.ArgumentParser(description="按渠道汇总订单，输出 JSON 报告")
    p.add_argument("--input", required=True, help="输入 CSV（需含 channel, amount 列）")
    p.add_argument("--output", required=True, help="输出 JSON 路径")
    p.add_argument("--limit", type=int, default=10, help="只处理前 N 行，默认 10")
    p.add_argument("--verbose", action="store_true", help="输出调试日志")
    return p


def read_rows(path):
    p = Path(path)
    if not p.is_file():
        raise ReportError("输入文件不存在：%s" % p)
    with p.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        cols = set(reader.fieldnames or [])
        if not {"channel", "amount"} <= cols:
            raise ReportError("CSV 缺列，需要 channel 和 amount，实际：%s" % sorted(cols))
        rows = []
        for line in reader:
            try:
                rows.append({"channel": line["channel"], "amount": float(line["amount"])})
            except (TypeError, ValueError):
                raise ReportError("amount 不是数字：%r" % line.get("amount"))
    return rows


def process(rows, limit=10):
    picked = rows[:limit]
    return {
        "orders": len(picked),
        "revenue": round(sum(r["amount"] for r in picked), 2),
        "channel_count": len({r["channel"] for r in picked}),
    }


def main(argv=None):
    try:
        args = build_parser().parse_args(argv)
        if args.limit < 0:
            raise ReportError("limit 不能为负")
        rows = read_rows(args.input)
        report = process(rows, args.limit)
        out = Path(args.output)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(report, ensure_ascii=False), encoding="utf-8")
        logger.info("报告已生成：%s（%d 行）", out, report["orders"])
        if args.verbose:
            logger.debug("明细：%s", report)
        return 0
    except SystemExit:
        return 2
    except (OSError, ValueError, ReportError) as exc:
        logger.error("生成失败：%s。用法见 --help", exc)
        return 2


if __name__ == "__main__":
    sys.exit(main())

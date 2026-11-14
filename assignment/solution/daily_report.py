"""渠道日报脚本 · 参考解（TASK 01 + TASK 03 的完整形态）。

跑法：
    python daily_report.py --help
    python daily_report.py --input data/orders.csv --output out/report.json

口径：只统计 status == "paid" 的订单；按 channel 分组求和。
退出码：0 成功；2 参数 / 输入 / 数据错误。重跑结果字节一致。

这是参考解，别直接复制进 workspace —— 卡住时对照思路，然后关掉自己写。
"""
from __future__ import annotations

import argparse
import csv
import json
import logging
import sys
from pathlib import Path


class ReportError(Exception):
    """可预期的业务错误：缺列、坏数据、文件不存在。"""


def build_parser():
    p = argparse.ArgumentParser(description="按渠道汇总已支付订单，输出 JSON 报告")
    p.add_argument("--input", required=True, help="输入 CSV（需含 channel, amount, status 列）")
    p.add_argument("--output", required=True, help="输出 JSON 路径")
    p.add_argument("--verbose", action="store_true", help="输出调试日志")
    return p


def read_rows(path):
    """读 CSV 并做基本校验；任何可预期的问题都转成 ReportError。"""
    p = Path(path)
    if not p.is_file():
        raise ReportError("输入文件不存在：%s" % p)
    with p.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        cols = set(reader.fieldnames or [])
        need = {"channel", "amount", "status"}
        if not need <= cols:
            raise ReportError("CSV 缺列，需要 %s，实际 %s" % (sorted(need), sorted(cols)))
        rows = []
        for line in reader:
            try:
                amount = float(line["amount"])
            except (TypeError, ValueError):
                raise ReportError("amount 不是数字：%r" % line.get("amount"))
            rows.append({
                "order_no": line.get("order_no", ""),
                "channel": line["channel"],
                "amount": amount,
                "status": line["status"],
            })
    return rows


def process(rows):
    """只算已支付，按渠道拆金额。rows 是 dict 列表。"""
    channels = {}
    orders = 0
    for r in rows:
        if r.get("status") != "paid":
            continue
        orders += 1
        key = r["channel"]
        channels[key] = channels.get(key, 0.0) + float(r["amount"])
    return {
        "orders": orders,
        "revenue": round(sum(channels.values()), 2),
        "channels": {k: round(v, 2) for k, v in sorted(channels.items())},
    }


def main(argv=None):
    parser = build_parser()
    try:
        args = parser.parse_args(argv)
    except SystemExit as exc:
        # --help 是 0；参数用法错是 2。别把它们混成一个码。
        return 0 if exc.code == 0 else 2

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    logger = logging.getLogger("daily_report")
    try:
        rows = read_rows(args.input)
        report = process(rows)
        out = Path(args.output)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(
            json.dumps(report, ensure_ascii=False, sort_keys=True),
            encoding="utf-8",
        )
        logger.info("报告已生成：%s（%d 单，%.2f 元）", out, report["orders"], report["revenue"])
        if args.verbose:
            logger.debug("明细：%s", report)
        return 0
    except (ReportError, OSError, ValueError) as exc:
        logger.error("生成失败：%s。用法见 --help", exc)
        return 2


if __name__ == "__main__":
    sys.exit(main())

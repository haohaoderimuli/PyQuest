#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""PyQuest · 企业第一周作业的本机验收脚本。

它真的执行你写的代码，不是检查文件存在就给过：

  - 用两份不同数据跑 CLI，逐个数字比对 JSON（防写死答案）
  - 真跑 unittest，并把你的模块改坏一次做变异测试（证明测试在测口径）
  - 造三种故障输入检查退出码与错误信息
  - 同参数跑两次比对输出字节（幂等）、检查 import 无副作用
  - 查真实 Git 提交历史与交付文件内容

用法（在 assignment/ 目录下）：
    python check.py                 全部四关
    python check.py --task 1        只跑第一关
    python check.py --task 1,2,3    跑前三关

退出码：0 全过；1 有 FAIL。SKIP 不算失败，但会在结果里提示。
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(errors="replace")
    except Exception:
        pass

ROOT = Path(__file__).resolve().parent
WS = ROOT / "workspace"
DATA = WS / "data"
MOD = WS / "daily_report.py"
MUT = WS / ".mutant"

EXPECT_MAIN = {"orders": 5, "revenue": 600.5, "channels": {"App": 300.0, "Web": 300.5}}
EXPECT_ALT = {"orders": 2, "revenue": 30.0, "channels": {"App": 10.0, "Web": 20.0}}

CHECKS = {1: [], 2: [], 3: [], 4: []}
TASK_TITLE = {
    1: "TASK 01 · 让脚本跑起来",
    2: "TASK 02 · 给脚本上测试",
    3: "TASK 03 · 让调度器敢调",
    4: "TASK 04 · 交给别人",
}


def check(task, name):
    """注册一条检查；函数返回 (ok, detail)，ok 为 None 表示 SKIP。"""
    def deco(fn):
        CHECKS[task].append((name, fn))
        return fn
    return deco


def run_cli(args, cwd=None, timeout=20):
    cmd = [sys.executable, str(MOD)] + [str(a) for a in args]
    return subprocess.run(
        cmd, cwd=str(cwd or WS), capture_output=True, text=True,
        encoding="utf-8", errors="replace", timeout=timeout,
    )


def run_py(args, cwd=None, timeout=30):
    cmd = [sys.executable] + [str(a) for a in args]
    return subprocess.run(
        cmd, cwd=str(cwd or WS), capture_output=True, text=True,
        encoding="utf-8", errors="replace", timeout=timeout,
    )


def both(r):
    return (r.stdout or "") + (r.stderr or "")


def first_line(text, limit=110):
    t = " ".join(str(text).split())
    return t[:limit] + ("…" if len(t) > limit else "")


def same_report(actual, expect):
    """逐个数字比对，允许 0.005 的金额容差。"""
    if not isinstance(actual, dict):
        return False, "输出不是 JSON 对象"
    if actual.get("orders") != expect["orders"]:
        return False, "orders=%r，期望 %r" % (actual.get("orders"), expect["orders"])
    try:
        rev = float(actual.get("revenue"))
    except (TypeError, ValueError):
        return False, "revenue 不是数字：%r" % actual.get("revenue")
    if abs(rev - expect["revenue"]) > 0.005:
        return False, "revenue=%.4f，期望 %.2f（检查是否只算了 paid）" % (rev, expect["revenue"])
    ch = actual.get("channels")
    if not isinstance(ch, dict):
        return False, "channels 不是对象：%r" % (ch,)
    if set(ch.keys()) != set(expect["channels"]):
        return False, "渠道集合=%s，期望 %s" % (sorted(ch), sorted(expect["channels"]))
    for k, v in expect["channels"].items():
        try:
            got = float(ch[k])
        except (TypeError, ValueError):
            return False, "渠道 %s 的金额不是数字：%r" % (k, ch[k])
        if abs(got - v) > 0.005:
            return False, "渠道 %s=%.4f，期望 %.2f" % (k, got, v)
    return True, "orders / revenue / channels 三项全对"


def produce(tmp, csv_name, tag):
    """跑一次 CLI，返回 (CompletedProcess, out_path, parsed_or_None, err)。"""
    out = tmp / tag / "report.json"          # 故意让父目录不存在，测自动创建
    r = run_cli(["--input", "data/" + csv_name, "--output", str(out)])
    if not out.is_file():
        return r, out, None, "没有生成输出文件"
    try:
        parsed = json.loads(out.read_text(encoding="utf-8"))
    except Exception as exc:
        return r, out, None, "输出不是合法 JSON：%s" % exc
    return r, out, parsed, ""


# ---------------------------------------------------------------- TASK 01
@check(1, "daily_report.py 已创建")
def t1_file(tmp):
    return MOD.is_file(), str(MOD.relative_to(ROOT))


@check(1, "--help 正常且列出 --input / --output")
def t1_help(tmp):
    r = run_cli(["--help"])
    out = both(r)
    ok = r.returncode == 0 and "--input" in out and "--output" in out
    return ok, "exit=%d；%s" % (r.returncode, first_line(out))


@check(1, "主数据跑通：退出码 0、自动建目录、生成 JSON")
def t1_run(tmp):
    r, out, _, err = produce(tmp, "orders.csv", "t1_main")
    ok = r.returncode == 0 and out.is_file()
    return ok, "exit=%d；%s" % (r.returncode, err or str(out))


@check(1, "主数据三项数值全对（只算 paid）")
def t1_json(tmp):
    r, _, parsed, err = produce(tmp, "orders.csv", "t1_json")
    if parsed is None:
        return False, err
    ok, detail = same_report(parsed, EXPECT_MAIN)
    return ok, detail


@check(1, "换一份数据仍然算对（防写死答案）")
def t1_alt(tmp):
    r, _, parsed, err = produce(tmp, "orders_alt.csv", "t1_alt")
    if parsed is None:
        return False, err
    ok, detail = same_report(parsed, EXPECT_ALT)
    return ok, "orders_alt.csv：" + detail


# ---------------------------------------------------------------- TASK 02
def test_files():
    return sorted(WS.glob("test_*.py"))


def run_unittest(cwd):
    return run_py(["-m", "unittest", "discover", "-s", ".", "-p", "test_*.py", "-v"], cwd=cwd)


@check(2, "存在 test_*.py 测试文件")
def t2_file(tmp):
    fs = test_files()
    return bool(fs), ", ".join(f.name for f in fs) or "没找到 test_*.py"


@check(2, "unittest 真跑且全绿")
def t2_run(tmp):
    r = run_unittest(WS)
    out = both(r)
    ok = r.returncode == 0 and re.search(r"\bOK\b", out) is not None
    return ok, "exit=%d；%s" % (r.returncode, first_line(out))


@check(2, "测试数量 >= 4（从 Ran N tests 读）")
def t2_count(tmp):
    r = run_unittest(WS)
    m = re.search(r"Ran\s+(\d+)\s+tests?", both(r))
    n = int(m.group(1)) if m else 0
    return n >= 4 and r.returncode == 0, "实际跑了 %d 条" % n


@check(2, "测试真的 import 了 daily_report 且含断言")
def t2_assert(tmp):
    src = "\n".join(f.read_text(encoding="utf-8", errors="replace") for f in test_files())
    has_import = re.search(r"(?:^\s*(?:import|from)\s+daily_report\b)", src, re.M) is not None
    has_assert = re.search(r"\bassert\w*\s*\(", src) is not None
    return has_import and has_assert, "import=%s，assert=%s" % (has_import, has_assert)


@check(2, "变异测试：改坏「只算 paid」后测试必须变红")
def t2_mutation(tmp):
    shutil.rmtree(MUT, ignore_errors=True)
    try:
        src = MOD.read_text(encoding="utf-8")
        hit = src.count('"paid"') + src.count("'paid'")
        if hit == 0:
            return None, "源码里找不到 'paid' 字面量，无法变异（建议用字符串常量比较状态）"
        MUT.mkdir(parents=True)
        (MUT / "daily_report.py").write_text(
            src.replace('"paid"', '"__never_paid__"').replace("'paid'", "'__never_paid__'"),
            encoding="utf-8",
        )
        for f in WS.glob("*.py"):
            if f.name != "daily_report.py":
                shutil.copy2(f, MUT / f.name)
        shutil.copytree(DATA, MUT / "data")   # 兼容 cwd 相对路径与 __file__ 相对路径
        for d in WS.iterdir():
            if d.is_dir() and d.name not in {".git", ".venv", "__pycache__", "data", ".mutant", "out"}:
                shutil.copytree(d, MUT / d.name)
        r = run_unittest(MUT)
        ok = r.returncode != 0
        detail = ("改坏口径后测试变红，说明有用例在守着 paid"
                  if ok else "改坏口径后测试仍全绿 —— 没有任何用例在测「只算 paid」")
        return ok, detail
    finally:
        shutil.rmtree(MUT, ignore_errors=True)


# ---------------------------------------------------------------- TASK 03
def expect_failure(tmp, csv_name, tag):
    out = tmp / tag / "report.json"
    r = run_cli(["--input", "data/" + csv_name, "--output", str(out)])
    msg = both(r).strip()
    ok = r.returncode == 2 and len(msg) >= 10
    return ok, "exit=%d；%s" % (r.returncode, first_line(msg))


@check(3, "输入文件不存在 → 退出码 2 + 可读错误")
def t3_missing(tmp):
    return expect_failure(tmp, "nope.csv", "t3_missing")


@check(3, "金额不是数字 → 退出码 2 + 可读错误")
def t3_bad(tmp):
    return expect_failure(tmp, "orders_bad.csv", "t3_bad")


@check(3, "CSV 缺列 → 退出码 2 + 可读错误")
def t3_nocol(tmp):
    return expect_failure(tmp, "orders_nocol.csv", "t3_nocol")


@check(3, "同参数跑两次输出字节一致（幂等）")
def t3_idempotent(tmp):
    out = tmp / "idem" / "report.json"
    args = ["--input", "data/orders.csv", "--output", str(out)]
    r1 = run_cli(args)
    b1 = out.read_bytes() if out.is_file() else b""
    r2 = run_cli(args)
    b2 = out.read_bytes() if out.is_file() else b""
    ok = r1.returncode == 0 and r2.returncode == 0 and bool(b1) and b1 == b2
    return ok, "两次 exit=%d/%d，字节 %d/%d%s" % (
        r1.returncode, r2.returncode, len(b1), len(b2),
        "" if b1 == b2 else "（输出里可能有时间戳/随机数，或用了追加写）",
    )


@check(3, "被 import 时不产生任何文件（main 守卫）")
def t3_guard(tmp):
    def snapshot():
        return {
            str(p.relative_to(WS)) for p in WS.rglob("*")
            if p.is_file() and "__pycache__" not in p.parts
            and ".git" not in p.parts and not p.name.endswith(".pyc")
        }
    before = snapshot()
    r = run_py(["-c", "import daily_report"])
    new = snapshot() - before
    ok = r.returncode == 0 and not new
    return ok, ("import 干净" if ok else "import 产生了新文件：%s" % sorted(new)[:4])


# ---------------------------------------------------------------- TASK 04
def read_ws(name):
    p = WS / name
    return p.read_text(encoding="utf-8", errors="replace") if p.is_file() else ""


@check(4, "真实 Git 仓库且提交历史 >= 3 次")
def t4_git(tmp):
    if not (WS / ".git").is_dir():
        return False, "workspace 里没有 .git，先 git init 并分次提交"
    try:
        r = subprocess.run(
            ["git", "-C", str(WS), "log", "--oneline"], capture_output=True,
            text=True, encoding="utf-8", errors="replace", timeout=10,
        )
    except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
        return False, "git 命令不可用：%s" % exc
    n = len([l for l in (r.stdout or "").splitlines() if l.strip()])
    return n >= 3, "%d 次提交（%s）" % (n, first_line((r.stdout or "").splitlines()[0] if n else r.stderr or "", 50))


@check(4, "requirements.txt 存在（哪怕只写「仅标准库」）")
def t4_req(tmp):
    return (WS / "requirements.txt").is_file(), "requirements.txt"


@check(4, "README 含最小命令 / 参数 / 退出码说明")
def t4_readme(tmp):
    t = read_ws("README.md")
    need = ["daily_report.py", "--input", "退出码"]
    miss = [x for x in need if x not in t]
    return not miss, "缺少：%s" % (", ".join(miss) if miss else "无，三项齐全")


@check(4, "Makefile 含 run: 与 test: 目标")
def t4_makefile(tmp):
    t = read_ws("Makefile")
    miss = [x for x in ("run:", "test:") if x not in t]
    return not miss, "缺少：%s" % (", ".join(miss) if miss else "无，两个目标齐全")


@check(4, ".gitignore 忽略 __pycache__ 与 .venv")
def t4_gitignore(tmp):
    t = read_ws(".gitignore")
    miss = [x for x in ("__pycache__", ".venv") if x not in t]
    return not miss, "缺少：%s" % (", ".join(miss) if miss else "无")


@check(4, "DELIVERY.md 已填并贴了全绿输出")
def t4_delivery(tmp):
    t = read_ws("DELIVERY.md")
    miss = [x for x in ("TASK 01", "PASS") if x not in t]
    return not miss, "缺少：%s" % (", ".join(miss) if miss else "无，交付记录齐全")


# ---------------------------------------------------------------- 汇总
def main():
    ap = argparse.ArgumentParser(description="PyQuest 企业第一周作业 · 本机验收")
    ap.add_argument("--task", default="all", help="all 或 1 / 1,2 / 1,2,3,4")
    args = ap.parse_args()
    if args.task.strip().lower() == "all":
        tasks = [1, 2, 3, 4]
    else:
        try:
            tasks = sorted({int(x) for x in re.split(r"[,\s]+", args.task.strip()) if x})
        except ValueError:
            ap.error("--task 只能是 all 或逗号分隔的数字")
        bad = [t for t in tasks if t not in CHECKS]
        if bad:
            ap.error("没有这些关卡：%s" % bad)

    print("=" * 68)
    print(" PyQuest · 企业第一周作业   本机验收")
    print(" 工作区：%s" % WS)
    print("=" * 68)

    shutil.rmtree(MUT, ignore_errors=True)
    total = {"pass": 0, "fail": 0, "skip": 0}
    per_task = {}

    with tempfile.TemporaryDirectory(prefix="pyquest-check-") as td:
        tmp = Path(td)
        for t in tasks:
            print("\n[%s]" % TASK_TITLE[t])
            stat = {"pass": 0, "fail": 0, "skip": 0}
            for name, fn in CHECKS[t]:
                try:
                    ok, detail = fn(tmp)
                except subprocess.TimeoutExpired:
                    ok, detail = False, "子进程超时（20s），检查是不是死循环或等输入"
                except Exception as exc:
                    ok, detail = False, "%s: %s" % (type(exc).__name__, exc)
                if ok is None:
                    tag, key = "SKIP", "skip"
                elif ok:
                    tag, key = "PASS", "pass"
                else:
                    tag, key = "FAIL", "fail"
                stat[key] += 1
                total[key] += 1
                print("  %-4s | %-40s | %s" % (tag, name, detail))
            per_task[t] = stat

    print("\n" + "-" * 68)
    print("  " + "   ".join("TASK %d %d/%d" % (t, per_task[t]["pass"],
                                              len(CHECKS[t])) for t in tasks))
    print("  总计 %d 通过 / %d 失败 / %d 跳过" % (total["pass"], total["fail"], total["skip"]))
    if total["fail"] == 0:
        print("  全绿。把这段输出贴进 workspace/DELIVERY.md，再补一次提交。")
    else:
        print("  按上面的 FAIL 逐条改，改完重跑：python check.py")
    print("=" * 68)
    return 1 if total["fail"] else 0


if __name__ == "__main__":
    sys.exit(main())

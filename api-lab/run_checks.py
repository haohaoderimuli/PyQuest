"""FastAPI 关卡判分器（在 api-lab/venv 里跑）。

用法：
    venv\\Scripts\\python.exe run_checks.py --level 13-1 --file 学生代码.py
    venv\\Scripts\\python.exe run_checks.py --level 13-1 --code "from fastapi import ..."

输出：一行 JSON 到 stdout。stderr 留给警告与 traceback。

为什么必须单独一个进程：
学生代码是在「导入」阶段就执行的，一旦它写了 while True 或者起了 uvicorn，
本进程就回不来了。所以判分放在子进程里跑，由 serve.py 负责超时与收尸。
"""
import argparse
import ast
import json
import os
import sys
import traceback
import types

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import level_checks  # noqa: E402

# 这几关只该出现这些模块。白名单比黑名单稳：漏一个包名不会变成安全洞。
ALLOWED_MODULES = {
    "fastapi", "pydantic", "starlette", "typing", "typing_extensions",
    "datetime", "enum", "math", "decimal", "json", "uuid", "re",
    "functools", "itertools", "collections", "dataclasses", "abc",
    "__future__",
}

# 命中这些就给出针对性的说明，而不是干巴巴的「不允许」
SPECIAL_DENY = {
    "uvicorn": "判分环境只导入你写的 app，不需要自己起服务。"
               "写 uvicorn.run(app) 会把进程占住，判分直接超时。",
    "requests": "这里判的是服务端，不需要客户端库——请求由判分器用 httpx 发。",
    "httpx": "判分器自己会发请求，你只要定义 app。",
    "time": "这一关用不到 sleep。要模拟慢接口，把它留到本机自己测。",
}

DENY_CALLS = {"eval", "exec", "compile", "__import__", "breakpoint"}


def scan(src):
    """静态体检：挡住越界导入与危险调用，返回问题列表。"""
    problems = []
    try:
        tree = ast.parse(src)
    except SyntaxError as exc:
        line = exc.lineno or 0
        problems.append("第 %d 行语法错误：%s" % (line, exc.msg))
        return problems, None

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                top = alias.name.split(".")[0]
                if top in SPECIAL_DENY:
                    problems.append("第 %d 行 import %s：%s" % (node.lineno, alias.name, SPECIAL_DENY[top]))
                elif top not in ALLOWED_MODULES:
                    problems.append("第 %d 行 import %s：这一章只允许 %s 这些模块"
                                    % (node.lineno, alias.name, " / ".join(sorted(ALLOWED_MODULES))))
        elif isinstance(node, ast.ImportFrom):
            top = (node.module or "").split(".")[0]
            if top in SPECIAL_DENY:
                problems.append("第 %d 行 from %s import ...：%s" % (node.lineno, node.module, SPECIAL_DENY[top]))
            elif top and top not in ALLOWED_MODULES:
                problems.append("第 %d 行 from %s import ...：这一章只允许 %s 这些模块"
                                % (node.lineno, node.module, " / ".join(sorted(ALLOWED_MODULES))))
        elif isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
            if node.func.id in DENY_CALLS:
                problems.append("第 %d 行用了 %s()：判分环境不接受动态执行" % (node.lineno, node.func.id))
    return problems, tree


def exec_student(src):
    """把学生代码当成一个模块执行，返回模块对象。"""
    mod = types.ModuleType("student_app")
    mod.__dict__["__file__"] = "student_app.py"
    sys.modules["student_app"] = mod
    exec(compile(src, "<你的代码>", "exec"), mod.__dict__)   # noqa: S102
    return mod


def describe_crash(exc):
    """把异常翻译成「第几行、什么问题」，比整段 traceback 好读。"""
    frames = traceback.extract_tb(exc.__traceback__)
    mine = [f for f in frames if f.filename == "<你的代码>"]
    head = "%s: %s" % (type(exc).__name__, exc)
    if not mine:
        return head
    f = mine[-1]
    snippet = (f.line or "").strip()
    return "第 %d 行出错——%s\n    %s" % (f.lineno, head, snippet)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--level", required=True)
    ap.add_argument("--file")
    ap.add_argument("--code")
    args = ap.parse_args()

    if args.level not in level_checks.CHECKS:
        print(json.dumps({"pass": False, "score": 0, "message": "未知关卡 %s" % args.level}, ensure_ascii=False))
        return 2

    if args.file:
        with open(args.file, encoding="utf-8") as fh:
            src = fh.read()
    else:
        src = args.code or ""

    if not src.strip():
        print(json.dumps({"pass": False, "score": 0, "message": "代码是空的"}, ensure_ascii=False))
        return 0

    problems, _tree = scan(src)
    if problems:
        print(json.dumps({
            "pass": False, "score": 0,
            "message": "代码没通过静态检查：\n" + "\n".join("· " + p for p in problems),
            "checks": [],
        }, ensure_ascii=False))
        return 0

    try:
        mod = exec_student(src)
    except Exception as exc:                                  # noqa: BLE001
        print(json.dumps({
            "pass": False, "score": 0,
            "message": "代码在导入阶段就报错了（FastAPI 的应用是在 import 时装配的）：\n" + describe_crash(exc),
            "checks": [],
        }, ensure_ascii=False))
        return 0

    app = getattr(mod, "app", None)
    if app is None:
        print(json.dumps({
            "pass": False, "score": 0,
            "message": "没找到 app。判分器要拿 app 发请求，所以变量得叫 app——"
                       "app = FastAPI() 这一句别改名。",
            "checks": [],
        }, ensure_ascii=False))
        return 0

    try:
        from fastapi.testclient import TestClient
        client = TestClient(app, raise_server_exceptions=False)
    except Exception as exc:                                  # noqa: BLE001
        print(json.dumps({
            "pass": False, "score": 0,
            "message": "app 建不起来：%s: %s" % (type(exc).__name__, exc), "checks": [],
        }, ensure_ascii=False))
        return 0

    try:
        rows = level_checks.CHECKS[args.level](client, mod)
    except Exception as exc:                                  # noqa: BLE001
        print(json.dumps({
            "pass": False, "score": 0,
            "message": "判分过程中出了异常：\n" + describe_crash(exc),
            "checks": [],
        }, ensure_ascii=False))
        return 0

    total = len(rows)
    passed = sum(1 for r in rows if r["pass"])
    score = round(passed * 100 / total) if total else 0
    ok = passed == total
    if ok:
        msg = "全部 %d 条都过了：" % total + level_checks.TITLES[args.level]
    else:
        first = next(r for r in rows if not r["pass"])
        msg = "%d / %d 条通过。第一个没过的是「%s」——%s" % (
            passed, total, first["label"], first["detail"] or "没给细节")

    print(json.dumps({
        "pass": ok, "score": score, "message": msg,
        "checks": rows, "passed": passed, "total": total,
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())

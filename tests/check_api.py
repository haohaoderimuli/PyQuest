"""第 13 章（FastAPI）判分器测试。

跑法：python tests/check_api.py
需要 api-lab/venv 里装好 fastapi + httpx（见 api-lab/README.md）。

它验四件事：
1. 四关参考解都拿 100 分
2. 四个反例都被拦住，且失败的是「预期的那条判据」
3. 静态体检能挡住越界 import、uvicorn、语法错误
4. 服务在跑时，POST /api/api-lab/grade 这条链路是通的
"""
import json
import os
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
LAB = os.path.join(ROOT, "api-lab")
WORK = os.path.join(LAB, ".work")

LEVELS = ["13-1", "13-2", "13-3", "13-4"]

# (关卡, 反例文件, 预期失败判据里的关键词)
WRONG = [
    ("13-1", "13-1_str_path.py", "order_id 声明成 int"),
    ("13-2", "13-2_manual_400.py", "limit=0"),
    ("13-3", "13-3_no_response_model.py", "响应字段恰好"),
    ("13-4", "13-4_header_required.py", "没带 X-Token"),
]

passed = 0
failed = []


def log(ok, name, detail=""):
    global passed
    if ok:
        passed += 1
        print("PASS | %s%s" % (name, (" | " + detail) if detail else ""))
    else:
        failed.append(name)
        print("FAIL | %s%s" % (name, (" | " + detail) if detail else ""))


def venv_py():
    for rel in (("Scripts", "python.exe"), ("bin", "python")):
        p = os.path.join(LAB, "venv", *rel)
        if os.path.exists(p):
            return p
    return None


def grade(level, code):
    """把代码写到临时文件，交给 api-lab 判分器，拿回 JSON。"""
    os.makedirs(WORK, exist_ok=True)
    fd, tmp = tempfile.mkstemp(suffix=".py", dir=WORK)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            fh.write(code)
        cp = subprocess.run(
            [venv_py(), os.path.join(LAB, "run_checks.py"), "--level", level, "--file", tmp],
            capture_output=True, text=True, encoding="utf-8", errors="replace",
            cwd=LAB, timeout=120,
        )
    finally:
        try:
            os.remove(tmp)
        except OSError:
            pass
    out = (cp.stdout or "").strip()
    if not out:
        raise RuntimeError("判分器没有输出：%s" % (cp.stderr or "")[-400:])
    return json.loads(out.splitlines()[-1])


def read(*parts):
    with open(os.path.join(*parts), encoding="utf-8") as fh:
        return fh.read()


def main():
    py = venv_py()
    if not py:
        print("FAIL | 找不到 api-lab/venv。先在 api-lab 里执行：")
        print("       python -m venv venv && venv\\Scripts\\pip install -r requirements.txt")
        return 1

    print("=" * 58)
    print("参考解应得 100 分")
    print("=" * 58)
    for lv in LEVELS:
        path = os.path.join(LAB, "solutions", lv + ".py")
        if not os.path.exists(path):
            log(False, lv + " 参考解存在", path)
            continue
        r = grade(lv, read(path))
        checks = r.get("checks") or []
        bad = [c["label"] for c in checks if not c["pass"]]
        log(r.get("pass") is True and r.get("score") == 100,
            lv + " 参考解 100 分",
            "%s 条判据%s" % (len(checks), "" if not bad else "，未过：" + " / ".join(bad[:2])))

    print("")
    print("=" * 58)
    print("反例应被拦下")
    print("=" * 58)
    for lv, fname, key in WRONG:
        path = os.path.join(LAB, "wrong", fname)
        r = grade(lv, read(path))
        labels = [c["label"] for c in (r.get("checks") or []) if not c["pass"]]
        hit = any(key in lab for lab in labels)
        log(r.get("pass") is False and hit,
            "%s %s 被拦下" % (lv, fname),
            "分数 %s，失败判据：%s" % (r.get("score"), " / ".join(labels[:2]) or "（无 check，见 message）"))

    print("")
    print("=" * 58)
    print("静态体检")
    print("=" * 58)
    cases = [
        ("import os", "13-1", "import os", "import os", "越界 import"),
        ("uvicorn", "13-1", "import uvicorn", "uvicorn", "自己起服务"),
        ("语法错", "13-1", "def broken(:\n    pass\n", "语法错误", "语法错误"),
        ("空代码", "13-1", "   \n\n", "空", "空代码"),
    ]
    for name, lv, code, key, label in cases:
        r = grade(lv, code)
        log(r.get("pass") is False and key in (r.get("message") or ""),
            "拦住「%s」" % label,
            (r.get("message") or "").replace("\n", " / ")[:110])

    print("")
    print("=" * 58)
    print("接口链路")
    print("=" * 58)
    try:
        req = urllib.request.Request(
            "http://127.0.0.1:8770/api/api-lab/status")
        st = json.load(urllib.request.urlopen(req, timeout=5))
        log(st.get("ready") is True, "/api/api-lab/status 就绪", "fastapi %s" % st.get("info"))
    except Exception as exc:                                  # noqa: BLE001
        log(False, "/api/api-lab/status 可达（服务没起？）", str(exc)[:100])

    try:
        body = json.dumps({"level": "13-1", "code": read(LAB, "solutions", "13-1.py")}).encode("utf-8")
        req = urllib.request.Request("http://127.0.0.1:8770/api/api-lab/grade", data=body,
                                     headers={"Content-Type": "application/json"})
        r = json.load(urllib.request.urlopen(req, timeout=90))
        log(r.get("pass") is True and r.get("score") == 100,
            "POST /api/api-lab/grade 判出 100 分", (r.get("message") or "")[:60])
    except Exception as exc:                                  # noqa: BLE001
        log(False, "POST /api/api-lab/grade 可用", str(exc)[:100])

    print("")
    print("=" * 58)
    print("%d 项通过，%d 项失败" % (passed, len(failed)))
    if failed:
        for f in failed:
            print("  - " + f)
        return 1
    print("全部通过")
    return 0


if __name__ == "__main__":
    sys.exit(main())

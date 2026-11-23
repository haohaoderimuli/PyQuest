# -*- coding: utf-8 -*-
"""
PyQuest 本地启动器。

直接双击 index.html 也能玩，但那样浏览器会走在线运行时（首次要下十几 MB）。
这个脚本起一个本地静态服务，让页面用上同目录 pyodide/ 里的运行时——秒开、离线可用。

顺便修一个 Windows 上的坑：系统注册表常把 .js 的 MIME 标成 text/plain，
浏览器会拒绝加载 WebAssembly 模块。这里强制改成 text/javascript。
"""
import http.server
import json
import mimetypes
import os
import socket
import subprocess
import sys
import tempfile
import threading
import webbrowser

# 控制台可能是 GBK 代码页，遇到编码不了的字符时替换掉而不是直接崩
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(errors='replace')
    except Exception:
        pass

mimetypes.add_type('text/javascript', '.js')
mimetypes.add_type('text/javascript', '.mjs')
mimetypes.add_type('application/wasm', '.wasm')
mimetypes.add_type('application/zip', '.zip')
mimetypes.add_type('application/zip', '.whl')   # wheel 本质就是 zip，比 octet-stream 语义准确
mimetypes.add_type('application/json', '.json')
mimetypes.add_type('text/csv', '.csv')          # Windows 注册表常把它标成 vnd.ms-excel

# 静态白名单：游戏运行所需的后缀照常放行；手册与配置只在 toolkits/ 与 assignment/ 内放行。
# 目的是既能下载实操包 / 作业包，又不把 serve.py / README.md / tests/ / .git 暴露出去。
BASE_EXT = {
    '.html', '.htm', '.js', '.mjs', '.css', '.csv', '.svg',
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.otf', '.ttf', '.woff',
    '.woff2', '.wasm', '.whl', '.zip', '.data', '.map', '.txt', '.lock',
}
TOOLKIT_EXT = {'.md', '.py', '.toml', '.ini', '.yaml', '.yml', '.cfg', '.rst'}
TOOLKIT_NAMES = {'Makefile', '.ruff.toml', '.pre-commit-config.yaml', 'Dockerfile'}
ASSIGNMENT_NAMES = {'.gitignore', 'requirements.txt'}
BLOCKED_PARTS = {'.git', '__pycache__', 'node_modules', 'tests',
                 '.mutant', '.venv', 'venv', 'out'}


def is_allowed(raw_path):
    from urllib.parse import unquote
    path = unquote(raw_path.split('?', 1)[0].split('#', 1)[0])
    if path.startswith('/'):
        path = path[1:]
    if not path:
        return True  # 根路径交给 index.html

    # 先做路径安全校验，再判后缀。否则 /toolkits/../server.py 这类路径会
    # 命中「toolkits 内 .py 放行」，被 SimpleHTTPRequestHandler 解析成源码下载。
    if '\x00' in path or '\\' in path:
        return False
    parts = path.split('/')
    if '..' in parts or any(part in BLOCKED_PARTS for part in parts):
        return False
    if path.endswith('/'):
        return False  # 不列目录
    root = os.path.realpath(os.path.dirname(os.path.abspath(__file__)))
    full = os.path.realpath(os.path.join(root, os.path.normpath(path)))
    try:
        if os.path.commonpath([full, root]) != root:
            return False
    except ValueError:
        return False

    name = parts[-1]
    ext = os.path.splitext(name)[1].lower()
    if ext in BASE_EXT:
        return True
    # .json 只给 Pyodide 的锁文件用；根目录 package.json / package-lock.json 不外泄
    if parts[0] == 'pyodide' and ext == '.json':
        return True
    if parts[0] in ('toolkits', 'assignment', 'joint') and (
            ext in TOOLKIT_EXT or name in TOOLKIT_NAMES or name in ASSIGNMENT_NAMES
            or (parts[0] in ('assignment', 'joint') and ext == '.json')):
        return True
    # api-lab 里只放行两份给人看的文档；判分器与参考解（solutions/、wrong/）不下载
    if parts[0] == 'api-lab' and len(parts) == 2 and name in ('README.md', 'requirements.txt'):
        return True
    return False

# 大文件长缓存：这些是固定版本的运行时和依赖，刷新时没必要重读 50MB
LONG_CACHE = ('.whl', '.wasm', '.zip', '.data', '.js', '.mjs')
MID_CACHE = ('.csv',)

ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)


def pick_port(start=8770, tries=20):
    for p in range(start, start + tries):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                s.bind(('127.0.0.1', p))
                return p
            except OSError:
                continue
    return None


# ---------------------------------------------------------------- FastAPI 关卡判分
# 浏览器里的 Pyodide 没有 FastAPI（ASGI 要事件循环，还不能联网装 pydantic-core），
# 所以第 13 章的四关走「本机子进程真跑」：api-lab/venv 里装 fastapi + httpx，
# 判分器导入学生写的 app，用 TestClient 真发请求。
API_LAB = os.path.join(ROOT, 'api-lab')
API_LEVELS = {'13-1', '13-2', '13-3', '13-4'}
MAX_CODE_BYTES = 200 * 1024
GRADE_TIMEOUT = 45
GRADE_LOCK = threading.Lock()
READY_CACHE = {}


def venv_python():
    for rel in (('Scripts', 'python.exe'), ('bin', 'python')):
        p = os.path.join(API_LAB, 'venv', *rel)
        if os.path.exists(p):
            return p
    return None


def api_lab_ready():
    """venv 在不在、fastapi 装没装。结果缓存，免得每次点运行都探一遍。"""
    if 'ready' in READY_CACHE:
        return READY_CACHE['ready']
    py = venv_python()
    if not py:
        READY_CACHE['ready'] = (False, '没找到 api-lab/venv。先在 api-lab 里执行：python -m venv venv 然后 pip install -r requirements.txt')
        return READY_CACHE['ready']
    try:
        cp = subprocess.run([py, '-c', 'import fastapi, httpx; print(fastapi.__version__)'],
                            capture_output=True, text=True, encoding='utf-8', errors='replace',
                            timeout=30, creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
        if cp.returncode == 0:
            READY_CACHE['ready'] = (True, cp.stdout.strip())
        else:
            READY_CACHE['ready'] = (False, 'venv 里没有 fastapi：%s' % (cp.stderr or '').strip()[-160:])
    except Exception as exc:                                   # noqa: BLE001
        READY_CACHE['ready'] = (False, '探测 venv 失败：%s' % exc)
    return READY_CACHE['ready']


class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.split('?', 1)[0] == '/api/api-lab/status':
            return self._api_status()
        if not is_allowed(self.path):
            self.send_error(404, "Not Found")
            return
        super().do_GET()

    def do_POST(self):
        if self.path.split('?', 1)[0] == '/api/api-lab/grade':
            return self._api_grade()
        self.send_error(404, "Not Found")

    def do_HEAD(self):
        if not is_allowed(self.path):
            self.send_error(404, "Not Found")
            return
        super().do_HEAD()

    # ------------------------------ 判分接口
    def _send_json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def _api_status(self):
        ok, info = api_lab_ready()
        self._send_json(200, {'ready': ok, 'info': info, 'levels': sorted(API_LEVELS)})

    def _api_grade(self):
        length = int(self.headers.get('Content-Length') or 0)
        if length <= 0:
            return self._send_json(400, {'pass': False, 'score': 0, 'message': '请求体是空的'})
        if length > MAX_CODE_BYTES:
            return self._send_json(413, {'pass': False, 'score': 0,
                                         'message': '代码太长了（上限 %d KB）' % (MAX_CODE_BYTES // 1024)})
        try:
            payload = json.loads(self.rfile.read(length).decode('utf-8'))
        except Exception:                                     # noqa: BLE001
            return self._send_json(400, {'pass': False, 'score': 0, 'message': '请求体不是合法 JSON'})

        level = str(payload.get('level') or '')
        code = payload.get('code') or ''
        if level not in API_LEVELS:
            return self._send_json(404, {'pass': False, 'score': 0, 'message': '未知关卡 %s' % level})
        if not isinstance(code, str) or not code.strip():
            return self._send_json(400, {'pass': False, 'score': 0, 'message': '代码是空的'})

        ok, info = api_lab_ready()
        if not ok:
            return self._send_json(200, {'pass': False, 'score': 0, 'infra': True,
                                         'message': '服务端判分环境没准备好：' + info})

        if not GRADE_LOCK.acquire(blocking=False):
            return self._send_json(429, {'pass': False, 'score': 0,
                                         'message': '上一次判分还没结束（每次要真跑一遍你的应用），稍等几秒再点'})
        workdir = os.path.join(API_LAB, '.work')
        tmp = None
        try:
            os.makedirs(workdir, exist_ok=True)
            fd, tmp = tempfile.mkstemp(suffix='.py', prefix='student-', dir=workdir)
            with os.fdopen(fd, 'w', encoding='utf-8') as fh:
                fh.write(code)
            env = dict(os.environ, PYTHONIOENCODING='utf-8', PYTHONUTF8='1')
            cp = subprocess.run(
                [venv_python(), os.path.join(API_LAB, 'run_checks.py'), '--level', level, '--file', tmp],
                capture_output=True, text=True, encoding='utf-8', errors='replace',
                timeout=GRADE_TIMEOUT, cwd=API_LAB, env=env,
                creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0),
            )
            out = (cp.stdout or '').strip()
            try:
                result = json.loads(out.splitlines()[-1]) if out else None
            except Exception:                                 # noqa: BLE001
                result = None
            if result is None:
                tail = (cp.stderr or out or '')[-400:].strip()
                return self._send_json(200, {'pass': False, 'score': 0,
                                             'message': '判分器没有正常返回（退出码 %s）。\n%s'
                                                        % (cp.returncode, tail)})
            self._send_json(200, result)
        except subprocess.TimeoutExpired:
            self._send_json(200, {'pass': False, 'score': 0,
                                  'message': '判分超时（%d 秒）。你的代码里可能有阻塞调用——'
                                             'sleep、死循环，或者自己起了 uvicorn。判分只 import 你的 app，'
                                             '请求由判分器来发。' % GRADE_TIMEOUT})
        except Exception as exc:                              # noqa: BLE001
            self._send_json(500, {'pass': False, 'score': 0, 'message': '判分服务异常：%s' % exc})
        finally:
            GRADE_LOCK.release()
            if tmp:
                try:
                    os.remove(tmp)
                except OSError:
                    pass

    def end_headers(self):
        path = self.path.split('?')[0].split('#')[0]
        ext = os.path.splitext(path)[1].lower()
        if ext in LONG_CACHE:
            self.send_header('Cache-Control', 'public, max-age=604800, immutable')
        elif ext in MID_CACHE:
            # 数据文件可能随时改，给 1 小时 + 允许条件请求
            self.send_header('Cache-Control', 'public, max-age=3600')
        else:
            # HTML 每次都要校验，改完立刻生效
            self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def log_message(self, fmt, *args):
        pass  # 安静运行，不刷屏


def main():
    port = pick_port()
    if port is None:
        print('端口都被占用了，换个法子：直接双击 index.html 吧。')
        input('按回车退出…')
        return

    url = 'http://127.0.0.1:%d/index.html' % port
    print('')
    print('  蛇之塔 · PyQuest   Python 闯关')
    print('  ----------------------------------------')
    print('  地址: %s' % url)
    print('  关掉这个黑窗口就停止服务。')
    print('')

    if not os.environ.get('PYQUEST_NO_BROWSER'):
        threading.Timer(1.0, lambda: webbrowser.open(url)).start()

    with http.server.ThreadingHTTPServer(('127.0.0.1', port), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == '__main__':
    main()

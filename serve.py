# -*- coding: utf-8 -*-
"""
PyQuest 本地启动器。

直接双击 index.html 也能玩，但那样浏览器会走在线运行时（首次要下十几 MB）。
这个脚本起一个本地静态服务，让页面用上同目录 pyodide/ 里的运行时——秒开、离线可用。

顺便修一个 Windows 上的坑：系统注册表常把 .js 的 MIME 标成 text/plain，
浏览器会拒绝加载 WebAssembly 模块。这里强制改成 text/javascript。
"""
import http.server
import mimetypes
import os
import socket
import sys
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


class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if not is_allowed(self.path):
            self.send_error(404, "Not Found")
            return
        super().do_GET()

    def do_HEAD(self):
        if not is_allowed(self.path):
            self.send_error(404, "Not Found")
            return
        super().do_HEAD()

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

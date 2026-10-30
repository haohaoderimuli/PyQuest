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

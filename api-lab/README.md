# api-lab —— 第 13 章的判分环境

第 13 章「接口之门」共 4 关，教的是**写接口**：路由、查询参数校验、请求体与响应模型、依赖注入与统一错误格式。

## 为什么这一章不在浏览器里跑

前面 44 关都跑在浏览器里的 Pyodide 上，这一章不行：

1. **没有 FastAPI**。Pyodide 的包列表里只有 `pydantic`，没有 `fastapi` / `starlette`。
2. **装不上**。`micropip` 从 PyPI 装纯 Python 包要联网，而 `pydantic-core` 是编译好的二进制，版本必须和运行时精确匹配——离线环境直接失败。
3. **ASGI 要事件循环**。Pyodide 的主循环归浏览器管，`asyncio.run()` 进去就报 `cannot be called from a running event loop`，`loop.run_until_complete` 也不会真的阻塞。

所以这 4 关改成**服务端真跑**：页面把代码 POST 给 `serve.py`，`serve.py` 起一个子进程（本目录的 venv），子进程导入你写的 `app`，用 `TestClient` 真发请求，把逐条回执返回给页面。

这也是唯一诚实的做法——判的是真实 HTTP 行为，不是"看起来像不像 FastAPI 代码"。

## 目录

```
api-lab/
  venv/              虚拟环境（不进仓库，见 .gitignore）
  requirements.txt   fastapi + httpx
  run_checks.py      判分器入口：静态体检 → 导入 → 建 TestClient → 跑该关的判据
  level_checks.py    四关各自的判据（真发请求，看状态码与 JSON）
  solutions/         四关参考解
  wrong/             四个"看起来对但会被拦住"的反例
  .work/             判分时写学生代码的临时目录（跑完即删）
```

## 装一次就行

```bash
cd api-lab
python -m venv venv
venv\Scripts\pip install -r requirements.txt      # macOS/Linux: venv/bin/pip
```

装完用这条自检：

```bash
venv\Scripts\python.exe run_checks.py --level 13-1 --file solutions/13-1.py
```

应输出 `"pass": true, "score": 100`。

## 判分怎么做

一次判分（约 1.5–3 秒）走四步：

1. **静态体检**（`run_checks.py: scan`）——AST 扫一遍，只放行 `fastapi / pydantic / typing / datetime` 这类学习所需模块。写 `import os` 会被挡下并说清原因；写 `import uvicorn` 会单独提示"判分只导入你的 app，不用自己起服务"。
2. **导入模块**——把你的代码当成一个名叫 `student_app` 的模块执行。FastAPI 的应用在 import 时就装配好了，所以语法错、装饰器写错、字段类型写错都会在这一步暴露，错误会定位到「第 N 行」。
3. **建 TestClient**——`TestClient(app, raise_server_exceptions=False)`，这样你的处理函数抛异常时拿到的是 500 响应，而不是让判分器崩掉。
4. **跑判据**——每一关有 7–10 条断言，全部真发请求。有一条不过就是不过，回执里会写清实际状态码与响应体。

分数 = 通过条数 / 总条数 × 100，**满分才算通关**（和其他关卡一致）。

## 四关各判什么

| 关卡 | 主题 | 关键判据 |
| --- | --- | --- |
| 13-1 | app 与路由 | `/healthz` 200 + 精确 JSON；`order_id` 声明成 `int` 时 `/orders/abc` 必须 422 |
| 13-2 | 查询参数与校验 | `total` 是过滤后总数（不是本页条数）；`limit=0/101`、`offset=-1`、`status=unknown` 都要 422 |
| 13-3 | 请求体与响应模型 | 201 状态码；响应字段恰好 `id/sku/qty/amount`；多传的 `cost` 不许回显 |
| 13-4 | 依赖注入与错误格式 | 没带 token 要 **401 而不是 422**；401 与 404 都用 `{"error":{"code","message"}}`，顶层没有 `detail` |

## 沙箱边界（说清楚，不假装）

- 学生代码在**你自己的机器上**、以**你自己的权限**执行。这里做的是"防手滑 + 防越界"，不是安全容器：AST 白名单能够拦住常见越界写法，但挡不住刻意构造的逃逸。
- 每次判分 45 秒超时。写了死循环或自己起 `uvicorn.run()`，会超时并按超时处理，不会卡住整个站点。
- 判分独占一把锁：上一轮没跑完时点第二次会返回 429 并提示"稍等几秒"。
- 只有 13-1…13-4 四个关卡名被接受，其他名字一律 404。

## 想在本机自己起服务看效果

判分器不替你起服务，但真上班要会这一句：

```bash
cd api-lab
venv\Scripts\activate
copy solutions\13-1.py myapp.py
python -m uvicorn myapp:app --reload --port 8000
```

（`13-1.py` 这种带横线的文件名不能当模块名导入，所以先复制成 `myapp.py`。这也是个真实的坑：uvicorn 收的是"模块:变量"，模块名必须是合法标识符。）

打开 <http://127.0.0.1:8000/docs> 就能看到自动生成的接口文档——**这是 FastAPI 最值钱的地方**：参数类型、校验规则、示例请求全从你的函数签名里长出来，不用另写文档。这也是为什么 13-2 要求把边界写在 `Query(ge=..., le=...)` 里，而不是写在函数体的 `if` 里——写进签名，文档里才有。

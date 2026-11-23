"""四关的真判分逻辑。

每一关拿到的是「已经 import 好的学生模块 + 一个 TestClient」。
判分全部靠真发 HTTP 请求，不看字符串、不猜意图——
学生写的如果只是个函数而不是 app，这里会直接说明。
"""


def _ck(rows, label, fn):
    """跑一条断言，异常也算不通过（不能让判分器自己崩掉）。"""
    try:
        ok, detail = fn()
    except Exception as exc:                                  # noqa: BLE001
        ok, detail = False, "调用时抛出 %s: %s" % (type(exc).__name__, str(exc)[:160])
    rows.append({"label": label, "pass": bool(ok), "detail": str(detail or "")[:240]})


def _body(resp):
    try:
        return resp.json()
    except Exception:                                         # noqa: BLE001
        return None


def _show(resp):
    """把响应压成一句可读的说明：状态码 + body 片段。"""
    return "%s %s" % (resp.status_code, (resp.text or "").strip()[:140])


# ---------------------------------------------------------------- 13-1
def check_13_1(client, mod):
    rows = []
    app = getattr(mod, "app", None)
    _ck(rows, "定义了 app（FastAPI 实例）",
        lambda: (app is not None and type(app).__name__ == "FastAPI",
                 "找到了 %s" % type(app).__name__ if app is not None else "模块里没有名叫 app 的变量"))
    if app is None:
        return rows

    r = client.get("/healthz")
    _ck(rows, "GET /healthz 返回 200", lambda: (r.status_code == 200, _show(r)))
    _ck(rows, '/healthz 的 JSON 是 {"status": "ok"}',
        lambda: (_body(r) == {"status": "ok"}, _show(r)))
    _ck(rows, "/healthz 的 Content-Type 是 application/json",
        lambda: ("application/json" in r.headers.get("content-type", ""),
                 r.headers.get("content-type", "(无)")[:80]))

    r2 = client.get("/orders/7")
    _ck(rows, "GET /orders/7 返回 200", lambda: (r2.status_code == 200, _show(r2)))
    _ck(rows, '/orders/7 的 JSON 是 {"id": 7, "status": "paid"}',
        lambda: (_body(r2) == {"id": 7, "status": "paid"}, _show(r2)))

    r3 = client.get("/orders/abc")
    _ck(rows, "order_id 声明成 int：/orders/abc 要 422（不是 200 也不是 500）",
        lambda: (r3.status_code == 422,
                 "实际 %s —— 声明成 int 时 FastAPI 会在进函数之前就返回 422；"
                 "写成 str 就会把脏值放进来（200 或 500）" % r3.status_code))
    return rows


# ---------------------------------------------------------------- 13-2
def check_13_2(client, mod):
    rows = []

    r = client.get("/orders")
    b = _body(r) or {}
    _ck(rows, "GET /orders 不带参数返回 200 且 total=3",
        lambda: (r.status_code == 200 and b.get("total") == 3, _show(r)))
    _ck(rows, "不带参数时 items 是全部 3 条",
        lambda: (isinstance(b.get("items"), list) and len(b["items"]) == 3,
                 "items 长度 %s" % (len(b.get("items") or []) if isinstance(b.get("items"), list) else "不是列表")))

    r = client.get("/orders", params={"status": "paid"})
    b = _body(r) or {}
    items = b.get("items") if isinstance(b.get("items"), list) else []
    _ck(rows, "?status=paid 只返回已支付（total=2）",
        lambda: (b.get("total") == 2 and len(items) == 2 and all(o.get("status") == "paid" for o in items),
                 _show(r)))

    r = client.get("/orders", params={"status": "pending"})
    b = _body(r) or {}
    _ck(rows, "?status=pending 只返回待支付（total=1，id=2）",
        lambda: (b.get("total") == 1 and [o.get("id") for o in (b.get("items") or [])] == [2], _show(r)))

    r = client.get("/orders", params={"limit": 1})
    b = _body(r) or {}
    _ck(rows, "?limit=1 只给 1 条，但 total 仍是 3（分页不能改总数）",
        lambda: (len(b.get("items") or []) == 1 and b.get("total") == 3, _show(r)))

    r = client.get("/orders", params={"limit": 1, "offset": 2})
    b = _body(r) or {}
    _ck(rows, "?limit=1&offset=2 跳过前两条，拿到 id=3",
        lambda: ([o.get("id") for o in (b.get("items") or [])] == [3], _show(r)))

    for bad, note in ((0, "limit=0 低于下界"), (101, "limit=101 超过上界")):
        rb = client.get("/orders", params={"limit": bad})
        _ck(rows, "?limit=%d 要 422（%s）" % (bad, note),
            lambda rb=rb: (rb.status_code == 422,
                           "实际 %s —— Query(ge=1, le=100) 才有这个效果" % rb.status_code))

    rb = client.get("/orders", params={"offset": -1})
    _ck(rows, "?offset=-1 要 422",
        lambda: (rb.status_code == 422, "实际 %s —— offset 要 Query(0, ge=0)" % rb.status_code))

    rb = client.get("/orders", params={"status": "unknown"})
    _ck(rows, "?status=unknown 要 422（枚举外的值不能放行）",
        lambda: (rb.status_code == 422,
                 "实际 %s —— 用 Literal['paid','pending','refunded'] 或 Enum 才能拦住" % rb.status_code))
    return rows


# ---------------------------------------------------------------- 13-3
GOOD = {"sku": "KB-100", "qty": 2, "price": 75.5, "coupon": 0.5}


def check_13_3(client, mod):
    rows = []
    r = client.post("/orders", json=dict(GOOD))
    b = _body(r) or {}

    _ck(rows, "POST /orders 返回 201（创建资源不是 200）",
        lambda: (r.status_code == 201, "实际 %s %s" % (r.status_code, r.text[:120])))
    _ck(rows, "响应字段恰好是 id / sku / qty / amount",
        lambda: (set(b) == {"id", "sku", "qty", "amount"},
                 "实际字段 %s —— 多出来的内部字段（如 cost）要用 response_model 裁掉"
                 % sorted(b.keys())))
    _ck(rows, "amount = qty×price − coupon，四舍五入到分（2×75.5−0.5=150.5）",
        lambda: (abs(float(b.get("amount", 0)) - 150.5) < 1e-9, "实际 amount=%r" % b.get("amount")))
    _ck(rows, "amount 是数字，不是字符串",
        lambda: (isinstance(b.get("amount"), (int, float)) and not isinstance(b.get("amount"), bool),
                 "实际类型 %s" % type(b.get("amount")).__name__))

    bad = dict(GOOD, qty=0)
    r1 = client.post("/orders", json=bad)
    _ck(rows, "qty=0 要 422（Field(ge=1)）",
        lambda: (r1.status_code == 422, "实际 %s —— 只有 Field(ge=1) 才拦得住 0" % r1.status_code))

    r2 = client.post("/orders", json=dict(GOOD, price=-1))
    _ck(rows, "price=-1 要 422（Field(gt=0)）",
        lambda: (r2.status_code == 422, "实际 %s —— 注意 gt 与 ge 的区别，0 元也不该收" % r2.status_code))

    r3 = client.post("/orders", json=dict(GOOD, sku="AB"))
    _ck(rows, "sku 只有 2 个字符要 422（Field(min_length=3)）",
        lambda: (r3.status_code == 422, "实际 %s" % r3.status_code))

    r4 = client.post("/orders", json=dict(GOOD, cost=999))
    b4 = _body(r4) or {}
    _ck(rows, "请求里多传 cost 不会回显到响应里",
        lambda: ("cost" not in b4, "响应里出现了 cost，说明没走 response_model 裁剪"))
    return rows


# ---------------------------------------------------------------- 13-4
TOKEN = {"X-Token": "demo-token"}


def check_13_4(client, mod):
    rows = []

    r = client.get("/orders/1")
    _ck(rows, "没带 X-Token 要 401（不是 422）",
        lambda: (r.status_code == 401,
                 "实际 %s —— Header(...) 必填会让 FastAPI 直接 422；要 default=None 再自己判 401"
                 % r.status_code))

    r2 = client.get("/orders/1", headers={"X-Token": "wrong"})
    _ck(rows, "带错 token 要 401", lambda: (r2.status_code == 401, "实际 %s" % r2.status_code))

    r3 = client.get("/orders/1", headers=TOKEN)
    _ck(rows, "带对 token 查存在的订单返回 200",
        lambda: (r3.status_code == 200, "实际 %s %s" % (r3.status_code, r3.text[:100])))
    _ck(rows, "查到的订单内容正确（id=1, status=paid）",
        lambda: (_body(r3) == {"id": 1, "status": "paid"}, _show(r3)))

    r4 = client.get("/orders/99", headers=TOKEN)
    _ck(rows, "查不存在的订单要 404", lambda: (r4.status_code == 404, "实际 %s" % r4.status_code))

    b1 = _body(r2) or {}
    _ck(rows, '401 的错误体是 {"error": {"code", "message"}}',
        lambda: (isinstance(b1.get("error"), dict)
                 and b1["error"].get("code") == 401
                 and bool(b1["error"].get("message")),
                 "实际 %s" % str(b1)[:140]))

    b4 = _body(r4) or {}
    _ck(rows, "404 用同一个错误格式（证明是全局处理器，不是每个函数手写）",
        lambda: (isinstance(b4.get("error"), dict) and b4["error"].get("code") == 404,
                 "实际 %s" % str(b4)[:140]))

    _ck(rows, "顶层没有 detail 键（默认格式被替换掉了）",
        lambda: ("detail" not in b1 and "detail" not in b4,
                 "响应里还有 detail，说明 exception_handler 没接管"))
    return rows


CHECKS = {
    "13-1": check_13_1,
    "13-2": check_13_2,
    "13-3": check_13_3,
    "13-4": check_13_4,
}

TITLES = {
    "13-1": "最小的服务",
    "13-2": "查询参数与校验",
    "13-3": "请求体与响应模型",
    "13-4": "依赖注入与统一错误",
}

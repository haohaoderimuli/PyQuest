"""反例：校验全靠手写 if，越界返回 400 而不是 422。

能挡住错值，但契约丢了：/docs 里看不到边界，前端也拿不到统一的
422 + 字段级错误说明。这是「能用」和「可协作」的差别。
"""
from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()

ORDERS = [
    {"id": 1, "sku": "KB-100", "status": "paid"},
    {"id": 2, "sku": "MS-200", "status": "pending"},
    {"id": 3, "sku": "CB-300", "status": "paid"},
]


@app.get("/orders")
def list_orders(status: str | None = None, limit: int = 20, offset: int = 0):
    if limit < 1 or limit > 100 or offset < 0:
        return JSONResponse(status_code=400, content={"msg": "参数不合法"})
    if status is not None and status not in ("paid", "pending", "refunded"):
        return JSONResponse(status_code=400, content={"msg": "状态不合法"})
    rows = ORDERS if status is None else [o for o in ORDERS if o["status"] == status]
    return {"total": len(rows), "items": rows[offset:offset + limit]}

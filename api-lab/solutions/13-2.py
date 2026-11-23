"""13-2 参考解：查询参数与校验。

要点：
- Query(ge=, le=) 把边界写在签名里，越界直接 422，函数体里不用 if
- Literal 把「只能取这几个值」变成可执行的约束，写错值也是 422
- total 是「过滤后、分页前」的总数，items 才是本页数据；这一条做错，
  前端分页器就会算出错误的页数
"""
from typing import Literal

from fastapi import FastAPI, Query

app = FastAPI(title="订单服务")

ORDERS = [
    {"id": 1, "sku": "KB-100", "status": "paid"},
    {"id": 2, "sku": "MS-200", "status": "pending"},
    {"id": 3, "sku": "CB-300", "status": "paid"},
]


@app.get("/orders")
def list_orders(
    status: Literal["paid", "pending", "refunded"] | None = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    rows = ORDERS if status is None else [o for o in ORDERS if o["status"] == status]
    return {"total": len(rows), "items": rows[offset:offset + limit]}

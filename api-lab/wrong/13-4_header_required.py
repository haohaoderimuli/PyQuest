"""反例：Header(...) 写成必填。

看起来更「严格」，实际没带 token 时 FastAPI 在进函数之前就返回 422，
你函数里那句 raise HTTPException(401) 根本没机会执行。
401 和 422 对前端是两件事：该跳登录页的，被当成了参数错误。
"""
from fastapi import Depends, FastAPI, Header, HTTPException

app = FastAPI()

TOKEN = "demo-token"
ORDERS = {1: {"id": 1, "status": "paid"}}


def require_token(x_token: str = Header(...)):
    if x_token != TOKEN:
        raise HTTPException(status_code=401, detail="token 无效或缺失")
    return x_token


@app.get("/orders/{order_id}")
def get_order(order_id: int, token: str = Depends(require_token)):
    order = ORDERS.get(order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="订单不存在")
    return order

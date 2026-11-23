"""13-4 参考解：依赖注入与统一错误格式。

要点：
- require_token 是依赖，不是装饰器：认证逻辑写一次，所有接口 Depends 复用
- Header(default=None) 是必须的。写成 Header(...)（必填）时，FastAPI 遇到
  「没带这个头」会返回 422，而不是你要的 401——这是新手最容易踩的坑
- 统一错误格式靠 exception_handler：所有 raise HTTPException 都走同一出口，
  前端只需要认 {"error": {"code", "message"}} 一种结构
"""
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import JSONResponse

TOKEN = "demo-token"

app = FastAPI(title="订单服务")

ORDERS = {
    1: {"id": 1, "status": "paid"},
    2: {"id": 2, "status": "pending"},
}


@app.exception_handler(HTTPException)
async def unify_error(request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.status_code, "message": exc.detail}},
    )


def require_token(x_token: str | None = Header(default=None)):
    if x_token != TOKEN:
        raise HTTPException(status_code=401, detail="token 无效或缺失")
    return x_token


@app.get("/orders/{order_id}")
def get_order(order_id: int, token: str = Depends(require_token)):
    order = ORDERS.get(order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="订单不存在")
    return order

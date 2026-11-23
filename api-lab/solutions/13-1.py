"""13-1 参考解：最小的服务。

要点：
- app 是 FastAPI() 的实例，uvicorn/TestClient 都靠它
- /healthz 给探活用的极简响应，别在这里塞业务查询
- {order_id: int} 的 int 不是装饰：路径参数声明成 int，传 "abc" 时
  FastAPI 会在进函数之前就返回 422，你一句校验代码都不用写
"""
from fastapi import FastAPI

app = FastAPI(title="订单服务")


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


@app.get("/orders/{order_id}")
def get_order(order_id: int):
    return {"id": order_id, "status": "paid"}

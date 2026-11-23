"""反例：路径参数写成 str。表面能跑，但 /orders/abc 会返回 200。

「反正 id 是数字，转一下就行」——问题就出在这句转一下：
转不动的时候谁负责？交给框架（声明 int）比交给你的 try/except 可靠。
"""
from fastapi import FastAPI

app = FastAPI()


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


@app.get("/orders/{order_id}")
def get_order(order_id: str):
    return {"id": int(order_id), "status": "paid"}

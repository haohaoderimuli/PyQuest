"""反例：不用 response_model，把内部字段 cost 一起返回，状态码还是 200。

字段校验做得挺好，错在「出去什么」没管。接口一多，就会有人不小心
把成本价、内部备注、别的用户的手机号带出去。
"""
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI()


class OrderIn(BaseModel):
    sku: str = Field(min_length=3)
    qty: int = Field(ge=1)
    price: float = Field(gt=0)
    coupon: float = 0


@app.post("/orders")
def create_order(payload: OrderIn):
    amount = round(payload.qty * payload.price - payload.coupon, 2)
    return {
        "id": 1001,
        "sku": payload.sku,
        "qty": payload.qty,
        "amount": amount,
        "cost": 999,
    }

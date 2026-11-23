"""13-3 参考解：请求体、响应模型与状态码。

要点：
- 入参模型 OrderIn 只管「进来什么」；字段上的 Field(min_length=, ge=, gt=)
  就是契约，前端传错立刻 422，不用你写一行 if
- 出参模型 OrderOut 决定「出去什么」。函数里 return 的字典多带了 cost，
  response_model 会把它裁掉——内部成本不该出现在对外接口里
- 创建资源用 201，不是 200
"""
from fastapi import FastAPI, status
from pydantic import BaseModel, Field


class OrderIn(BaseModel):
    sku: str = Field(min_length=3)
    qty: int = Field(ge=1)
    price: float = Field(gt=0)
    coupon: float = 0


class OrderOut(BaseModel):
    id: int
    sku: str
    qty: int
    amount: float


app = FastAPI(title="订单服务")


@app.post("/orders", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderIn):
    amount = round(payload.qty * payload.price - payload.coupon, 2)
    return {
        "id": 1001,
        "sku": payload.sku,
        "qty": payload.qty,
        "amount": amount,
        "cost": 999,          # 内部成本：对外不该出现，靠 response_model 裁掉
    }

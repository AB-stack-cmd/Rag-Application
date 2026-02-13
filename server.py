from fastapi import FastAPI

app = FastAPI()

@app.post("/upload")
def Response(items):
    return "running.."
from fastapi import FastAPI
from pydantic import BaseModel


class Item(BaseModel):
    name: str
    description: str | None = None
    price: float
    tax: float | None = None


app = FastAPI()


@app.post(query)
async def create_item(item: Item):
    return item


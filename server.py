from fastapi import FastAPI

app = FastAPI()

@app.post("/upload")
def Response(items):
    return "running.."
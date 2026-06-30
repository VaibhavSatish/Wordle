from fastapi import FastAPI

app = FastAPI()
@app.get("/")
def root():
    return {"message": "Wordle Backend is Alive"}
from fastapi import FastAPI
from words import VALID_WORDS

app = FastAPI("Custom Wordle API")
@app.get("/")
def root():
    return {"message": "Wordle Backend is Alive"}
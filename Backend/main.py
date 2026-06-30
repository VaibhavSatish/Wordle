from fastapi import FastAPI
from words import generate_words

WORD_LENGTH = 5
VALID_WORDS = generate_words(WORD_LENGTH)

app = FastAPI("Custom Wordle API")
@app.get("/")
def root():
    return {"message": "Wordle Backend is Alive"}
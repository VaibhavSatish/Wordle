from datetime import datetime
from typing import Literal
from fastapi import FastAPI, HTTPException
from words import generate_words
import uvicorn
import random
from pydantic import BaseModel
import datetime
import uuid

WORD_LENGTH = 5
MAX_ATTEMPTS = 6
VALID_WORDS = generate_words(WORD_LENGTH)
LetterState = Literal['Correct', 'In Word', 'Not_Used']
games = []

app = FastAPI(title = "Wordle API")

@app.get("/")
def root():
    print(VALID_WORDS)
    return {"message": "Wordle Backend is Alive"}

class CreateNewGame(BaseModel):
    game_id: int
    word_length: int
    max_attempts: int

class GuessRequest(BaseModel):
    game_id: int
    guess: str

class GuessResponse(BaseModel):
    result: list[LetterState]
    attempts_used: int
    attempts_remaining: int
    is_correct: bool
    game_over: bool

class AnswerResponse(BaseModel):
    answer: str

def set_new_target_word():
    seed = datetime.date.today().isoformat()
    rng = random.Random(seed)
    target_word = rng.choice(VALID_WORDS)
    return target_word

def evaluate_guess(guess: str, target_word: str) -> list[LetterState]:
    result = ["Not Used"] * len(guess)
    answer_chars = list(target_word)
    for i in range(len(guess)):
        if guess[i] == target_word[i]:
            result[i] = LetterState[0]
            answer_chars[i] = None

    for j in range(len(guess)):
        if result[j] == "Correct":
            continue
        if guess[j] in answer_chars:
            result[j] = LetterState[1]
            answer_chars[answer_chars.index(guess[j])] = None
    return result

@app.get("/api/game/new", response_model = CreateNewGame)
def create_new_game(daily = True):
    word = ""
    if daily:
        word = set_new_target_word()
    else:
        word = random.choice(VALID_WORDS)

    game_id = str(uuid.uuid4())
    games[game_id] = {"word": word, "attempts_used": 0, "is_finished":False}
    return CreateNewGame(game_id = game_id, word_length=WORD_LENGTH, max_attempts=MAX_ATTEMPTS)

@app.post("/api/game/guess", response_model=GuessResponse)
def submit_guess(request: GuessRequest):
    #TODO
    pass
    
if __name__ == "__main__":
    uvicorn.run(app, host = "127.0.0.1", port = 8000)
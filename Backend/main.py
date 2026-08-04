from typing import Literal
from fastapi import FastAPI, Query, HTTPException
from words import generate_words
import random
from pydantic import BaseModel
import datetime
import uuid
from fastapi.middleware.cors import CORSMiddleware

MAX_ATTEMPTS = 6
LetterState = Literal['correct', 'present', 'absent']
games = {}

app = FastAPI(title="Wordle API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "https://dynamicwordle.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class CreateNewGame(BaseModel):
    game_id: str
    word_length: int
    max_attempts: int

class GuessRequest(BaseModel):
    game_id: str  
    guess: str

class GuessResponse(BaseModel):
    result: list[LetterState]
    attempts_used: int
    attempts_remaining: int
    is_correct: bool
    game_over: bool

class AnswerResponse(BaseModel):
    word: str      

def set_new_target_word(VALID_WORDS: list[str]) -> str:
    seed = datetime.date.today().isoformat()
    rng = random.Random(seed)
    return rng.choice(VALID_WORDS)

def evaluate_guess(guess: str, target_word: str) -> list[LetterState]:
    result: list[LetterState] = ["absent"] * len(guess)
    answer_chars = list(target_word)

    # First pass: exact matches
    for i in range(len(guess)):
        if guess[i] == target_word[i]:
            result[i] = "correct"
            answer_chars[i] = None

    # Second pass: wrong position
    for j in range(len(guess)):
        if result[j] == "correct":
            continue
        if guess[j] in answer_chars:
            result[j] = "present"
            answer_chars[answer_chars.index(guess[j])] = None

    return result

@app.get("/api/game/new", response_model=CreateNewGame)
def create_new_game(daily: bool = True, length: int = Query(5, ge=4, le=8)):
    WORD_LENGTH = length
    VALID_WORDS = generate_words(WORD_LENGTH)
    word = set_new_target_word(VALID_WORDS) if daily else random.choice(VALID_WORDS)
    game_id = str(uuid.uuid4())
    
    # Store word_length and valid_words in the game session
    games[game_id] = {
        "word": word,
        "word_length": WORD_LENGTH,
        "valid_words": VALID_WORDS,
        "attempts_used": 0,
        "is_finished": False
    }
    
    return CreateNewGame(game_id=game_id, word_length=WORD_LENGTH, max_attempts=MAX_ATTEMPTS)

@app.post("/api/game/guess", response_model=GuessResponse)
def submit_guess(request: GuessRequest):
    if request.game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")

    game = games[request.game_id]
    if game["is_finished"]:
        raise HTTPException(status_code=400, detail="Game is already finished")
        
    WORD_LENGTH = game["word_length"]
    VALID_WORDS = game["valid_words"]

    if len(request.guess) != WORD_LENGTH:
        raise HTTPException(status_code=400, detail=f"Guess must be {WORD_LENGTH} letters long")
    if request.guess.lower() not in VALID_WORDS:
        raise HTTPException(status_code=400, detail="Guess is not a valid word")

    game["attempts_used"] += 1
    result = evaluate_guess(request.guess.lower(), game["word"])
    is_correct = request.guess.lower() == game["word"]
    game_over = is_correct or game["attempts_used"] >= MAX_ATTEMPTS
    if game_over:
        game["is_finished"] = True

    return GuessResponse(
        result=result,
        attempts_used=game["attempts_used"],
        attempts_remaining=MAX_ATTEMPTS - game["attempts_used"],
        is_correct=is_correct,
        game_over=game_over,
    )

@app.get("/api/game/answer/{game_id}", response_model=AnswerResponse)
def reveal_answer(game_id: str):
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    game = games[game_id]
    if not game["is_finished"]:
        raise HTTPException(status_code=400, detail="Game is not finished yet")
    return AnswerResponse(word=game["word"])

@app.get("/")
def health_check():
    return {"message": "Wordle Backend is Alive"}
import { useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;

const KEYBOARD_ROWS = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["ENTER","Z","X","C","V","B","N","M","⌫"],
];

// ── Tile ────────────────────────────────────────────────────────────────────
function Tile({ letter, state, revealed, delay = 0 }) {
  const stateClass = revealed && state ? `tile--${state}` : letter ? "tile--filled" : "tile--empty";
  return (
    <div
      className={`tile ${stateClass} ${revealed ? "tile--flip" : ""}`}
      style={{ animationDelay: revealed ? `${delay}ms` : "0ms" }}
    >
      <div className="tile-inner">
        <div className="tile-front">{letter}</div>
        <div className="tile-back">{letter}</div>
      </div>
    </div>
  );
}

// ── Board ────────────────────────────────────────────────────────────────────
function Board({ guesses, currentGuess, results, currentRow, shakeRow }) {
  const rows = Array.from({ length: MAX_ATTEMPTS }, (_, r) => {
    const isCurrentRow = r === currentRow;
    const isPastRow = r < currentRow;
    const letters = isPastRow
      ? guesses[r].split("")
      : isCurrentRow
      ? currentGuess.split("").concat(Array(WORD_LENGTH).fill("")).slice(0, WORD_LENGTH)
      : Array(WORD_LENGTH).fill("");

    return (
      <div key={r} className={`board-row ${shakeRow === r ? "board-row--shake" : ""}`}>
        {Array.from({ length: WORD_LENGTH }, (_, c) => (
          <Tile
            key={c}
            letter={letters[c] || ""}
            state={isPastRow ? results[r]?.[c] : null}
            revealed={isPastRow}
            delay={c * 120}
          />
        ))}
      </div>
    );
  });

  return <div className="board">{rows}</div>;
}

// ── Key ──────────────────────────────────────────────────────────────────────
function Key({ label, state, onPress }) {
  const isWide = label === "ENTER" || label === "⌫";
  return (
    <button
      className={`key ${isWide ? "key--wide" : ""} ${state ? `key--${state}` : ""}`}
      onClick={() => onPress(label)}
      aria-label={label === "⌫" ? "Backspace" : label}
    >
      {label}
    </button>
  );
}

// ── Keyboard ─────────────────────────────────────────────────────────────────
function Keyboard({ letterStates, onKey }) {
  return (
    <div className="keyboard">
      {KEYBOARD_ROWS.map((row, i) => (
        <div key={i} className="keyboard-row">
          {row.map((key) => (
            <Key key={key} label={key} state={letterStates[key]} onPress={onKey} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Definition Panel ──────────────────────────────────────────────────────────
function DefinitionPanel({ word }) {
  const [def, setDef] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!word) return;
    setLoading(true);
    setError(false);
    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("No definition found");
        const entry = data[0];
        const meaning = entry.meanings[0];
        setDef({
          phonetic: entry.phonetic || entry.phonetics?.[0]?.text || "",
          partOfSpeech: meaning.partOfSpeech,
          definition: meaning.definitions[0].definition,
          example: meaning.definitions[0].example || null,
        });
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [word]);

  return (
    <div className="def-panel">
      <div className="def-word">
        {word}
        {def?.phonetic && <span className="def-phonetic">{def.phonetic}</span>}
      </div>
      {loading && <p className="def-loading">Looking up definition…</p>}
      {error && <p className="def-error">Definition not found.</p>}
      {def && !loading && (
        <>
          <p className="def-pos">{def.partOfSpeech}</p>
          <p className="def-definition">{def.definition}</p>
          {def.example && <p className="def-example">"{def.example}"</p>}
        </>
      )}
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message }) {
  if (!message) return null;
  return <div className="toast">{message}</div>;
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [gameId, setGameId] = useState(null);
  const [guesses, setGuesses] = useState([]);      // completed guess strings
  const [results, setResults] = useState([]);      // per-row letter state arrays
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [letterStates, setLetterStates] = useState({});
  const [toast, setToast] = useState("");
  const [shakeRow, setShakeRow] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Start game ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API}/game/new`)
      .then((r) => r.json())
      .then((data) => {
        setGameId(data.game_id);
        setLoading(false);
      })
      .catch(() => showToast("Could not connect to server."));
  }, []);

  function showToast(msg, duration = 2000) {
    setToast(msg);
    setTimeout(() => setToast(""), duration);
  }

  // ── Fetch answer after game over ────────────────────────────────────────────
  const fetchAnswer = useCallback((id) => {
    fetch(`${API}/game/answer/${id}`)
      .then((r) => r.json())
      .then((data) => setAnswer(data.word));
  }, []);

  //── Play Again Button ────────────────────────────────────────────
  const resetGame = useCallback(async () => {
  setGuesses([]);
  setResults([]);
  setCurrentGuess("");
  setGameOver(false);
  setWon(false);
  setAnswer(null);
  setLetterStates({});
  setToast("");
  setLoading(true);

  const res = await fetch(`${API}/game/new?daily=false`);
  const data = await res.json();
  setGameId(data.game_id);
  setLoading(false);
}, []);

  // ── Submit guess ────────────────────────────────────────────────────────────
  const submitGuess = useCallback(async () => {
    if (currentGuess.length !== WORD_LENGTH) {
      showToast("Not enough letters");
      setShakeRow(guesses.length);
      setTimeout(() => setShakeRow(null), 600);
      return;
    }
    if (gameOver || !gameId) return;

    try {
      const res = await fetch(`${API}/game/guess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_id: gameId, guess: currentGuess.toLowerCase() }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.detail || "Invalid word");
        setShakeRow(guesses.length);
        setTimeout(() => setShakeRow(null), 600);
        return;
      }

      const newGuesses = [...guesses, currentGuess];
      const newResults = [...results, data.result];
      setGuesses(newGuesses);
      setResults(newResults);
      setCurrentGuess("");

      // Update keyboard colours — only upgrade state (correct > present > absent)
      const priority = { correct: 3, present: 2, absent: 1 };
      setLetterStates((prev) => {
        const next = { ...prev };
        currentGuess.split("").forEach((ch, i) => {
          const key = ch.toUpperCase();
          const newState = data.result[i];
          if ((priority[newState] || 0) > (priority[prev[key]] || 0)) {
            next[key] = newState;
          }
        });
        return next;
      });

      if (data.game_over) {
        setGameOver(true);
        setWon(data.is_correct);
        // Wait for flip animations to finish before fetching answer
        setTimeout(() => fetchAnswer(gameId), WORD_LENGTH * 120 + 400);
        if (data.is_correct) {
          setTimeout(() => showToast("Brilliant! 🎉", 3000), WORD_LENGTH * 120 + 500);
        } else {
          setTimeout(() => showToast("Better luck next time.", 3000), WORD_LENGTH * 120 + 500);
        }
      }
    } catch {
      showToast("Network error — is the server running?");
    }
  }, [currentGuess, guesses, results, gameId, gameOver, fetchAnswer]);

  // ── Key handler ─────────────────────────────────────────────────────────────
  const handleKey = useCallback((key) => {
    if (gameOver) return;
    if (key === "ENTER") {
      submitGuess();
    } else if (key === "⌫" || key === "BACKSPACE") {
      setCurrentGuess((g) => g.slice(0, -1));
    } else if (/^[A-Za-z]$/.test(key) && currentGuess.length < WORD_LENGTH) {
      setCurrentGuess((g) => g + key.toUpperCase());
    }
  }, [gameOver, currentGuess, submitGuess]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      handleKey(e.key.toUpperCase());
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleKey]);

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="app">
        <div className="loading">Connecting…</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1 className="header-title">WORDLE</h1>
        <p className="header-sub">Guess the {WORD_LENGTH}-letter word</p>
      </header>

      <Toast message={toast} />

      <main className="main">
        <Board
          guesses={guesses}
          currentGuess={currentGuess}
          results={results}
          currentRow={guesses.length}
          shakeRow={shakeRow}
        />

       {gameOver && answer && (
        <div className="result-section">
          <p className="result-label">{won ? "You got it!" : "The word was"}</p>
          <DefinitionPanel word={answer} />
          <button className="play-again-btn" onClick={resetGame}>
            Play Again
          </button>
        </div>
      )}
      </main>

      <Keyboard letterStates={letterStates} onKey={handleKey} />
    </div>
  );
}

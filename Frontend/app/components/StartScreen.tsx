'use client';
import React, {useState} from 'react';
import './StartScreen.css';

function StartScreen({ onStart }) {
    const [numletters, setNumLetters] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const HandleClick = () => {
        const num = parseInt(numletters);
        if (!isNaN(num) && num >= 4 && num <= 8) {
            onStart(num);
            setErrorMessage('');
        } else {
            setErrorMessage('Please enter a valid number of letters (between 4 and 8).');
            return; 
        }
    }
    return (
       <div className="start-screen">
            <h1>Welcome to Wordle!</h1>
            
            <div className="input-group">
                <input
                    type="number"
                    placeholder="Enter Word Length (4-8)"
                    value={numletters}
                    onChange={(e) => {
                        setNumLetters(e.target.value);
                        setErrorMessage(''); 
                    }}
                    className="player-input"
                    min="3"
                    max="8"
                />
                <button className="btn play" onClick={HandleClick}>Play</button>
            </div>
            {errorMessage && <p className="error-text">{errorMessage}</p>}
        </div>
    );
}

export default StartScreen;
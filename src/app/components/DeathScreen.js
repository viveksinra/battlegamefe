'use client';

import { useState, useEffect } from 'react';

export default function DeathScreen({ score, survivalTime, onRestart }) {
  const [fadeIn, setFadeIn] = useState(false);
  
  useEffect(() => {
    // Add a small delay before animation to ensure the component is mounted
    const timer = setTimeout(() => {
      setFadeIn(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Format survival time to minutes:seconds
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <div className={`death-screen ${fadeIn ? 'visible' : ''}`}>
      <div className="death-content">
        <div className="death-icon">💀</div>
        <h2 className="death-title">Game Over</h2>
        
        <div className="death-stats">
          <div className="stat-item">
            <div className="stat-label">Final Score</div>
            <div className="stat-value">{score}</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-label">Survival Time</div>
            <div className="stat-value">{formatTime(survivalTime)}</div>
          </div>
        </div>
        
        <button className="restart-button" onClick={onRestart}>
          <span className="button-icon">↺</span>
          <span className="button-text">Play Again</span>
        </button>
      </div>
    </div>
  );
} 
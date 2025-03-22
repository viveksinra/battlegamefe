'use client';

export default function ScoreDisplay({ score }) {
  return (
    <div className="score-display">
      <div className="score-icon">🏆</div>
      <div className="score-value">{score}</div>
    </div>
  );
} 
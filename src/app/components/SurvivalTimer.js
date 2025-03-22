'use client';

export default function SurvivalTimer({ seconds }) {
  // Format survival time to minutes:seconds
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <div className="survival-timer">
      <div className="timer-icon">⏱️</div>
      <div className="timer-value">{formatTime(seconds)}</div>
    </div>
  );
} 
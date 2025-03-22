'use client';

import { useState, useEffect } from 'react';

export default function QueueNotice({ position }) {
  const [dots, setDots] = useState('');
  
  // Animated loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="queue-notice">
      <div className="queue-content">
        <div className="loader"></div>
        <h2 className="queue-title">Waiting to Join{dots}</h2>
        
        <div className="queue-info">
          <div className="queue-position">
            <span className="position-number">{position}</span>
            <span className="position-label">Your Position in Queue</span>
          </div>
          
          <p className="queue-message">
            You will automatically join when a spot opens up
          </p>
        </div>
      </div>
    </div>
  );
} 
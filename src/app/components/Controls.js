'use client';

import { useState } from 'react';

export default function Controls({ onToggle, visible }) {
  return (
    <>
      <button 
        className="controls-toggle" 
        onClick={onToggle}
        aria-label="Toggle Controls"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-8h2v6h-2v-6zm0-4h2v2h-2V8z" />
        </svg>
      </button>
      
      {visible && (
        <div className="controls-panel">
          <div className="controls-header">
            <h3>Game Controls</h3>
            <button className="close-button" onClick={onToggle}>×</button>
          </div>
          
          <div className="controls-section">
            <h4>Movement</h4>
            <div className="control-item">
              <span className="key-combo">W / ↑</span>
              <span className="key-desc">Move Up</span>
            </div>
            <div className="control-item">
              <span className="key-combo">A / ←</span>
              <span className="key-desc">Move Left</span>
            </div>
            <div className="control-item">
              <span className="key-combo">S / ↓</span>
              <span className="key-desc">Move Down</span>
            </div>
            <div className="control-item">
              <span className="key-combo">D / →</span>
              <span className="key-desc">Move Right</span>
            </div>
          </div>
          
          <div className="controls-section">
            <h4>Combat</h4>
            <div className="control-item">
              <span className="key-combo">Space</span>
              <span className="key-desc">Attack</span>
            </div>
            <div className="control-item">
              <span className="key-combo">Shift</span>
              <span className="key-desc">Block</span>
            </div>
          </div>
          
          <div className="controls-section">
            <h4>Camera</h4>
            <div className="control-item">
              <span className="key-combo">C</span>
              <span className="key-desc">Toggle camera mode (Follow/Free)</span>
            </div>
            <div className="control-item">
              <span className="key-desc">Mouse Drag to rotate view in Free mode</span>
            </div>
            <div className="control-item">
              <span className="key-desc">Mouse Wheel to zoom in/out</span>
            </div>
          </div>
          
          <div className="controls-section">
            <h4>Misc</h4>
            <div className="control-item">
              <span className="key-combo">H</span>
              <span className="key-desc">Toggle this help</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

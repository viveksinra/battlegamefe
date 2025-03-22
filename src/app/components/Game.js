'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { io } from 'socket.io-client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import Player from './Player';
import ScoreDisplay from './ScoreDisplay';
import Controls from './Controls';
import DeathScreen from './DeathScreen';
import QueueNotice from './QueueNotice';
import SurvivalTimer from './SurvivalTimer';

// Constants
const VIEWPORT_WIDTH = window.innerWidth;
const VIEWPORT_HEIGHT = window.innerHeight;
const SERVER_URL = 'http://localhost:3001';
const SCALE_FACTOR = 10; // Reduced from 20 for better use of space

// 3D Environment components
const Arena = () => {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial 
          color="#2c3e50"
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>
      
      {/* Grid */}
      <gridHelper args={[200, 200, "#34495e", "#34495e"]} position={[0, -0.49, 0]} />
      
      {/* Ambient lighting */}
      <ambientLight intensity={0.4} />
      
      {/* Main directional light with shadows */}
      <directionalLight 
        position={[10, 10, 10]} 
        intensity={0.7} 
        castShadow 
        shadow-mapSize-width={2048} 
        shadow-mapSize-height={2048}
      />
      
      {/* Fill light */}
      <directionalLight position={[-10, 5, -10]} intensity={0.3} />
    </group>
  );
};

export default function Game() {
  // Game state
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState({ players: {} });
  const [playerId, setPlayerId] = useState(null);
  const [cameraPosition, setCameraPosition] = useState([0, 4, 10]);
  const [cameraTarget, setCameraTarget] = useState([0, 0, 0]);
  const [cameraMode, setCameraMode] = useState('follow'); // 'follow' or 'free'
  const [isDead, setIsDead] = useState(false);
  const [inQueue, setInQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);
  const [score, setScore] = useState(0);
  const [survivalTime, setSurvivalTime] = useState(0);
  const [deathStats, setDeathStats] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [playerCount, setPlayerCount] = useState(0);
  const [botCount, setBotCount] = useState(0);
  const [showControls, setShowControls] = useState(false);
  
  // Store player position for "Go to Player" functionality
  const [lastPlayerPosition, setLastPlayerPosition] = useState({ x: 0, y: 0, z: 0 });
  
  const keysPressed = useRef({});
  const cameraRef = useRef();
  const orbitControlsRef = useRef();
  const cameraChanging = useRef(false);
  
  // Function to go to player position
  const goToPlayerView = () => {
    if (playerId && gameState.players[playerId] && !gameState.players[playerId].isDead) {
      if (orbitControlsRef.current) {
        // Save the last position before switching to follow mode
        const playerX = gameState.players[playerId].x / SCALE_FACTOR;
        const playerZ = gameState.players[playerId].y / SCALE_FACTOR;
        
        // Set camera position to be behind player
        setCameraPosition([
          playerX - 2, // Offset to see more in front
          4, // Height
          playerZ + 8 // Behind player
        ]);
        
        // Update camera target to player position
        setCameraTarget([playerX, 0, playerZ]);
        
        // Prevent immediate camera switch back due to state changes
        cameraChanging.current = true;
        setTimeout(() => {
          setCameraMode('follow');
          cameraChanging.current = false;
        }, 50);
      }
    }
  };
  
  // Connect to server
  useEffect(() => {
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);
    
    newSocket.on('connect', () => {
      setConnectionStatus('Connected');
      console.log('Connected to server with socket ID:', newSocket.id);
    });
    
    newSocket.on('connect_error', (error) => {
      setConnectionStatus(`Connection Error: ${error.message}`);
      console.error('Connection error:', error);
    });
    
    // Socket event handlers
    newSocket.on('gameState', (state) => {
      setGameState(state);
      
      // Count players and bots
      const players = Object.values(state.players || {});
      setPlayerCount(players.filter(p => !p.isBot).length);
      setBotCount(players.filter(p => p.isBot).length);
      
      // Update survival time and score for current player
      if (playerId && state.players[playerId]) {
        const player = state.players[playerId];
        setSurvivalTime(player.survivalTime || 0);
        setScore(player.score || 0);
        
        // Store player position regardless of camera mode
        const playerX = player.x / SCALE_FACTOR;
        const playerZ = player.y / SCALE_FACTOR;
        setLastPlayerPosition({ x: playerX, y: 0, z: playerZ });
        
        // Update camera target to follow player only in follow mode
        if (!player.isDead && cameraMode === 'follow' && !cameraChanging.current) {
          setCameraTarget([playerX, 0, playerZ]);
          
          // Move camera position to follow player with offset
          setCameraPosition([
            playerX - 2, // Slight offset to see more in front
            4, // Height above player
            playerZ + 8 // Camera behind player
          ]);
        }
        
        // Check if player is dead
        if (player.isDead && !isDead) {
          setIsDead(true);
          setCameraMode('free'); // Allow free camera movement when dead
        }
      }
    });
    
    newSocket.on('playerJoined', (id) => {
      setPlayerId(id);
      setInQueue(false);
      setIsDead(false);
      setDeathStats(null);
      setCameraMode('follow'); // Reset to follow mode on join
      console.log('Joined game with player ID:', id);
    });
    
    newSocket.on('playerDied', (stats) => {
      setIsDead(true);
      setDeathStats(stats);
      setScore(stats.score);
      setSurvivalTime(stats.survivalTime);
    });
    
    newSocket.on('playerRestarted', (id) => {
      setIsDead(false);
      setDeathStats(null);
      setSurvivalTime(0);
      setScore(0);
      setCameraMode('follow'); // Reset to follow mode on restart
    });
    
    newSocket.on('queued', (position) => {
      setInQueue(true);
      setQueuePosition(position);
    });
    
    return () => {
      newSocket.disconnect();
    };
  }, []); // Empty dependency array to prevent reconnection
  
  // Update camera controls when camera mode changes
  useEffect(() => {
    if (orbitControlsRef.current) {
      if (cameraMode === 'free') {
        // Enable free camera movement
        orbitControlsRef.current.enableRotate = true;
        orbitControlsRef.current.enablePan = true;
        orbitControlsRef.current.enableDamping = true;
        orbitControlsRef.current.dampingFactor = 0.1;
        orbitControlsRef.current.rotateSpeed = 0.7;
      } else {
        // Disable rotation and panning in follow mode
        orbitControlsRef.current.enableRotate = false;
        orbitControlsRef.current.enablePan = false;
        
        // If we have a player, immediately update camera
        if (playerId && gameState.players && gameState.players[playerId]) {
          const playerX = gameState.players[playerId].x / SCALE_FACTOR;
          const playerZ = gameState.players[playerId].y / SCALE_FACTOR;
          
          setCameraTarget([playerX, 0, playerZ]);
          setCameraPosition([
            playerX - 2,
            4,
            playerZ + 8
          ]);
        }
      }
    }
  }, [cameraMode, playerId, gameState.players]);
  
  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current[e.key] = true;
      
      // Toggle controls guide
      if (e.key === 'h') {
        setShowControls(prev => !prev);
      }
      
      // Toggle camera mode with C key
      if (e.key === 'c' && !cameraChanging.current) {
        cameraChanging.current = true;
        
        // When switching to free mode, maintain current position
        if (cameraMode === 'follow' && playerId && gameState.players && gameState.players[playerId]) {
          const playerX = gameState.players[playerId].x / SCALE_FACTOR;
          const playerZ = gameState.players[playerId].y / SCALE_FACTOR;
          
          // Set target to player position first to avoid camera jump
          setCameraTarget([playerX, 0, playerZ]);
        }
        
        // Toggle mode with small delay to avoid state conflicts
        setTimeout(() => {
          setCameraMode(prev => prev === 'follow' ? 'free' : 'follow');
          cameraChanging.current = false;
        }, 50);
      }
      
      // Go to player view with G key
      if (e.key === 'g' && playerId && gameState.players[playerId] && !gameState.players[playerId].isDead) {
        goToPlayerView();
      }
    };
    
    const handleKeyUp = (e) => {
      keysPressed.current[e.key] = false;
      
      // Attack on space
      if (e.key === ' ' && socket && playerId) {
        socket.emit('playerAttack');
      }
      
      // Block on shift
      if (e.key === 'Shift' && socket && playerId) {
        socket.emit('playerBlock');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [socket, playerId, gameState, cameraMode]);
  
  // Handle player movement
  useEffect(() => {
    if (!socket || !playerId || !gameState.players[playerId] || gameState.players[playerId].isDead) return;
    
    const moveInterval = setInterval(() => {
      const player = gameState.players[playerId];
      let newX = player.x;
      let newY = player.y;
      let direction = player.direction;
      const speed = 5;
      
      if (keysPressed.current['w'] || keysPressed.current['ArrowUp']) {
        newY -= speed;
      }
      if (keysPressed.current['s'] || keysPressed.current['ArrowDown']) {
        newY += speed;
      }
      if (keysPressed.current['a'] || keysPressed.current['ArrowLeft']) {
        newX -= speed;
        direction = 'left';
      }
      if (keysPressed.current['d'] || keysPressed.current['ArrowRight']) {
        newX += speed;
        direction = 'right';
      }
      
      // Only emit if position changed
      if (newX !== player.x || newY !== player.y) {
        socket.emit('playerMove', { x: newX, y: newY, direction });
      }
      
      // Return to idle if no movement
      if (!Object.values(keysPressed.current).some(key => key)) {
        socket.emit('playerIdle');
      }
    }, 30); // ~33 updates per second
    
    return () => clearInterval(moveInterval);
  }, [socket, playerId, gameState]);
  
  // Handle restart
  const handleRestart = () => {
    if (socket) {
      socket.emit('restart');
    }
  };
  
  return (
    <div className="game-container">
      {/* Camera Mode Indicator */}
      <div className={`camera-mode ${cameraMode}`}>
        <span>{cameraMode === 'follow' ? 'Camera: Follow' : 'Camera: Free'}</span>
        <div className="camera-tip">Press C to toggle</div>
      </div>
      
      {/* Go to Player Button - Only show in free mode and when player is alive */}
      {cameraMode === 'free' && playerId && gameState.players && gameState.players[playerId] && !gameState.players[playerId].isDead && (
        <button 
          className="goto-player-btn" 
          onClick={goToPlayerView}
          aria-label="Go to Player"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
          </svg>
          <span>Go to Player</span>
        </button>
      )}
      
      {/* 3D Canvas */}
      <Canvas shadows className="game-canvas">
        <Suspense fallback={null}>
          <PerspectiveCamera 
            makeDefault 
            position={cameraPosition} 
            fov={60} 
            near={0.1} 
            far={1000}
            ref={cameraRef}
          />
          <OrbitControls 
            ref={orbitControlsRef}
            target={cameraTarget}
            enablePan={cameraMode === 'free'}
            enableRotate={cameraMode === 'free'}
            enableZoom={true}
            maxDistance={50}
            minDistance={3}
            maxPolarAngle={Math.PI / 2.1}
            dampingFactor={0.1}
            rotateSpeed={0.7}
            enabled={true}
          />
          <Arena />
          <Environment preset="city" />
          
          {/* Render Players in 3D space */}
          {Object.values(gameState.players || {}).map((player) => (
            <group 
              key={player.id} 
              position={[player.x / SCALE_FACTOR, 0, player.y / SCALE_FACTOR]}
              scale={[0.5, 0.5, 0.5]}
            >
              <Player 
                player={player} 
                isCurrentPlayer={player.id === playerId} 
              />
            </group>
          ))}
        </Suspense>
      </Canvas>
      
      {/* HUD Elements */}
      <div className="hud">
        {playerId && gameState.players[playerId] && !isDead && (
          <>
            <ScoreDisplay score={gameState.players[playerId].score} />
            <SurvivalTimer seconds={survivalTime} />
          </>
        )}
        
        <div className="player-stats">
          <span>Players: {playerCount}</span>
          <span>Bots: {botCount}</span>
        </div>
        
        <div className={`connection-status ${connectionStatus === 'Connected' ? 'connected' : 'disconnected'}`}>
          {connectionStatus}
        </div>
      </div>
      
      <Controls 
        onToggle={() => setShowControls(prev => !prev)}
        visible={showControls}
      />
      
      {isDead && deathStats && (
        <DeathScreen 
          score={deathStats.score} 
          survivalTime={deathStats.survivalTime} 
          onRestart={handleRestart} 
        />
      )}
      
      {inQueue && <QueueNotice position={queuePosition} />}
    </div>
  );
} 
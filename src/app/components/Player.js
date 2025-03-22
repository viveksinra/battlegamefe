'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

// This component is used within the Three.js canvas context
export function StickmanModel({ player, isCurrentPlayer }) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  const { isDead, color, action, direction } = player;
  
  // Animation effect
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = direction === 'left' ? Math.PI : 0;
    }
  }, [direction]);
  
  useFrame((state, delta) => {
    if (groupRef.current && !isDead) {
      // Breathing animation
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
      
      if (action === 'attack') {
        // Attack animation
        groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 10) * 0.1;
      } else if (action === 'block') {
        // Block animation
        groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 5) * 0.1;
      }
    }
  });
  
  return (
    <group 
      ref={groupRef} 
      position={[0, isDead ? -0.5 : 0, 0]}
      rotation={isDead ? [Math.PI / 2, 0, 0] : [0, 0, 0]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered && !isDead ? 1.1 : 1}
    >
      {/* Head */}
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Body */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.6, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Arms */}
      <group position={[0, 0.4, 0]}>
        {/* Left Arm */}
        <mesh position={[0.2, 0, 0]} rotation={action === 'attack' ? [0, 0, -Math.PI / 4] : action === 'block' ? [0, 0, -Math.PI / 2] : [0, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
        
        {/* Right Arm */}
        <mesh position={[-0.2, 0, 0]} rotation={action === 'attack' ? [0, 0, Math.PI / 4] : action === 'block' ? [0, 0, Math.PI / 2] : [0, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
      
      {/* Legs */}
      <group position={[0, 0, 0]}>
        {/* Left Leg */}
        <mesh position={[0.08, -0.2, 0]} rotation={[0, 0, 0.1]}>
          <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
        
        {/* Right Leg */}
        <mesh position={[-0.08, -0.2, 0]} rotation={[0, 0, -0.1]}>
          <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
      
      {/* Player Name and Health - use Html component properly */}
      <Html position={[0, 1.2, 0]} center distanceFactor={10} occlude>
        <div className="player-label">
          <div className="player-name">
            {player.isBot ? `Bot ${player.id.split('-')[1]}` : `Player ${player.id.substring(0, 4)}`}
            {isDead && " ☠️"}
          </div>
          
          {!isDead && (
            <div className="health-bar" style={{ width: '60px' }}>
              <div 
                className="health-fill"
                style={{ 
                  width: `${player.health}%`,
                  backgroundColor: player.health > 50 ? '#2ecc71' : player.health > 20 ? '#f39c12' : '#e74c3c'
                }}
              ></div>
            </div>
          )}
        </div>
      </Html>
      
      {/* Death symbol if dead - properly wrapped in Html */}
      {isDead && (
        <mesh position={[0, 0.9, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="red" />
        </mesh>
      )}
    </group>
  );
}

// Default export is a regular component outside Three.js context
export default function Player(props) {
  // This component is now just a wrapper for StickmanModel
  // which will be rendered inside the Canvas in Game.js
  return <StickmanModel {...props} />;
}
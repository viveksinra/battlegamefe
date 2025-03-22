'use client';
import dynamic from 'next/dynamic';

// Use dynamic import with SSR disabled for the Game component
// This is necessary because the Game component uses browser-only APIs
const Game = dynamic(() => import('./components/Game'), { ssr: false });

export default function Home() {
  return (
    <main>
      <Game />
    </main>
  );
}

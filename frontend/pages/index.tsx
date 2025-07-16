import React from 'react';
import { GameList } from '../src/components/GameList';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <GameList />
      </div>
    </div>
  );
}

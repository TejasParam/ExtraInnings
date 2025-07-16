import React from 'react';
import { Game } from '../types/game';
import { GameCard } from './GameCard';
import { format } from 'date-fns';

interface DateSectionProps {
  date: string;
  games: Game[];
}

export const DateSection: React.FC<DateSectionProps> = ({ date, games }) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'M/d/yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="mb-8 bg-white border border-gray-200 rounded-lg p-6">
      {/* Date Header */}
      <h2 className="text-2xl font-bold text-secondary-900 mb-4 border-b-2 border-secondary-200 pb-2">
        {formatDate(date)}
      </h2>
      
      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {games.map((game, index) => (
          <GameCard 
            key={game.id} 
            game={game} 
            gameNumber={index + 1}
          />
        ))}
      </div>
      
      {games.length === 0 && (
        <div className="text-center py-8 text-secondary-500">
          No games found for this date.
        </div>
      )}
    </div>
  );
};

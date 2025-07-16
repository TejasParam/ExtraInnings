import React from 'react';
import { Game } from '../types/game';

interface GameCardProps {
  game: Game;
  gameNumber: number;
}

export const GameCard: React.FC<GameCardProps> = ({ game, gameNumber }) => {
  const formatScore = () => {
    if (game.home_score !== null && game.away_score !== null) {
      return `${game.away_score} - ${game.home_score}`;
    }
    return 'TBD';
  };

  return (
    <div className="bg-white border border-secondary-300 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-4">
      <div className="space-y-3">
        {/* Game Title */}
        <h3 className="text-lg font-semibold text-secondary-900">
          Game {gameNumber}
        </h3>
        
        {/* Teams */}
        <div className="text-center">
          <div className="text-base font-medium text-secondary-800">
            {game.away_team} vs {game.home_team}
          </div>
          <div className="text-sm text-secondary-600 mt-1">
            Score: {formatScore()}
          </div>
        </div>
        
        {/* Excitement Score */}
        <div className="flex justify-center">
          <div className="bg-primary-50 px-3 py-1 rounded-full">
            <span className="text-sm font-medium text-primary-700">
              Excitement: {game.excitement_score.toFixed(2)}
            </span>
          </div>
        </div>
        
        {/* Game Date */}
        <div className="text-center">
          <span className="text-sm text-secondary-500">
            {new Date(game.game_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>
        
        {/* Highlight Link */}
        {game.highlight_url ? (
          <div className="text-center">
            <a
              href={game.highlight_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1 text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
            >
              Watch Highlights →
            </a>
          </div>
        ) : (
          <div className="text-center">
            <span className="text-sm text-secondary-400">
              No highlights available
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

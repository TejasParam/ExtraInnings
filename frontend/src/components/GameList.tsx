import React, { useState, useEffect } from 'react';
import { Game, SortOption, TimeFilter } from '../types/game';
import { DateFilterDropdown } from './DateFilterDropdown';
import { SortDropdown } from './SortDropdown';
import { GameCard } from './GameCard';
import { useGames } from '../hooks/useGames';

export const GameList: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [sortOption, setSortOption] = useState<SortOption>('excitement');
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});

  // Calculate date range based on filter - using actual recent dates with games
  const getDateRange = (filter: TimeFilter) => {
    switch (filter) {
      case 'day':
        // Show the most recent day with games (October 30, 2024)
        return { start: '2024-10-30', end: '2024-10-30' };
      case 'week':
        // Show the most recent week with games (October 24-30, 2024)
        return { start: '2024-10-24', end: '2024-10-30' };
      case 'month':
        // Show the most recent month with games (October 2024)
        return { start: '2024-10-01', end: '2024-10-31' };
      case 'season':
        // Show the most recent complete season (2024)
        return { start: '2024-03-01', end: '2024-11-30' };
      default:
        return dateRange;
    }
  };

  const currentDateRange = timeFilter === 'custom' ? dateRange : getDateRange(timeFilter);

  const { data, loading, error } = useGames({
    sort: sortOption,
    start: currentDateRange.start,
    end: currentDateRange.end,
    limit: 100,
  });

  const handleCustomRange = (start: string, end: string) => {
    setDateRange({ start, end });
    setTimeFilter('custom');
  };

  // Group games by date for custom filter, or treat as single period for others
  const organizeGames = (games: Game[]) => {
    if (timeFilter === 'custom') {
      // For custom ranges, group by date and show multiple date sections
      const grouped: { [key: string]: Game[] } = {};
      
      games.forEach(game => {
        const date = game.game_date;
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(game);
      });

      const sortedDates = Object.keys(grouped).sort((a, b) => {
        // For custom range, show chronological order (oldest to newest)
        return new Date(a).getTime() - new Date(b).getTime();
      });

      return sortedDates.map(date => ({
        type: 'date' as const,
        date,
        games: grouped[date].sort((a, b) => {
          if (sortOption === 'excitement') {
            return b.excitement_score - a.excitement_score;
          }
          return new Date(b.game_date).getTime() - new Date(a.game_date).getTime();
        })
      }));
    } else {
      // For day/week/month/season, treat as single period
      const sortedGames = games.sort((a, b) => {
        if (sortOption === 'excitement') {
          return b.excitement_score - a.excitement_score;
        }
        return new Date(b.game_date).getTime() - new Date(a.game_date).getTime();
      });

      // Generate period title
      let periodTitle = '';
      const range = getDateRange(timeFilter);
      
      if (timeFilter === 'day') {
        periodTitle = new Date(range.start!).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } else if (timeFilter === 'week') {
        const startDate = new Date(range.start!);
        const endDate = new Date(range.end!);
        periodTitle = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      } else if (timeFilter === 'month') {
        periodTitle = new Date(range.start!).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long'
        });
      } else if (timeFilter === 'season') {
        const year = new Date(range.start!).getFullYear();
        periodTitle = `${year} Season`;
      }

      return [{
        type: 'period' as const,
        title: periodTitle,
        games: sortedGames
      }];
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg font-medium mb-2">Error loading games</div>
        <div className="text-secondary-600">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  const organizedData = data ? organizeGames(data.games) : [];

  return (
    <div className="space-y-6 bg-white min-h-screen p-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-secondary-200">
        <h1 className="text-3xl font-bold text-secondary-900">EXTRAINNINGS</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <DateFilterDropdown
            value={timeFilter}
            onChange={setTimeFilter}
            onCustomRange={handleCustomRange}
          />
          <SortDropdown
            value={sortOption}
            onChange={setSortOption}
          />
        </div>
      </div>

      {/* Games List */}
      <div className="space-y-8">
        {organizedData.length > 0 ? (
          organizedData.map((section, index) => (
            <div key={section.type === 'date' ? section.date : section.title} className="mb-8 bg-white border border-gray-200 rounded-lg p-6">
              {/* Section Header */}
              <h2 className="text-2xl font-bold text-secondary-900 mb-4 border-b-2 border-secondary-200 pb-2">
                {section.type === 'date' ? 
                  new Date(section.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 
                  section.title
                }
              </h2>
              
              {/* Games Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {section.games.map((game, gameIndex) => (
                  <GameCard 
                    key={game.id} 
                    game={game} 
                    gameNumber={gameIndex + 1}
                  />
                ))}
              </div>
              
              {section.games.length === 0 && (
                <div className="text-center py-8 text-secondary-500">
                  No games found for this period.
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="text-secondary-500 text-lg">
              No games found for the selected period.
            </div>
            <div className="text-secondary-400 text-sm mt-2">
              Try selecting a different time range or check back later.
            </div>
          </div>
        )}
      </div>

      {/* Results summary */}
      {data && (
        <div className="text-center text-sm text-secondary-500 py-4 border-t border-secondary-200">
          Showing {data.games.length} of {data.total} games
        </div>
      )}
    </div>
  );
};

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
  const [periodOffset, setPeriodOffset] = useState(0); // 0 = current/most recent, higher = older periods

  // Get the maximum offset for the current filter type
  const getMaxOffset = (filter: TimeFilter) => {
    switch (filter) {
      case 'day': return 34; // 35 days total (0-34)
      case 'week': return 7; // 8 weeks total (0-7)  
      case 'month': return 7; // 8 months total (0-7)
      case 'season': return 2; // 3 seasons total (0-2)
      default: return 0;
    }
  };

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (timeFilter === 'custom') return; // Don't navigate for custom ranges
      
      const maxOffset = getMaxOffset(timeFilter);
      
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setPeriodOffset(prev => Math.min(maxOffset, prev + 1)); // Go to older period, don't exceed max
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setPeriodOffset(prev => Math.max(0, prev - 1)); // Go to newer period, don't go negative
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [timeFilter]);

  // Reset offset when filter changes
  useEffect(() => {
    setPeriodOffset(0);
  }, [timeFilter]);

  // Calculate date range based on filter and offset
  const getDateRange = (filter: TimeFilter, offset: number = 0) => {
    switch (filter) {
      case 'day':
        const recentDates = [
          '2024-10-30', '2024-10-29', '2024-10-28', '2024-10-27', '2024-10-26',
          '2024-10-25', '2024-10-24', '2024-10-23', '2024-10-22', '2024-10-21',
          '2024-10-20', '2024-10-19', '2024-10-18', '2024-10-17', '2024-10-16',
          '2024-10-15', '2024-10-14', '2024-10-13', '2024-10-12', '2024-10-11',
          '2024-10-10', '2024-10-09', '2024-10-08', '2024-10-07', '2024-10-06',
          '2024-10-05', '2024-10-04', '2024-10-03', '2024-10-02', '2024-10-01',
          '2024-09-30', '2024-09-29', '2024-09-28', '2024-09-27', '2024-09-26'
        ];
        const dayIndex = Math.max(0, Math.min(offset, recentDates.length - 1));
        const dateStr = recentDates[dayIndex];
        return { start: dateStr, end: dateStr };
        
      case 'week':
        const weeks = [
          { start: '2024-10-25', end: '2024-10-31' }, // Week 0 (most recent)
          { start: '2024-10-18', end: '2024-10-24' }, // Week 1
          { start: '2024-10-11', end: '2024-10-17' }, // Week 2
          { start: '2024-10-04', end: '2024-10-10' }, // Week 3
          { start: '2024-09-27', end: '2024-10-03' }, // Week 4
          { start: '2024-09-20', end: '2024-09-26' }, // Week 5
          { start: '2024-09-13', end: '2024-09-19' }, // Week 6
          { start: '2024-09-06', end: '2024-09-12' }  // Week 7
        ];
        const weekIndex = Math.max(0, Math.min(offset, weeks.length - 1));
        return weeks[weekIndex];
        
      case 'month':
        const months = [
          { start: '2024-10-01', end: '2024-10-31' }, // Month 0 (October 2024 - most recent)
          { start: '2024-09-01', end: '2024-09-30' }, // Month 1 (September 2024)
          { start: '2024-08-01', end: '2024-08-31' }, // Month 2 (August 2024)
          { start: '2024-07-01', end: '2024-07-31' }, // Month 3 (July 2024)
          { start: '2024-06-01', end: '2024-06-30' }, // Month 4 (June 2024)
          { start: '2024-05-01', end: '2024-05-31' }, // Month 5 (May 2024)
          { start: '2024-04-01', end: '2024-04-30' }, // Month 6 (April 2024)
          { start: '2024-03-01', end: '2024-03-31' }  // Month 7 (March 2024)
        ];
        const monthIndex = Math.max(0, Math.min(offset, months.length - 1));
        return months[monthIndex];
        
      case 'season':
        const seasons = [
          { start: '2024-03-01', end: '2024-11-30' }, // Season 0 (2024 - most recent)
          { start: '2023-03-01', end: '2023-11-30' }, // Season 1 (2023)
          { start: '2022-03-01', end: '2022-11-30' }  // Season 2 (2022)
        ];
        const seasonIndex = Math.max(0, Math.min(offset, seasons.length - 1));
        return seasons[seasonIndex];
        
      default:
        return dateRange;
    }
  };

  const currentDateRange = timeFilter === 'custom' ? dateRange : getDateRange(timeFilter, periodOffset);

  const { data, loading, error } = useGames({
    sort: sortOption,
    start: currentDateRange.start,
    end: currentDateRange.end,
    limit: 500,
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
      const range = getDateRange(timeFilter, periodOffset);
      
      if (timeFilter === 'day') {
        const [year, month, day] = range.start!.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        periodTitle = date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } else if (timeFilter === 'week') {
        const [startYear, startMonth, startDay] = range.start!.split('-').map(Number);
        const [endYear, endMonth, endDay] = range.end!.split('-').map(Number);
        const startDate = new Date(startYear, startMonth - 1, startDay);
        const endDate = new Date(endYear, endMonth - 1, endDay);
        periodTitle = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      } else if (timeFilter === 'month') {
        // Use a more explicit date construction to avoid timezone issues
        const [year, month] = range.start!.split('-').map(Number);
        const date = new Date(year, month - 1, 1); // month is 0-indexed in JS Date
        periodTitle = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long'
        });
      } else if (timeFilter === 'season') {
        const [year] = range.start!.split('-').map(Number);
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

      {/* Navigation Controls - Only show for non-custom filters */}
      {timeFilter !== 'custom' && (
        <div className="flex items-center justify-center gap-4 py-4">
          <button
            onClick={() => setPeriodOffset(prev => Math.min(getMaxOffset(timeFilter), prev + 1))}
            className="flex items-center gap-2 px-4 py-2 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Older
          </button>
          
          <div className="text-center">
            <div className="text-sm text-secondary-500">
              Use ← → arrow keys to navigate
            </div>
            {periodOffset !== 0 && (
              <button
                onClick={() => setPeriodOffset(0)}
                className="text-xs text-primary-600 hover:text-primary-700 underline mt-1"
              >
                Back to current
              </button>
            )}
          </div>
          
          <button
            onClick={() => setPeriodOffset(prev => Math.max(0, prev - 1))}
            className="flex items-center gap-2 px-4 py-2 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 rounded-lg transition-colors"
          >
            Newer
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Games List */}
      <div className="space-y-8">
        {organizedData.length > 0 ? (
          organizedData.map((section, index) => (
            <div key={section.type === 'date' ? section.date : section.title} className="mb-8 bg-white border border-gray-200 rounded-lg p-6">
              {/* Section Header */}
              <h2 className="text-2xl font-bold text-secondary-900 mb-4 border-b-2 border-secondary-200 pb-2">
                {section.type === 'date' ? 
                  (() => {
                    const [year, month, day] = section.date.split('-').map(Number);
                    const date = new Date(year, month - 1, day);
                    return date.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    });
                  })() : 
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

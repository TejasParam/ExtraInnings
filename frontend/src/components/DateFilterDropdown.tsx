import React, { useState } from 'react';
import { TimeFilter } from '../types/game';

interface DateFilterDropdownProps {
  value: TimeFilter;
  onChange: (filter: TimeFilter) => void;
  onCustomRange?: (start: string, end: string) => void;
}

export const DateFilterDropdown: React.FC<DateFilterDropdownProps> = ({ 
  value, 
  onChange, 
  onCustomRange 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const filters = [
    { value: 'day' as TimeFilter, label: 'Day' },
    { value: 'week' as TimeFilter, label: 'Week' },
    { value: 'month' as TimeFilter, label: 'Month' },
    { value: 'season' as TimeFilter, label: 'Season' },
    { value: 'custom' as TimeFilter, label: 'Custom Range' },
  ];

  const handleFilterChange = (filter: TimeFilter) => {
    if (filter === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      onChange(filter);
      setIsOpen(false);
    }
  };

  const handleCustomSubmit = () => {
    if (customStart && customEnd && onCustomRange) {
      onCustomRange(customStart, customEnd);
      setShowCustom(false);
      setIsOpen(false);
    }
  };

  const getDisplayLabel = () => {
    const filter = filters.find(f => f.value === value);
    return filter ? filter.label : 'Select Period';
  };

  return (
    <div className="dropdown">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-between w-40 px-4 py-2 text-sm font-medium text-secondary-700 bg-white border border-secondary-300 rounded-md hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <span>{getDisplayLabel()}</span>
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <div className="py-1">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => handleFilterChange(filter.value)}
                className={`block w-full px-4 py-2 text-left text-sm hover:bg-secondary-100 ${
                  value === filter.value ? 'bg-primary-50 text-primary-700' : 'text-secondary-700'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          
          {showCustom && (
            <div className="p-4 border-t border-secondary-200">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-secondary-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full px-3 py-1 text-sm text-secondary-900 bg-white border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full px-3 py-1 text-sm text-secondary-900 bg-white border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <button
                  onClick={handleCustomSubmit}
                  disabled={!customStart || !customEnd}
                  className="w-full btn-primary text-xs py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply Range
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

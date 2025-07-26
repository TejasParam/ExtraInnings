import React, { useState, useEffect, useRef } from 'react';

interface TeamFilterDropdownProps {
  value: string[];
  onChange: (teams: string[]) => void;
}

export const TeamFilterDropdown: React.FC<TeamFilterDropdownProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [teams, setTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch available teams from the API
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${API_BASE_URL}/teams`);
        const data = await response.json();
        setTeams(data.teams || []);
      } catch (error) {
        console.error('Failed to fetch teams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const handleTeamToggle = (team: string) => {
    const newTeams = value.includes(team)
      ? value.filter(t => t !== team)
      : [...value, team];
    onChange(newTeams);
  };

  const clearAllTeams = () => {
    onChange([]);
  };

  const getDisplayLabel = () => {
    if (value.length === 0) return 'All Teams';
    if (value.length === 1) return value[0];
    return `${value.length} teams selected`;
  };

  if (loading) {
    return (
      <div className="w-44 px-4 py-2 text-sm text-secondary-500 bg-secondary-50 border border-secondary-300 rounded-md">
        Loading teams...
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-between w-44 px-4 py-2 text-sm font-medium text-secondary-700 bg-white border border-secondary-300 rounded-md hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <span>{getDisplayLabel()}</span>
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-64 mt-1 bg-white border border-secondary-300 rounded-md shadow-lg max-h-64 overflow-y-auto">
          <div className="p-2 border-b border-secondary-200">
            <button
              onClick={clearAllTeams}
              className="w-full px-3 py-1 text-sm text-secondary-600 hover:text-secondary-800 hover:bg-secondary-50 rounded"
            >
              Clear All
            </button>
          </div>
          <div className="py-1">
            {teams.map((team) => (
              <label
                key={team}
                className="flex items-center px-3 py-2 hover:bg-secondary-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={value.includes(team)}
                  onChange={() => handleTeamToggle(team)}
                  className="mr-3 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-secondary-700">{team}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { SortOption } from '../types/game';

interface SortDropdownProps {
  value: SortOption;
  onChange: (sort: SortOption) => void;
}

export const SortDropdown: React.FC<SortDropdownProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { value: 'excitement' as SortOption, label: 'Most Exciting' },
    { value: 'excitement_asc' as SortOption, label: 'Least Exciting' },
    { value: 'date' as SortOption, label: 'Date' },
  ];

  const handleChange = (sort: SortOption) => {
    onChange(sort);
    setIsOpen(false);
  };

  const getDisplayLabel = () => {
    const option = options.find(opt => opt.value === value);
    return option ? `Sort by: ${option.label}` : 'Sort by';
  };

  return (
    <div className="dropdown">
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
        <div className="dropdown-menu">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleChange(option.value)}
                className={`block w-full px-4 py-2 text-left text-sm hover:bg-secondary-100 ${
                  value === option.value ? 'bg-primary-50 text-primary-700' : 'text-secondary-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// frontend/src/components/HeaderCell.js
import React, { useState, useRef, useEffect } from 'react';
import { getColumnLetter } from '../utils/spreadsheetUtils';

const HeaderCell = ({ columnIndex, onSort, sortState }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const label = getColumnLetter(columnIndex);

  const isSorted = sortState.column === label;
  const sortIcon = isSorted ? (
    sortState.direction === 'asc' ? '▲' : '▼'
  ) : ' ';

  // Close the dropdown if a click occurs outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSortClick = (direction) => {
    onSort(label, direction);
    setIsDropdownOpen(false);
  };

  return (
    <div
      className="relative flex items-center justify-center p-2 font-bold bg-gray-200 border-r border-b border-gray-300 text-gray-700 select-none"
      style={{ gridColumn: columnIndex + 2, gridRow: 1 }}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        {isSorted && (
          <span className="text-sm text-gray-500">{sortIcon}</span>
        )}
      </div>
      <div className="relative ml-auto" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`ml-1 text-gray-500 focus:outline-none transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        {isDropdownOpen && (
          <div className="absolute top-full right-0 mt-1 w-40 bg-white border border-gray-300 rounded-md shadow-lg z-20">
            <button
              onClick={() => handleSortClick('asc')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-md"
            >
              Sort Ascending
            </button>
            <button
              onClick={() => handleSortClick('desc')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-md"
            >
              Sort Descending
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeaderCell;

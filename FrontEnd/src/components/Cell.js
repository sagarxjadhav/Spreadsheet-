import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { SpreadsheetContext } from '../context/SpreadsheetContext';

/**
 * Represents an individual cell in the spreadsheet grid.
 * Handles its own editing state and displays content.
 */
const Cell = React.memo(({ row, col, cellId, rowIndex, colIndex }) => {
  // Access global state and functions from SpreadsheetContext
  const { cells, selectedCell, updateCellValue, updateActiveCell, userId, connectedUsers } = useContext(SpreadsheetContext);

  // Get cell data from the global state, or default to empty
  const cellData = cells.get(cellId) || { value: '', displayValue: '' };

  // Ref for the input element when editing
  const inputRef = useRef(null);

  // Local state for editing mode and the value being edited
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(cellData.value);

  // Determine if this cell is currently selected by the local user
  const isSelected = selectedCell === cellId;

  // Determine if another user is currently active on this cell
  const isOtherUserEditing = Array.from(connectedUsers.entries()).some(
    ([id, user]) => id !== userId && user.activeCell === cellId
  );
  // Get the names of other users currently editing this cell
  const otherUserEditingName = Array.from(connectedUsers.entries())
    .filter(([id, user]) => id !== userId && user.activeCell === cellId)
    .map(([, user]) => user.name)
    .join(', ');

  // Effect to synchronize local value with global state when not editing
  useEffect(() => {
    if (!isEditing) {
      setLocalValue(cellData.value);
    }
  }, [cellData.value, isEditing]);

  // Effect to focus and select text in the input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  /**
   * Handles a single click on the cell to select it.
   */
  const handleCellClick = useCallback(() => {
    updateActiveCell(cellId);
  }, [cellId, updateActiveCell]);

  /**
   * Handles a double click on the cell to enter edit mode.
   */
  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    updateActiveCell(cellId); // Also select the cell on double click
    // Focus the input after a short delay to ensure it's rendered
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 0);
  }, [cellId, updateActiveCell]);

  /**
   * Handles keyboard events when the cell is selected but not editing.
   */
  const handleCellKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsEditing(true);
      updateActiveCell(cellId);
    }
    // Remove arrow key handling from individual cells - let the global handler manage it
  }, [cellId, updateActiveCell]);

  /**
   * Updates the local value as the user types in the input.
   */
  const handleInputChange = useCallback((e) => {
    setLocalValue(e.target.value);
  }, []);

  /**
   * Handles blur event (when input loses focus) to exit edit mode and save value.
   */
  const handleInputBlur = useCallback(() => {
    setIsEditing(false);
    updateCellValue(cellId, localValue); // Update global state and broadcast
  }, [cellId, localValue, updateCellValue]);

  /**
   * Handles keydown events in the input, specifically for 'Enter' to save and arrow key navigation.
   */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent new line in input field
      setIsEditing(false);
      updateCellValue(cellId, localValue); // Update global state and broadcast
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      // If we're editing, save the value first and exit edit mode
      setIsEditing(false);
      updateCellValue(cellId, localValue);
      // Let the global handler manage navigation
    }
    // For all other keys, allow normal typing behavior
  }, [cellId, localValue, updateCellValue]);

  // Dynamic CSS classes for cell styling based on state
  const cellClasses = `
    relative h-8 w-24 border border-gray-300 flex items-center justify-center
    ${isSelected ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-500' : 'bg-white hover:bg-gray-50'}
    ${isOtherUserEditing ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500' : ''}
    ${cellData.error ? 'bg-red-100 border-red-500 text-red-700' : ''}
    rounded-sm overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-400
  `;

  return (
    <div
      id={cellId} // Unique ID for direct DOM access (e.g., for keyboard navigation)
      className={cellClasses}
      onClick={handleCellClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleCellKeyDown}
      tabIndex={isSelected ? 0 : -1} // Make selected cell focusable
    >
      {isEditing ? (
        // Render input field when in editing mode
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          className="w-full h-full p-1 text-sm bg-transparent focus:outline-none"
          autoFocus
        />
      ) : (
        // Render span with display value when not editing
        <span className="text-sm truncate px-1">
          {cellData.displayValue || cellData.value}
        </span>
      )}
      {/* Indicator for other users editing this cell */}
      {isOtherUserEditing && (
        <div className="absolute -top-5 left-0 bg-purple-500 text-white text-xs px-1 rounded-t-md">
          {otherUserEditingName}
        </div>
      )}
    </div>
  );
});

export default Cell;

import React, { useCallback, useEffect, useContext } from 'react';
import { SpreadsheetContext } from '../context/SpreadsheetContext';
import Cell from './Cell';
import { parseCellId, getColumnIndex, getColumnLetter } from '../utils/spreadsheetUtils';

/**
 * Renders the main spreadsheet grid, including headers and cells.
 * Manages global keyboard navigation for the grid.
 */
const SpreadsheetGrid = () => {
  // Access global state and functions from SpreadsheetContext
  const { selectedCell, updateActiveCell, updateCellValue, cells } = useContext(SpreadsheetContext);
  const numRows = 100;
  const numCols = 26; // A-Z

  /**
   * Handles global keyboard navigation for the spreadsheet.
   * Moves selected cell, triggers editing, and handles copy/paste.
   */
  const handleKeyDown = useCallback((e) => {
    if (!selectedCell) return; // Do nothing if no cell is selected

    let { col, row } = parseCellId(selectedCell);
    let colIndex = getColumnIndex(col);

    let newColIndex = colIndex;
    let newRow = row;

    // Check if an input field is currently active (meaning a cell is being edited)
    const isEditing = document.activeElement && document.activeElement.tagName === 'INPUT';

    // Handle arrow key navigation
    if (e.key === 'ArrowUp') {
      e.preventDefault(); // Prevent default browser scrolling
      newRow = Math.max(1, row - 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      newRow = Math.min(numRows, row + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      newColIndex = Math.max(0, colIndex - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      newColIndex = Math.min(numCols - 1, colIndex + 1);
    } else if (e.key === 'Tab') {
      e.preventDefault(); // Prevent default browser tab behavior
      if (e.shiftKey) { // Shift + Tab: move left
        if (colIndex > 0) {
          newColIndex = colIndex - 1;
        } else if (row > 1) { // Wrap to end of previous row
          newColIndex = numCols - 1;
          newRow = row - 1;
        }
      } else { // Tab: move right
        if (colIndex < numCols - 1) {
          newColIndex = colIndex + 1;
        } else if (row < numRows) { // Wrap to beginning of next row
          newColIndex = 0;
          newRow = row + 1;
        }
      }
    } else if (e.key === 'Enter' && !isEditing) {
      e.preventDefault();
      // If Enter is pressed and not already editing, activate edit mode for the selected cell
      document.querySelector(`#${selectedCell} input`)?.focus();
      document.querySelector(`#${selectedCell} input`)?.select();
      return; // Don't move selection after entering edit mode
    } else if (e.ctrlKey && e.key === 'c') { // Ctrl+C for copy
      const cellData = cells.get(selectedCell);
      if (cellData && cellData.value) {
        // Use modern Clipboard API for copying text
        navigator.clipboard.writeText(cellData.value)
          .then(() => console.log('Cell content copied to clipboard'))
          .catch(err => console.error('Failed to copy text: ', err));
      }
    } else if (e.ctrlKey && e.key === 'v') { // Ctrl+V for paste
      // Use modern Clipboard API for pasting text
      navigator.clipboard.readText()
        .then(text => {
          if (selectedCell) {
            updateCellValue(selectedCell, text); // Update the selected cell with pasted text
            console.log('Pasted:', text, 'to', selectedCell);
          }
        })
        .catch(err => console.error('Failed to read clipboard: ', err));
    }

    // If the new coordinates are different, update the active cell
    if (newColIndex !== colIndex || newRow !== row) {
      updateActiveCell(`${getColumnLetter(newColIndex)}${newRow}`);
    }
  }, [selectedCell, updateActiveCell, updateCellValue, cells]);

  // Attach and detach the global keydown event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);


  // Generate column headers (A, B, C...)
  const columnHeaders = Array.from({ length: numCols }, (_, i) => getColumnLetter(i));
  // Generate row numbers (1, 2, 3...)
  const rowNumbers = Array.from({ length: numRows }, (_, i) => i + 1);

  return (
    <div className="flex flex-col items-center p-4 min-w-full">
      <div className="overflow-auto max-h-[calc(100vh-100px)] max-w-full">
        <div className="grid border border-gray-400 rounded-md shadow-md bg-gray-100"
          style={{
            // Define grid columns: fixed width for row headers, then flexible for cells
            gridTemplateColumns: `40px repeat(${numCols}, minmax(96px, 1fr))`,
            // Define grid rows: fixed height for column headers, then flexible for cells
            gridTemplateRows: `32px repeat(${numRows}, minmax(32px, 1fr))`
          }}
        >
          {/* Top-left corner (empty) */}
          <div className="sticky top-0 left-0 z-20 bg-gray-200 border-b border-r border-gray-300 rounded-tl-md"></div>

          {/* Column Headers */}
          {columnHeaders.map((header, index) => (
            <div
              key={`col-header-${index}`}
              className="sticky top-0 z-10 h-8 bg-gray-200 border-b border-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700 rounded-t-sm"
            >
              {header}
            </div>
          ))}

          {/* Render each row */}
          {rowNumbers.map((rowNum) => (
            <React.Fragment key={`row-${rowNum}`}>
              {/* Row Number Header */}
              <div
                className="sticky left-0 z-10 w-10 bg-gray-200 border-r border-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700 rounded-l-sm"
              >
                {rowNum}
              </div>
              {/* Render cells for the current row */}
              {columnHeaders.map((colLetter) => {
                const cellId = `${colLetter}${rowNum}`;
                return (
                  <Cell key={cellId} row={rowNum} col={colLetter} cellId={cellId} />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpreadsheetGrid;

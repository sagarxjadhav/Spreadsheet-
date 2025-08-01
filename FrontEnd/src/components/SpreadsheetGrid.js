// frontend/src/components/SpreadsheetGrid.js
import React, { useContext, useCallback, useEffect } from 'react';
import Cell from './Cell';
import HeaderCell from './HeaderCell';
import { SpreadsheetContext } from '../context/SpreadsheetContext';
import { getColumnLetter, getColumnIndex } from '../utils/spreadsheetUtils';

const SpreadsheetGrid = () => {
    const { updateActiveCell, updateCellValue, sortState, handleSort, sortedRows, selectedCell } = useContext(SpreadsheetContext);
    const rows = 100;
    const cols = 26;
    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: `50px repeat(${cols}, minmax(120px, 1fr))`,
        gridTemplateRows: `30px repeat(${rows}, 30px)`,
        minWidth: `${50 + cols * 120}px`,
        minHeight: `${30 + rows * 30}px`,
    };

    const columnHeaders = Array.from({ length: cols }, (_, i) => i);
    const rowHeaders = sortedRows || Array.from({ length: rows }, (_, i) => i + 1);

    // Global keyboard navigation handler
    const handleGlobalKeyDown = useCallback((e) => {
        if (!selectedCell) return;

        // Check if an input field is currently active (meaning a cell is being edited)
        const isEditing = document.activeElement && document.activeElement.tagName === 'INPUT';

        // Parse the current selected cell
        const match = selectedCell.match(/^([A-Z]+)(\d+)$/);
        if (!match) return;

        const [, colLetter, rowNumberStr] = match;
        const rowNumber = parseInt(rowNumberStr, 10);
        const colIndex = getColumnIndex(colLetter);

        let newColIndex = colIndex;
        let newRow = rowNumber;

        // Handle arrow key navigation
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (rowNumber > 1) {
                newRow = rowNumber - 1;
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (rowNumber < rows) {
                newRow = rowNumber + 1;
            }
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (colIndex > 0) {
                newColIndex = colIndex - 1;
            }
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            if (colIndex < cols - 1) {
                newColIndex = colIndex + 1;
            }
        } else if (e.key === 'Enter' && !isEditing) {
            e.preventDefault();
            // If Enter is pressed and not already editing, activate edit mode for the selected cell
            const cellElement = document.querySelector(`#${selectedCell} input`);
            if (cellElement) {
                cellElement.focus();
                cellElement.select();
            }
            return; // Don't move selection after entering edit mode
        } else if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) { // Shift + Tab: move left
                if (colIndex > 0) {
                    newColIndex = colIndex - 1;
                } else if (rowNumber > 1) { // Wrap to end of previous row
                    newColIndex = cols - 1;
                    newRow = rowNumber - 1;
                }
            } else { // Tab: move right
                if (colIndex < cols - 1) {
                    newColIndex = colIndex + 1;
                } else if (rowNumber < rows) { // Wrap to beginning of next row
                    newColIndex = 0;
                    newRow = rowNumber + 1;
                }
            }
        }

        // If the new coordinates are different, update the active cell
        if (newColIndex !== colIndex || newRow !== rowNumber) {
            const newCellId = `${getColumnLetter(newColIndex)}${newRow}`;
            updateActiveCell(newCellId);
        }
    }, [selectedCell, updateActiveCell, rows, cols]);

    // Attach and detach the global keydown event listener
    useEffect(() => {
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => {
            window.removeEventListener('keydown', handleGlobalKeyDown);
        };
    }, [handleGlobalKeyDown]);

    const handleCellKeyDown = (e, cellId) => {
        const [colLetter, rowNumberStr] = cellId.match(/^([A-Z]+)(\d+)$/).slice(1);
        const rowNumber = parseInt(rowNumberStr, 10);
        const colIndex = getColumnIndex(colLetter);

        if (e.key === 'ArrowUp' && rowNumber > 1) {
            e.preventDefault();
            const newCellId = `${colLetter}${rowNumber - 1}`;
            updateActiveCell(newCellId);
        } else if (e.key === 'ArrowDown' && rowNumber < rows) {
            e.preventDefault();
            const newCellId = `${colLetter}${rowNumber + 1}`;
            updateActiveCell(newCellId);
        } else if (e.key === 'ArrowLeft' && colIndex > 0) {
            e.preventDefault();
            const newColLetter = getColumnLetter(colIndex - 1);
            const newCellId = `${newColLetter}${rowNumber}`;
            updateActiveCell(newCellId);
        } else if (e.key === 'ArrowRight' && colIndex < cols - 1) {
            e.preventDefault();
            const newColLetter = getColumnLetter(colIndex + 1);
            const newCellId = `${newColLetter}${rowNumber}`;
            updateActiveCell(newCellId);
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            updateCellValue(cellId, '');
        }
    };

    return (
        <div className="bg-white shadow-xl rounded-lg border border-gray-300" style={gridStyle}>
            {/* Top-left corner */}
            <div className="w-full h-full bg-gray-200 border-r border-b border-gray-300"></div>

            {/* Column Headers */}
            {columnHeaders.map(colIndex => (
                <HeaderCell
                    key={`col-header-${colIndex}`}
                    columnIndex={colIndex}
                    onSort={handleSort}
                    sortState={sortState}
                />
            ))}

            {/* Row Headers and Cells */}
            {rowHeaders.map((rowNumber) => (
                <React.Fragment key={`row-${rowNumber}`}>
                    <div
                        className="p-2 font-bold bg-gray-200 border-r border-b border-gray-300 text-gray-700 flex items-center justify-center select-none"
                        style={{ gridColumn: 1, gridRow: rowNumber + 1 }}
                    >
                        {rowNumber}
                    </div>
                    {columnHeaders.map(colIndex => {
                        const cellId = `${getColumnLetter(colIndex)}${rowNumber}`;
                        return (
                            <Cell
                                key={cellId}
                                cellId={cellId}
                                rowIndex={rowNumber - 1}
                                colIndex={colIndex}
                                onKeyDown={(e) => handleCellKeyDown(e, cellId)}
                            />
                        );
                    })}
                </React.Fragment>
            ))}
        </div>
    );
};

export default SpreadsheetGrid;

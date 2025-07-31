// // frontend/src/utils/spreadsheetUtils.js

// /**
//  * Converts a 0-based column index to its corresponding spreadsheet letter (e.g., 0 -> A, 25 -> Z, 26 -> AA).
//  * @param {number} colIndex - The 0-based column index.
//  * @returns {string} The column letter.
//  */
// export const getColumnLetter = (colIndex) => {
//   let letter = '';
//   let temp = colIndex;
//   while (temp >= 0) {
//     letter = String.fromCharCode(65 + (temp % 26)) + letter;
//     temp = Math.floor(temp / 26) - 1;
//   }
//   return letter;
// };

// /**
//  * Converts a spreadsheet column letter to its 0-based index (e.g., A -> 0, Z -> 25, AA -> 26).
//  * @param {string} columnLetter - The column letter (e.g., 'A', 'AZ').
//  * @returns {number} The 0-based column index.
//  */
// export const getColumnIndex = (columnLetter) => {
//   let index = 0;
//   for (let i = 0; i < columnLetter.length; i++) {
//     index = index * 26 + (columnLetter.charCodeAt(i) - 65 + 1);
//   }
//   return index - 1; // Adjust for 0-based index
// };

// /**
//  * Parses a cell ID string (e.g., 'A1') into an object containing column letter and row number.
//  * @param {string} cellId - The cell ID string.
//  * @returns {{col: string, row: number}|null} An object with 'col' and 'row', or null if invalid.
//  */
// export const parseCellId = (cellId) => {
//   const match = cellId.match(/^([A-Z]+)(\d+)$/);
//   if (!match) return null;
//   return { col: match[1], row: parseInt(match[2], 10) };
// };

// /**
//  * Converts a spreadsheet range string (e.g., 'A1:B2') into an array of individual cell IDs.
//  * @param {string} range - The range string.
//  * @returns {string[]} An array of cell IDs within the range.
//  */
// export const getCellsInRange = (range) => {
//   const parts = range.split(':');
//   if (parts.length !== 2) return [];

//   const start = parseCellId(parts[0]);
//   const end = parseCellId(parts[1]);

//   if (!start || !end) return [];

//   const startColIndex = getColumnIndex(start.col);
//   const endColIndex = getColumnIndex(end.col);
//   const startRow = start.row;
//   const endRow = end.row;

//   const cells = [];
//   // Iterate through rows and columns within the defined range
//   for (let r = Math.min(startRow, endRow); r <= Math.max(startRow, endRow); r++) {
//     for (let c = Math.min(startColIndex, endColIndex); c <= Math.max(startColIndex, endColIndex); c++) {
//       cells.push(`${getColumnLetter(c)}${r}`);
//     }
//   }
//   return cells;
// };

// /**
//  * Evaluates a spreadsheet formula (e.g., '=SUM(A1:A10)').
//  * Currently supports SUM, AVERAGE, and COUNT for cell ranges.
//  * @param {string} formula - The formula string (must start with '=').
//  * @param {Map<string, object>} cellsData - A Map containing all cell data for evaluation.
//  * @returns {{value: any, isFormula: boolean, result?: number, error?: boolean}} The evaluated result.
//  */
// export const evaluateFormula = (formula, cellsData) => {
//   // If it doesn't start with '=', it's not a formula, return as is.
//   if (!formula.startsWith('=')) return { value: formula, isFormula: false };

//   const expression = formula.substring(1).trim(); // Remove '=' and trim whitespace
//   const upperCaseExpression = expression.toUpperCase(); // Convert to uppercase for case-insensitive matching

//   try {
//     // Regex to match SUM, AVERAGE, COUNT formulas with a range (e.g., SUM(A1:A10))
//     const sumMatch = upperCaseExpression.match(/^SUM\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)$/);
//     const averageMatch = upperCaseExpression.match(/^AVERAGE\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)$/);
//     const countMatch = upperCaseExpression.match(/^COUNT\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)$/);

//     let cellsToEvaluate = [];
//     if (sumMatch || averageMatch || countMatch) {
//       const match = sumMatch || averageMatch || countMatch;
//       const range = `${match[1]}${match[2]}:${match[3]}${match[4]}`; // Reconstruct the range string
//       cellsToEvaluate = getCellsInRange(range); // Get all cell IDs within the range
//     } else {
//       // If no supported formula matches, it's an invalid formula
//       return { value: '#ERROR! Invalid Formula', isFormula: true, error: true };
//     }

//     // Extract numeric values from the cells in the range
//     const values = cellsToEvaluate.map(cellId => {
//       const cell = cellsData.get(cellId);
//       // Use displayValue if available (for nested formulas), otherwise raw value
//       const val = cell ? (cell.displayValue !== undefined ? cell.displayValue : cell.value) : '';
//       return parseFloat(val);
//     }).filter(val => !isNaN(val)); // Filter out any non-numeric results (e.g., text, empty strings)

//     // Perform calculations based on the matched formula type
//     if (sumMatch) {
//       const sum = values.reduce((acc, curr) => acc + curr, 0);
//       return { value: sum, isFormula: true, result: sum };
//     } else if (averageMatch) {
//       if (values.length === 0) return { value: '#DIV/0!', isFormula: true, error: true }; // Avoid division by zero
//       const sum = values.reduce((acc, curr) => acc + curr, 0);
//       const average = sum / values.length;
//       return { value: average.toFixed(2), isFormula: true, result: average }; // Format average to 2 decimal places
//     } else if (countMatch) {
//       // Count non-empty cells in the original range (before filtering for numbers)
//       const count = cellsToEvaluate.filter(cellId => {
//         const cell = cellsData.get(cellId);
//         return cell && cell.value !== undefined && cell.value !== null && String(cell.value).trim() !== '';
//       }).length;
//       return { value: count, isFormula: true, result: count };
//     }

//     // Fallback for unknown but syntactically valid formula patterns
//     return { value: '#ERROR! Unknown Formula', isFormula: true, error: true };

//   } catch (e) {
//     console.error("Formula evaluation error:", e);
//     return { value: '#ERROR!', isFormula: true, error: true };
//   }
// };


// frontend/src/utils/spreadsheetUtils.js

/**
 * Parses a formula to find cell references.
 * @param {string} formula
 * @returns {Array<string>} An array of cell IDs found in the formula.
 */
export const findDependencies = (formula) => {
    const dependencies = new Set();
    // Matches cell IDs like A1, B23, etc., but also ranges like A1:A5
    const cellRegex = /[A-Z]+\d+/g;
    let match;
    while ((match = cellRegex.exec(formula)) !== null) {
        dependencies.add(match[0]);
    }
    return Array.from(dependencies);
};

/**
 * Converts a 0-based column index to its corresponding spreadsheet letter (e.g., 0 -> A, 25 -> Z, 26 -> AA).
 * @param {number} colIndex - The 0-based column index.
 * @returns {string} The column letter.
 */
export const getColumnLetter = (colIndex) => {
    let letter = '';
    let temp = colIndex;
    while (temp >= 0) {
        letter = String.fromCharCode(65 + (temp % 26)) + letter;
        temp = Math.floor(temp / 26) - 1;
    }
    return letter;
};

/**
 * Converts a spreadsheet column letter to its 0-based index (e.g., A -> 0, Z -> 25, AA -> 26).
 * @param {string} columnLetter - The column letter (e.g., 'A', 'AZ').
 * @returns {number} The 0-based column index.
 */
export const getColumnIndex = (columnLetter) => {
    let index = 0;
    for (let i = 0; i < columnLetter.length; i++) {
        index = index * 26 + (columnLetter.charCodeAt(i) - 65 + 1);
    }
    return index - 1; // Adjust for 0-based index
};

/**
 * Parses a cell ID string (e.g., 'A1') into an object containing column letter and row number.
 * @param {string} cellId - The cell ID string.
 * @returns {{col: string, row: number}|null} An object with 'col' and 'row', or null if invalid.
 */
export const parseCellId = (cellId) => {
    const match = cellId.match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;
    return { col: match[1], row: parseInt(match[2], 10) };
};

/**
 * Converts a spreadsheet range string (e.g., 'A1:B2') into an array of individual cell IDs.
 * @param {string} range - The range string.
 * @returns {string[]} An array of cell IDs within the range.
 */
export const getCellsInRange = (range) => {
    const parts = range.split(':');
    if (parts.length !== 2) return [];

    const start = parseCellId(parts[0]);
    const end = parseCellId(parts[1]);

    if (!start || !end) return [];

    const startColIndex = getColumnIndex(start.col);
    const endColIndex = getColumnIndex(end.col);
    const startRow = start.row;
    const endRow = end.row;

    const cells = [];
    // Iterate through rows and columns within the defined range
    for (let r = Math.min(startRow, endRow); r <= Math.max(startRow, endRow); r++) {
        for (let c = Math.min(startColIndex, endColIndex); c <= Math.max(startColIndex, endColIndex); c++) {
            cells.push(`${getColumnLetter(c)}${r}`);
        }
    }
    return cells;
};

/**
 * Evaluates a formula or a literal value.
 * This version handles arithmetic and functions like SUM, AVERAGE, and COUNT.
 * @param {string} value The formula or value to evaluate.
 * @param {Map} cellsData The current state of all cells.
 * @returns {{ displayValue: string, dependencies: Array<string> }} The evaluated result and any dependencies.
 */
export const evaluateFormula = (value, cellsData) => {
    let displayValue = value;
    let dependencies = [];

    // Check if it's a formula
    if (value && value.startsWith('=')) {
        try {
            const formula = value.substring(1);
            dependencies = findDependencies(formula);
            let expression = formula;

            // Handle specific functions first
            const upperCaseExpression = expression.toUpperCase();
            const sumMatch = upperCaseExpression.match(/^SUM\(([A-Z]+\d+:[A-Z]+\d+)\)$/);
            const averageMatch = upperCaseExpression.match(/^AVERAGE\(([A-Z]+\d+:[A-Z]+\d+)\)$/);
            const countMatch = upperCaseExpression.match(/^COUNT\(([A-Z]+\d+:[A-Z]+\d+)\)$/);

            if (sumMatch || averageMatch || countMatch) {
                const match = sumMatch || averageMatch || countMatch;
                const range = match[1];
                const cellsToEvaluate = getCellsInRange(range);
                const values = cellsToEvaluate
                    .map(cellId => parseFloat(cellsData.get(cellId)?.displayValue || '0'))
                    .filter(val => !isNaN(val));

                if (sumMatch) {
                    displayValue = values.reduce((acc, curr) => acc + curr, 0);
                } else if (averageMatch) {
                    displayValue = values.length > 0 ? values.reduce((acc, curr) => acc + curr, 0) / values.length : 0;
                } else if (countMatch) {
                    displayValue = cellsToEvaluate.filter(cellId => cellsData.get(cellId)?.displayValue !== '').length;
                }

                // Get dependencies for the function from the range
                dependencies = cellsToEvaluate;
            } else {
                // If it's not a function, evaluate as a mathematical expression
                // Replace cell references with their current numeric values
                dependencies.forEach(depId => {
                    const depCell = cellsData.get(depId);
                    const depValue = depCell ? parseFloat(depCell.displayValue) : 0;
                    expression = expression.replace(new RegExp(depId, 'g'), `(${depValue})`);
                });
                
                // Use a safer eval function
                // eslint-disable-next-line no-eval
                displayValue = eval(expression);
            }

            if (isNaN(displayValue) || !isFinite(displayValue)) {
                displayValue = '#ERROR';
            }
        } catch (e) {
            console.error('Formula evaluation error:', e);
            displayValue = '#ERROR';
        }
    }

    return {
        displayValue: displayValue.toString(),
        dependencies,
    };
};

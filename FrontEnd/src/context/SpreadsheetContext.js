

// // frontend/src/context/SpreadsheetContext.js
// import { createContext, useState, useEffect, useRef, useCallback } from 'react';
// import { evaluateFormula, findDependencies } from '../utils/spreadsheetUtils';

// // Create a context for the spreadsheet state and actions
// export const SpreadsheetContext = createContext();

// // Create a provider component to wrap the application
// export const SpreadsheetProvider = ({ children }) => {
//   const [cells, setCells] = useState(new Map());
//   const [selectedCell, setSelectedCell] = useState(null);
//   const [connectedUsers, setConnectedUsers] = useState(new Map());
//   const [userId, setUserId] = useState(null);
//   const [userName, setUserName] = useState('');
//   // Use a Map to store pages: pageId -> Map of cells
//   const [pages, setPages] = useState(new Map([['page-1', new Map()]]));
//   const [currentPageId, setCurrentPageId] = useState('page-1');
//   const ws = useRef(null);
//   const isMounted = useRef(false);

//   // This combined useEffect handles both the user ID setup and the WebSocket connection.
//   // By depending on userId and userName, it ensures the connection is only created
//   // or re-created when the user's identity is stable.
//   useEffect(() => {
//     isMounted.current = true;
    
//     // First, load or generate the user's ID and name.
//     let id = localStorage.getItem('userId');
//     let name = localStorage.getItem('userName');

//     if (!id) {
//       id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
//         const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
//         return v.toString(16);
//       });
//       localStorage.setItem('userId', id);
//     }
//     if (!name) {
//       name = `User-${id.substring(0, 4)}`;
//       localStorage.setItem('userName', name);
//     }
    
//     setUserId(id);
//     setUserName(name);

//     // Now, if we have a user ID, we can safely establish the WebSocket connection.
//     if (id && name) {
//       // Guard against multiple WebSocket connections by closing any old ones.
//       if (ws.current) {
//         ws.current.close();
//       }

//       ws.current = new WebSocket('ws://localhost:8080');

//       ws.current.onopen = () => {
//         console.log('Connected to WebSocket server');
//         // Send the user's persistent ID and name to the server upon connection
//         ws.current.send(JSON.stringify({ type: 'init_connection', userId: id, userName: name }));
//       };

//       ws.current.onmessage = (event) => {
//         if (!isMounted.current) return;
//         const message = JSON.parse(event.data);
//         console.log('Message received:', message);

//         switch (message.type) {
//           case 'initial_data': {
//             const newCells = new Map(message.cells.map(cell => [cell.id, cell]));
//             setCells(newCells);
//             setConnectedUsers(new Map(Object.entries(message.activeUsers)));
//             break;
//           }
//           case 'cell_update': {
//             setCells(prevCells => {
//                 const newCells = new Map(prevCells);
//                 const { displayValue, dependencies } = evaluateFormula(message.cellId, message.value, newCells);
//                 newCells.set(message.cellId, { value: message.value, formula: message.value, displayValue, dependencies });
    
//                 // Re-evaluate cells that depend on the updated cell
//                 recursivelyEvaluate(message.cellId, newCells);
    
//                 return newCells;
//             });
//             break;
//           }
//           case 'active_cell': {
//             setConnectedUsers(prevUsers => {
//               const newUsers = new Map(prevUsers);
//               const user = newUsers.get(message.userId);
//               if (user) {
//                 user.activeCell = message.cellId;
//               }
//               return newUsers;
//             });
//             break;
//           }
//           case 'user_joined': {
//             setConnectedUsers(prevUsers => {
//               const newUsers = new Map(prevUsers);
//               newUsers.set(message.userId, { name: message.userName, activeCell: null });
//               return newUsers;
//             });
//             break;
//           }
//           case 'user_left': {
//             setConnectedUsers(prevUsers => {
//               const newUsers = new Map(prevUsers);
//               newUsers.delete(message.userId);
//               return newUsers;
//             });
//             break;
//           }
//           default:
//             console.warn('Unknown message type:', message.type);
//         }
//       };

//       ws.current.onclose = () => {
//         console.log('Disconnected from WebSocket server');
//         // Implement a robust reconnection attempt
//         if (isMounted.current) {
//           setTimeout(() => {
//             console.log('Attempting to reconnect...');
//             // The effect will rerun and create a new connection
//           }, 3000);
//         }
//       };

//       ws.current.onerror = (error) => {
//         console.error('WebSocket error:', error);
//       };

//       // Cleanup function to close the WebSocket connection on component unmount
//       return () => {
//         if (ws.current) {
//           ws.current.close();
//         }
//       };
//     }

//     // Cleanup function for the whole effect
//     return () => {
//       isMounted.current = false;
//     };
//   }, []);

//   const recursivelyEvaluate = (cellId, cellsMap) => {
//     for (const [id, cell] of cellsMap.entries()) {
//         if (cell.dependencies && cell.dependencies.includes(cellId)) {
//             const { displayValue } = evaluateFormula(id, cell.value, cellsMap);
//             cellsMap.set(id, { ...cell, displayValue });
//             recursivelyEvaluate(id, cellsMap); // Recursively update
//         }
//     }
//   };

//   const createNewPage = useCallback(() => {
//     // Save the current page's cells before creating a new one
//     setPages(prevPages => {
//       const updatedPages = new Map(prevPages);
//       updatedPages.set(currentPageId, cells);
//       return updatedPages;
//     });

//     const newPageId = `page-${pages.size + 1}`;
//     const newPageCells = new Map();
//     setPages(prevPages => {
//         const newPages = new Map(prevPages);
//         newPages.set(newPageId, newPageCells);
//         return newPages;
//     });
//     setCurrentPageId(newPageId);
//     setCells(newPageCells); // Set the current cells to the empty map for the new page
//     setSelectedCell(null); // Deselect any active cell
//   }, [pages, currentPageId, cells]);

//   const switchPage = useCallback((pageId) => {
//     // Save the current page's cells before switching
//     setPages(prevPages => {
//         const updatedPages = new Map(prevPages);
//         updatedPages.set(currentPageId, cells);
//         return updatedPages;
//     });

//     const newCells = pages.get(pageId) || new Map();
//     setCurrentPageId(pageId);
//     setCells(newCells);
//     setSelectedCell(null);
//   }, [pages, currentPageId, cells]);


//   const updateCellValue = useCallback((cellId, newValue) => {
//     setCells(prevCells => {
//       const newCells = new Map(prevCells);
//       const { displayValue, dependencies } = evaluateFormula(cellId, newValue, newCells);
//       newCells.set(cellId, { value: newValue, formula: newValue, displayValue, dependencies });

//       // Re-evaluate cells that depend on the updated cell
//       recursivelyEvaluate(cellId, newCells);

//       // Update the pages map with the new cells for the current page
//       setPages(prevPages => {
//           const updatedPages = new Map(prevPages);
//           updatedPages.set(currentPageId, newCells);
//           return updatedPages;
//       });
      
//       if (ws.current && ws.current.readyState === WebSocket.OPEN) {
//         ws.current.send(JSON.stringify({
//           type: 'cell_update',
//           userId: userId,
//           cellId: cellId,
//           value: newValue,
//           userName: userName
//         }));
//       }

//       return newCells;
//     });
//   }, [userId, userName, currentPageId]);

//   const updateActiveCell = useCallback((cellId) => {
//     setSelectedCell(cellId);
//     if (ws.current && ws.current.readyState === WebSocket.OPEN) {
//       ws.current.send(JSON.stringify({
//         type: 'active_cell',
//         userId: userId,
//         cellId: cellId,
//         userName: userName
//       }));
//     }
//   }, [userId, userName]);

//   const value = {
//     cells,
//     setCells,
//     selectedCell,
//     setSelectedCell,
//     updateCellValue,
//     updateActiveCell,
//     connectedUsers,
//     userId,
//     userName,
//     setUserName,
//     pages,
//     currentPageId,
//     createNewPage,
//     switchPage,
//   };

//   return (
//     <SpreadsheetContext.Provider value={value}>
//       {children}
//     </SpreadsheetContext.Provider>
//   );
// };




// // frontend/src/context/SpreadsheetContext.js
// import { createContext, useState, useEffect, useRef, useCallback } from 'react';
// import { evaluateFormula } from '../utils/spreadsheetUtils';

// // Create a context for the spreadsheet state and actions
// export const SpreadsheetContext = createContext();

// // Create a provider component to wrap the application
// export const SpreadsheetProvider = ({ children }) => {
//   const [cells, setCells] = useState(new Map());
//   const [selectedCell, setSelectedCell] = useState(null);
//   const [connectedUsers, setConnectedUsers] = useState(new Map());
//   const [userId, setUserId] = useState(null);
//   const [userName, setUserName] = useState('');
//   // Use a Map to store pages: pageId -> Map of cells
//   const [pages, setPages] = useState(new Map([['page-1', new Map()]]));
//   const [currentPageId, setCurrentPageId] = useState('page-1');
//   const ws = useRef(null);
//   const isMounted = useRef(false);

//   // This combined useEffect handles both the user ID setup and the WebSocket connection.
//   // By depending on userId and userName, it ensures the connection is only created
//   // or re-created when the user's identity is stable.
//   useEffect(() => {
//     isMounted.current = true;
    
//     // First, load or generate the user's ID and name.
//     let id = localStorage.getItem('userId');
//     let name = localStorage.getItem('userName');

//     if (!id) {
//       id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
//         const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
//         return v.toString(16);
//       });
//       localStorage.setItem('userId', id);
//     }
//     if (!name) {
//       name = `User-${id.substring(0, 4)}`;
//       localStorage.setItem('userName', name);
//     }
    
//     setUserId(id);
//     setUserName(name);

//     // Now, if we have a user ID, we can safely establish the WebSocket connection.
//     if (id && name) {
//       // Guard against multiple WebSocket connections by closing any old ones.
//       if (ws.current) {
//         ws.current.close();
//       }

//       ws.current = new WebSocket('ws://localhost:8080');

//       ws.current.onopen = () => {
//         console.log('Connected to WebSocket server');
//         // Send the user's persistent ID and name to the server upon connection
//         ws.current.send(JSON.stringify({ type: 'init_connection', userId: id, userName: name }));
//       };

//       ws.current.onmessage = (event) => {
//         if (!isMounted.current) return;
//         const message = JSON.parse(event.data);
//         console.log('Message received:', message);

//         switch (message.type) {
//           case 'initial_data': {
//             const newCells = new Map(message.cells.map(cell => [cell.id, cell]));
//             setCells(newCells);
//             setConnectedUsers(new Map(Object.entries(message.activeUsers)));
//             break;
//           }
//           case 'cell_update': {
//             setCells(prevCells => {
//                 const newCells = new Map(prevCells);
//                 const { displayValue, dependencies } = evaluateFormula(message.value, newCells);
//                 newCells.set(message.cellId, { value: message.value, formula: message.value, displayValue, dependencies });
    
//                 // Re-evaluate cells that depend on the updated cell
//                 recursivelyEvaluate(message.cellId, newCells);
    
//                 return newCells;
//             });
//             break;
//           }
//           case 'active_cell': {
//             setConnectedUsers(prevUsers => {
//               const newUsers = new Map(prevUsers);
//               const user = newUsers.get(message.userId);
//               if (user) {
//                 user.activeCell = message.cellId;
//               }
//               return newUsers;
//             });
//             break;
//           }
//           case 'user_joined': {
//             setConnectedUsers(prevUsers => {
//               const newUsers = new Map(prevUsers);
//               newUsers.set(message.userId, { name: message.userName, activeCell: null });
//               return newUsers;
//             });
//             break;
//           }
//           case 'user_left': {
//             setConnectedUsers(prevUsers => {
//               const newUsers = new Map(prevUsers);
//               newUsers.delete(message.userId);
//               return newUsers;
//             });
//             break;
//           }
//           default:
//             console.warn('Unknown message type:', message.type);
//         }
//       };

//       ws.current.onclose = () => {
//         console.log('Disconnected from WebSocket server');
//         // Implement a robust reconnection attempt
//         if (isMounted.current) {
//           setTimeout(() => {
//             console.log('Attempting to reconnect...');
//             // The effect will rerun and create a new connection
//           }, 3000);
//         }
//       };

//       ws.current.onerror = (error) => {
//         console.error('WebSocket error:', error);
//       };

//       // Cleanup function to close the WebSocket connection on component unmount
//       return () => {
//         if (ws.current) {
//           ws.current.close();
//         }
//       };
//     }

//     // Cleanup function for the whole effect
//     return () => {
//       isMounted.current = false;
//     };
//   }, []);

//   // Recursively re-evaluate cells that depend on a changed cell
//   const recursivelyEvaluate = (cellId, cellsMap) => {
//     // Find all cells that have the current cellId as a dependency
//     const dependents = [...cellsMap.values()].filter(cell => cell.dependencies?.includes(cellId));

//     dependents.forEach(dependentCell => {
//       // Re-evaluate the dependent cell's formula
//       const { displayValue, dependencies } = evaluateFormula(dependentCell.value, cellsMap);
//       cellsMap.set(dependentCell.id, { ...dependentCell, displayValue, dependencies });
      
//       // Recursively evaluate any cells that depend on this one
//       recursivelyEvaluate(dependentCell.id, cellsMap);
//     });
//   };

//   const createNewPage = useCallback(() => {
//     // Save the current page's cells before creating a new one
//     setPages(prevPages => {
//       const updatedPages = new Map(prevPages);
//       updatedPages.set(currentPageId, cells);
//       return updatedPages;
//     });

//     const newPageId = `page-${pages.size + 1}`;
//     const newPageCells = new Map();
//     setPages(prevPages => {
//         const newPages = new Map(prevPages);
//         newPages.set(newPageId, newPageCells);
//         return newPages;
//     });
//     setCurrentPageId(newPageId);
//     setCells(newPageCells); // Set the current cells to the empty map for the new page
//     setSelectedCell(null); // Deselect any active cell
//   }, [pages, currentPageId, cells]);

//   const switchPage = useCallback((pageId) => {
//     // Save the current page's cells before switching
//     setPages(prevPages => {
//         const updatedPages = new Map(prevPages);
//         updatedPages.set(currentPageId, cells);
//         return updatedPages;
//     });

//     const newCells = pages.get(pageId) || new Map();
//     setCurrentPageId(pageId);
//     setCells(newCells);
//     setSelectedCell(null);
//   }, [pages, currentPageId, cells]);


//   const updateCellValue = useCallback((cellId, newValue) => {
//     setCells(prevCells => {
//       const newCells = new Map(prevCells);
//       const { displayValue, dependencies } = evaluateFormula(newValue, newCells);
//       newCells.set(cellId, { value: newValue, formula: newValue, displayValue, dependencies });

//       // Re-evaluate cells that depend on the updated cell
//       recursivelyEvaluate(cellId, newCells);

//       // Update the pages map with the new cells for the current page
//       setPages(prevPages => {
//           const updatedPages = new Map(prevPages);
//           updatedPages.set(currentPageId, newCells);
//           return updatedPages;
//       });
      
//       if (ws.current && ws.current.readyState === WebSocket.OPEN) {
//         ws.current.send(JSON.stringify({
//           type: 'cell_update',
//           userId: userId,
//           cellId: cellId,
//           value: newValue,
//           userName: userName
//         }));
//       }

//       return newCells;
//     });
//   }, [userId, userName, currentPageId]);

//   const updateActiveCell = useCallback((cellId) => {
//     setSelectedCell(cellId);
//     if (ws.current && ws.current.readyState === WebSocket.OPEN) {
//       ws.current.send(JSON.stringify({
//         type: 'active_cell',
//         userId: userId,
//         cellId: cellId,
//         userName: userName
//       }));
//     }
//   }, [userId, userName]);

//   const value = {
//     cells,
//     setCells,
//     selectedCell,
//     setSelectedCell,
//     updateCellValue,
//     updateActiveCell,
//     connectedUsers,
//     userId,
//     userName,
//     setUserName,
//     pages,
//     currentPageId,
//     createNewPage,
//     switchPage,
//   };

//   return (
//     <SpreadsheetContext.Provider value={value}>
//       {children}
//     </SpreadsheetContext.Provider>
//   );
// };




//best

// frontend/src/context/SpreadsheetContext.js
import { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { evaluateFormula, getColumnLetter } from '../utils/spreadsheetUtils';

// Create a context for the spreadsheet state and actions
export const SpreadsheetContext = createContext();

// Create a provider component to wrap the application
export const SpreadsheetProvider = ({ children }) => {
  const [cells, setCells] = useState(new Map());
  const [selectedCell, setSelectedCell] = useState(null);
  const [connectedUsers, setConnectedUsers] = useState(new Map());
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('');
  const [pages, setPages] = useState(new Map());
  const [currentPageId, setCurrentPageId] = useState(null);
  const [sortState, setSortState] = useState({ column: null, direction: null });
  const [sortedRows, setSortedRows] = useState(null);
  
  const ws = useRef(null);
  const isMounted = useRef(false);
  
  const localStorageKey = 'spreadsheetData';

  // Convert Map to a plain object for localStorage storage
  const mapToObject = (map) => {
    const obj = {};
    map.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  };

  // Convert plain object from localStorage back to a Map
  const objectToMap = (obj) => {
    const map = new Map();
    if (obj) {
      Object.keys(obj).forEach(key => {
        map.set(key, obj[key]);
      });
    }
    return map;
  };

  // Effect to load data from local storage on initial mount
  useEffect(() => {
    isMounted.current = true;
    
    // Check for existing data in local storage
    const storedData = localStorage.getItem(localStorageKey);
    if (storedData) {
      const { pages: storedPages, currentPageId: storedPageId } = JSON.parse(storedData);
      
      const loadedPages = objectToMap(storedPages);
      setPages(loadedPages);
      
      // Load cells for the last active page
      const pageCells = loadedPages.get(storedPageId) ? objectToMap(loadedPages.get(storedPageId).cells) : new Map();
      setCells(pageCells);
      setCurrentPageId(storedPageId);
      
    } else {
      // If no data exists, create a default page
      const initialPageId = 'page-1';
      const initialPage = {
        id: initialPageId,
        name: 'page-1',
        cells: new Map()
      };
      const initialPages = new Map([[initialPageId, initialPage]]);
      setPages(initialPages);
      setCurrentPageId(initialPageId);
    }
    
    let id = localStorage.getItem('userId');
    let name = localStorage.getItem('userName');

    if (!id) {
      id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      localStorage.setItem('userId', id);
    }
    if (!name) {
      name = `User-${id.substring(0, 4)}`;
      localStorage.setItem('userName', name);
    }
    
    setUserId(id);
    setUserName(name);

    if (id && name) {
      if (ws.current) {
        ws.current.close();
      }

      ws.current = new WebSocket('ws://localhost:8080');

      ws.current.onopen = () => {
        console.log('Connected to WebSocket server');
        ws.current.send(JSON.stringify({ type: 'init_connection', userId: id, userName: name }));
      };

      ws.current.onmessage = (event) => {
        if (!isMounted.current) return;
        const message = JSON.parse(event.data);
        console.log('Message received:', message);

        switch (message.type) {
          case 'initial_data': {
            setConnectedUsers(new Map(Object.entries(message.activeUsers)));
            break;
          }
          case 'cell_update': {
            setCells(prevCells => {
                const newCells = new Map(prevCells);
                const { displayValue, dependencies } = evaluateFormula(message.value, newCells);
                newCells.set(message.cellId, { value: message.value, formula: message.value, displayValue, dependencies });
    
                recursivelyEvaluate(message.cellId, newCells);
                updatePagesWithCells(newCells); // Update pages state
    
                return newCells;
            });
            break;
          }
          case 'active_cell': {
            setConnectedUsers(prevUsers => {
              const newUsers = new Map(prevUsers);
              const user = newUsers.get(message.userId);
              if (user) {
                user.activeCell = message.cellId;
              }
              return newUsers;
            });
            break;
          }
          case 'user_joined': {
            setConnectedUsers(prevUsers => {
              const newUsers = new Map(prevUsers);
              newUsers.set(message.userId, { name: message.userName, activeCell: null });
              return newUsers;
            });
            break;
          }
          case 'user_left': {
            setConnectedUsers(prevUsers => {
              const newUsers = new Map(prevUsers);
              newUsers.delete(message.userId);
              return newUsers;
            });
            break;
          }
          default:
            console.warn('Unknown message type:', message.type);
        }
      };

      ws.current.onclose = () => {
        console.log('Disconnected from WebSocket server');
        if (isMounted.current) {
          setTimeout(() => {
            console.log('Attempting to reconnect...');
          }, 3000);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      return () => {
        if (ws.current) {
          ws.current.close();
        }
      };
    }

    return () => {
      isMounted.current = false;
    };
  }, []);

  const updatePagesWithCells = (updatedCells) => {
    setPages(prevPages => {
      const newPages = new Map(prevPages);
      if (currentPageId) {
        newPages.set(currentPageId, { ...newPages.get(currentPageId), cells: updatedCells });
      }
      localStorage.setItem(localStorageKey, JSON.stringify({ pages: mapToObject(newPages), currentPageId }));
      return newPages;
    });
  };

  const recursivelyEvaluate = useCallback((cellId, cellsMap) => {
    const dependents = [...cellsMap.values()].filter(cell => cell.dependencies?.includes(cellId));
    dependents.forEach(dependentCell => {
      const { displayValue, dependencies } = evaluateFormula(dependentCell.value, cellsMap);
      cellsMap.set(dependentCell.id, { ...dependentCell, displayValue, dependencies });
      recursivelyEvaluate(dependentCell.id, cellsMap);
    });
  }, []);

  const createNewPage = useCallback(() => {
    setPages(prevPages => {
      const newPageId = `page-${prevPages.size + 1}`;
      const newPage = {
        id: newPageId,
        name: newPageId,
        cells: new Map()
      };
      
      const newPages = new Map(prevPages);
      // Save current page's cells
      if (currentPageId) {
          newPages.set(currentPageId, { ...newPages.get(currentPageId), cells: cells });
      }
      newPages.set(newPageId, newPage);
      
      setCurrentPageId(newPageId);
      setCells(new Map());
      setSelectedCell(null);
      
      localStorage.setItem(localStorageKey, JSON.stringify({ pages: mapToObject(newPages), currentPageId: newPageId }));
      return newPages;
    });
  }, [pages, cells, currentPageId]);

  const switchPage = useCallback((pageId) => {
    // Save current page's cells to pages state before switching
    setPages(prevPages => {
      const newPages = new Map(prevPages);
      if (currentPageId) {
          newPages.set(currentPageId, { ...newPages.get(currentPageId), cells: cells });
      }
      
      localStorage.setItem(localStorageKey, JSON.stringify({ pages: mapToObject(newPages), currentPageId: pageId }));
      return newPages;
    });
    
    // Load new page's cells
    const newCells = pages.get(pageId) ? objectToMap(pages.get(pageId).cells) : new Map();
    setCurrentPageId(pageId);
    setCells(newCells);
    setSelectedCell(null);
    setSortedRows(null); // Clear sort state when switching pages
    setSortState({ column: null, direction: null });
  }, [pages, cells, currentPageId]);
  
  const deletePage = useCallback((pageId) => {
    setPages(prevPages => {
      const newPages = new Map(prevPages);
      newPages.delete(pageId);
      
      let newCurrentPageId = currentPageId;
      if (currentPageId === pageId) {
          const remainingPageIds = Array.from(newPages.keys());
          if (remainingPageIds.length > 0) {
              newCurrentPageId = remainingPageIds[0];
          } else {
              newCurrentPageId = `page-1`;
              newPages.set(newCurrentPageId, { id: newCurrentPageId, name: newCurrentPageId, cells: new Map() });
          }
      }
      
      setCurrentPageId(newCurrentPageId);
      if (newPages.get(newCurrentPageId)) {
        setCells(objectToMap(newPages.get(newCurrentPageId).cells));
      }
      
      localStorage.setItem(localStorageKey, JSON.stringify({ pages: mapToObject(newPages), currentPageId: newCurrentPageId }));
      return newPages;
    });
  }, [pages, currentPageId]);

  const handleSort = useCallback((columnLabel, direction) => {
    const rows = 100;
    const rowsToSort = [];

    // Create an array of objects to sort, including the original row number and the cell's display value
    for (let i = 1; i <= rows; i++) {
        const cellId = `${columnLabel}${i}`;
        const cellData = cells.get(cellId) || { displayValue: '' };
        rowsToSort.push({ rowNumber: i, value: cellData.displayValue });
    }
    
    // Sort the rows based on the value in the specified column
    const sortedRows = rowsToSort.sort((a, b) => {
        const valueA = a.value;
        const valueB = b.value;
        
        // Handle empty values: place them last
        if (valueA === '' && valueB === '') return 0;
        if (valueA === '') return 1;
        if (valueB === '') return -1;
        
        // Check if values are numeric
        const isNumericA = !isNaN(Number(valueA)) && valueA.trim() !== '';
        const isNumericB = !isNaN(Number(valueB)) && valueB.trim() !== '';

        let comparison = 0;
        if (isNumericA && isNumericB) {
            // Compare numbers numerically
            comparison = Number(valueA) - Number(valueB);
        } else if (isNumericA) {
            // A is a number, B is a string. Numbers come before strings in ascending order.
            comparison = -1;
        } else if (isNumericB) {
            // B is a number, A is a string.
            comparison = 1;
        } else {
            // Both are strings, compare alphabetically
            comparison = String(valueA).localeCompare(String(valueB));
        }

        // Apply sort direction
        return direction === 'asc' ? comparison : -comparison;
    }).map(row => row.rowNumber);

    setSortedRows(sortedRows);
    setSortState({ column: columnLabel, direction });
  }, [cells]);

  const updateCellValue = useCallback((cellId, newValue) => {
    setCells(prevCells => {
      const newCells = new Map(prevCells);
      const { displayValue, dependencies } = evaluateFormula(newValue, newCells);
      newCells.set(cellId, { value: newValue, formula: newValue, displayValue, dependencies });
      recursivelyEvaluate(cellId, newCells);

      // Persist the changes to local storage
      updatePagesWithCells(newCells);
      
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: 'cell_update',
          userId: userId,
          cellId: cellId,
          value: newValue,
          userName: userName
        }));
      }
      return newCells;
    });
  }, [userId, userName, recursivelyEvaluate]);


  const updateActiveCell = useCallback((cellId) => {
    setSelectedCell(cellId);
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'active_cell',
        userId: userId,
        cellId: cellId,
        userName: userName
      }));
    }
  }, [userId, userName]);

  const value = {
    cells,
    setCells,
    selectedCell,
    setSelectedCell,
    updateCellValue,
    updateActiveCell,
    connectedUsers,
    userId,
    userName,
    setUserName,
    pages,
    currentPageId,
    createNewPage,
    switchPage,
    deletePage,
    sortState,
    handleSort,
    sortedRows,
    setSortedRows,
  };

  return (
    <SpreadsheetContext.Provider value={value}>
      {children}
    </SpreadsheetContext.Provider>
  );
};


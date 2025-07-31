

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




// frontend/src/context/SpreadsheetContext.js
import { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { evaluateFormula } from '../utils/spreadsheetUtils';

// Create a context for the spreadsheet state and actions
export const SpreadsheetContext = createContext();

// Create a provider component to wrap the application
export const SpreadsheetProvider = ({ children }) => {
  const [cells, setCells] = useState(new Map());
  const [selectedCell, setSelectedCell] = useState(null);
  const [connectedUsers, setConnectedUsers] = useState(new Map());
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('');
  // Use a Map to store pages: pageId -> Map of cells
  const [pages, setPages] = useState(new Map([['page-1', new Map()]]));
  const [currentPageId, setCurrentPageId] = useState('page-1');
  const ws = useRef(null);
  const isMounted = useRef(false);

  // This combined useEffect handles both the user ID setup and the WebSocket connection.
  // By depending on userId and userName, it ensures the connection is only created
  // or re-created when the user's identity is stable.
  useEffect(() => {
    isMounted.current = true;
    
    // First, load or generate the user's ID and name.
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

    // Now, if we have a user ID, we can safely establish the WebSocket connection.
    if (id && name) {
      // Guard against multiple WebSocket connections by closing any old ones.
      if (ws.current) {
        ws.current.close();
      }

      ws.current = new WebSocket('ws://localhost:8080');

      ws.current.onopen = () => {
        console.log('Connected to WebSocket server');
        // Send the user's persistent ID and name to the server upon connection
        ws.current.send(JSON.stringify({ type: 'init_connection', userId: id, userName: name }));
      };

      ws.current.onmessage = (event) => {
        if (!isMounted.current) return;
        const message = JSON.parse(event.data);
        console.log('Message received:', message);

        switch (message.type) {
          case 'initial_data': {
            const newCells = new Map(message.cells.map(cell => [cell.id, cell]));
            setCells(newCells);
            setConnectedUsers(new Map(Object.entries(message.activeUsers)));
            break;
          }
          case 'cell_update': {
            setCells(prevCells => {
                const newCells = new Map(prevCells);
                const { displayValue, dependencies } = evaluateFormula(message.value, newCells);
                newCells.set(message.cellId, { value: message.value, formula: message.value, displayValue, dependencies });
    
                // Re-evaluate cells that depend on the updated cell
                recursivelyEvaluate(message.cellId, newCells);
    
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
        // Implement a robust reconnection attempt
        if (isMounted.current) {
          setTimeout(() => {
            console.log('Attempting to reconnect...');
            // The effect will rerun and create a new connection
          }, 3000);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      // Cleanup function to close the WebSocket connection on component unmount
      return () => {
        if (ws.current) {
          ws.current.close();
        }
      };
    }

    // Cleanup function for the whole effect
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Recursively re-evaluate cells that depend on a changed cell
  const recursivelyEvaluate = (cellId, cellsMap) => {
    // Find all cells that have the current cellId as a dependency
    const dependents = [...cellsMap.values()].filter(cell => cell.dependencies?.includes(cellId));

    dependents.forEach(dependentCell => {
      // Re-evaluate the dependent cell's formula
      const { displayValue, dependencies } = evaluateFormula(dependentCell.value, cellsMap);
      cellsMap.set(dependentCell.id, { ...dependentCell, displayValue, dependencies });
      
      // Recursively evaluate any cells that depend on this one
      recursivelyEvaluate(dependentCell.id, cellsMap);
    });
  };

  const createNewPage = useCallback(() => {
    // Save the current page's cells before creating a new one
    setPages(prevPages => {
      const updatedPages = new Map(prevPages);
      updatedPages.set(currentPageId, cells);
      return updatedPages;
    });

    const newPageId = `page-${pages.size + 1}`;
    const newPageCells = new Map();
    setPages(prevPages => {
        const newPages = new Map(prevPages);
        newPages.set(newPageId, newPageCells);
        return newPages;
    });
    setCurrentPageId(newPageId);
    setCells(newPageCells); // Set the current cells to the empty map for the new page
    setSelectedCell(null); // Deselect any active cell
  }, [pages, currentPageId, cells]);

  const switchPage = useCallback((pageId) => {
    // Save the current page's cells before switching
    setPages(prevPages => {
        const updatedPages = new Map(prevPages);
        updatedPages.set(currentPageId, cells);
        return updatedPages;
    });

    const newCells = pages.get(pageId) || new Map();
    setCurrentPageId(pageId);
    setCells(newCells);
    setSelectedCell(null);
  }, [pages, currentPageId, cells]);


  const updateCellValue = useCallback((cellId, newValue) => {
    setCells(prevCells => {
      const newCells = new Map(prevCells);
      const { displayValue, dependencies } = evaluateFormula(newValue, newCells);
      newCells.set(cellId, { value: newValue, formula: newValue, displayValue, dependencies });

      // Re-evaluate cells that depend on the updated cell
      recursivelyEvaluate(cellId, newCells);

      // Update the pages map with the new cells for the current page
      setPages(prevPages => {
          const updatedPages = new Map(prevPages);
          updatedPages.set(currentPageId, newCells);
          return updatedPages;
      });
      
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
  }, [userId, userName, currentPageId]);

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
  };

  return (
    <SpreadsheetContext.Provider value={value}>
      {children}
    </SpreadsheetContext.Provider>
  );
};


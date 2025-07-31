


// frontend/src/App.js
import { useContext, useState, useRef, useEffect } from 'react';
import SpreadsheetGrid from './components/SpreadsheetGrid';
import { SpreadsheetContext } from './context/SpreadsheetContext';
import './index.css';

function App() {
  const { connectedUsers, userName, setUserName, createNewPage, pages, currentPageId, switchPage } = useContext(SpreadsheetContext);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Handle name change from user input
  const handleNameChange = (e) => {
    const newName = e.target.value;
    setUserName(newName);
    localStorage.setItem('userName', newName);
  };

  // Toggle the dropdown menu's visibility
  const toggleDropdown = () => {
    setIsDropdownOpen(prev => !prev);
  };

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
  }, [dropdownRef]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-inter">
      <header className="bg-white shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 mb-2 sm:mb-0">Collaborative Spreadsheet</h1>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={userName}
            onChange={handleNameChange}
            placeholder="Enter your name"
            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          />
          <div className="relative" ref={dropdownRef}>
            <span
              className="text-sm font-medium text-gray-700 cursor-pointer"
              onClick={toggleDropdown}
            >
              Active Users ({connectedUsers.size})
            </span>
            <div
              className={`absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 transition-all duration-300 transform ${
                isDropdownOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
              }`}
            >
              <ul className="py-1">
                {[...connectedUsers.values()].map((user) => (
                  <li key={user.name} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150">
                    {user.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <button
            onClick={createNewPage}
            className="px-4 py-2 bg-purple-500 text-white rounded-md shadow hover:bg-purple-600 transition-colors duration-200"
          >
            New Page
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4">
        {/* Page tabs UI */}
        <div className="flex space-x-2 mb-4">
          {[...pages.keys()].map(pageId => (
            <button
              key={pageId}
              onClick={() => switchPage(pageId)}
              className={`px-4 py-2 rounded-md transition-colors duration-200 ${
                pageId === currentPageId
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {pageId}
            </button>
          ))}
        </div>
        <div className="relative w-full h-full">
          <SpreadsheetGrid />
        </div>
      </main>
      <footer className="bg-white shadow-inner p-4 text-center text-sm text-gray-500">
        <p>Double-click a cell to edit. Use arrow keys to navigate. Formulas start with `=` (e.g., `=SUM(A1:A5)`).</p>
      </footer>
    </div>
  );
}

export default App;

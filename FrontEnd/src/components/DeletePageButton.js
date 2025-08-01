// frontend/src/components/DeletePageButton.js
import React, { useContext } from 'react';
import { SpreadsheetContext } from '../context/SpreadsheetContext';

const DeletePageButton = () => {
  const { pages, currentPageId, deletePage } = useContext(SpreadsheetContext);

  const handleDelete = () => {
    // if (window.confirm(`Are you sure you want to delete ${pages.get(currentPageId)?.name}?`)) {
      deletePage(currentPageId);
    // }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={pages.size <= 1}
      style={{
        padding: '8px 16px',
        backgroundColor: '#e74c3c',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: pages.size <= 1 ? 'not-allowed' : 'pointer',
        margin: '5px'
      }}
    >
      Delete Page
    </button>
  );
};

export default DeletePageButton;

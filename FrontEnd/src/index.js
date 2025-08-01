

import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { SpreadsheetProvider } from './context/SpreadsheetContext';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <SpreadsheetProvider>
      <App />
    </SpreadsheetProvider>
  </React.StrictMode>
);

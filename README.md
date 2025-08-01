# 📊 Real-Time Collaborative Spreadsheet

A modern, real-time collaborative spreadsheet application built with React, Node.js, and WebSocket technology. Multiple users can edit the same spreadsheet simultaneously with live updates and user presence indicators.

## ✨ Features

- **Real-time Collaboration**: Multiple users can edit simultaneously
- **Live User Presence**: See who's currently editing which cells
- **Formula Support**: Basic spreadsheet formulas (SUM, AVERAGE, COUNT)
- **Multi-page Support**: Create and manage multiple spreadsheet pages
- **Sorting**: Sort data by columns
- **Responsive Design**: Modern UI with Tailwind CSS
- **Local Storage**: Automatic data persistence
- **Keyboard Navigation**: Full keyboard support for navigation

## 🚀 Quick Start

### Prerequisites

- **Node.js** (version 16 or higher)
- **npm** or **yarn** package manager

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd Spreadsheet-
   ```

2. **Install Backend Dependencies**
   ```bash
   cd BackEnd
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../FrontEnd
   npm install
   ```

4. **Start the Backend Server**
   ```bash
   cd ../BackEnd
   npm start
   ```
   The backend will start on `http://localhost:8080`

5. **Start the Frontend Application**
   ```bash
   cd ../FrontEnd
   npm start
   ```
   The frontend will start on `http://localhost:3000`

6. **Open your browser**
   Navigate to `http://localhost:3000` to start using the spreadsheet

## 📁 Project Reading


FrontEnd/src/index.js
FrontEnd/src/App.js
FrontEnd/src/context/SpreadsheetContext.js   ----> brain
FrontEnd/src/components/SpreadsheetGrid.js ----> grid created with rows and columns
FrontEnd/src/components/Cell.js  -----> cell operations like is active 
FrontEnd/src/utils/spreadsheetUtils.js  ---> formula answer finding
BackEnd/server.js
FrontEnd/src/components/HeaderCell.js ---> sorting ascending and descending
FrontEnd/src/components/DeletePageButton.js
Optional (if you want to understand everything):
FrontEnd/package.json
BackEnd/package.json
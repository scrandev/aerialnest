/**
 * React Application Entry Point
 * This file is the "bootstrap" that starts your React application
 * It's similar to how your API's index.js starts your server
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import App from './App';

// Get the HTML element where React will render your application
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render your App component into the root element
// React.StrictMode helps catch common development issues
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

import React, { useState, useEffect } from 'react';
import './App.css';

/**
 * Main Application Component
 * This is the root component of your entire frontend application.
 * Think of it as the "main" function of your frontend, similar to how
 * your API has a main handler function.
 */
function App() {
  // React "state" - these are variables that can change and trigger UI updates
  // Think of state as the "memory" of your component
  const [apiStatus, setApiStatus] = useState('Checking connection...');
  const [apiData, setApiData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * useEffect runs when the component first loads
   * This is similar to putting code at the top of a script that runs immediately
   * We're using it to test the connection to our API as soon as the page loads
   */
  useEffect(() => {
    testApiConnection();
  }, []); // The empty array means "only run this once when the component loads"

  /**
   * Function to test our API connection
   * This demonstrates how frontend and backend communicate
   */
  const testApiConnection = async () => {
    setIsLoading(true);
    
    try {
      // This is where we connect to your API
      // For now, we'll use localhost since we're developing locally
      const apiUrl = 'http://localhost:3001/api';
      
      console.log('Testing connection to:', apiUrl);
      
      // Fetch is the modern way to make HTTP requests from browsers
      // It's similar to using curl, but from JavaScript
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update our component's state with the successful response
      setApiStatus('✅ Connected successfully!');
      setApiData(data);
      
      console.log('API Response:', data);
      
    } catch (error) {
      console.error('API connection failed:', error);
      
      // Show a helpful error message
      setApiStatus('❌ Connection failed');
      setApiData({
        error: 'Could not connect to API',
        details: error.message,
        suggestion: 'Make sure your API server is running with "npm run dev" in the api directory'
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * The "render" part of the component
   * This JSX (JavaScript XML) syntax lets you write HTML-like code in JavaScript
   * React will convert this into actual DOM elements that appear in the browser
   */
  return (
    <div className="App">
      <header className="App-header">
        <h1>Aerial Nest</h1>
        <p>End-of-life document planning and storage platform</p>
        
        <div className="api-connection-section">
          <h2>API Connection Status</h2>
          
          <div className="status-display">
            <p><strong>Status:</strong> {apiStatus}</p>
            
            {isLoading && <p>Testing connection...</p>}
            
            {apiData && (
              <div className="api-response">
                <h3>API Response:</h3>
                <pre>{JSON.stringify(apiData, null, 2)}</pre>
              </div>
            )}
          </div>
          
          <button 
            onClick={testApiConnection} 
            disabled={isLoading}
            className="test-button"
          >
            {isLoading ? 'Testing...' : 'Test API Connection'}
          </button>
        </div>
        
        <div className="next-steps">
          <h3>🚀 What's Working:</h3>
          <ul>
            <li>✅ Frontend React application</li>
            <li>✅ Backend API server</li>
            <li>✅ Communication between frontend and backend</li>
          </ul>
          
          <h3>🎯 Next Steps:</h3>
          <ul>
            <li>📄 Add user authentication</li>
            <li>📋 Create document upload interface</li>
            <li>🔗 Deploy to AWS infrastructure</li>
          </ul>
        </div>
      </header>
    </div>
  );
}

export default App;

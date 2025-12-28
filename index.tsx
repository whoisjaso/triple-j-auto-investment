import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error('Failed to render React app:', error);
  rootElement.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background-color: #011c12; color: #f3f4f6; font-family: 'Inter', sans-serif; padding: 20px;">
      <div style="text-align: center; max-width: 600px;">
        <h1 style="color: #D4AF37; margin-bottom: 20px;">Error Loading Application</h1>
        <p style="margin-bottom: 10px;">There was an error loading the React application.</p>
        <p style="color: #888; font-size: 14px; margin-top: 20px;">Please check the browser console for details.</p>
        <pre style="background: #000805; padding: 15px; border-radius: 4px; margin-top: 20px; text-align: left; overflow-x: auto; color: #f00;">${error instanceof Error ? error.message : String(error)}</pre>
      </div>
    </div>
  `;
}
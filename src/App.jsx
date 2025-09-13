import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const WEBSOCKET_URL = "ws://127.0.0.1:8000/ws/video_feed";

function App() {
  const [frame, setFrame] = useState('');
  const [alerts, setAlerts] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef(null);

  useEffect(() => {
    // Function to establish connection
    const connect = () => {
      ws.current = new WebSocket(WEBSOCKET_URL);

      ws.current.onopen = () => {
        console.log("WebSocket Connected");
        setIsConnected(true);
      };

      ws.current.onclose = () => {
        console.log("WebSocket Disconnected. Attempting to reconnect...");
        setIsConnected(false);
        // Attempt to reconnect after a short delay
        setTimeout(() => {
            connect();
        }, 3000);
      };

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setFrame(data.image);
        setAlerts(data.alerts);
      };

      ws.current.onerror = (err) => {
        console.error("WebSocket Error:", err);
        ws.current.close();
      };
    };

    connect();

    // Cleanup on component unmount
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <div className="App">
      <header className="App-header">
        <h1>Live Cam Monitoring</h1>
        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          <div className="status-dot"></div>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </header>
      <main className="App-main">
        <div className="video-container">
          {frame ? (
            <img src={`data:image/jpeg;base64,${frame}`} alt="Live Feed" />
          ) : (
            <div className="loading-container">
              <p>{isConnected ? "Waiting for video stream..." : "Attempting to connect to backend..."}</p>
            </div>
          )}
        </div>
        {alerts && (
          <div className="alert-panel">
            {alerts.toddler_in_zone && <div className="alert alert-danger">ALERT: Child detected in danger zone!</div>}
            {alerts.knife_detected && <div className="alert alert-warning">WARNING: Knife detected!</div>}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
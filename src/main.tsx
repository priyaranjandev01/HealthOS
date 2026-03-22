import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { HealthOSProvider } from './context/HealthOSContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HealthOSProvider>
      <App />
    </HealthOSProvider>
  </StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration failed — offline support unavailable
    });
  });
}

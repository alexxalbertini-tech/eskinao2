import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Fix for "Cannot set property fetch... which has only a getter" error
if (typeof window !== 'undefined' && 'fetch' in window) {
  try {
    const originalFetch = window.fetch;
    // Attempt to make fetch writable/configurable if it's just a getter
    Object.defineProperty(window, 'fetch', {
      value: originalFetch,
      configurable: true,
      writable: true,
      enumerable: true
    });
  } catch (e) {
    // If it fails, it's likely already locked or we don't have permissions
    console.debug("Note: window.fetch is read-only in this environment.");
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

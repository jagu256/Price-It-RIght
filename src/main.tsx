import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { applyDisplay, loadDisplay } from './lib/display';
import './index.css';

// Apply larger text / high contrast before the first paint, so the page doesn't flash.
applyDisplay(loadDisplay());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App autoTour />
  </StrictMode>,
);

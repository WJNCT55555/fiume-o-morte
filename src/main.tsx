import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { mountRenderer } from './ui/arengo';
import { mountRenderer as mountParliament } from './ui/parliament';
import './index.css';

/* The legacy UI (src/legacy/ui) is a no-build IIFE and cannot import ES modules,
   so the few views that need one are reached through a global. Registering it
   once here, rather than inside a component, keeps it out of StrictMode's
   double-invoked effects. */
mountRenderer();
mountParliament();

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
);

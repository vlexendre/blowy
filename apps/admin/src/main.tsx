import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { config } from './config';
import { applyTheme } from './theme';
import './styles.css';

applyTheme();
// Admin de test (VITE_APP_ENV=dev) : bandeau « DEV » sur chaque écran, connexion comprise, et titre d'onglet marqué.
const dev = config.appEnv === 'dev';
if (dev) document.title = `DEV · ${document.title}`;
const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      {dev && (
        <div className="env-ribbon" role="note" aria-label="Environnement de test (dev), pas la production">
          DEV
        </div>
      )}
      <App />
    </StrictMode>,
  );
}

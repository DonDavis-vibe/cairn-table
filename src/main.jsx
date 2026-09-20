import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LangProvider } from './i18n/index.jsx';
import App from './components/App.jsx';
import './assets/fonts/fonts.css';
import './index.css';
import './theme.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LangProvider>
      <App />
    </LangProvider>
  </StrictMode>,
);

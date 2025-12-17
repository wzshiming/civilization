import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import AppSSE from './App-SSE.tsx'
import { I18nProvider } from './i18n'

// Use SSE mode if backend URL is configured, otherwise use standalone mode
const USE_SSE_MODE = import.meta.env.VITE_BACKEND_URL !== undefined;
const AppComponent = USE_SSE_MODE ? AppSSE : App;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <AppComponent />
    </I18nProvider>
  </StrictMode>,
)

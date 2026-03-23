import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.jsx'

Sentry.init({
  dsn: 'https://6d650727f43707a3a4bac6a20a9faca6@o4511066527956992.ingest.us.sentry.io/4511066880475136',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
  ],
  tracesSampleRate: 1.0,
  enableLogs: true,
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

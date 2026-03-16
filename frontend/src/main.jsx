import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/design-system.css'  // Design tokens - MUST be first
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

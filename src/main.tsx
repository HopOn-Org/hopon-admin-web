import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializeAuthentication } from './lib/keycloak/authentication'
import { AuthenticationGate } from './features/auth/authentication-gate'

// Outside StrictMode effects: a Keycloak adapter instance can init only once.
void initializeAuthentication()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthenticationGate>
      <App />
    </AuthenticationGate>
  </StrictMode>,
)

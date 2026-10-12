import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.jsx'
import { ProfileEditSessionProvider } from './features/profile-edit/ProfileEditSession.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ProfileEditSessionProvider>
        <App />
      </ProfileEditSessionProvider>
    </BrowserRouter>
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.jsx'
import { BenefitsAuthProvider } from './features/my-benefits/BenefitsAuthProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <BenefitsAuthProvider>
        <App />
      </BenefitsAuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

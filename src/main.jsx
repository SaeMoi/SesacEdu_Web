import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.jsx'
import { PaymentAuthProvider } from './features/my-payment/PaymentAuthProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <PaymentAuthProvider>
        <App />
      </PaymentAuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

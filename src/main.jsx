import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.jsx'
import { CartAuthProvider } from './features/my-cart/CartAuthProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <CartAuthProvider>
        <App />
      </CartAuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

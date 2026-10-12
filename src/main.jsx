import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.jsx'
import { QnaAuthProvider } from './features/my-qna/QnaAuthProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <QnaAuthProvider>
        <App />
      </QnaAuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

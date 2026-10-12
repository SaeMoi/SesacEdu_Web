import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.jsx'
import { MyLearningAuthProvider } from './features/my-learning/MyLearningAuthProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <MyLearningAuthProvider>
        <App />
      </MyLearningAuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

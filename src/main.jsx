import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.jsx'
import { InstructorCoursesAuthProvider } from './features/instructor-courses/InstructorCoursesAuthProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <InstructorCoursesAuthProvider>
        <App />
      </InstructorCoursesAuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.jsx'
import { InstructorCoursesAuthProvider } from './features/instructor-courses/InstructorCoursesAuthProvider.jsx'

const devInstructorToken = import.meta.env.DEV
  ? import.meta.env.VITE_DEV_INSTRUCTOR_TOKEN || null
  : null;
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <InstructorCoursesAuthProvider accessToken={devInstructorToken}>
    <App />
      </InstructorCoursesAuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

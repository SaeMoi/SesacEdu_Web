
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import App from "./App.jsx";

// 강사센터 인증 Provider
import { InstructorCoursesAuthProvider } from "./features/instructor-courses/InstructorCoursesAuthProvider.jsx";

// 마이페이지 인증 Provider
import AuthProviders from "./auth/AuthProviders.jsx";

// 개발 환경에서만 강사 테스트 토큰 사용
const devInstructorToken = import.meta.env.DEV
  ? import.meta.env.VITE_DEV_INSTRUCTOR_TOKEN || null
  : null;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProviders>
        <InstructorCoursesAuthProvider accessToken={devInstructorToken}>
          <App />
        </InstructorCoursesAuthProvider>
      </AuthProviders>
    </BrowserRouter>
  </StrictMode>,
);

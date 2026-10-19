
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import App from "./App.jsx";

// 강사센터 인증 Provider
import { InstructorCoursesAuthProvider } from "./features/instructor-courses/InstructorCoursesAuthProvider.jsx";

// 마이페이지 인증 Provider
import AuthProviders from "./auth/AuthProviders.jsx";

// 로그인 시 저장된 JWT를 강사센터에서도 사용
const savedAuth = JSON.parse(
  sessionStorage.getItem("sesacedu.auth") || "null"
);

const instructorToken =
  savedAuth?.authorization?.replace(/^Bearer\s+/i, "") || null;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProviders>
        <InstructorCoursesAuthProvider accessToken={instructorToken}>
          <App />
        </InstructorCoursesAuthProvider>
      </AuthProviders>
    </BrowserRouter>
  </StrictMode>,
);

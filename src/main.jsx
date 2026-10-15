import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import App from "./App.jsx";

// 로그인 세션의 토큰을 기존 기능별 Provider(프로필·학습·Q&A·장바구니·혜택·결제)에 전달합니다.
import AuthProviders from "./auth/AuthProviders.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProviders>
        <App />
      </AuthProviders>
    </BrowserRouter>
  </StrictMode>,
);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import App from "./App.jsx";
import { ProfileEditSessionProvider } from "./features/profile-edit/ProfileEditSession.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      {/* 프로필 수정 관련 화면에 공유 상태를 제공합니다. */}
      <ProfileEditSessionProvider>
        <App />
      </ProfileEditSessionProvider>
    </BrowserRouter>
  </StrictMode>,
);
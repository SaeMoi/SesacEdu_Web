import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import App from "./App.jsx";

import { ProfileEditSessionProvider } from "./features/profile-edit/ProfileEditSession.jsx";
import { MyLearningAuthProvider } from "./features/my-learning/MyLearningAuthProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      {/* 기존 프로필 수정 기능의 상태 공유를 유지합니다. */}
      <ProfileEditSessionProvider>
        {/* 내 학습 기능에 필요한 Context를 제공합니다. */}
        <MyLearningAuthProvider>
          <App />
        </MyLearningAuthProvider>
      </ProfileEditSessionProvider>
    </BrowserRouter>
  </StrictMode>,
);

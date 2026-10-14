import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import App from "./App.jsx";

// 기존 기능과 질문·답변 기능에 필요한 공유 상태입니다.
import { ProfileEditSessionProvider } from "./features/profile-edit/ProfileEditSession.jsx";
import { MyLearningAuthProvider } from "./features/my-learning/MyLearningAuthProvider.jsx";
import { QnaAuthProvider } from "./features/my-qna/QnaAuthProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      {/* 기존 프로필 수정과 내 학습 기능을 유지합니다. */}
      <ProfileEditSessionProvider>
        <MyLearningAuthProvider>
          {/* 내 질문·답변 기능에 공유 상태를 제공합니다. */}
          <QnaAuthProvider>
            <App />
          </QnaAuthProvider>
        </MyLearningAuthProvider>
      </ProfileEditSessionProvider>
    </BrowserRouter>
  </StrictMode>,
);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import App from "./App.jsx";

// 각 기능에 필요한 공유 상태를 제공합니다.
import { ProfileEditSessionProvider } from "./features/profile-edit/ProfileEditSession.jsx";
import { MyLearningAuthProvider } from "./features/my-learning/MyLearningAuthProvider.jsx";
import { QnaAuthProvider } from "./features/my-qna/QnaAuthProvider.jsx";
import { CartAuthProvider } from "./features/my-cart/CartAuthProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      {/* 기존 기능의 Provider를 유지합니다. */}
      <ProfileEditSessionProvider>
        <MyLearningAuthProvider>
          <QnaAuthProvider>
            {/* 장바구니 기능의 Provider를 추가합니다. */}
            <CartAuthProvider>
              <App />
            </CartAuthProvider>
          </QnaAuthProvider>
        </MyLearningAuthProvider>
      </ProfileEditSessionProvider>
    </BrowserRouter>
  </StrictMode>,
);

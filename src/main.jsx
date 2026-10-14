import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import App from "./App.jsx";

// 기존 기능에 필요한 공유 상태입니다.
import { ProfileEditSessionProvider } from "./features/profile-edit/ProfileEditSession.jsx";
import { MyLearningAuthProvider } from "./features/my-learning/MyLearningAuthProvider.jsx";
import { QnaAuthProvider } from "./features/my-qna/QnaAuthProvider.jsx";
import { CartAuthProvider } from "./features/my-cart/CartAuthProvider.jsx";
import { BenefitsAuthProvider } from "./features/my-benefits/BenefitsAuthProvider.jsx";

// 결제 기능에 필요한 공유 상태입니다.
import { PaymentAuthProvider } from "./features/my-payment/PaymentAuthProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      {/* 기존 기능의 Provider를 모두 유지합니다. */}
      <ProfileEditSessionProvider>
        <MyLearningAuthProvider>
          <QnaAuthProvider>
            <CartAuthProvider>
              <BenefitsAuthProvider>
                {/* 결제 화면에 필요한 Provider를 추가합니다. */}
                <PaymentAuthProvider>
                  <App />
                </PaymentAuthProvider>
              </BenefitsAuthProvider>
            </CartAuthProvider>
          </QnaAuthProvider>
        </MyLearningAuthProvider>
      </ProfileEditSessionProvider>
    </BrowserRouter>
  </StrictMode>,
);
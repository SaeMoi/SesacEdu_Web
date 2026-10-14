import "./App.css";
import { Route, Routes } from "react-router";

// 메인·마이페이지·공통 요소
import HomePage from "./pages/HomePage";
import MyPage from "./pages/MyPage.jsx";
import Header from "./components/navigation/Header.jsx";
import Chatbot from "./components/chatbot/Chatbot";

// 본인 확인·프로필 수정
import VerifyPasswordPage from "./features/profile-edit/VerifyPasswordPage.jsx";
import ProfileEditPage from "./features/profile-edit/ProfileEditPage.jsx";

// 내 학습·리뷰 작성
import MyLearningPage from "./features/my-learning/MyLearningPage.jsx";
import ReviewWritePage from "./features/my-learning/ReviewWritePage.jsx";

// 내 질문·답변, 장바구니, 쿠폰·포인트
import MyQnaPage from "./features/my-qna/MyQnaPage.jsx";
import MyCartPage from "./features/my-cart/MyCartPage.jsx";
import BenefitsPage from "./features/my-benefits/BenefitsPage.jsx";

// 결제 관련 화면 4개
import {
  PaymentPage,
  PaymentCompletePage,
  PaymentHistoryPage,
  PaymentDetailPage,
} from "./features/my-payment/PaymentPages.jsx";

export default function App() {
  return (
    <>
      <Routes>
        {/* 기존 화면의 주소를 유지합니다. */}
        <Route path="/" element={<HomePage />} />
        <Route path="/mypage" element={<MyPage />} />

        <Route
          path="/mypage/verify-password"
          element={<VerifyPasswordPage />}
        />
        <Route
          path="/mypage/profile"
          element={<ProfileEditPage />}
        />

        <Route
          path="/mypage/learning"
          element={<MyLearningPage />}
        />
        <Route
          path="/mypage/learning/:courseId/review"
          element={<ReviewWritePage />}
        />

        <Route path="/mypage/qna" element={<MyQnaPage />} />
        <Route path="/mypage/cart" element={<MyCartPage />} />
        <Route path="/mypage/bnf" element={<BenefitsPage />} />

        {/* B의 결제 관련 주소를 그대로 연결합니다. */}
        <Route path="/mypage/buy" element={<PaymentPage />} />
        <Route
          path="/mypage/buy/complete"
          element={<PaymentCompletePage />}
        />
        <Route
          path="/mypage/buy/history"
          element={<PaymentHistoryPage />}
        />
        <Route
          path="/mypage/buy/history/:orderId"
          element={<PaymentDetailPage />}
        />

        {/* 등록되지 않은 React 주소에 안내 화면을 표시합니다. */}
        <Route
          path="*"
          element={
            <>
              <Header />
              <main className="container">
                <section className="home-hero">
                  <h1>페이지를 찾을 수 없습니다.</h1>
                  <p className="hero-description">
                    요청한 화면은 아직 준비되지 않았거나 주소가 올바르지 않습니다.
                  </p>
                  <a className="button button-primary" href="/">
                    홈으로
                  </a>
                </section>
              </main>
            </>
          }
        />
      </Routes>

      {/* 모든 React 화면에서 공통으로 표시합니다. */}
      <Chatbot />
    </>
  );
}
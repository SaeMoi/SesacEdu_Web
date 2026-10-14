import "./App.css";
import { Route, Routes } from "react-router";

// 기존 메인·마이페이지·공통 챗봇
import HomePage from "./pages/HomePage";
import MyPage from "./pages/MyPage.jsx";
import Chatbot from "./components/chatbot/Chatbot";

// 본인 확인·프로필 수정
import VerifyPasswordPage from "./features/profile-edit/VerifyPasswordPage.jsx";
import ProfileEditPage from "./features/profile-edit/ProfileEditPage.jsx";

// 내 학습·리뷰 작성
import MyLearningPage from "./features/my-learning/MyLearningPage.jsx";
import ReviewWritePage from "./features/my-learning/ReviewWritePage.jsx";

// 내 질문·답변과 장바구니
import MyQnaPage from "./features/my-qna/MyQnaPage.jsx";
import MyCartPage from "./features/my-cart/MyCartPage.jsx";

export default function App() {
  return (
    <>
      <Routes>
        {/* 기존 화면의 경로를 유지합니다. */}
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

        {/* B의 장바구니 화면을 추가합니다. */}
        <Route path="/mypage/cart" element={<MyCartPage />} />
      </Routes>

      {/* 모든 React 화면에서 공통으로 표시합니다. */}
      <Chatbot />
    </>
  );
}

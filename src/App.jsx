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

// 내 질문·답변
import MyQnaPage from "./features/my-qna/MyQnaPage.jsx";

export default function App() {
  return (
    <>
      <Routes>
        {/* 메인과 마이페이지 */}
        <Route path="/" element={<HomePage />} />
        <Route path="/mypage" element={<MyPage />} />

        {/* 본인 확인과 프로필 수정 */}
        <Route
          path="/mypage/verify-password"
          element={<VerifyPasswordPage />}
        />
        <Route
          path="/mypage/profile"
          element={<ProfileEditPage />}
        />

        {/* 내 학습과 강의별 리뷰 작성 */}
        <Route
          path="/mypage/learning"
          element={<MyLearningPage />}
        />
        <Route
          path="/mypage/learning/:courseId/review"
          element={<ReviewWritePage />}
        />

        {/* B의 내 질문·답변 화면을 연결합니다. */}
        <Route path="/mypage/qna" element={<MyQnaPage />} />
      </Routes>

      {/* 모든 React 화면에서 공통으로 표시합니다. */}
      <Chatbot />
    </>
  );
}
import "./App.css";
import { Route, Routes } from "react-router";

// 기존 A 메인과 B 마이페이지를 유지합니다.
import HomePage from "./pages/HomePage";
import MyPage from "./pages/MyPage.jsx";
import Chatbot from "./components/chatbot/Chatbot";

// B의 프로필 수정 관련 화면을 추가합니다.
import VerifyPasswordPage from "./features/profile-edit/VerifyPasswordPage.jsx";
import ProfileEditPage from "./features/profile-edit/ProfileEditPage.jsx";

export default function App() {
  return (
    <>
      <Routes>
        {/* 기존 화면 */}
        <Route path="/" element={<HomePage />} />
        <Route path="/mypage" element={<MyPage />} />

        {/* 본인 확인과 프로필 수정 화면 */}
        <Route
          path="/mypage/verify-password"
          element={<VerifyPasswordPage />}
        />
        <Route
          path="/mypage/profile"
          element={<ProfileEditPage />}
        />
      </Routes>

      {/* 모든 React 화면에서 공통으로 표시합니다. */}
      <Chatbot />
    </>
  );
}
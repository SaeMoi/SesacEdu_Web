import "./App.css";
import { Route, Routes } from "react-router";
import HomePage from "./pages/HomePage";
import Chatbot from "./components/chatbot/Chatbot";
import MyPage from "./pages/MyPage.jsx";

export default function App() {
  return (
    <>
      {/* A의 메인과 B의 마이페이지를 주소별로 연결합니다. */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/mypage" element={<MyPage />} />
      </Routes>

      {/* 두 화면에서 공통으로 표시합니다. */}
      <Chatbot />
    </>
  );
}
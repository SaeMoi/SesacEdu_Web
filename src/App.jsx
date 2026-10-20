import "./App.css";
import { Navigate, Route, Routes } from "react-router";

// 메인·마이페이지·공통 요소
import HomePage from "./pages/HomePage.jsx";
import MyPage from "./pages/MyPage.jsx";
import Header from "./components/navigation/Header.jsx";
import Chatbot from "./components/chatbot/Chatbot.jsx";

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

// 결제 관련 화면
import {
  PaymentPage,
  PaymentCompletePage,
  PaymentHistoryPage,
  PaymentDetailPage,
} from "./features/my-payment/PaymentPages.jsx";

// 강사 신청
import InstructorApplyPage from "./features/instructor-apply/InstructorApplyPage.jsx";

// 강사센터 - 강의 관리
import {
  InstructorCoursesPage,
} from "./features/instructor-courses/InstructorCoursesPages.jsx";

// 강사센터 - 과제 피드백
import {
  InstructorAssignmentsDetailPage,
  InstructorAssignmentsListPage,
} from "./features/instructor-assignments/InstructorAssignmentsPages.jsx";

// 강사센터 - Q&A
import {
  InstructorQnaDetailPage,
  InstructorQnaListPage,
} from "./features/instructor-qna/InstructorQnaPages.jsx";

// 강사센터 - 정산 관리
import {
  InstructorSettlementDetailPage,
  InstructorSettlementListPage,
} from "./features/instructor-settlement/InstructorSettlementPages.jsx";

// 강사센터 - 강사 정보 및 쿠폰
import { InstructorProfilePage } from "./features/instructor-profile/InstructorProfilePage.jsx";
import { InstructorCouponPage } from "./features/instructor-coupons/InstructorCouponPage.jsx";

import "./features/instructor-center/instructorCenter.css";

export default function App() {
  return (
    <>
      <Routes>
        {/* 메인 */}
        <Route path="/" element={<HomePage />} />

        {/* 마이페이지 */}
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

        {/* 결제 */}
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

        {/* 강사 신청 */}
        <Route
          path="/instructor/apply"
          element={<InstructorApplyPage />}
        />

        {/* 강사센터 진입 주소: 강의 관리로 이동 */}
        <Route
          path="/instructor"
          element={<Navigate to="/instructor/lectures" replace />}
        />

        {/* 강사센터 - 강의 관리 */}
        <Route
          path="/instructor/lectures"
          element={<InstructorCoursesPage />}
        />

        {/* 강사센터 - 과제 피드백 */}
        <Route
          path="/instructor/assignments"
          element={<InstructorAssignmentsListPage />}
        />
        <Route
          path="/instructor/assignments/:assid"
          element={<InstructorAssignmentsDetailPage />}
        />

        {/* 강사센터 - Q&A */}
        <Route
          path="/instructor/qna"
          element={<InstructorQnaListPage />}
        />
        <Route
          path="/instructor/qna/:qnaid"
          element={<InstructorQnaDetailPage />}
        />

        {/* 강사센터 - 정산 관리 */}
        <Route
          path="/instructor/settlement"
          element={<InstructorSettlementListPage />}
        />
        <Route
          path="/instructor/settlement/:sid"
          element={<InstructorSettlementDetailPage />}
        />

        {/* 강사센터 - 정보 관리 */}
        <Route
          path="/instructor/profile"
          element={<InstructorProfilePage />}
        />

        {/* 강사센터 - 쿠폰 발행 */}
        <Route
          path="/instructor/coupon"
          element={<InstructorCouponPage />}
        />

        {/* 등록되지 않은 주소 */}
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

      {/* 공통 챗봇 */}
      <Chatbot />
    </>
  );
}

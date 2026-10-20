import { useEffect } from "react";
import { useLocation } from "react-router";
import { startSessionKeeper } from "./session.js";
import { useAccessToken } from "./useAccessToken.js";
import { ProfileEditSessionProvider } from "../features/profile-edit/ProfileEditSession.jsx";
import { MyLearningAuthProvider } from "../features/my-learning/MyLearningAuthProvider.jsx";
import { QnaAuthProvider } from "../features/my-qna/QnaAuthProvider.jsx";
import { CartAuthProvider } from "../features/my-cart/CartAuthProvider.jsx";
import { BenefitsAuthProvider } from "../features/my-benefits/BenefitsAuthProvider.jsx";
import { PaymentAuthProvider } from "../features/my-payment/PaymentAuthProvider.jsx";
import { InstructorApplyAuthContext } from "../features/instructor-apply/instructorApplyAuthContext.js";
import { InstructorCoursesAuthProvider } from "../features/instructor-courses/InstructorCoursesAuthProvider.jsx";

// 로그인이 필요한 React 화면 주소입니다.
const PROTECTED_PATHS = ["/mypage", "/instructor"];

// 로그인 세션의 토큰을 기존 기능별 Provider(강사 신청·강사센터 포함)에 전달합니다.
export default function AuthProviders({ children }) {
  const accessToken = useAccessToken();
  const { pathname } = useLocation();

  useEffect(() => {
    startSessionKeeper();
  }, []);

  // 로그인 화면은 JSP이므로 문서 전체를 이동합니다.
  const needsLogin =
    !accessToken &&
    PROTECTED_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    );
  useEffect(() => {
    if (needsLogin) window.location.replace("/login");
  }, [needsLogin]);

  return (
    <ProfileEditSessionProvider accessToken={accessToken}>
      <MyLearningAuthProvider accessToken={accessToken}>
        <QnaAuthProvider accessToken={accessToken}>
          <CartAuthProvider accessToken={accessToken}>
            <BenefitsAuthProvider accessToken={accessToken}>
              <PaymentAuthProvider accessToken={accessToken}>
                <InstructorApplyAuthContext.Provider value={{ accessToken }}>
                  {/* 강사센터 화면(강의·과제·Q&A·정산·정보·쿠폰)은 모두 이 토큰을 쓴다 */}
                  <InstructorCoursesAuthProvider accessToken={accessToken}>
                    {children}
                  </InstructorCoursesAuthProvider>
                </InstructorApplyAuthContext.Provider>
              </PaymentAuthProvider>
            </BenefitsAuthProvider>
          </CartAuthProvider>
        </QnaAuthProvider>
      </MyLearningAuthProvider>
    </ProfileEditSessionProvider>
  );
}

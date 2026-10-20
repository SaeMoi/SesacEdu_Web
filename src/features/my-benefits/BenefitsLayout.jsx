// 공통 사이드바와 탭으로 페이지 이동을 연결합니다.
import { MyPageSidebar, MyPageTabs } from "../../components/navigation/MyPageNavigation.jsx";
import { Link } from "react-router";

// 메인·마이페이지·JSP와 같은 공통 헤더를 사용합니다.
import Header from "../../components/navigation/Header.jsx";
export function BenefitsLayout({ children }) {
  return (
    <>
      <Header />
      <div className="benefits-layout">
        <MyPageSidebar />
        <main className="benefits-main">{children}</main>
      </div>
    </>
  );
}

export function BenefitsPageHeader() {
  return (
    <>
      <nav className="benefits-breadcrumb" aria-label="현재 위치">
        <Link to="/">사용자공간</Link>
        <span aria-hidden="true">/</span>
        <span>마이페이지</span>
      </nav>
      <header className="benefits-heading">
        <h1>쿠폰 / 포인트</h1>
        <p>보유한 혜택을 확인하고 쿠폰 코드를 등록하세요.</p>
      </header>
      <MyPageTabs active="purchase" />
    </>
  );
}

// 공통 사이드바와 탭으로 페이지 이동을 연결합니다.
import { MyPageSidebar, MyPageTabs } from "../../components/navigation/MyPageNavigation.jsx";
import { Link } from "react-router";
import Header from "../../components/navigation/Header.jsx";

export function PaymentLayout({ children }) {
  return (
    <>
      {/* 메인·마이페이지와 동일한 공통 React 헤더입니다. */}
      <Header />

      <div className="payment-layout">
        <MyPageSidebar />

        <main className="payment-main">{children}</main>
      </div>
    </>
  );
}

export function PaymentPageHeading({ title, description }) {
  return (
    <>
      <nav className="payment-breadcrumb" aria-label="현재 위치">
        <Link to="/">사용자공간</Link>
        <span aria-hidden="true">/</span>
        <span>마이페이지</span>
      </nav>

      {/* 사이트 헤더와 별개인 결제 페이지의 제목 영역입니다. */}
      <header className="payment-heading">
        <h1>{title}</h1>
        <p>{description}</p>
      </header>

      <MyPageTabs active="purchase" />
    </>
  );
}
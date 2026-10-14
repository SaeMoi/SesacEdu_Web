// 공통 사이드바와 탭으로 페이지 이동을 연결합니다.
import { MyPageSidebar, MyPageTabs } from "../../components/navigation/MyPageNavigation.jsx";
import { Link } from "react-router";

// 페이지마다 별도 헤더를 만들지 않고 공통 컴포넌트를 사용합니다.
import Header from "../../components/navigation/Header.jsx";
export function MyCartLayout({ children }) {
  return (
    <>
      <Header />
      <div className="cart-layout">
       <MyPageSidebar />
        <main className="cart-main">{children}</main>
      </div>
    </>
  );
}

export function CartPageHeader() {
  return (
    <>
      <nav className="cart-breadcrumb" aria-label="현재 위치">
        <Link to="/">사용자공간</Link>
        <span aria-hidden="true">/</span>
        <span>마이페이지</span>
      </nav>
      <header className="cart-heading">
        <h1>장바구니</h1>
        <p>선택한 강의를 확인하고 수강 신청을 진행하세요.</p>
      </header>
      <MyPageTabs active="purchase" />
    </>
  );
}

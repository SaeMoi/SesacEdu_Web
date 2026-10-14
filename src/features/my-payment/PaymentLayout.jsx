import { Link } from "react-router";
import Header from "../../components/navigation/Header.jsx";

export function PaymentLayout({ children, active = "history" }) {
  return (
    <>
      {/* 메인·마이페이지와 동일한 공통 React 헤더입니다. */}
      <Header />

      <div className="payment-layout">
        <aside className="payment-sidebar" aria-label="마이페이지 메뉴">
          <p className="payment-sidebar-eyebrow">MY PAGE</p>
          <h2>마이페이지</h2>

          <div className="payment-side-group">
            <p>프로필 관리</p>
            <span>프로필 관리</span>
          </div>

          <div className="payment-side-group">
            <p>학습</p>
            <span>내 학습</span>
            <span>내 질문</span>
            <Link
              aria-current={active === "cart" ? "page" : undefined}
              className={active === "cart" ? "is-active" : ""}
              to="/mypage/cart"
            >
              장바구니
            </Link>
          </div>

          <div className="payment-side-group">
            <p>구매 / 혜택</p>
            <span>쿠폰 / 포인트</span>
            <Link
              aria-current={active === "history" ? "page" : undefined}
              className={active === "history" ? "is-active" : ""}
              to="/mypage/buy/history"
            >
              결제 내역
            </Link>
          </div>

          <div className="payment-side-group">
            <p>강사 활동</p>
            <span>강사 신청</span>
          </div>

          <div className="payment-side-group">
            <p>고객센터</p>
            <span>공지사항</span>
          </div>
        </aside>

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

      <nav className="payment-tabs" aria-label="마이페이지 분류">
        <span>내 정보</span>
        <span>내 학습</span>
        <Link
          aria-current="page"
          className="is-active"
          to="/mypage/buy/history"
        >
          구매 / 혜택
        </Link>
        <span>질문</span>
      </nav>
    </>
  );
}
import { Link } from "react-router";

export function PaymentLayout({ children, active = "history" }) {
  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" to="/" aria-label="새싹에듀 홈">
            새싹<span>에듀</span>
          </Link>
          <nav className="main-nav" aria-label="주요 메뉴">
            <span className="nav-active">강의</span>
            <span>커뮤니티</span>
          </nav>
          <label className="payment-search">
            <span aria-hidden="true">⌕</span>
            <input aria-label="강의 검색" placeholder="어떤 배움을 찾고 있나요?" />
          </label>
          <nav className="header-actions" aria-label="사용자 메뉴">
            <span>마이페이지</span>
            <Link className="payment-cart-link" to="/mypage/cart">
              장바구니
            </Link>
          </nav>
        </div>
      </header>
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
      <header className="payment-heading">
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      <nav className="payment-tabs" aria-label="마이페이지 분류">
        <span>내 정보</span>
        <span>내 학습</span>
        <Link aria-current="page" className="is-active" to="/mypage/buy/history">
          구매 / 혜택
        </Link>
        <span>질문</span>
      </nav>
    </>
  );
}

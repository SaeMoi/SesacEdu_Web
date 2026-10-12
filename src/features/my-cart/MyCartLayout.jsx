import { Link } from "react-router";

function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" to="/" aria-label="새싹에듀 홈">
          새싹<span>에듀</span>
        </Link>
        <nav className="main-nav" aria-label="주요 메뉴">
          <span className="nav-active">강의</span>
          <span>커뮤니티</span>
        </nav>
        <label className="cart-header-search">
          <span aria-hidden="true">⌕</span>
          <input type="search" placeholder="어떤 배움을 찾고 있나요?" />
        </label>
        <nav className="header-actions" aria-label="사용자 메뉴">
          <span>마이페이지</span>
          <Link aria-current="page" className="cart-header-link" to="/mypage/cart">
            장바구니
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Sidebar() {
  return (
    <aside className="cart-sidebar" aria-label="마이페이지 메뉴">
      <p className="cart-sidebar-eyebrow">MY PAGE</p>
      <h2>마이페이지</h2>
      <section className="cart-sidebar-group">
        <p>프로필 관리</p>
        <span>프로필 관리</span>
      </section>
      <section className="cart-sidebar-group">
        <p>학습</p>
        <span>내 학습</span>
        <span>내 질문</span>
        <Link
          aria-current="page"
          className="cart-sidebar-active"
          to="/mypage/cart"
        >
          장바구니
        </Link>
      </section>
      <section className="cart-sidebar-group">
        <p>구매 / 혜택</p>
        <span>쿠폰 / 포인트</span>
        <span>결제 내역</span>
      </section>
      <section className="cart-sidebar-group">
        <p>강사 활동</p>
        <span>강사 신청</span>
      </section>
      <section className="cart-sidebar-group">
        <p>고객센터</p>
        <span>공지사항</span>
      </section>
    </aside>
  );
}

export function MyCartLayout({ children }) {
  return (
    <>
      <Header />
      <div className="cart-layout">
        <Sidebar />
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
      <nav className="cart-tabs" aria-label="마이페이지 분류">
        <span>내 정보</span>
        <span>내 학습</span>
        <Link aria-current="page" className="is-active" to="/mypage/cart">
          구매 / 혜택
        </Link>
        <span>질문</span>
      </nav>
    </>
  );
}

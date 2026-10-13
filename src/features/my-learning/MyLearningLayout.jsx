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
        <label className="learning-header-search">
          <span aria-hidden="true">⌕</span>
          <input type="search" placeholder="어떤 배움을 찾고 있나요?" />
        </label>
        <nav className="header-actions" aria-label="사용자 메뉴">
          <span>마이페이지</span>
          <span className="learning-header-cart">장바구니</span>
        </nav>
      </div>
    </header>
  );
}

function Sidebar() {
  return (
    <aside className="learning-sidebar" aria-label="마이페이지 메뉴">
      <p className="learning-sidebar-eyebrow">MY PAGE</p>
      <h2>마이페이지</h2>
      <section className="learning-sidebar-group">
        <p>프로필 관리</p>
        <span>프로필 관리</span>
      </section>
      <section className="learning-sidebar-group">
        <p>학습</p>
        <Link className="learning-sidebar-active" to="/mypage/learning">
          내 학습
        </Link>
        <span>내 질문</span>
        <span>장바구니</span>
      </section>
      <section className="learning-sidebar-group">
        <p>구매 / 혜택</p>
        <span>쿠폰 / 포인트</span>
        <span>결제 내역</span>
      </section>
      <section className="learning-sidebar-group">
        <p>강사 활동</p>
        <span>강사 신청</span>
      </section>
      <section className="learning-sidebar-group">
        <p>고객센터</p>
        <span>공지사항</span>
      </section>
    </aside>
  );
}

export function MyLearningLayout({ children }) {
  return (
    <>
      <Header />
      <div className="learning-layout">
        <Sidebar />
        <main className="learning-main">{children}</main>
      </div>
    </>
  );
}

export function LearningPageHeader({ title, description }) {
  return (
    <>
      <nav className="learning-breadcrumb" aria-label="현재 위치">
        <Link to="/">사용자공간</Link>
        <span aria-hidden="true">/</span>
        <span>마이페이지</span>
      </nav>
      <header className="learning-page-heading">
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      <nav className="learning-tabs" aria-label="마이페이지 분류">
        <span>내 정보</span>
        <Link className="is-active" to="/mypage/learning">
          내 학습
        </Link>
        <span>구매 / 혜택</span>
        <span>질문</span>
      </nav>
    </>
  );
}

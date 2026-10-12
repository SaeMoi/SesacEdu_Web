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
        <label className="qna-header-search">
          <span aria-hidden="true">⌕</span>
          <input type="search" placeholder="어떤 배움을 찾고 있나요?" />
        </label>
        <nav className="header-actions" aria-label="사용자 메뉴">
          <span>마이페이지</span>
          <span className="qna-header-cart">장바구니</span>
        </nav>
      </div>
    </header>
  );
}

function Sidebar() {
  return (
    <aside className="qna-sidebar" aria-label="마이페이지 메뉴">
      <p className="qna-sidebar-eyebrow">MY PAGE</p>
      <h2>마이페이지</h2>
      <section className="qna-sidebar-group">
        <p>프로필 관리</p>
        <span>프로필 관리</span>
      </section>
      <section className="qna-sidebar-group">
        <p>학습</p>
        <span>내 학습</span>
        <Link
          aria-current="page"
          className="qna-sidebar-active"
          to="/mypage/qna"
        >
          내 질문
        </Link>
        <span>장바구니</span>
      </section>
      <section className="qna-sidebar-group">
        <p>구매 / 혜택</p>
        <span>쿠폰 / 포인트</span>
        <span>결제 내역</span>
      </section>
      <section className="qna-sidebar-group">
        <p>강사 활동</p>
        <span>강사 신청</span>
      </section>
      <section className="qna-sidebar-group">
        <p>고객센터</p>
        <span>공지사항</span>
      </section>
    </aside>
  );
}

export function MyQnaLayout({ children }) {
  return (
    <>
      <Header />
      <div className="qna-layout">
        <Sidebar />
        <main className="qna-main">{children}</main>
      </div>
    </>
  );
}

export function QnaPageHeader() {
  return (
    <>
      <nav className="qna-breadcrumb" aria-label="현재 위치">
        <Link to="/">사용자공간</Link>
        <span aria-hidden="true">/</span>
        <span>마이페이지</span>
      </nav>
      <header className="qna-heading">
        <h1>강의 Q&amp;A 목록</h1>
        <p>질문과 답변을 확인하고 학습을 이어가세요.</p>
      </header>
      <nav className="qna-tabs" aria-label="마이페이지 분류">
        <span>내 정보</span>
        <span>내 학습</span>
        <span>구매 / 혜택</span>
        <Link aria-current="page" className="is-active" to="/mypage/qna">
          질문
        </Link>
      </nav>
    </>
  );
}

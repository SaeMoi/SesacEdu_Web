import { Link } from "react-router";

export function InstructorCoursesLayout({ children }) {
  return (
    <>
      <header className="site-header instructor-courses-header">
        <div className="container header-inner">
          <Link className="brand" to="/" aria-label="새싹에듀 홈">
            새싹<span>에듀</span>
          </Link>
          <nav className="main-nav" aria-label="주요 메뉴">
            <span className="nav-active">강의</span>
            <span>커뮤니티</span>
          </nav>
          <label className="instructor-courses-search">
            <span aria-hidden="true">⌕</span>
            <input aria-label="강의 검색" placeholder="어떤 배움을 찾고 있나요?" />
          </label>
          <nav className="header-actions" aria-label="사용자 메뉴">
            <span>강사센터</span>
            <Link className="instructor-courses-cart" to="/mypage/cart">
              장바구니
            </Link>
          </nav>
        </div>
      </header>
      <div className="instructor-courses-layout">
        <aside className="instructor-courses-sidebar" aria-label="강사센터 메뉴">
          <p className="instructor-courses-eyebrow">INSTRUCTOR</p>
          <h2>강사센터</h2>
          <section className="instructor-courses-side-group">
            <p>운영</p>
            <Link
              aria-current="page"
              className="is-active"
              to="/instructor/lectures"
            >
              강의 관리
            </Link>
          </section>
          <section className="instructor-courses-side-group">
            <p>학습 관리</p>
            <span>과제 피드백</span>
            <span>Q&amp;A 관리</span>
          </section>
          <section className="instructor-courses-side-group">
            <p>정산</p>
            <span>정산 관리</span>
          </section>
          <section className="instructor-courses-side-group">
            <p>강사 정보</p>
            <span>경력 관리</span>
            <span>강사 정보 관리</span>
          </section>
          <section className="instructor-courses-side-group">
            <p>혜택</p>
            <span>쿠폰 발행</span>
          </section>
          <section className="instructor-courses-side-group instructor-courses-customer">
            <p>고객센터</p>
            <span>공지사항</span>
          </section>
        </aside>
        <main className="instructor-courses-main">{children}</main>
      </div>
    </>
  );
}

export function InstructorCoursesHeading({ title, description }) {
  return (
    <>
      <nav className="instructor-courses-breadcrumb" aria-label="현재 위치">
        <Link to="/instructor/lectures">강사공간</Link>
        <span aria-hidden="true">/</span>
        <span>강사센터</span>
      </nav>
      <header className="instructor-courses-heading">
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      <nav className="instructor-courses-tabs" aria-label="강사센터 분류">
        <span>운영 현황</span>
        <Link
          aria-current="page"
          className="is-active"
          to="/instructor/lectures"
        >
          강의
        </Link>
        <span>학습 관리</span>
        <span>정산</span>
      </nav>
    </>
  );
}

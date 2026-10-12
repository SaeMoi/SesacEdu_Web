import { Link } from "react-router";

function SiteHeader() {
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

        <label className="header-search">
          <span aria-hidden="true">⌕</span>
          <input type="search" placeholder="어떤 배움을 찾고 있나요?" />
        </label>

        <nav className="header-actions" aria-label="사용자 메뉴">
          <Link className="header-mypage" to="/mypage">
            마이페이지
          </Link>
          <span className="header-cart">장바구니</span>
        </nav>
      </div>
    </header>
  );
}

export default SiteHeader;

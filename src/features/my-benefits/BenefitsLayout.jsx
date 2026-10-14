import { Link } from "react-router";

// 메인·마이페이지·JSP와 같은 공통 헤더를 사용합니다.
import Header from "../../components/navigation/Header.jsx";


function Sidebar() {
  return (
    <aside className="benefits-sidebar" aria-label="마이페이지 메뉴">
      <p className="benefits-sidebar-eyebrow">MY PAGE</p>
      <h2>마이페이지</h2>
      <section className="benefits-sidebar-group">
        <p>프로필 관리</p>
        <span>프로필 관리</span>
      </section>
      <section className="benefits-sidebar-group">
        <p>학습</p>
        <span>내 학습</span>
        <span>내 질문</span>
        <span>장바구니</span>
      </section>
      <section className="benefits-sidebar-group">
        <p>구매 / 혜택</p>
        <Link
          aria-current="page"
          className="benefits-sidebar-active"
          to="/mypage/bnf"
        >
          쿠폰 / 포인트
        </Link>
        <span>결제 내역</span>
      </section>
      <section className="benefits-sidebar-group">
        <p>강사 활동</p>
        <span>강사 신청</span>
      </section>
      <section className="benefits-sidebar-group">
        <p>고객센터</p>
        <span>공지사항</span>
      </section>
    </aside>
  );
}

export function BenefitsLayout({ children }) {
  return (
    <>
      <Header />
      <div className="benefits-layout">
        <Sidebar />
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
      <nav className="benefits-tabs" aria-label="마이페이지 분류">
        <span>내 정보</span>
        <span>내 학습</span>
        <Link
          aria-current="page"
          className="is-active"
          to="/mypage/bnf"
        >
          구매 / 혜택
        </Link>
        <span>질문</span>
      </nav>
    </>
  );
}

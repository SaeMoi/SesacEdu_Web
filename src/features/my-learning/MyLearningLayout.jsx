import { Link } from "react-router";

// 페이지마다 별도 헤더를 만들지 않고 공통 컴포넌트를 사용합니다.
import Header from "../../components/navigation/Header.jsx";

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

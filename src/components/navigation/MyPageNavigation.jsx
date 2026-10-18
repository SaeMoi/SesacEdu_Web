import { NavLink } from "react-router";
import "./MyPageNavigation.css";

// 실제로 통합한 화면만 메뉴에 연결합니다.
const menuGroups = [
  {
    title: "프로필 관리",
    items: [
      { label: "프로필 관리", to: "/mypage", end: true },
    ],
  },
  {
    title: "학습",
    items: [
      { label: "내 학습", to: "/mypage/learning" },
      { label: "내 질문", to: "/mypage/qna" },
      { label: "장바구니", to: "/mypage/cart" },
    ],
  },
  {
    title: "구매 / 혜택",
    items: [
      { label: "쿠폰 / 포인트", to: "/mypage/bnf" },
      { label: "결제 내역", to: "/mypage/buy/history" },
    ],
  },
  {
    title: "강사 활동",
    items: [
      { label: "강사 신청", to: "/instructor/apply" },
    ],
  },
];

export function MyPageSidebar() {
  return (
    <aside className="shared-mypage-sidebar" aria-label="마이페이지 메뉴">
      <p className="shared-mypage-eyebrow">MY PAGE</p>
      <h2>마이페이지</h2>

      {menuGroups.map((group) => (
        <section className="shared-mypage-group" key={group.title}>
          <h3>{group.title}</h3>

          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `shared-mypage-link${isActive ? " is-active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </section>
      ))}

      <section className="shared-mypage-group">
        <h3>고객센터</h3>
        {/* 아직 연결할 화면이 없으므로 링크처럼 표시하지 않습니다. */}
        <span className="shared-mypage-unavailable">
          공지사항 · 준비 중
        </span>
      </section>
    </aside>
  );
}

// 상위 분류의 선택 상태는 각 화면에서 명시적으로 전달합니다.
const tabs = [
  { key: "profile", label: "내 정보", to: "/mypage" },
  { key: "learning", label: "내 학습", to: "/mypage/learning" },
  { key: "purchase", label: "구매 / 혜택", to: "/mypage/cart" },
  { key: "qna", label: "질문", to: "/mypage/qna" },
];

export function MyPageTabs({ active }) {
  return (
    <nav className="shared-mypage-tabs" aria-label="마이페이지 분류">
      {tabs.map((tab) => (
        <NavLink
          key={tab.key}
          to={tab.to}
          className={`shared-mypage-tab${
            active === tab.key ? " is-active" : ""
          }`}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import { getBasicProfile } from "../../api/profile.js";
import { useAccessToken } from "../../auth/useAccessToken.js";
import { resolveApiAssetUrl } from "../../auth/session.js";
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

const roleLabels = {
  GENERAL: "일반",
  STUDENT: "학습자",
  INSTRUCTOR: "강사",
  ADMIN: "관리자",
  INSTRUCTOR_PENDING: "강사 신청 대기",
};

// GET /mypage/basic_profile 로 사이드바 상단에 이름·사진·권한·포인트를 표시합니다.
// 불러오지 못하면 카드만 숨기고 메뉴는 그대로 둡니다.
function SidebarProfileCard() {
  const accessToken = useAccessToken();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!accessToken) return undefined;
    const controller = new AbortController();
    getBasicProfile({ accessToken, signal: controller.signal })
      .then(setProfile)
      .catch((error) => {
        if (error.name !== "AbortError") setProfile(null);
      });
    return () => controller.abort();
  }, [accessToken]);

  if (!accessToken || !profile) return null;

  const displayName =
    (typeof profile.nickname === "string" && profile.nickname.trim()) ||
    (typeof profile.name === "string" && profile.name.trim()) ||
    "회원";
  const imageUrl = resolveApiAssetUrl(profile.profileImageUrl);
  const role = roleLabels[profile.role] ?? profile.role;
  const point = Number.isFinite(profile.point) ? profile.point : 0;

  return (
    <section className="shared-mypage-profile" aria-label="내 기본 프로필">
      {imageUrl ? (
        <img className="shared-mypage-avatar" src={imageUrl} alt="" />
      ) : (
        <div className="shared-mypage-avatar is-fallback" aria-hidden="true">
          {displayName.slice(0, 1)}
        </div>
      )}
      <div className="shared-mypage-profile-text">
        <strong>{displayName}</strong>
        {role && <span className="shared-mypage-role">{role}</span>}
        <NavLink className="shared-mypage-point" to="/mypage/bnf">
          포인트 {point.toLocaleString("ko-KR")}P
        </NavLink>
      </div>
    </section>
  );
}

export function MyPageSidebar() {
  return (
    <aside className="shared-mypage-sidebar" aria-label="마이페이지 메뉴">
      <p className="shared-mypage-eyebrow">MY PAGE</p>
      <h2>마이페이지</h2>

      <SidebarProfileCard />

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
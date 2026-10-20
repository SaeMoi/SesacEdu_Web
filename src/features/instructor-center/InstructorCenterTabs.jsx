import { Link, useLocation } from "react-router";

// 강사센터 상단 분류 탭. 각 탭은 왼쪽 메뉴 그룹의 첫 화면으로 이동합니다.
// 운영 현황 전용 화면이 아직 없어 강사 정보 관리로 연결합니다.
const TABS = [
  { label: "운영 현황", to: "/instructor/profile", paths: ["/instructor/profile"] },
  {
    label: "강의",
    to: "/instructor/lectures",
    paths: ["/instructor/lectures", "/instructor/coupon"],
  },
  {
    label: "학습 관리",
    to: "/instructor/assignments",
    paths: ["/instructor/assignments", "/instructor/qna"],
  },
  { label: "정산", to: "/instructor/settlement", paths: ["/instructor/settlement"] },
];

function isUnder(pathname, path) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function InstructorCenterTabs({ className }) {
  const { pathname } = useLocation();
  return (
    <nav className={className} aria-label="강사센터 분류">
      {TABS.map(({ label, to, paths }) => {
        const active = paths.some((path) => isUnder(pathname, path));
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={active ? "is-active" : undefined}
            key={to}
            to={to}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

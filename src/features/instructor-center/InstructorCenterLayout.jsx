import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import Header from "../../components/navigation/Header.jsx";

const MENU_ITEMS = [
  { label: "강의 관리", to: "/instructor/lectures" },
  { label: "과제 피드백", to: "/instructor/assignments" },
  { label: "Q&A 관리", to: "/instructor/qna" },
  { label: "정산 관리", to: "/instructor/settlement" },
  { label: "강사 정보 관리", to: "/instructor/profile" },
  { label: "쿠폰 발행", to: "/instructor/coupon" },
];

const LAYOUT_STYLES = {
  assignments: {
    app: "assignment-app",
    workspace: "assignment-workspace",
    sidebar: "assignment-sidebar",
    eyebrow: "assignment-sidebar-eyebrow",
    group: "assignment-menu-group",
    groupHeading: "span",
    footer: "assignment-sidebar-footer",
    main: "assignment-main",
    breadcrumb: "assignment-breadcrumb",
  },
  courses: {
    workspace: "instructor-courses-layout",
    sidebar: "instructor-courses-sidebar",
    eyebrow: "instructor-courses-eyebrow",
    group: "instructor-courses-side-group",
    groupHeading: "p",
    footer: "instructor-courses-side-group instructor-courses-customer",
    footerHeading: "고객센터",
    main: "instructor-courses-main",
    breadcrumb: "instructor-courses-breadcrumb",
  },
  qna: {
    app: "instructor-qna-app",
    workspace: "instructor-qna-workspace",
    sidebar: "instructor-qna-sidebar",
    eyebrow: "instructor-qna-eyebrow",
    group: "instructor-qna-side-group",
    groupHeading: "p",
    footer: "instructor-qna-sidebar-footer",
    main: "instructor-qna-main",
    breadcrumb: "instructor-qna-breadcrumb",
  },
  settlement: {
    app: "instructor-settlement-app",
    workspace: "instructor-settlement-workspace",
    sidebar: "instructor-settlement-sidebar",
    eyebrow: "instructor-settlement-eyebrow",
    group: "instructor-settlement-side-group",
    groupHeading: "p",
    footer: "instructor-settlement-sidebar-footer",
    main: "instructor-settlement-main",
    breadcrumb: "instructor-settlement-breadcrumb",
  },
  profile: {
    app: "instructor-profile-app",
    workspace: "instructor-profile-workspace",
    sidebar: "instructor-profile-sidebar",
    eyebrow: "instructor-profile-eyebrow",
    group: "instructor-profile-side-group",
    groupHeading: "p",
    footer: "instructor-profile-sidebar-footer",
    main: "instructor-profile-main",
    breadcrumb: "instructor-profile-breadcrumb",
  },
  coupons: {
    app: "instructor-coupons-app",
    workspace: "instructor-coupons-workspace",
    sidebar: "instructor-coupons-sidebar",
    eyebrow: "instructor-coupons-eyebrow",
    group: "instructor-coupons-side-group",
    groupHeading: "p",
    footer: "instructor-coupons-sidebar-footer",
    main: "instructor-coupons-main",
    breadcrumb: "instructor-coupons-breadcrumb",
  },
};

const MENU_GROUPS = [
  { heading: "운영", items: [MENU_ITEMS[0]] },
  { heading: "학습 관리", items: MENU_ITEMS.slice(1, 3) },
  { heading: "정산", items: [MENU_ITEMS[3]] },
  {
    heading: "강사 정보",
    items: [MENU_ITEMS[4]],
  },
  { heading: "혜택", items: [MENU_ITEMS[5]] },
];

export function InstructorCenterLayout({ children, variant }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const styles = LAYOUT_STYLES[variant];
  const location = useLocation();
  const navigate = useNavigate();
  const currentMenu = MENU_ITEMS.find(
    ({ to }) =>
      location.pathname === to || location.pathname.startsWith(`${to}/`),
  );
  const GroupHeading = styles.groupHeading;
  const layout = (
    <>
      <div
        className="instructor-center-common-header"
        onClickCapture={(event) => {
          if (!(event.target instanceof Element)) return;
          const anchor = event.target.closest("a");
          if (!anchor) return;
          const destination = new URL(anchor.href, window.location.href);
          if (
            destination.origin !== window.location.origin ||
            destination.pathname !== "/"
          ) {
            return;
          }
          event.preventDefault();
          navigate(`${destination.pathname}${destination.search}${destination.hash}`);
        }}
      >
        <Header />
      </div>

      <div className={`${styles.workspace} instructor-center-workspace`}>
        <aside
          className={`${styles.sidebar} instructor-center-sidebar${mobileMenuOpen ? " is-open" : ""}`}
          aria-label="강사센터 메뉴"
        >
          <button
            aria-expanded={mobileMenuOpen}
            className="instructor-center-mobile-menu-toggle"
            onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
            type="button"
          >
            <span>강사센터 메뉴</span>
            <span aria-hidden="true">{mobileMenuOpen ? "−" : "+"}</span>
          </button>
          <p
            className={`${styles.eyebrow} instructor-center-sidebar-eyebrow`}
          >
            INSTRUCTOR
          </p>
          <h2 className="instructor-center-sidebar-title">강사센터</h2>
          {MENU_GROUPS.map(({ heading, items }) => (
            <section
              className={`${styles.group} instructor-center-menu-group`}
              key={heading}
            >
              <GroupHeading className="instructor-center-menu-heading">
                {heading}
              </GroupHeading>
              {items.map((item) =>
                item.disabled ? (
                  <span aria-disabled="true" key={item.label}>
                    {item.label}
                  </span>
                ) : (
                  <NavLink
                    className={({ isActive }) =>
                      isActive ? "is-active" : undefined
                    }
                    key={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    to={item.to}
                  >
                    {item.label}
                  </NavLink>
                ),
              )}
            </section>
          ))}
          <div className={styles.footer}>
            {styles.footerHeading && <p>{styles.footerHeading}</p>}
            {styles.footerHeading ? (
              <span aria-disabled="true">공지사항</span>
            ) : (
              <>
                <span aria-disabled="true">고객센터</span>
                <span aria-disabled="true">공지사항</span>
              </>
            )}
          </div>
        </aside>

        <main className={`${styles.main} instructor-center-main`}>
          <nav
            className={`${styles.breadcrumb} instructor-center-breadcrumb`}
            aria-label="현재 위치"
          >
            <Link to={currentMenu?.to ?? "/instructor/lectures"}>강사공간</Link>
            <span aria-hidden="true">/</span>
            <span>강사센터</span>
          </nav>
          {children}
        </main>
      </div>
    </>
  );

  const content = styles.app ? <div className={styles.app}>{layout}</div> : layout;
  return (
    <div className={`instructor-center-shell instructor-center-${variant}`}>
      {content}
    </div>
  );
}

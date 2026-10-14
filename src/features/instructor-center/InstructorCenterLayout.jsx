import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import logoUrl from "../../assets/saesak-edu-logo.png";

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
    header: "assignment-header",
    brand: "assignment-brand",
    globalNav: "assignment-global-nav",
    headerActions: "assignment-header-actions",
    search: "assignment-search",
    cart: "assignment-cart",
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
    header: "site-header instructor-courses-header",
    headerInner: "header-inner",
    brand: "brand",
    globalNav: "main-nav",
    globalNavActive: "nav-active",
    headerActions: "header-actions",
    search: "instructor-courses-search",
    cart: "instructor-courses-cart",
    cartTo: "/mypage/cart",
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
    header: "instructor-qna-header",
    brand: "instructor-qna-brand",
    globalNav: "instructor-qna-global-nav",
    headerActions: "instructor-qna-header-actions",
    search: "instructor-qna-search",
    cart: "instructor-qna-cart",
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
    header: "instructor-settlement-header",
    brand: "instructor-settlement-brand",
    globalNav: "instructor-settlement-global-nav",
    headerActions: "instructor-settlement-header-actions",
    search: "instructor-settlement-search",
    cart: "instructor-settlement-cart",
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
    header: "instructor-profile-header",
    brand: "instructor-profile-brand",
    globalNav: "instructor-profile-global-nav",
    headerActions: "instructor-profile-header-actions",
    search: "instructor-profile-search",
    cart: "instructor-profile-cart",
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
    header: "instructor-coupons-header",
    brand: "instructor-coupons-brand",
    globalNav: "instructor-coupons-global-nav",
    headerActions: "instructor-coupons-header-actions",
    search: "instructor-coupons-search",
    cart: "instructor-coupons-cart",
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

function InstructorCenterLogo({ className }) {
  return (
    <Link className={className} to="/" aria-label="새싹에듀 홈">
      <img alt="" src={logoUrl} />
    </Link>
  );
}

export function InstructorCenterLayout({ children, variant }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const styles = LAYOUT_STYLES[variant];
  const location = useLocation();
  const currentMenu = MENU_ITEMS.find(
    ({ to }) =>
      location.pathname === to || location.pathname.startsWith(`${to}/`),
  );
  const GroupHeading = styles.groupHeading;
  const headerContent = (
    <>
      <InstructorCenterLogo className={styles.brand} />
      <nav className={styles.globalNav} aria-label="주요 메뉴">
        <span aria-disabled="true" className={styles.globalNavActive}>
          강의
        </span>
        <span aria-disabled="true">커뮤니티</span>
      </nav>
      <div className={styles.headerActions}>
        <label className={styles.search}>
          <span aria-hidden="true">⌕</span>
          <input aria-label="강의 검색" placeholder="어떤 배움을 찾고 있나요?" />
        </label>
        <span>강사센터</span>
        {styles.cartTo ? (
          <Link className={styles.cart} to={styles.cartTo}>
            장바구니
          </Link>
        ) : (
          <span aria-disabled="true" className={styles.cart}>
            장바구니
          </span>
        )}
      </div>
    </>
  );
  const layout = (
    <>
      <header className={`${styles.header} instructor-center-header`}>
        <div
          className={`${styles.headerInner ?? ""} instructor-center-header-inner`}
        >
          {headerContent}
        </div>
      </header>

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
          <p className={styles.eyebrow}>INSTRUCTOR</p>
          <h2>강사센터</h2>
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

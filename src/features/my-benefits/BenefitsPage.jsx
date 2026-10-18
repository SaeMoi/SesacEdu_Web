import { useEffect, useRef, useState } from "react";
import { useBenefitsAuth } from "./benefitsAuthContext.js";
import {
  getBenefits,
  getBenefitsErrorMessage,
  getCouponRegistrationErrorMessage,
  registerCoupon,
} from "./benefitsApi.js";
import { BenefitsLayout, BenefitsPageHeader } from "./BenefitsLayout.jsx";
import "./myBenefits.css";

const PAGE_SIZE = 10;
const numberFormat = new Intl.NumberFormat("ko-KR");

function formatNumber(value) {
  return Number.isFinite(value) ? numberFormat.format(value) : "—";
}

function formatDate(value) {
  if (typeof value !== "string") return "—";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : "—";
}

function normalizeCouponCode(value) {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

function isValidCouponCode(value) {
  return /^[A-Z0-9]{12,16}$/.test(value);
}

function BenefitsPage() {
  const { accessToken } = useBenefitsAuth();
  const [pageNumber, setPageNumber] = useState(0);
  const [benefits, setBenefits] = useState(null);
  const [loadState, setLoadState] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [couponMessageType, setCouponMessageType] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [retry, setRetry] = useState(0);
  const requestSequence = useRef(0);
  const registerLock = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const sequence = requestSequence.current + 1;
    requestSequence.current = sequence;

    getBenefits(accessToken, pageNumber, PAGE_SIZE, controller.signal)
      .then((result) => {
        if (controller.signal.aborted || sequence !== requestSequence.current) {
          return;
        }
        setBenefits(result);
        setLoadState("success");
        setLoadError("");
      })
      .catch((error) => {
        if (
          error.name === "AbortError" ||
          controller.signal.aborted ||
          sequence !== requestSequence.current
        ) {
          return;
        }
        setLoadError(getBenefitsErrorMessage(error));
        setLoadState("error");
      });

    return () => controller.abort();
  }, [accessToken, pageNumber, retry]);

  const summary = benefits?.summary ?? {};
  const coupons = Array.isArray(benefits?.coupons) ? benefits.coupons : [];
  const page = benefits?.page;
  const totalPages =
    Number.isInteger(page?.totalPages) && page.totalPages > 0
      ? page.totalPages
      : 0;
  const currentPage =
    Number.isInteger(page?.number) && page.number >= 0
      ? page.number
      : pageNumber;
  const firstVisiblePage = Math.max(
    0,
    Math.min(currentPage - 2, totalPages - 5),
  );
  const visiblePages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => firstVisiblePage + index,
  );

  function changePage(nextPage) {
    if (nextPage < 0 || nextPage >= totalPages || nextPage === currentPage) {
      return;
    }
    setLoadState("loading");
    setPageNumber(nextPage);
  }

  async function handleCouponRegistration(event) {
    event.preventDefault();
    if (registerLock.current || isRegistering) return;

    setCouponMessage("");
    setCouponMessageType("");
    const normalizedCode = normalizeCouponCode(couponCode.trim());
    if (!normalizedCode) {
      setCouponMessage("쿠폰 코드를 입력하세요.");
      setCouponMessageType("error");
      return;
    }
    if (!isValidCouponCode(normalizedCode)) {
      setCouponMessage(
        "쿠폰 코드는 영문 대문자와 숫자 12~16자로 입력해주세요.",
      );
      setCouponMessageType("error");
      return;
    }

    registerLock.current = true;
    setIsRegistering(true);
    try {
      await registerCoupon(accessToken, normalizedCode);
      setCouponCode("");
      setCouponMessage("쿠폰이 등록되었습니다.");
      setCouponMessageType("success");
      setLoadState("loading");
      setPageNumber(0);
      setRetry((value) => value + 1);
    } catch (error) {
      setCouponMessage(getCouponRegistrationErrorMessage(error));
      setCouponMessageType("error");
    } finally {
      registerLock.current = false;
      setIsRegistering(false);
    }
  }

  function retryBenefits() {
    setLoadError("");
    setLoadState("loading");
    setRetry((value) => value + 1);
  }

  return (
    <BenefitsLayout>
      <BenefitsPageHeader />

      {loadState === "loading" && (
        <p className="benefits-state-message" role="status">
          혜택 정보를 불러오는 중입니다.
        </p>
      )}

      {loadState === "error" && (
        <section
          className="benefits-state-message benefits-state-error"
          role="alert"
        >
          <p>{loadError}</p>
          <button
            className="benefits-retry-button"
            onClick={retryBenefits}
            type="button"
          >
            다시 시도
          </button>
        </section>
      )}

      {loadState === "success" && (
        <>
          <section className="benefits-summary" aria-label="보유 혜택">
            <article className="benefits-summary-card coupon-summary-card">
              <h2>보유 쿠폰</h2>
              <p>
                {Number.isFinite(summary.availableCouponCount)
                  ? `${formatNumber(summary.availableCouponCount)}장`
                  : "—"}
              </p>
            </article>
            <article className="benefits-summary-card point-summary-card">
              <h2>보유 포인트</h2>
              <p>
                {Number.isFinite(summary.pointBalance)
                  ? `${formatNumber(summary.pointBalance)} P`
                  : "—"}
              </p>
            </article>
          </section>

          <form
            className="coupon-register-form"
            onSubmit={handleCouponRegistration}
          >
            <label htmlFor="benefits-coupon-code">쿠폰 코드 등록</label>
            <div className="coupon-register-controls">
              <input
                autoComplete="off"
                id="benefits-coupon-code"
                maxLength={32}
                onChange={(event) => {
                  setCouponCode(event.target.value);
                  setCouponMessage("");
                  setCouponMessageType("");
                }}
                placeholder="쿠폰 코드를 입력하세요"
                value={couponCode}
              />
              <button disabled={isRegistering} type="submit">
                {isRegistering ? "등록 중..." : "등록"}
              </button>
            </div>
            {couponMessage && (
              <p
                className={`coupon-register-message is-${couponMessageType}`}
                role={couponMessageType === "error" ? "alert" : "status"}
              >
                {couponMessage}
              </p>
            )}
          </form>

          {coupons.length > 0 ? (
            <div className="benefits-table-scroll">
              <table className="benefits-table">
                <thead>
                  <tr>
                    <th scope="col">쿠폰명</th>
                    <th scope="col">할인액</th>
                    <th scope="col">적용 강의</th>
                    <th scope="col">만료일</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon.couponId}>
                      <td className="benefits-coupon-name">
                        {typeof coupon.name === "string" && coupon.name.trim()
                          ? coupon.name
                          : "쿠폰 정보 없음"}
                      </td>
                      <td>
                        {Number.isFinite(coupon.discountValue)
                          ? `${formatNumber(coupon.discountValue)}원 할인`
                          : "—"}
                      </td>
                      <td>
                        {typeof coupon.targetCourse?.title === "string" &&
                        coupon.targetCourse.title.trim()
                          ? coupon.targetCourse.title
                          : "전체 강의"}
                      </td>
                      <td>
                        <time dateTime={coupon.expiresAt}>
                          {formatDate(coupon.expiresAt)}
                        </time>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="benefits-empty-message">
              사용 가능한 쿠폰이 없습니다.
            </p>
          )}

          {totalPages > 1 && (
            <nav className="benefits-pagination" aria-label="페이지 이동">
              <button
                aria-label="이전 페이지"
                disabled={currentPage <= 0}
                onClick={() => changePage(currentPage - 1)}
                type="button"
              >
                ‹
              </button>
              {visiblePages.map((pageIndex) => (
                <button
                  aria-current={currentPage === pageIndex ? "page" : undefined}
                  className={currentPage === pageIndex ? "is-current" : ""}
                  key={pageIndex}
                  onClick={() => changePage(pageIndex)}
                  type="button"
                >
                  {pageIndex + 1}
                </button>
              ))}
              <button
                aria-label="다음 페이지"
                disabled={!page?.hasNext || currentPage >= totalPages - 1}
                onClick={() => changePage(currentPage + 1)}
                type="button"
              >
                ›
              </button>
            </nav>
          )}
        </>
      )}
    </BenefitsLayout>
  );
}

export default BenefitsPage;

import { useEffect, useMemo, useRef, useState } from "react";
import { useCartAuth } from "./cartAuthContext.js";
import {
  deleteCartCourses,
  getCart,
  getCartErrorMessage,
} from "./cartApi.js";
import { CartPageHeader, MyCartLayout } from "./MyCartLayout.jsx";
import "./myCart.css";

const PAGE_SIZE = 10;
const currency = new Intl.NumberFormat("ko-KR");
const EMPTY_ITEMS = [];

function formatWon(value) {
  return `${currency.format(Number.isFinite(value) ? value : 0)}원`;
}

function MyCartPage() {
  const { accessToken } = useCartAuth();
  const [cart, setCart] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [pageNumber, setPageNumber] = useState(0);
  const [loadState, setLoadState] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [retry, setRetry] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCheckoutNotice, setIsCheckoutNotice] = useState(false);
  const selectAllRef = useRef(null);
  const deleteLockRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    getCart(accessToken, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setCart(result);
        const ids = new Set(
          result.items
            .filter(
              (item) => Number.isInteger(item?.courseId) && item.courseId > 0,
            )
            .map((item) => item.courseId),
        );
        setSelectedIds((current) => {
          const next = new Set();
          for (const courseId of current) {
            if (ids.has(courseId)) next.add(courseId);
          }
          return next;
        });
        setLoadState("success");
      })
      .catch((error) => {
        if (error.name === "AbortError" || controller.signal.aborted) return;
        setErrorMessage(getCartErrorMessage(error));
        setLoadState("error");
      });
    return () => controller.abort();
  }, [accessToken, retry]);

  const items = Array.isArray(cart?.items) ? cart.items : EMPTY_ITEMS;
  const purchasableIds = useMemo(
    () =>
      items
        .filter(
          (item) =>
            item?.purchasable === true &&
            Number.isInteger(item?.courseId) &&
            item.courseId > 0,
        )
        .map((item) => item.courseId),
    [items],
  );
  const selectedPurchasableIds = purchasableIds.filter((courseId) =>
    selectedIds.has(courseId),
  );
  const selectedCount = selectedPurchasableIds.length;
  const allPurchasableSelected =
    purchasableIds.length > 0 && selectedCount === purchasableIds.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selectedCount > 0 && !allPurchasableSelected;
    }
  }, [allPurchasableSelected, selectedCount]);

  const selectedAmount = items.reduce((total, item) => {
    if (
      item?.purchasable !== true ||
      !selectedIds.has(item.courseId) ||
      !Number.isFinite(item.price)
    ) {
      return total;
    }
    return total + item.price;
  }, 0);

  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const safePageNumber =
    totalPages === 0 ? 0 : Math.min(pageNumber, totalPages - 1);
  const visibleItems = items.slice(
    safePageNumber * PAGE_SIZE,
    (safePageNumber + 1) * PAGE_SIZE,
  );

  function toggleCourse(courseId, checked) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(courseId);
      else next.delete(courseId);
      return next;
    });
    setNotice("");
  }

  function toggleAll(checked) {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const courseId of purchasableIds) {
        if (checked) next.add(courseId);
        else next.delete(courseId);
      }
      return next;
    });
    setNotice("");
  }

  async function removeCourses(courseIds) {
    if (deleteLockRef.current || isDeleting) return;
    if (!courseIds.length) {
      setNotice("삭제할 강의를 선택해주세요.");
      return;
    }

    deleteLockRef.current = true;
    setIsDeleting(true);
    setNotice("");
    try {
      const result = await deleteCartCourses(accessToken, courseIds);
      setSelectedIds((current) => {
        const next = new Set(current);
        for (const courseId of courseIds) next.delete(courseId);
        return next;
      });
      setNotice(`강의 ${result.deletedCount}개를 장바구니에서 삭제했습니다.`);
      setLoadState("loading");
      setRetry((current) => current + 1);
    } catch (error) {
      setNotice(getCartErrorMessage(error));
    } finally {
      deleteLockRef.current = false;
      setIsDeleting(false);
    }
  }

  function retryCart() {
    setErrorMessage("");
    setLoadState("loading");
    setRetry((current) => current + 1);
  }

  function handleCheckout() {
    if (!selectedPurchasableIds.length) return;
    setIsCheckoutNotice(true);
  }

  return (
    <MyCartLayout>
      <CartPageHeader />

      {notice && (
        <p className="cart-notice" role="status">
          {notice}
        </p>
      )}

      {isCheckoutNotice && (
        <p className="cart-notice" role="status">
          결제 페이지 연동이 필요합니다. 결제 요청은 전송되지 않았습니다.
        </p>
      )}

      {loadState === "loading" && (
        <p className="cart-state-message" role="status">
          장바구니를 불러오는 중입니다.
        </p>
      )}

      {loadState === "error" && (
        <section className="cart-state-message cart-state-error" role="alert">
          <p>{errorMessage}</p>
          <button
            className="cart-retry-button"
            onClick={retryCart}
            type="button"
          >
            다시 시도
          </button>
        </section>
      )}

      {loadState === "success" && (
        <>
          <section className="cart-list-tools" aria-label="장바구니 관리">
            <label className="cart-select-all">
              <input
                checked={allPurchasableSelected}
                disabled={!purchasableIds.length || isDeleting}
                onChange={(event) => toggleAll(event.target.checked)}
                ref={selectAllRef}
                type="checkbox"
              />
              <span>전체 선택</span>
            </label>
            <button
              className="cart-delete-selected"
              disabled={isDeleting}
              onClick={() => removeCourses(selectedPurchasableIds)}
              type="button"
            >
              선택 삭제
            </button>
          </section>

          {items.length === 0 ? (
            <p className="cart-state-message">
              장바구니에 담긴 강의가 없습니다.
            </p>
          ) : (
            <>
              <div className="cart-table-scroll">
                <table className="cart-table">
                  <thead>
                    <tr>
                      <th className="cart-select-column" scope="col">
                        선택
                      </th>
                      <th scope="col">강의</th>
                      <th className="cart-price-column" scope="col">
                        가격
                      </th>
                      <th className="cart-manage-column" scope="col">
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleItems.map((item) => {
                      const validCourseId =
                        Number.isInteger(item?.courseId) && item.courseId > 0;
                      const title =
                        typeof item?.title === "string" && item.title.trim()
                          ? item.title
                          : "강의 정보 없음";
                      const purchasable = item?.purchasable === true;
                      return (
                        <tr key={item.courseId}>
                          <td className="cart-select-column">
                            <input
                              aria-label={`${title} 선택`}
                              checked={
                                validCourseId && selectedIds.has(item.courseId)
                              }
                              disabled={
                                !validCourseId || !purchasable || isDeleting
                              }
                              onChange={(event) =>
                                toggleCourse(item.courseId, event.target.checked)
                              }
                              type="checkbox"
                            />
                          </td>
                          <td className="cart-course-cell">
                            <span>{title}</span>
                            {!purchasable && (
                              <small>현재 구매할 수 없는 강의입니다.</small>
                            )}
                          </td>
                          <td className="cart-price-column">
                            {formatWon(item.price)}
                          </td>
                          <td className="cart-manage-column">
                            <button
                              className="cart-delete-item"
                              disabled={isDeleting || !validCourseId}
                              onClick={() => removeCourses([item.courseId])}
                              type="button"
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <nav className="cart-pagination" aria-label="페이지 이동">
                  <button
                    aria-label="이전 페이지"
                    disabled={safePageNumber === 0}
                    onClick={() => setPageNumber(Math.max(0, safePageNumber - 1))}
                    type="button"
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, index) => (
                    <button
                      aria-current={
                        safePageNumber === index ? "page" : undefined
                      }
                      className={
                        safePageNumber === index ? "is-current" : ""
                      }
                      key={index}
                      onClick={() => setPageNumber(index)}
                      type="button"
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    aria-label="다음 페이지"
                    disabled={safePageNumber >= totalPages - 1}
                    onClick={() =>
                      setPageNumber(Math.min(totalPages - 1, safePageNumber + 1))
                    }
                    type="button"
                  >
                    ›
                  </button>
                </nav>
              )}
            </>
          )}

          <section className="cart-summary" aria-label="결제 금액 요약">
            <div>
              <span>상품 금액</span>
              <strong>{formatWon(selectedAmount)}</strong>
            </div>
            <div>
              <span>할인</span>
              <strong>{formatWon(0)}</strong>
            </div>
            <div>
              <span>결제 예정</span>
              <strong>{formatWon(selectedAmount)}</strong>
            </div>
          </section>
          <div className="cart-checkout-actions">
            <button
              className="cart-checkout-button"
              disabled={!selectedCount || isDeleting}
              onClick={handleCheckout}
              type="button"
            >
              선택 강의 결제
            </button>
          </div>
          {Number.isFinite(cart?.summary?.itemCount) && (
            <p className="cart-total-count">
              장바구니 전체 {cart.summary.itemCount}개
            </p>
          )}
        </>
      )}
    </MyCartLayout>
  );
}

export default MyCartPage;

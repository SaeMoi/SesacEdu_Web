import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { PaymentLayout, PaymentPageHeading } from "./PaymentLayout.jsx";
import { usePaymentAuth } from "./paymentAuthContext.js";
import {
  createOrder,
  getPaymentDetail,
  getPaymentHistory,
  getPaymentInitial,
  paymentErrorMessage,
  previewCoupon,
  previewPoints,
  submitPayment,
  PaymentApiError,
} from "./paymentApi.js";
import "./myPayment.css";

const PAGE_SIZE = 10;
const moneyFormat = new Intl.NumberFormat("ko-KR");

function formatWon(value) {
  return Number.isFinite(value) ? `${moneyFormat.format(value)}원` : "—";
}

function safeAmount(...values) {
  return values.find((value) => Number.isInteger(value) && value >= 0) ?? null;
}

function summaryAmounts(summary = {}) {
  return {
    product:
      safeAmount(
        summary.productAmount,
        summary.productPrice,
        summary.itemAmount,
      ) ?? null,
    coupon:
      safeAmount(
        summary.couponDiscount,
        summary.couponDiscountAmount,
        summary.discountAmount,
      ) ?? null,
    points:
      safeAmount(
        summary.pointDiscount,
        summary.pointAmount,
        summary.usedPoint,
        summary.usePoint,
      ) ?? null,
    final:
      safeAmount(
        summary.finalAmount,
        summary.paymentAmount,
        summary.totalAmount,
      ) ?? null,
  };
}

function moneyFrom(items) {
  return items.reduce(
    (sum, item) =>
      sum +
      (Number.isInteger(item.price) && item.price >= 0 ? item.price : 0),
    0,
  );
}

function getPointBalance(point) {
  if (Number.isFinite(point)) return Math.max(0, point);
  if (!point || typeof point !== "object") return null;
  return (
    safeAmount(
      point.balance,
      point.pointBalance,
      point.availablePoint,
      point.available,
    ) ?? null
  );
}

function getDisplayName(item) {
  return item?.title ?? item?.courseTitle ?? item?.name ?? "강의 정보 없음";
}

function CheckoutFailureModal({
  errorCode,
  message,
  canRetry,
  busy,
  onClose,
  onRetry,
}) {
  const closeRef = useRef(null);
  useEffect(() => {
    const previousFocus = document.activeElement;
    closeRef.current?.focus();
    function onKeyDown(event) {
      if (event.key === "Escape" && !busy) onClose();
      if (event.key === "Tab") {
        const buttons = [...document.querySelectorAll(".payment-failure-modal button:not(:disabled)")];
        if (buttons.length === 0) return;
        if (event.shiftKey && document.activeElement === buttons[0]) {
          event.preventDefault();
          buttons.at(-1).focus();
        } else if (!event.shiftKey && document.activeElement === buttons.at(-1)) {
          event.preventDefault();
          buttons[0].focus();
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus?.();
    };
  }, [busy, onClose]);

  const uncertain = errorCode === "PG_UNAVAILABLE";
  return (
    <div className="payment-modal-backdrop">
      <section
        aria-labelledby="payment-failure-title"
        aria-modal="true"
        className="payment-failure-modal"
        role="dialog"
      >
        <div aria-hidden="true" className="payment-modal-icon">
          !
        </div>
        <h2 id="payment-failure-title">
          {uncertain ? "결제 상태를 확인할 수 없습니다" : "결제에 실패했습니다"}
        </h2>
        <p>
          {uncertain
            ? "결제 승인 여부가 불명확합니다."
            : "결제가 완료되지 않았습니다."}
        </p>
        <p className="payment-modal-guidance">
          {uncertain
            ? "중복 결제를 막기 위해 다시 결제하지 말고 결제 내역을 확인해주세요."
            : message ||
              "결제 수단을 확인한 후 다시 시도해주세요."}
        </p>
        <div className="payment-modal-actions">
          <button
            className="payment-modal-secondary"
            disabled={busy}
            onClick={onClose}
            ref={closeRef}
            type="button"
          >
            결제 화면으로
          </button>
          {canRetry && !uncertain && (
            <button
              className="payment-modal-primary"
              disabled={busy}
              onClick={onRetry}
              type="button"
            >
              {busy ? "처리 중..." : "다시 시도"}
            </button>
          )}
          {uncertain && (
            <Link className="payment-modal-primary" to="/mypage/buy/history">
              결제 내역 확인
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}

export function PaymentPage() {
  const { accessToken } = usePaymentAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const passedCourseIds = location.state?.courseIds;
  const courseIds = useMemo(
    () =>
      Array.isArray(passedCourseIds)
        ? [...new Set(passedCourseIds.filter((id) => Number.isInteger(id) && id > 0))]
        : [],
    [passedCourseIds],
  );
  const courseKey = courseIds.join(",");
  const [initialRecord, setInitialRecord] = useState(null);
  const [retryLoad, setRetryLoad] = useState(0);
  const [couponId, setCouponId] = useState("");
  const [usePoint, setUsePoint] = useState("0");
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState("");
  const [unavailableCoupons, setUnavailableCoupons] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("CARD");
  const [card, setCard] = useState({
    number: "",
    expiry: "",
    cvc: "",
    installment: "0",
  });
  const [transfer, setTransfer] = useState({
    bankCode: "",
    accountNumber: "",
    accountHolder: "",
  });
  const [formError, setFormError] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [failure, setFailure] = useState(null);
  const [retryPayment, setRetryPayment] = useState(null);
  const paymentLock = useRef(false);
  const previewSequence = useRef(0);
  const initialRequestKey = `${courseKey}:${retryLoad}`;
  const initial =
    initialRecord?.key === initialRequestKey ? initialRecord.result : null;
  const loadState =
    courseIds.length === 0
      ? "error"
      : initialRecord?.key === initialRequestKey
        ? initialRecord.status
        : "loading";
  const loadError =
    courseIds.length === 0
      ? "결제할 강의 선택 정보가 없습니다. 장바구니에서 구매 가능한 강의를 선택한 뒤 다시 이동해주세요."
      : initialRecord?.key === initialRequestKey
        ? initialRecord.error
        : "";

  useEffect(() => {
    if (courseIds.length === 0) return undefined;
    const controller = new AbortController();
    getPaymentInitial(accessToken, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setInitialRecord({
          key: initialRequestKey,
          result,
          status: "success",
          error: "",
        });
      })
      .catch((error) => {
        if (error.name === "AbortError" || controller.signal.aborted) return;
        setInitialRecord({
          key: initialRequestKey,
          result: null,
          status: "error",
          error: paymentErrorMessage(error),
        });
      });
    return () => controller.abort();
  }, [accessToken, courseIds.length, initialRequestKey]);

  const selectedItems = useMemo(() => {
    const allItems = Array.isArray(initial?.items) ? initial.items : [];
    return allItems.filter(
      (item) =>
        courseIds.includes(item.courseId) &&
        item.purchasable === true,
    );
  }, [initial, courseIds]);
  const removedItems = courseIds.filter(
    (id) => !selectedItems.some((item) => item.courseId === id),
  );
  const coupons = Array.isArray(initial?.coupons) ? initial.coupons : [];
  const pointBalance = getPointBalance(initial?.point);
  const productAmount = initial ? moneyFrom(selectedItems) : null;
  const numericPoints = usePoint === "" ? 0 : Number(usePoint);
  const selectedCoupon = coupons.find(
    (coupon) => String(coupon.couponId) === couponId,
  );
  const couponDiscountEstimate = couponId
    ? safeAmount(selectedCoupon?.discountValue) ?? 0
    : 0;
  const pointLimit = Math.min(
    pointBalance ?? 0,
    Math.max(0, (productAmount ?? 0) - couponDiscountEstimate),
  );
  const pointInputValid =
    pointBalance !== null &&
    Number.isInteger(numericPoints) &&
    numericPoints >= 0 &&
    numericPoints <= pointLimit;
  const previewKey = `${courseKey}|${couponId}|${numericPoints}`;
  const appliedPreview =
    preview?.key === previewKey ? preview.result : null;
  const previewSummary = summaryAmounts(appliedPreview?.summary);
  const displayedProduct = previewSummary.product ?? productAmount;
  const displayedCoupon =
    previewSummary.coupon ??
    (initial ? couponDiscountEstimate : null);
  const displayedPoints =
    previewSummary.points ?? (initial ? numericPoints : null);
  const displayedFinal =
    previewSummary.final ??
    (displayedProduct !== null &&
    displayedCoupon !== null &&
    displayedPoints !== null
      ? Math.max(0, displayedProduct - displayedCoupon - displayedPoints)
      : null);
  const orderReady =
    loadState === "success" &&
    selectedItems.length > 0 &&
    pointInputValid &&
    Boolean(appliedPreview) &&
    !previewError &&
    !isPaying;

  useEffect(() => {
    if (loadState !== "success" || selectedItems.length === 0 || !pointInputValid) {
      return undefined;
    }
    const controller = new AbortController();
    const sequence = previewSequence.current + 1;
    previewSequence.current = sequence;
    const timer = window.setTimeout(async () => {
      setPreviewError("");
      try {
        if (couponId) {
          await previewCoupon(
            accessToken,
            selectedItems.map((item) => item.courseId),
            Number(couponId),
            controller.signal,
          );
        }
        const result = await previewPoints(
          accessToken,
          selectedItems.map((item) => item.courseId),
          couponId ? Number(couponId) : undefined,
          numericPoints,
          controller.signal,
        );
        if (!controller.signal.aborted && sequence === previewSequence.current) {
          setPreview({ key: previewKey, result });
        }
      } catch (error) {
        if (
          error.name === "AbortError" ||
          controller.signal.aborted ||
          sequence !== previewSequence.current
        ) {
          return;
        }
        if (
          error.code === "COUPON_NOT_APPLICABLE" &&
          couponId
        ) {
          setUnavailableCoupons((current) =>
            current.includes(couponId) ? current : [...current, couponId],
          );
        }
        setPreviewError(paymentErrorMessage(error));
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    accessToken,
    couponId,
    courseKey,
    loadState,
    numericPoints,
    pointInputValid,
    previewKey,
    selectedItems,
  ]);

  function updateCoupon(nextCouponId) {
    setCouponId(nextCouponId);
    setPreviewError("");
    setUnavailableCoupons((current) =>
      current.filter((id) => id !== nextCouponId),
    );
  }

  function validatePayment() {
    if (selectedItems.length === 0) {
      return "구매 가능한 주문 강의가 없습니다. 장바구니를 다시 확인해주세요.";
    }
    if (!pointInputValid) {
      return "사용 포인트는 보유 포인트 및 주문 금액 이하의 정수로 입력해주세요.";
    }
    if (previewError) return previewError;
    if (paymentMethod === "CARD") {
      const cardNumber = card.number.replace(/\D/g, "");
      if (!/^\d{14,16}$/.test(cardNumber)) {
        return "카드 번호는 숫자 14~16자리로 입력해주세요.";
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) {
        return "유효기간을 MM/YY 형식으로 입력해주세요.";
      }
      if (!/^\d{3}$/.test(card.cvc)) return "CVC는 숫자 3자리로 입력해주세요.";
      if (!/^(0|[2-9]|1[0-2])$/.test(card.installment)) {
        return "할부 개월을 확인해주세요.";
      }
    } else {
      if (!/^\d{3}$/.test(transfer.bankCode.trim())) {
        return "은행 코드는 숫자 3자리로 입력해주세요.";
      }
      if (!/^\d{10,14}$/.test(transfer.accountNumber)) {
        return "계좌번호는 숫자 10~14자리로 입력해주세요.";
      }
      const holder = transfer.accountHolder.trim();
      if (!holder || holder.length > 20) {
        return "예금주를 1~20자로 입력해주세요.";
      }
    }
    return "";
  }

  // POST /payment 본문의 결제 수단 정보. 주문의 payMethod와 같은 종류만 보냅니다.
  function paymentDetails() {
    if (paymentMethod === "CARD") {
      return {
        card: {
          number: card.number.replace(/\D/g, ""),
          expiry: card.expiry,
          cvc: card.cvc,
          installment: Number(card.installment),
        },
      };
    }
    return {
      transfer: {
        bankCode: transfer.bankCode.trim(),
        accountNumber: transfer.accountNumber,
        holderName: transfer.accountHolder.trim(),
      },
    };
  }

  function paymentCompleteState(orderResult, paymentResult = null) {
    const result = orderResult ?? {};
    const payment = paymentResult ?? {};
    return {
      order: {
        orderId: result.orderId ?? payment.orderId,
        orderName: result.orderName ?? payment.orderName,
        amount:
          result.summary?.finalAmount ??
          result.summary?.paymentAmount ??
          result.finalAmount ??
          result.paymentAmount ??
          result.amount ??
          payment.summary?.finalAmount ??
          payment.amount ??
          payment.finalAmount,
        courseNames: selectedItems.map(getDisplayName),
        statusLabel: result.statusLabel ?? payment.statusLabel,
      },
    };
  }

  async function payExistingOrder(orderId) {
    const validationError = validatePayment();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    if (paymentLock.current) return;
    paymentLock.current = true;
    setIsPaying(true);
    setFormError("");
    try {
      const body = await submitPayment(accessToken, {
        orderId,
        ...paymentDetails(),
      });
      if (body.code === "PAYMENT_COMPLETED") {
        navigate(
          "/mypage/buy/complete",
          paymentCompleteState(retryPayment?.orderResult, body.result),
        );
        setFailure(null);
        return;
      }
      if (body.code === "PAYMENT_DECLINED") {
        setFailure({
          code: body.code,
          message: body.message,
          canRetry: true,
        });
        return;
      }
      if (body.code === "PG_UNAVAILABLE") {
        setFailure({ code: body.code, message: body.message, canRetry: false });
        return;
      }
      throw new PaymentApiError(
        body.code ?? "PAYMENT_FAILED",
        body.message ?? "결제를 완료하지 못했습니다.",
      );
    } catch (error) {
      if (error.code === "PAYMENT_DECLINED") {
        setFailure({ code: error.code, message: error.message, canRetry: true });
      } else if (
        error.code === "PG_UNAVAILABLE" ||
        error.code === "NETWORK_ERROR" ||
        error.status >= 500
      ) {
        setFailure({ code: error.code, message: error.message, canRetry: false });
      } else {
        setFormError(paymentErrorMessage(error));
      }
    } finally {
      paymentLock.current = false;
      setIsPaying(false);
    }
  }

  async function handlePay() {
    if (retryPayment?.orderId) {
      await payExistingOrder(retryPayment.orderId);
      return;
    }
    const validationError = validatePayment();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    if (paymentLock.current) return;
    paymentLock.current = true;
    setIsPaying(true);
    setFormError("");
    let createdOrderResult = null;
    try {
      const orderBody = await createOrder(accessToken, {
        courseIds: selectedItems.map((item) => item.courseId),
        couponId: couponId ? Number(couponId) : null,
        usePoint: numericPoints,
        payMethod: paymentMethod,
      });
      const orderResult = orderBody.result ?? {};
      if (orderBody.code === "ORDER_COMPLETED") {
        navigate(
          "/mypage/buy/complete",
          paymentCompleteState(orderResult),
        );
        return;
      }
      if (orderBody.code !== "ORDER_CREATED" || !orderResult.orderId) {
        throw new PaymentApiError(
          orderBody.code ?? "INVALID_RESPONSE",
          orderBody.message ?? "주문 생성 결과를 확인할 수 없습니다.",
        );
      }
      createdOrderResult = orderResult;
      setRetryPayment({ orderId: orderResult.orderId, orderResult });
      const paymentBody = await submitPayment(accessToken, {
        orderId: orderResult.orderId,
        ...paymentDetails(),
      });
      if (paymentBody.code === "PAYMENT_COMPLETED") {
        navigate(
          "/mypage/buy/complete",
          paymentCompleteState(orderResult, paymentBody.result),
        );
        return;
      }
      if (paymentBody.code === "PAYMENT_DECLINED") {
        setFailure({
          code: paymentBody.code,
          message: paymentBody.message,
          canRetry: true,
        });
        return;
      }
      if (paymentBody.code === "PG_UNAVAILABLE") {
        setFailure({
          code: paymentBody.code,
          message: paymentBody.message,
          canRetry: false,
        });
        return;
      }
      throw new PaymentApiError(
        paymentBody.code ?? "PAYMENT_FAILED",
        paymentBody.message ?? "결제를 완료하지 못했습니다.",
      );
    } catch (error) {
      const outcomeUncertain =
        error.code === "NETWORK_ERROR" || error.status >= 500;
      if (createdOrderResult && outcomeUncertain) {
        setFailure({
          code: "PG_UNAVAILABLE",
          message:
            "주문은 생성되었지만 결제 응답을 확인하지 못했습니다. 중복 결제를 막기 위해 결제 내역에서 상태를 확인해주세요.",
          canRetry: false,
        });
      } else if (!createdOrderResult && outcomeUncertain) {
        setFailure({
          code: "PG_UNAVAILABLE",
          message:
            "주문 생성 응답을 확인하지 못했습니다. 중복 주문을 막기 위해 다시 제출하지 말고 결제 내역을 확인해주세요.",
          canRetry: false,
        });
      } else if (error.code === "PAYMENT_DECLINED") {
        setFailure({ code: error.code, message: error.message, canRetry: true });
      } else if (error.code === "PG_UNAVAILABLE") {
        setFailure({
          code: error.code,
          message: error.message,
          canRetry: false,
        });
      } else {
        setFormError(paymentErrorMessage(error));
      }
    } finally {
      paymentLock.current = false;
      setIsPaying(false);
    }
  }

  return (
    <PaymentLayout active="cart">
      <PaymentPageHeading
        description="할인과 포인트를 적용하고 결제 정보를 확인하세요."
        title="결제"
      />
      {!location.state?.courseIds && (
        <div className="payment-notice" role="alert">
          {loadError}
          <button onClick={() => navigate(-1)} type="button">
            이전 화면으로
          </button>
        </div>
      )}
      {location.state?.courseIds && loadState === "error" && (
        <div className="payment-notice" role="alert">
          <span>{loadError}</span>
          <button
            onClick={() => setRetryLoad((value) => value + 1)}
            type="button"
          >
            다시 시도
          </button>
        </div>
      )}
      {loadState === "loading" && (
        <p className="payment-state" role="status">
          결제 정보를 불러오는 중입니다.
        </p>
      )}
      {removedItems.length > 0 && loadState === "success" && (
        <p className="payment-inline-warning" role="status">
          일부 선택 강의를 구매할 수 없거나 장바구니에서 찾을 수 없습니다.
          구매 가능한 강의만 주문 대상으로 사용합니다.
        </p>
      )}

      <div className="payment-checkout-grid">
        <section className="payment-form-column">
          <div className="payment-field-block">
            <div className="payment-field-title">
              <h2>주문 강의</h2>
              <span>
                {selectedItems.length > 0
                  ? `${selectedItems.length}개`
                  : "선택 정보 확인 필요"}
              </span>
            </div>
            <div className="payment-input-list">
              {selectedItems.length > 0 ? (
                selectedItems.map((item) => (
                  <div className="payment-course-line" key={item.courseId}>
                    <span>{getDisplayName(item)}</span>
                    <strong>{formatWon(item.price)}</strong>
                  </div>
                ))
              ) : (
                <p className="payment-empty-inline">
                  {loadState === "loading"
                    ? "주문 강의를 확인하고 있습니다."
                    : "결제 화면은 장바구니에서 선택한 강의로 열어주세요."}
                </p>
              )}
            </div>
          </div>

          <div className="payment-field-block">
            <label htmlFor="payment-coupon">쿠폰 선택</label>
            <select
              disabled={
                loadState !== "success" ||
                coupons.length === 0 ||
                Boolean(retryPayment)
              }
              id="payment-coupon"
              onChange={(event) => updateCoupon(event.target.value)}
              value={couponId}
            >
              <option value="">쿠폰 미사용</option>
              {coupons.map((coupon) => {
                const id = String(coupon.couponId);
                const unavailable = unavailableCoupons.includes(id);
                return (
                  <option disabled={unavailable} key={id} value={id}>
                    {coupon.name ?? "쿠폰"} ·{" "}
                    {formatWon(coupon.discountValue)} 할인
                    {unavailable ? " (적용 불가)" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="payment-field-block">
            <label htmlFor="payment-points">포인트 사용</label>
            <div className="payment-point-input">
              <input
                disabled={Boolean(retryPayment)}
                id="payment-points"
                inputMode="numeric"
                max={pointLimit}
                onChange={(event) => {
                  const onlyDigits = event.target.value.replace(/\D/g, "");
                  setUsePoint(onlyDigits);
                  setPreviewError("");
                }}
                placeholder="사용할 포인트"
                value={usePoint}
              />
              <span>
                보유{" "}
                {pointBalance === null
                  ? "— P"
                  : formatWon(pointBalance).replace("원", " P")}
              </span>
            </div>
            {!pointInputValid && (
              <p className="payment-field-error" role="alert">
                보유 포인트와 상품 금액을 초과할 수 없습니다.
              </p>
            )}
          </div>

          <fieldset className="payment-field-block payment-method-field">
            <legend>결제 수단</legend>
            <div className="payment-method-buttons">
              <button
                aria-pressed={paymentMethod === "CARD"}
                className={paymentMethod === "CARD" ? "is-selected" : ""}
                disabled={Boolean(retryPayment)}
                onClick={() => setPaymentMethod("CARD")}
                type="button"
              >
                카드
              </button>
              <button
                aria-pressed={paymentMethod === "TRANSFER"}
                className={paymentMethod === "TRANSFER" ? "is-selected" : ""}
                disabled={Boolean(retryPayment)}
                onClick={() => setPaymentMethod("TRANSFER")}
                type="button"
              >
                계좌이체
              </button>
            </div>
            {paymentMethod === "CARD" ? (
              <div className="payment-card-fields">
                <label>
                  카드 번호
                  <input
                    autoComplete="cc-number"
                    inputMode="numeric"
                    maxLength={23}
                    onChange={(event) =>
                      setCard((current) => ({
                        ...current,
                        number: event.target.value.replace(/[^\d ]/g, ""),
                      }))
                    }
                    placeholder="카드 번호"
                    value={card.number}
                  />
                </label>
                <label>
                  유효기간
                  <input
                    autoComplete="cc-exp"
                    maxLength={5}
                    onChange={(event) =>
                      setCard((current) => ({
                        ...current,
                        expiry: event.target.value
                          .replace(/\D/g, "")
                          .replace(/^(\d{2})(\d)/, "$1/$2")
                          .slice(0, 5),
                      }))
                    }
                    placeholder="MM/YY"
                    value={card.expiry}
                  />
                </label>
                <label>
                  CVC
                  <input
                    autoComplete="cc-csc"
                    inputMode="numeric"
                    maxLength={3}
                    onChange={(event) =>
                      setCard((current) => ({
                        ...current,
                        cvc: event.target.value.replace(/\D/g, ""),
                      }))
                    }
                    placeholder="CVC"
                    type="password"
                    value={card.cvc}
                  />
                </label>
                <label>
                  할부 개월
                  <select
                    onChange={(event) =>
                      setCard((current) => ({
                        ...current,
                        installment: event.target.value,
                      }))
                    }
                    value={card.installment}
                  >
                    <option value="0">일시불</option>
                    {[2, 3, 6, 12].map((month) => (
                      <option key={month} value={month}>
                        {month}개월
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : (
              <div className="payment-card-fields">
                <label>
                  은행 코드
                  <input
                    onChange={(event) =>
                      setTransfer((current) => ({
                        ...current,
                        bankCode: event.target.value,
                      }))
                    }
                    inputMode="numeric"
                    maxLength={3}
                    placeholder="은행 코드 (숫자 3자리)"
                    value={transfer.bankCode}
                  />
                </label>
                <label>
                  계좌번호
                  <input
                    autoComplete="off"
                    inputMode="numeric"
                    onChange={(event) =>
                      setTransfer((current) => ({
                        ...current,
                        accountNumber: event.target.value.replace(/\D/g, ""),
                      }))
                    }
                    placeholder="계좌번호"
                    value={transfer.accountNumber}
                  />
                </label>
                <label className="payment-transfer-holder">
                  예금주
                  <input
                    autoComplete="name"
                    onChange={(event) =>
                      setTransfer((current) => ({
                        ...current,
                        accountHolder: event.target.value,
                      }))
                    }
                    placeholder="예금주"
                    value={transfer.accountHolder}
                  />
                </label>
              </div>
            )}
          </fieldset>
          {previewError && (
            <p className="payment-field-error" role="alert">
              {previewError}
            </p>
          )}
          {formError && (
            <p className="payment-field-error" role="alert">
              {formError}
            </p>
          )}
        </section>

        <aside className="payment-summary-card">
          <h2>결제 요약</h2>
          <dl>
            <div>
              <dt>상품 금액</dt>
              <dd>{formatWon(displayedProduct)}</dd>
            </div>
            <div>
              <dt>쿠폰 할인</dt>
              <dd>-{formatWon(displayedCoupon)}</dd>
            </div>
            <div>
              <dt>포인트</dt>
              <dd>-{formatWon(displayedPoints)}</dd>
            </div>
          </dl>
          {previewError && (
            <p className="payment-summary-warning">
              서버 금액 미리보기를 확인할 수 없습니다.
            </p>
          )}
          <div className="payment-total">
            <span>최종 결제</span>
            <strong>{formatWon(displayedFinal)}</strong>
          </div>
          <button
            className="payment-submit-button"
            disabled={!orderReady}
            onClick={handlePay}
            type="button"
          >
            {isPaying
              ? "결제 처리 중..."
              : retryPayment
                ? `${formatWon(displayedFinal)} 결제 다시 시도`
                : `${formatWon(displayedFinal)} 결제`}
          </button>
        </aside>
      </div>

      {failure && (
        <CheckoutFailureModal
          busy={isPaying}
          canRetry={failure.canRetry}
          errorCode={failure.code}
          message={failure.message}
          onClose={() => setFailure(null)}
          onRetry={() => {
            if (retryPayment?.orderId) {
              setFailure(null);
              void payExistingOrder(retryPayment.orderId);
            }
          }}
        />
      )}
    </PaymentLayout>
  );
}

export function PaymentCompletePage() {
  const location = useLocation();
  const order = location.state?.order;
  return (
    <PaymentLayout active="history">
      <PaymentPageHeading
        description="결제 결과와 주문 정보를 확인하세요."
        title="결제 완료"
      />
      {order?.orderId ? (
        <>
          <section className="payment-complete-card">
            <h2>결제가 완료되었습니다</h2>
            <dl>
              <div>
                <dt>주문번호</dt>
                <dd>{order.orderId}</dd>
              </div>
              <div>
                <dt>주문 강의</dt>
                <dd>
                  {order.courseNames?.length
                    ? order.courseNames.join(", ")
                    : order.orderName ?? "주문 정보 확인"}
                </dd>
              </div>
              <div>
                <dt>결제 금액</dt>
                <dd>{formatWon(order.amount)}</dd>
              </div>
            </dl>
          </section>
          <div className="payment-complete-actions">
            <Link className="payment-bright-button" to="/mypage/learning">
              학습 시작
            </Link>
            <Link className="payment-outline-button" to="/mypage/buy/history">
              결제 내역
            </Link>
          </div>
        </>
      ) : (
        <section className="payment-state payment-empty-state" role="status">
          <h2>결제 완료 정보를 확인할 수 없습니다.</h2>
          <p>
            성공 응답 상태가 현재 화면에 전달되지 않았습니다. 결제 내역에서
            서버의 주문 상태를 확인해주세요.
          </p>
          <Link className="payment-bright-button" to="/mypage/buy/history">
            결제 내역 확인
          </Link>
        </section>
      )}
    </PaymentLayout>
  );
}

export function PaymentHistoryPage() {
  const { accessToken } = usePaymentAuth();
  const [status, setStatus] = useState("ALL");
  const [pageNumber, setPageNumber] = useState(0);
  const [historyRecord, setHistoryRecord] = useState(null);
  const [retry, setRetry] = useState(0);
  const requestId = useRef(0);
  const requestKey = `${status}:${pageNumber}:${retry}`;
  const loadState =
    historyRecord?.key === requestKey ? historyRecord.status : "loading";
  const history =
    historyRecord?.key === requestKey ? historyRecord.result : null;
  const error =
    historyRecord?.key === requestKey ? historyRecord.error : "";

  useEffect(() => {
    const controller = new AbortController();
    const id = requestId.current + 1;
    requestId.current = id;
    getPaymentHistory(
      accessToken,
      status,
      pageNumber,
      PAGE_SIZE,
      controller.signal,
    )
      .then((result) => {
        if (controller.signal.aborted || id !== requestId.current) return;
        setHistoryRecord({
          key: requestKey,
          result,
          status: "success",
          error: "",
        });
      })
      .catch((requestError) => {
        if (
          requestError.name === "AbortError" ||
          controller.signal.aborted ||
          id !== requestId.current
        ) {
          return;
        }
        setHistoryRecord({
          key: requestKey,
          result: null,
          status: "error",
          error: paymentErrorMessage(requestError),
        });
      });
    return () => controller.abort();
  }, [accessToken, pageNumber, requestKey, status]);

  const orders = Array.isArray(history?.orders)
    ? history.orders
    : Array.isArray(history?.items)
      ? history.items
      : [];
  const page = history?.page;
  const totalPages =
    Number.isInteger(page?.totalPages) && page.totalPages > 0
      ? page.totalPages
      : 0;
  const currentPage =
    Number.isInteger(page?.number) && page.number >= 0
      ? page.number
      : pageNumber;
  const firstVisible = Math.max(
    0,
    Math.min(currentPage - 2, totalPages - 5),
  );
  const pages = Array.from(
    { length: Math.min(totalPages, 5) },
    (_, index) => firstVisible + index,
  );

  function changeStatus(value) {
    setPageNumber(0);
    setStatus(value);
  }

  return (
    <PaymentLayout active="history">
      <PaymentPageHeading
        description="결제한 강의와 상세 내역을 확인하세요."
        title="결제 내역 / 영수증"
      />
      <div className="payment-history-filters" role="group" aria-label="결제 상태">
        {[
          ["ALL", "전체"],
          ["PAID", "결제 완료"],
          ["REFUNDED", "취소 / 환불"],
        ].map(([value, label]) => (
          <button
            aria-pressed={status === value}
            className={status === value ? "is-active" : ""}
            key={value}
            onClick={() => changeStatus(value)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {loadState === "loading" && (
        <p className="payment-state" role="status">
          결제 내역을 불러오는 중입니다.
        </p>
      )}
      {loadState === "error" && (
        <div className="payment-notice" role="alert">
          <span>{error}</span>
          <button onClick={() => setRetry((value) => value + 1)} type="button">
            다시 시도
          </button>
        </div>
      )}
      {loadState === "success" && (
        <>
          {orders.length > 0 ? (
            <div className="payment-history-table-scroll">
              <table className="payment-history-table">
                <thead>
                  <tr>
                    <th scope="col">주문번호</th>
                    <th scope="col">강의</th>
                    <th scope="col">결제 금액</th>
                    <th scope="col">상태 / 상세</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const orderId = order.orderId;
                    const amount = safeAmount(
                      order.finalAmount,
                      order.paymentAmount,
                      order.amount,
                    );
                    return (
                      <tr key={orderId}>
                        <td>
                          <Link to={`/mypage/buy/history/${orderId}`}>
                            {orderId ?? "—"}
                          </Link>
                        </td>
                        <td>
                          <Link to={`/mypage/buy/history/${orderId}`}>
                            {order.orderName ?? "주문 상세"}
                          </Link>
                        </td>
                        <td>{amount === 0 ? "무료" : formatWon(amount)}</td>
                        <td>
                          {order.statusLabel ?? order.status ?? "상태 확인"}
                          <span className="payment-history-row-actions">
                            {order.hasReceipt ? (
                              <Link to={`/mypage/buy/history/${orderId}`}>
                                영수증 확인
                              </Link>
                            ) : (
                              <Link to={`/mypage/buy/history/${orderId}`}>
                                {amount === 0
                                  ? "무료 · 상세"
                                  : "상세 보기"}
                              </Link>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="payment-empty-list">결제 내역이 없습니다.</p>
          )}
          {totalPages > 1 && (
            <nav className="payment-pagination" aria-label="결제 내역 페이지">
              <button
                aria-label="이전 페이지"
                disabled={currentPage <= 0}
                onClick={() => setPageNumber(currentPage - 1)}
                type="button"
              >
                ‹
              </button>
              {pages.map((index) => (
                <button
                  aria-current={currentPage === index ? "page" : undefined}
                  className={currentPage === index ? "is-current" : ""}
                  key={index}
                  onClick={() => setPageNumber(index)}
                  type="button"
                >
                  {index + 1}
                </button>
              ))}
              <button
                aria-label="다음 페이지"
                disabled={!page?.hasNext || currentPage >= totalPages - 1}
                onClick={() => setPageNumber(currentPage + 1)}
                type="button"
              >
                ›
              </button>
            </nav>
          )}
        </>
      )}
      <aside className="payment-history-tip">
        <strong>결제 상세 안내</strong>
        <p>
          결제 수단, 할인 내역, 결제 일시와 환불 가능 여부를 주문 상세에서
          확인하세요.
        </p>
      </aside>
    </PaymentLayout>
  );
}

function detailItems(result) {
  if (Array.isArray(result.items)) return result.items;
  if (Array.isArray(result.orderItems)) return result.orderItems;
  return [];
}

export function PaymentDetailPage() {
  const { accessToken } = usePaymentAuth();
  const { orderId } = useParams();
  const [detailRecord, setDetailRecord] = useState(null);
  const [retry, setRetry] = useState(0);
  const requestKey = `${orderId}:${retry}`;
  const state =
    detailRecord?.key === requestKey ? detailRecord.status : "loading";
  const detail =
    detailRecord?.key === requestKey ? detailRecord.result : null;
  const error =
    detailRecord?.key === requestKey ? detailRecord.error : "";

  useEffect(() => {
    const controller = new AbortController();
    getPaymentDetail(accessToken, orderId, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setDetailRecord({
          key: requestKey,
          result: result.order ?? result,
          status: "success",
          error: "",
        });
      })
      .catch((requestError) => {
        if (requestError.name === "AbortError" || controller.signal.aborted) {
          return;
        }
        setDetailRecord({
          key: requestKey,
          result: null,
          status: "error",
          error: paymentErrorMessage(requestError),
        });
      });
    return () => controller.abort();
  }, [accessToken, orderId, requestKey]);

  const orderLines = detail ? detailItems(detail) : [];
  const payment = detail?.payment ?? null;
  const summary = detail?.summary ?? detail ?? {};
  const productAmount = safeAmount(
    summary.productAmount,
    summary.productPrice,
    summary.itemAmount,
  );
  const couponDiscount = safeAmount(
    summary.couponDiscount,
    summary.couponDiscountAmount,
  );
  const pointUsed = safeAmount(
    summary.usedPoint,
    summary.pointAmount,
    summary.pointDiscount,
    summary.usePoint,
  );
  const finalAmount = safeAmount(
    summary.finalAmount,
    summary.paymentAmount,
    summary.amount,
  );

  return (
    <PaymentLayout active="history">
      <PaymentPageHeading
        description="주문과 결제 증빙 정보를 확인하세요."
        title="결제 상세 / 영수증"
      />
      {state === "loading" && (
        <p className="payment-state" role="status">
          주문 상세를 불러오는 중입니다.
        </p>
      )}
      {state === "error" && (
        <div className="payment-notice" role="alert">
          <span>{error}</span>
          <button onClick={() => setRetry((value) => value + 1)} type="button">
            다시 시도
          </button>
        </div>
      )}
      {state === "success" && detail && (
        <>
          <section className="payment-detail-card">
            <h2>주문 정보</h2>
            <dl className="payment-detail-grid">
              <div>
                <dt>주문번호</dt>
                <dd>{detail.orderId ?? orderId}</dd>
              </div>
              <div>
                <dt>주문일</dt>
                <dd>{detail.createdAt ?? detail.orderedAt ?? "—"}</dd>
              </div>
              <div>
                <dt>결제 수단</dt>
                <dd>
                  {detail.payMethodLabel ??
                    detail.payMethod ??
                    payment?.method ??
                    "—"}
                </dd>
              </div>
              <div>
                <dt>결제 상태</dt>
                <dd>
                  {detail.statusLabel ?? detail.status ?? "상태 확인"}
                </dd>
              </div>
            </dl>
          </section>
          <section className="payment-detail-card">
            <h2>주문 강의</h2>
            {orderLines.length > 0 ? (
              <ul className="payment-detail-items">
                {orderLines.map((item, index) => (
                  <li key={item.courseId ?? item.orderItemId ?? index}>
                    <span>{getDisplayName(item)}</span>
                    <strong>
                      {formatWon(
                        safeAmount(item.price, item.amount, item.orderPrice),
                      )}
                    </strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="payment-muted-note">강의 상세 항목이 없습니다.</p>
            )}
            <dl className="payment-detail-totals">
              <div>
                <dt>상품 금액</dt>
                <dd>{formatWon(productAmount)}</dd>
              </div>
              <div>
                <dt>쿠폰 할인</dt>
                <dd>-{formatWon(couponDiscount)}</dd>
              </div>
              <div>
                <dt>사용 포인트</dt>
                <dd>-{formatWon(pointUsed)}</dd>
              </div>
              <div className="payment-detail-grand-total">
                <dt>최종 결제 금액</dt>
                <dd>{formatWon(finalAmount)}</dd>
              </div>
            </dl>
          </section>
          <section className="payment-detail-card">
            <h2>영수증 정보</h2>
            {payment ? (
              <dl className="payment-detail-grid">
                <div>
                  <dt>결제 식별 키</dt>
                  <dd>{payment.paymentKey ?? "—"}</dd>
                </div>
                <div>
                  <dt>승인 일시</dt>
                  <dd>{payment.approvedAt ?? "—"}</dd>
                </div>
                <div>
                  <dt>카드</dt>
                  <dd>
                    {payment.cardBrand
                      ? `${payment.cardBrand} · **** ${payment.cardLast4 ?? "****"}`
                      : payment.bankName
                        ? `${payment.bankName} 계좌이체${
                            payment.accountLast4
                              ? ` · **** ${payment.accountLast4}`
                              : ""
                          }`
                        : "—"}
                  </dd>
                </div>
                <div>
                  <dt>할부</dt>
                  <dd>
                    {Number.isInteger(payment.installment)
                      ? payment.installment === 0
                        ? "일시불"
                        : `${payment.installment}개월`
                      : "—"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="payment-muted-note">
                승인 영수증이 없습니다.
                {finalAmount === 0 ? " 무료 주문은 등록 완료 상태입니다." : ""}
              </p>
            )}
          </section>
        </>
      )}
      <Link className="payment-outline-button payment-back-link" to="/mypage/buy/history">
        결제 내역으로
      </Link>
    </PaymentLayout>
  );
}

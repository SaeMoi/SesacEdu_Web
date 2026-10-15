import { authFetch } from "../../auth/session.js";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(
  /\/+$/,
  "",
);
const ERROR_CODES = new Set([
  "UNAUTHORIZED",
  "TOKEN_EXPIRED",
  "INVALID_INPUT",
  "COUPON_NOT_APPLICABLE",
  "INVALID_POINT",
  "CART_CHANGED",
  "ORDER_NOT_FOUND",
  "ALREADY_PAID",
  "PAYMENT_DECLINED",
  "PG_UNAVAILABLE",
]);

export class PaymentApiError extends Error {
  constructor(code, message, status = 0, result = null) {
    super(message);
    this.name = "PaymentApiError";
    this.code = code;
    this.status = status;
    this.result = result;
  }
}

async function request(path, { accessToken, ...options } = {}) {
  if (!API_BASE_URL) {
    throw new PaymentApiError(
      "API_BASE_URL_REQUIRED",
      "결제 API 서버 주소가 설정되지 않았습니다. VITE_API_BASE_URL 설정이 필요합니다.",
    );
  }
  if (!accessToken) {
    throw new PaymentApiError(
      "AUTH_INTEGRATION_REQUIRED",
      "로그인 Access Token 연동이 완료되지 않아 결제 정보를 불러올 수 없습니다.",
    );
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  let response;
  try {
    response = await authFetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new PaymentApiError(
      "NETWORK_ERROR",
      "네트워크 오류가 발생했습니다. 연결을 확인한 뒤 다시 시도해주세요.",
    );
  }

  let body;
  try {
    body = await response.json();
  } catch {
    throw new PaymentApiError(
      "INVALID_RESPONSE",
      "결제 서버 응답 형식을 확인할 수 없습니다.",
      response.status,
    );
  }
  if (!response.ok || ERROR_CODES.has(body?.code)) {
    throw new PaymentApiError(
      body?.code ?? `HTTP_${response.status}`,
      body?.message ?? "결제 요청을 처리하지 못했습니다.",
      response.status,
      body?.result,
    );
  }
  return body;
}

function queryForCheckout(courseIds, values = {}) {
  const params = new URLSearchParams({ courseIds: courseIds.join(",") });
  if (values.couponId !== undefined && values.couponId !== null) {
    params.set("couponId", String(values.couponId));
  }
  if (values.usePoint !== undefined) {
    params.set("usePoint", String(values.usePoint));
  }
  return params.toString();
}

export async function getPaymentInitial(accessToken, signal) {
  const body = await request("/mypage/buy", {
    method: "GET",
    accessToken,
    signal,
  });
  if (body?.code !== "BUY_FOUND" && !body?.result) {
    throw new PaymentApiError(
      body?.code ?? "INVALID_RESPONSE",
      body?.message ?? "결제 초기 응답 형식이 올바르지 않습니다.",
      200,
    );
  }
  return body.result;
}

export async function previewCoupon(
  accessToken,
  courseIds,
  couponId,
  signal,
) {
  const body = await request(
    `/mypage/buy/cpn?${queryForCheckout(courseIds, { couponId })}`,
    { method: "GET", accessToken, signal },
  );
  if (body?.code !== "COUPON_APPLIED") {
    throw new PaymentApiError(
      body?.code ?? "INVALID_RESPONSE",
      body?.message ?? "쿠폰 적용 결과를 확인할 수 없습니다.",
      200,
      body?.result,
    );
  }
  return body.result;
}

export async function previewPoints(
  accessToken,
  courseIds,
  couponId,
  usePoint,
  signal,
) {
  const body = await request(
    `/mypage/buy/pnt?${queryForCheckout(courseIds, {
      ...(couponId ? { couponId } : {}),
      usePoint,
    })}`,
    { method: "GET", accessToken, signal },
  );
  if (body?.code !== "POINT_APPLIED") {
    throw new PaymentApiError(
      body?.code ?? "INVALID_RESPONSE",
      body?.message ?? "포인트 적용 결과를 확인할 수 없습니다.",
      200,
      body?.result,
    );
  }
  return body.result;
}

export async function createOrder(accessToken, payload) {
  return request("/mypage/buy", {
    method: "POST",
    accessToken,
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify(payload),
  });
}

export async function submitPayment(accessToken, payload) {
  return request("/payment", {
    method: "POST",
    accessToken,
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify(payload),
  });
}

export async function getPaymentHistory(
  accessToken,
  status,
  page,
  size,
  signal,
) {
  const params = new URLSearchParams({
    status,
    page: String(page),
    size: String(size),
  });
  const body = await request(`/mypage/buy/history?${params}`, {
    method: "GET",
    accessToken,
    signal,
  });
  if (!body?.result) {
    throw new PaymentApiError(
      body?.code ?? "INVALID_RESPONSE",
      body?.message ?? "결제 내역 응답 형식이 올바르지 않습니다.",
      200,
    );
  }
  return body.result;
}

export async function getPaymentDetail(accessToken, orderId, signal) {
  const body = await request(
    `/mypage/buy/history/${encodeURIComponent(orderId)}`,
    { method: "GET", accessToken, signal },
  );
  if (!body?.result) {
    throw new PaymentApiError(
      body?.code ?? "INVALID_RESPONSE",
      body?.message ?? "결제 상세 응답 형식이 올바르지 않습니다.",
      200,
    );
  }
  return body.result;
}

export function paymentErrorMessage(error) {
  if (
    error.code === "API_BASE_URL_REQUIRED" ||
    error.code === "AUTH_INTEGRATION_REQUIRED"
  ) {
    return error.message;
  }
  switch (error.code) {
    case "UNAUTHORIZED":
      return "로그인이 필요합니다. 프로젝트의 로그인 처리와 연결이 필요합니다.";
    case "TOKEN_EXPIRED":
      return "로그인 토큰이 만료되었습니다. 기존 토큰 재발급 연동이 필요합니다.";
    case "INVALID_INPUT":
      return error.message || "입력값을 확인해주세요.";
    case "COUPON_NOT_APPLICABLE":
      return "선택한 쿠폰은 주문 강의에 적용할 수 없습니다.";
    case "INVALID_POINT":
      return error.message || "사용할 포인트를 확인해주세요.";
    case "CART_CHANGED":
      return "장바구니가 변경되었습니다. 장바구니를 다시 확인해주세요.";
    case "ORDER_NOT_FOUND":
      return "주문 정보를 찾을 수 없습니다.";
    case "ALREADY_PAID":
      return "이미 결제가 완료된 주문입니다. 결제 내역을 확인해주세요.";
    case "PG_UNAVAILABLE":
      return "결제 상태를 확인할 수 없습니다. 즉시 재결제하지 말고 결제 내역을 확인해주세요.";
    default:
      return error.message || "요청을 처리하지 못했습니다. 다시 시도해주세요.";
  }
}

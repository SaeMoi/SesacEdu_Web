import { authFetch } from "../../auth/session.js";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(
  /\/+$/,
  "",
);

export const BENEFITS_API_PATH = "/mypage/bnf";
export const REGISTER_COUPON_API_PATH = "/mypage/cpn";

export class BenefitsApiError extends Error {
  constructor(code, message, status = 0) {
    super(message);
    this.name = "BenefitsApiError";
    this.code = code;
    this.status = status;
  }
}

async function request(path, { accessToken, ...options } = {}) {
  if (!API_BASE_URL) {
    throw new BenefitsApiError(
      "API_BASE_URL_REQUIRED",
      "혜택 API 서버 주소가 설정되지 않았습니다. VITE_API_BASE_URL 설정이 필요합니다.",
    );
  }

  if (!accessToken) {
    throw new BenefitsApiError(
      "AUTH_INTEGRATION_REQUIRED",
      "로그인 Access Token 연동이 완료되지 않아 혜택 정보를 불러올 수 없습니다.",
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
    throw new BenefitsApiError(
      "NETWORK_ERROR",
      "네트워크 오류가 발생했습니다. 연결을 확인한 뒤 다시 시도해주세요.",
    );
  }

  let body;
  try {
    body = await response.json();
  } catch {
    throw new BenefitsApiError(
      "INVALID_RESPONSE",
      "혜택 서버 응답 형식을 확인할 수 없습니다.",
      response.status,
    );
  }

  if (!response.ok) {
    throw new BenefitsApiError(
      body?.code ?? `HTTP_${response.status}`,
      body?.message ?? "혜택 요청을 처리하지 못했습니다.",
      response.status,
    );
  }

  return { response, body };
}

export async function getBenefits(accessToken, page = 0, size = 10, signal) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  const { body } = await request(`${BENEFITS_API_PATH}?${params}`, {
    method: "GET",
    accessToken,
    signal,
  });

  if (
    body?.code !== "BENEFITS_FOUND" ||
    !body.result?.summary ||
    !Array.isArray(body.result.coupons) ||
    !body.result.page
  ) {
    throw new BenefitsApiError(
      body?.code ?? "INVALID_RESPONSE",
      body?.message ?? "혜택 조회 응답 형식이 올바르지 않습니다.",
      200,
    );
  }

  return body.result;
}

export async function registerCoupon(accessToken, couponCode) {
  const { response, body } = await request(REGISTER_COUPON_API_PATH, {
    method: "POST",
    accessToken,
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify({ couponCode }),
  });

  if (response.status !== 201 || body?.code !== "COUPON_REGISTERED") {
    throw new BenefitsApiError(
      body?.code ?? "INVALID_RESPONSE",
      body?.message ?? "쿠폰 등록 응답 형식이 올바르지 않습니다.",
      response.status,
    );
  }

  return body.result;
}

export function getBenefitsErrorMessage(error) {
  if (
    error.code === "API_BASE_URL_REQUIRED" ||
    error.code === "AUTH_INTEGRATION_REQUIRED"
  ) {
    return error.message;
  }
  if (error.code === "UNAUTHORIZED") {
    return "로그인이 필요합니다. 현재 프로젝트의 로그인 처리와 연결이 필요합니다.";
  }
  if (error.code === "TOKEN_EXPIRED") {
    return "로그인 토큰이 만료되었습니다. 현재 프로젝트에 토큰 재발급 연동이 없습니다.";
  }
  if (error.code === "INVALID_INPUT") {
    return error.message || "요청값을 확인해주세요.";
  }
  return error.message || "요청을 처리하지 못했습니다. 다시 시도해주세요.";
}

export function getCouponRegistrationErrorMessage(error) {
  switch (error.code) {
    case "INVALID_INPUT":
      return "쿠폰 코드 형식을 확인해 주세요.";
    case "INVALID_COUPON_CODE":
      return "유효하지 않은 쿠폰 코드입니다.";
    case "COUPON_ALREADY_REGISTERED":
      return "이미 등록한 쿠폰입니다.";
    case "COUPON_SOLD_OUT":
      return "쿠폰이 모두 소진되었습니다.";
    case "OWN_COUPON":
      return "본인이 발행한 쿠폰은 등록할 수 없습니다.";
    case "UNAUTHORIZED":
      return "로그인이 필요합니다. 현재 프로젝트의 로그인 처리와 연결이 필요합니다.";
    case "TOKEN_EXPIRED":
      return "로그인 토큰이 만료되었습니다. 현재 프로젝트에 토큰 재발급 연동이 없습니다.";
    default:
      return error.message || "쿠폰 등록에 실패했습니다. 다시 시도해주세요.";
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(
  /\/+$/,
  "",
);

export const CART_API_PATH = "/mypage/cart";

export class CartApiError extends Error {
  constructor(code, message, status = 0, result = null) {
    super(message);
    this.name = "CartApiError";
    this.code = code;
    this.status = status;
    this.result = result;
  }
}

async function requestCart(path, { accessToken, ...options } = {}) {
  if (!API_BASE_URL) {
    throw new CartApiError(
      "API_BASE_URL_REQUIRED",
      "장바구니 API 서버 주소가 설정되지 않았습니다. VITE_API_BASE_URL 설정이 필요합니다.",
    );
  }
  if (!accessToken) {
    throw new CartApiError(
      "AUTH_INTEGRATION_REQUIRED",
      "로그인 Access Token 연동이 완료되지 않아 장바구니를 이용할 수 없습니다.",
    );
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new CartApiError(
      "NETWORK_ERROR",
      "네트워크 오류가 발생했습니다. 연결을 확인한 뒤 다시 시도해주세요.",
    );
  }

  let body;
  try {
    body = await response.json();
  } catch {
    throw new CartApiError(
      "INVALID_RESPONSE",
      "장바구니 서버 응답 형식을 확인할 수 없습니다.",
      response.status,
    );
  }

  if (!response.ok) {
    throw new CartApiError(
      body?.code ?? `HTTP_${response.status}`,
      body?.message ?? "장바구니 요청을 처리하지 못했습니다.",
      response.status,
      body?.result ?? null,
    );
  }

  return body;
}

export async function getCart(accessToken, signal) {
  const response = await requestCart(CART_API_PATH, {
    method: "GET",
    accessToken,
    signal,
  });

  if (
    response.code !== "CART_FOUND" ||
    !Array.isArray(response.result?.items) ||
    !response.result?.summary
  ) {
    throw new CartApiError(
      response.code ?? "INVALID_RESPONSE",
      response.message ?? "장바구니 응답 형식이 올바르지 않습니다.",
      200,
    );
  }
  return response.result;
}

export async function addCourseToCart(accessToken, courseId) {
  if (!Number.isInteger(courseId) || courseId <= 0) {
    throw new CartApiError(
      "INVALID_INPUT",
      "유효한 강의 ID가 필요합니다.",
    );
  }

  const response = await requestCart(`${CART_API_PATH}/add`, {
    method: "POST",
    accessToken,
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify({ courseId }),
  });

  if (response.code !== "CART_ITEM_ADDED" || !response.result) {
    throw new CartApiError(
      response.code ?? "INVALID_RESPONSE",
      response.message ?? "장바구니 추가 응답이 올바르지 않습니다.",
      200,
      response.result,
    );
  }
  return response.result;
}

export async function deleteCartCourses(accessToken, courseIds) {
  const uniqueIds = [...new Set(courseIds)];
  if (
    uniqueIds.length < 1 ||
    uniqueIds.length > 50 ||
    uniqueIds.some((courseId) => !Number.isInteger(courseId) || courseId <= 0)
  ) {
    throw new CartApiError(
      "INVALID_INPUT",
      "삭제할 강의 ID는 중복 없이 1~50개의 양의 정수여야 합니다.",
    );
  }

  const response = await requestCart(`${CART_API_PATH}/del`, {
    method: "DELETE",
    accessToken,
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify({ courseIds: uniqueIds }),
  });

  if (response.code !== "CART_ITEMS_DELETED" || !response.result) {
    throw new CartApiError(
      response.code ?? "INVALID_RESPONSE",
      response.message ?? "장바구니 삭제 응답이 올바르지 않습니다.",
      200,
      response.result,
    );
  }
  return response.result;
}

export function getCartErrorMessage(error) {
  if (error.code === "API_BASE_URL_REQUIRED") return error.message;
  if (error.code === "AUTH_INTEGRATION_REQUIRED") return error.message;
  if (error.code === "UNAUTHORIZED") {
    return "로그인이 필요합니다. 현재 프로젝트에 연결된 로그인 처리가 없어 인증 연동이 필요합니다.";
  }
  if (error.code === "TOKEN_EXPIRED") {
    return "로그인 토큰이 만료되었습니다. 현재 프로젝트에 토큰 재발급 연동이 없습니다.";
  }
  if (
    [
      "INVALID_INPUT",
      "COURSE_NOT_FOUND",
      "ALREADY_IN_CART",
      "ALREADY_ENROLLED",
      "CART_FULL",
    ].includes(error.code)
  ) {
    return error.message;
  }
  return error.message || "장바구니 요청을 처리하지 못했습니다.";
}

import { authFetch } from "../../auth/session.js";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(
  /\/+$/,
  "",
);

export const MY_QNA_API_PATH = "/mypage/qna";

export class QnaApiError extends Error {
  constructor(code, message, status = 0) {
    super(message);
    this.name = "QnaApiError";
    this.code = code;
    this.status = status;
  }
}

export async function getMyQna({
  accessToken,
  status = "ALL",
  sort = "RECENT",
  page = 0,
  size = 5,
  signal,
}) {
  if (!API_BASE_URL) {
    throw new QnaApiError(
      "API_BASE_URL_REQUIRED",
      "Q&A API 서버 주소가 설정되지 않았습니다. VITE_API_BASE_URL 설정 후 이용해주세요.",
    );
  }

  if (!accessToken) {
    throw new QnaApiError(
      "AUTH_INTEGRATION_REQUIRED",
      "로그인 Access Token 연동이 완료되지 않아 질문 목록을 불러올 수 없습니다.",
    );
  }

  const params = new URLSearchParams({
    status,
    sort,
    page: String(page),
    size: String(size),
  });
  let response;
  try {
    response = await authFetch(
      `${API_BASE_URL}${MY_QNA_API_PATH}?${params.toString()}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
        signal,
      },
    );
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new QnaApiError(
      "NETWORK_ERROR",
      "네트워크 오류가 발생했습니다. 연결을 확인한 뒤 다시 시도해주세요.",
    );
  }

  let body;
  try {
    body = await response.json();
  } catch {
    throw new QnaApiError(
      "INVALID_RESPONSE",
      "Q&A 서버 응답 형식을 확인할 수 없습니다.",
      response.status,
    );
  }

  if (!response.ok) {
    throw new QnaApiError(
      body?.code ?? `HTTP_${response.status}`,
      body?.message ?? "질문 목록을 불러오지 못했습니다.",
      response.status,
    );
  }

  if (
    body?.code !== "MY_QNA_FOUND" ||
    !body?.result ||
    !Array.isArray(body.result.questions) ||
    !body.result.page
  ) {
    throw new QnaApiError(
      body?.code ?? "INVALID_RESPONSE",
      body?.message ?? "Q&A 목록 응답 형식이 올바르지 않습니다.",
      response.status,
    );
  }

  return body.result;
}

export function getQnaErrorMessage(error) {
  if (error.code === "API_BASE_URL_REQUIRED") return error.message;
  if (error.code === "AUTH_INTEGRATION_REQUIRED") return error.message;
  if (error.code === "UNAUTHORIZED") {
    return "로그인이 필요합니다. 현재 프로젝트에 연결된 로그인 처리가 없어 인증 연동이 필요합니다.";
  }
  if (error.code === "TOKEN_EXPIRED") {
    return "로그인 토큰이 만료되었습니다. 현재 프로젝트에 토큰 재발급 연동이 없습니다.";
  }
  if (error.code === "INVALID_INPUT") {
    return error.message || "필터 또는 페이지 조건을 확인해주세요.";
  }
  if (error.code === "INVALID_RESPONSE") return error.message;
  return error.message || "질문 목록을 불러오지 못했습니다. 다시 시도해주세요.";
}

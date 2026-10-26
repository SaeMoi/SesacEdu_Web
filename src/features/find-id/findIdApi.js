// 아이디(이메일) 찾기 API 클라이언트 — 비로그인 공개 호출 (토큰 없음).
// 서버: POST /login/find-id { name, birthDate } → 200 { result.email } / 404 ACCOUNT_NOT_FOUND / 400 INVALID_INPUT
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");

export const FIND_ID_API_PATH = "/login/find-id";

export class FindIdApiError extends Error {
  constructor(code, message, status = 0) {
    super(message);
    this.name = "FindIdApiError";
    this.code = code;
    this.status = status;
  }
}

export async function findId({ name, birthDate }, { signal } = {}) {
  if (!API_BASE_URL) {
    throw new FindIdApiError(
      "API_BASE_URL_REQUIRED",
      "API 서버 주소가 설정되지 않았습니다. VITE_API_BASE_URL 설정이 필요합니다.",
    );
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${FIND_ID_API_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, birthDate }),
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new FindIdApiError(
      "NETWORK_ERROR",
      "네트워크 오류가 발생했습니다. 연결을 확인한 뒤 다시 시도해주세요.",
    );
  }

  let body;
  try {
    body = await response.json();
  } catch {
    throw new FindIdApiError(
      "INVALID_RESPONSE",
      "서버 응답 형식을 확인할 수 없습니다.",
      response.status,
    );
  }

  if (response.ok) {
    // 서버가 전체 이메일을 그대로 내려준다 (마스킹 없음 — 의도된 취약점).
    return body?.result?.email ?? null;
  }
  throw new FindIdApiError(
    body?.code ?? "UNKNOWN",
    body?.message ?? "아이디를 찾을 수 없습니다.",
    response.status,
  );
}

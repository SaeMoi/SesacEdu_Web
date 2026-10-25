import { authFetch } from "../../auth/session.js";

// 고객센터 1:1 문의 API (Notion API 명세서, 2026-10-22).
// 응답은 마이페이지 공통 { code, message, result } 형식입니다. 토큰 만료(401 TOKEN_EXPIRED)는 authFetch가 재발급 후 다시 보냅니다.
// 로그인 세션(auth/session.js)과 같이 값이 비어 있으면 Vite 프록시 경로 /backend 를 씁니다.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/backend").replace(
  /\/+$/,
  "",
);

export const CST_QNA_API_PATH = "/mypage/cstqna";
export const TITLE_MAX = 200;
export const CONTENT_MAX = 4000;

export class CstQnaApiError extends Error {
  constructor(code, message, status = 0, errors = []) {
    super(message);
    this.name = "CstQnaApiError";
    this.code = code;
    this.status = status;
    this.errors = errors; // 400 INVALID_INPUT의 [{ field, reason }]
  }
}

const statusMessages = {
  401: "로그인이 만료되었습니다. 다시 로그인해 주세요.",
  403: "이용이 제한된 계정은 문의를 작성·수정·삭제할 수 없습니다.",
  404: "문의를 찾을 수 없습니다.",
  409: "답변이 달린 문의는 수정·삭제할 수 없습니다.",
};

async function request(path, { accessToken, method = "GET", body, signal, expectedCode }) {
  if (!accessToken) {
    throw new CstQnaApiError("AUTH_INTEGRATION_REQUIRED", "로그인 후 이용할 수 있습니다.");
  }

  const headers = { Authorization: `Bearer ${accessToken}`, Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response;
  try {
    response = await authFetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new CstQnaApiError(
      "NETWORK_ERROR",
      "네트워크 오류가 발생했습니다. 연결을 확인한 뒤 다시 시도해주세요.",
    );
  }

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new CstQnaApiError(
      json?.code ?? `HTTP_${response.status}`,
      json?.message ?? statusMessages[response.status] ?? "요청을 처리하지 못했습니다.",
      response.status,
      Array.isArray(json?.result?.errors) ? json.result.errors : [],
    );
  }
  if (!json || json.code !== expectedCode || !json.result) {
    throw new CstQnaApiError(
      "INVALID_RESPONSE",
      "1:1 문의 서버 응답 형식이 올바르지 않습니다.",
      response.status,
    );
  }
  return json.result;
}

function inquiryPath(inquiryId) {
  if (!/^[1-9]\d*$/.test(String(inquiryId))) {
    throw new CstQnaApiError("INVALID_INPUT", "문의 번호가 올바르지 않습니다.");
  }
  return `${CST_QNA_API_PATH}/${inquiryId}`;
}

// GET /mypage/cstqna?status=&page=&size= → { counts, inquiries, page }
export function getCstQnaList({ accessToken, status = "ALL", page = 0, size = 5, signal }) {
  const params = new URLSearchParams({ status, page: String(page), size: String(size) });
  return request(`${CST_QNA_API_PATH}?${params.toString()}`, {
    accessToken,
    signal,
    expectedCode: "CST_QNA_FOUND",
  });
}

// GET /mypage/cstqna/{iqid} → 상세
export function getCstQnaDetail({ accessToken, inquiryId, signal }) {
  return request(inquiryPath(inquiryId), {
    accessToken,
    signal,
    expectedCode: "CST_QNA_DETAIL_FOUND",
  });
}

// POST /mypage/cstqna/posts { title, content } → 상세
export function createCstQna({ accessToken, title, content }) {
  return request(`${CST_QNA_API_PATH}/posts`, {
    accessToken,
    method: "POST",
    body: { title, content },
    expectedCode: "CST_QNA_CREATED",
  });
}

// PUT /mypage/cstqna/{iqid} { title, content } → 상세
export function updateCstQna({ accessToken, inquiryId, title, content }) {
  return request(inquiryPath(inquiryId), {
    accessToken,
    method: "PUT",
    body: { title, content },
    expectedCode: "CST_QNA_UPDATED",
  });
}

// DELETE /mypage/cstqna/{iqid} → { inquiryId }
export function deleteCstQna({ accessToken, inquiryId }) {
  return request(inquiryPath(inquiryId), {
    accessToken,
    method: "DELETE",
    expectedCode: "CST_QNA_DELETED",
  });
}

export function formatDate(value) {
  if (typeof value !== "string") return "—";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : "—";
}

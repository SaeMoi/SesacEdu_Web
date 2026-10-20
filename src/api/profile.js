import { authFetch } from "../auth/session.js";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");

export class ProfileApiError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ProfileApiError";
    this.code = code;
  }
}

export async function getProfile({ accessToken, signal } = {}) {
  const headers = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : undefined;
  const response = await authFetch(`${API_BASE_URL}/mypage`, {
    method: "GET",
    headers,
    signal,
  });

  let body;
  try {
    body = await response.json();
  } catch {
    throw new ProfileApiError(
      "INVALID_RESPONSE",
      "프로필 서버의 응답을 확인할 수 없습니다.",
    );
  }

  if (!response.ok) {
    throw new ProfileApiError(
      body?.code ?? `HTTP_${response.status}`,
      body?.message ?? "프로필 정보를 불러오지 못했습니다.",
    );
  }

  if (body?.code !== "PROFILE_FOUND" || !body?.result) {
    throw new ProfileApiError(
      body?.code ?? "INVALID_RESPONSE",
      body?.message ?? "프로필 응답 형식이 올바르지 않습니다.",
    );
  }

  return body.result;
}

// GET /mypage/basic_profile: 사이드바 카드용 기본 프로필 (이름·닉네임·사진·권한·포인트).
export async function getBasicProfile({ accessToken, signal } = {}) {
  const headers = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : undefined;
  const response = await authFetch(`${API_BASE_URL}/mypage/basic_profile`, {
    method: "GET",
    headers,
    signal,
  });

  let body;
  try {
    body = await response.json();
  } catch {
    throw new ProfileApiError(
      "INVALID_RESPONSE",
      "프로필 서버의 응답을 확인할 수 없습니다.",
    );
  }

  if (!response.ok) {
    throw new ProfileApiError(
      body?.code ?? `HTTP_${response.status}`,
      body?.message ?? "기본 프로필을 불러오지 못했습니다.",
    );
  }

  if (body?.code !== "BASIC_PROFILE_FOUND" || !body?.result) {
    throw new ProfileApiError(
      body?.code ?? "INVALID_RESPONSE",
      body?.message ?? "기본 프로필 응답 형식이 올바르지 않습니다.",
    );
  }

  return body.result;
}

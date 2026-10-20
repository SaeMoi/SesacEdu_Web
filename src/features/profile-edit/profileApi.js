import { authFetch, resolveApiAssetUrl } from "../../auth/session.js";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(
  /\/+$/,
  "",
);

export class ProfileApiError extends Error {
  constructor(code, message, result = null, status = 0) {
    super(message);
    this.name = "ProfileApiError";
    this.code = code;
    this.result = result;
    this.status = status;
  }
}

async function request(path, { accessToken, reauthToken, ...options } = {}) {
  if (!accessToken) {
    throw new ProfileApiError(
      "AUTH_INTEGRATION_REQUIRED",
      "로그인 access token 연동이 완료되지 않아 요청을 보낼 수 없습니다.",
    );
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (reauthToken) headers.set("X-Reauth-Token", reauthToken);

  const response = await authFetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let body;
  try {
    body = await response.json();
  } catch {
    throw new ProfileApiError(
      "INVALID_RESPONSE",
      "서버 응답 형식을 확인할 수 없습니다.",
      null,
      response.status,
    );
  }

  if (!response.ok) {
    throw new ProfileApiError(
      body?.code ?? `HTTP_${response.status}`,
      body?.message ?? "요청을 처리하지 못했습니다.",
      body?.result ?? null,
      response.status,
    );
  }

  return body;
}

function jsonOptions(body, accessToken, reauthToken) {
  return {
    method: "PUT",
    accessToken,
    reauthToken,
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify(body),
  };
}

export async function verifyPassword(accessToken, pw, purpose) {
  const response = await request("/mypage/verify-password", {
    method: "POST",
    accessToken,
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify({ pw, purpose }),
  });

  if (response.code !== "PASSWORD_VERIFIED") {
    throw new ProfileApiError(
      response.code ?? "INVALID_RESPONSE",
      response.message ?? "본인 확인 응답이 올바르지 않습니다.",
      response.result,
      200,
    );
  }

  return response.result;
}

export async function getProfile(accessToken, signal) {
  const response = await request("/mypage", {
    method: "GET",
    accessToken,
    signal,
  });
  if (response.code !== "PROFILE_FOUND" || !response.result) {
    throw new ProfileApiError(
      response.code ?? "INVALID_RESPONSE",
      response.message ?? "프로필 응답이 올바르지 않습니다.",
      response.result,
      200,
    );
  }
  return response.result;
}

export async function updateProfile(
  accessToken,
  reauthToken,
  profile,
) {
  const response = await request(
    "/mypage/profile",
    jsonOptions(profile, accessToken, reauthToken),
  );
  if (response.code !== "PROFILE_UPDATED" || !response.result) {
    throw new ProfileApiError(
      response.code ?? "INVALID_RESPONSE",
      response.message ?? "프로필 수정 응답이 올바르지 않습니다.",
      response.result,
      200,
    );
  }
  return response.result;
}

export async function updateProfileImage(accessToken, file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await request("/mypage/edit_prof", {
    method: "POST",
    accessToken,
    body: formData,
  });
  if (
    response.code !== "PROFILE_IMAGE_UPDATED" ||
    typeof response.result?.profileImageUrl !== "string"
  ) {
    throw new ProfileApiError(
      response.code ?? "INVALID_RESPONSE",
      response.message ?? "프로필 사진 응답이 올바르지 않습니다.",
      response.result,
      200,
    );
  }
  return response.result.profileImageUrl;
}

export async function updatePassword(
  accessToken,
  reauthToken,
  newPw,
  newPwCheck,
) {
  const response = await request(
    "/mypage/password",
    jsonOptions({ newPw, newPwCheck }, accessToken, reauthToken),
  );
  if (response.code !== "PASSWORD_CHANGED") {
    throw new ProfileApiError(
      response.code ?? "INVALID_RESPONSE",
      response.message ?? "비밀번호 변경 응답이 올바르지 않습니다.",
      response.result,
      200,
    );
  }
  return response.result;
}

export function getProfileImageSrc(imageUrl) {
  return resolveApiAssetUrl(imageUrl);
}

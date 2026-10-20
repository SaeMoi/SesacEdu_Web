const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");
const API_PATH = "/instructor/profile";

async function request(path, accessToken, options = {}) {
  if (!API_BASE_URL) {
    throw new Error("강사 API 서버 주소가 설정되지 않았습니다.");
  }
  if (!accessToken) {
    throw new Error(
      "로그인 Access Token 공급자가 연결되지 않았습니다. 로그인 연동이 필요합니다.",
    );
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...options.headers,
      },
    });
  } catch (error) {
    throw new Error(
      "네트워크 오류가 발생했습니다. 연결을 확인한 뒤 다시 시도해 주세요.",
      { cause: error },
    );
  }

  const responseText = await response.text();
  let body = null;
  if (responseText.trim()) {
    body = await Promise.resolve()
      .then(() => JSON.parse(responseText))
      .catch(() => null);
    if (response.ok && body === null) {
      throw new Error("서버 응답 형식이 올바르지 않습니다.");
    }
  }

  if (!response.ok) {
    const message = body?.message;
    if (response.status === 400) throw new Error(message || "입력 정보를 확인해 주세요.");
    if (response.status === 401) {
      throw new Error(message || "로그인이 필요하거나 인증이 만료되었습니다.");
    }
    if (response.status === 403) throw new Error(message || "강사 권한이 없습니다.");
    if (response.status === 404) throw new Error(message || "강사 정보를 찾을 수 없습니다.");
    if (response.status >= 500) {
      throw new Error(message || "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }
    throw new Error(message || "요청을 처리하지 못했습니다.");
  }

  return body?.result ?? body;
}

export async function getInstructorProfile(accessToken, { signal } = {}) {
  const result = await request(API_PATH, accessToken, { signal });
  if (!result || typeof result !== "object") {
    throw new Error("강사 정보 응답 형식이 올바르지 않습니다.");
  }
  return result;
}

export async function updateInstructorProfile(accessToken, formData) {
  const params = new URLSearchParams();

  for (const field of [
    "iname",
    "bio",
    "career",
    "field",
    "link",
    "bank",
    "account",
  ]) {
    params.set(field, String(formData.get(field) ?? ""));
  }

  const body = new FormData();
  const careerFile = formData.get("careerFile");

  if (careerFile instanceof File) {
    body.append("file", careerFile);
  }

  return request(`${API_PATH}?${params.toString()}`, accessToken, {
    method: "PUT",
    body,
  });
}


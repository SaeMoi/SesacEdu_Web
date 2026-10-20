const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");
const API_PATH = "/instructor/qna";

async function request(path, accessToken, options = {}) {
  if (!accessToken) {
    throw new Error(
      "인증 토큰 공급자가 연결되어 있지 않습니다. 로그인 토큰을 연결한 뒤 다시 시도해 주세요.",
    );
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
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
    if (response.status === 400) {
      throw new Error(message || "요청 내용을 확인해 주세요.");
    }
    if (response.status === 401) {
      throw new Error(message || "로그인이 필요하거나 인증이 만료되었습니다.");
    }
    if (response.status === 403) {
      throw new Error(message || "Q&A에 접근할 권한이 없습니다.");
    }
    if (response.status === 404) {
      throw new Error(message || "질문 정보를 찾을 수 없습니다.");
    }
    if (response.status >= 500) {
      throw new Error(message || "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }
    throw new Error(message || "요청을 처리하지 못했습니다.");
  }

  return body;
}

function unwrapResponse(body) {
  return body?.result ?? body;
}

export async function getInstructorQnaList(
  accessToken,
  { page = 1, status, signal } = {},
) {
  const params = new URLSearchParams();

  params.set("page", String(page));

  if (status) {
    params.set("status", status);
  }

  const body = await request(
    `${API_PATH}?${params.toString()}`,
    accessToken,
    { signal },
  );

  const result = unwrapResponse(body);

  if (!Array.isArray(result?.qnaList)) {
    throw new Error("Q&A 목록 응답 형식이 올바르지 않습니다.");
  }

  return result;
}

export async function getInstructorQna(accessToken, qnaid, { signal } = {}) {
  const body = await request(
    `${API_PATH}/${encodeURIComponent(qnaid)}`,
    accessToken,
    { signal },
  );
  const result = unwrapResponse(body);
  if (!result || typeof result !== "object") {
    throw new Error("Q&A 상세 응답 형식이 올바르지 않습니다.");
  }
  return result;
}

export async function saveInstructorQnaAnswer(accessToken, qnaid, answer) {
  return request(`${API_PATH}/${encodeURIComponent(qnaid)}`, accessToken, {
    method: "PUT",
    body: JSON.stringify({ answer }),
  });
}

export async function deleteInstructorQnaAnswer(accessToken, qnaid) {
  return request(`${API_PATH}/${encodeURIComponent(qnaid)}`, accessToken, {
    method: "DELETE",
  });
}

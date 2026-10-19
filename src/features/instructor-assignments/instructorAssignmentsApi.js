const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");
const API_PATH = "/instructor/assignments";

async function request(path, accessToken, options = {}) {
  if (!accessToken) {
    throw new Error(
      "이 화면에 로그인 토큰 공급자가 연결되어 있지 않습니다. 로그인 상태여도 토큰을 전달받지 못해 요청할 수 없습니다.",
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
  } catch {
    throw new Error("네트워크 오류가 발생했습니다. 연결을 확인한 후 다시 시도해 주세요.");
  }

  if (!response.ok) {
    let code = "";
    let message = "";
    try {
      const errorBody = await response.json();
      code = errorBody.code ?? "";
      message = errorBody.message ?? "";
    } catch {
      // The server may return an empty or non-JSON error response.
    }

    if (response.status === 401) {
      throw new Error("로그인이 필요하거나 인증이 만료되었습니다.");
    }
    if (response.status === 403) {
      throw new Error("과제 피드백을 조회하거나 수정할 권한이 없습니다.");
    }
    if (response.status === 404) {
      throw new Error("과제 정보를 찾을 수 없습니다.");
    }
    if (response.status === 400) {
      throw new Error(message || "입력값을 확인해 주세요.");
    }
    if (response.status >= 500) {
      throw new Error("서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }
    throw new Error(message || code || "요청을 처리하지 못했습니다.");
  }

  if (response.status === 204) return null;
  const responseText = await response.text();
  if (!responseText.trim()) return null;
  try {
    return JSON.parse(responseText);
  } catch {
    throw new Error("서버 응답을 읽을 수 없습니다.");
  }
}

function unwrapResponse(body) {
  return body?.result ?? body;
}

export async function getInstructorAssignments(
  accessToken,
  { lecture, page, status } = {},
) {
  const params = new URLSearchParams();
  if (lecture !== undefined && lecture !== null && lecture !== "") {
    params.set("lecture", String(lecture));
  }
  if (page !== undefined && page !== null && page !== "") {
    params.set("page", String(page));
  }
  if (status) params.set("status", status);
  const query = params.toString();
  const body = await request(`${API_PATH}${query ? `?${query}` : ""}`, accessToken);
  const result = unwrapResponse(body);

  if (!result || !Array.isArray(result.assignments)) {
    throw new Error("과제 목록 응답 형식이 올바르지 않습니다.");
  }

  return {
    lectureName: result.lectureName ?? "",
    assignments: result.assignments,
    page: Number.isInteger(result.page) ? result.page : null,
    totalPages: Number.isInteger(result.totalPages) ? result.totalPages : null,
  };
}

export async function getInstructorAssignment(accessToken, assid) {
  const body = await request(
    `${API_PATH}/${encodeURIComponent(assid)}`,
    accessToken,
  );
  const result = unwrapResponse(body);
  if (!result || typeof result !== "object") {
    throw new Error("과제 상세 응답 형식이 올바르지 않습니다.");
  }
  return result;
}

export async function saveInstructorAssignmentFeedback(
  accessToken,
  assid,
  feedback,
) {
  return request(`${API_PATH}/${encodeURIComponent(assid)}`, accessToken, {
    method: "PUT",
    body: JSON.stringify(feedback),
  });
}

export async function deleteInstructorAssignmentFeedback(accessToken, assid) {
  return request(`${API_PATH}/${encodeURIComponent(assid)}`, accessToken, {
    method: "DELETE",
  });
}

export async function getInstructorAssignmentDownload(accessToken, assid) {
  const body = await request(
    `${API_PATH}/${encodeURIComponent(assid)}/download`,
    accessToken,
  );
  const result = unwrapResponse(body);
  if (!result?.url) {
    throw new Error("다운로드 주소를 받지 못했습니다.");
  }
  return result;
}

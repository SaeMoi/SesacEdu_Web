const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");
const API_PATH = "/instructor/settlement";

async function request(path, accessToken, { signal } = {}) {
  if (!API_BASE_URL) {
    throw new Error("정산 API 서버 주소가 설정되지 않았습니다.");
  }
  if (!accessToken) {
    throw new Error(
      "로그인 Access Token 공급자가 연결되어 있지 않습니다. 로그인 연동 후 다시 시도해 주세요.",
    );
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal,
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
    if (response.status === 401) {
      throw new Error(message || "로그인이 필요하거나 인증이 만료되었습니다.");
    }
    if (response.status === 403) {
      throw new Error(message || "정산 정보를 조회할 강사 권한이 없습니다.");
    }
    if (response.status === 404) {
      throw new Error(message || "정산 정보를 찾을 수 없습니다.");
    }
    if (response.status >= 500) {
      throw new Error(message || "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }
    throw new Error(message || "정산 정보를 조회하지 못했습니다.");
  }

  return body?.result ?? body;
}

function getPagination(result) {
  const metadata = result?.pagination ?? result?.pageInfo ?? result;
  const totalPages = Number.isInteger(metadata?.totalPages)
    ? metadata.totalPages
    : null;
  const hasNext = typeof metadata?.hasNext === "boolean"
    ? metadata.hasNext
    : null;
  return { totalPages, hasNext };
}

export async function getInstructorSettlements(accessToken, page, { signal } = {}) {
  const params = new URLSearchParams({ page: String(page) });
  const result = await request(`${API_PATH}?${params.toString()}`, accessToken, {
    signal,
  });
  if (!result || !Array.isArray(result.settlements)) {
    throw new Error("정산 목록 응답 형식이 올바르지 않습니다.");
  }
  return {
    totalRevenue: result.totalRevenue,
    upcomingAmount: result.upcomingAmount,
    latestStatus: result.latestStatus,
    settlements: result.settlements,
    ...getPagination(result),
  };
}

export async function getInstructorSettlement(accessToken, sid, page, { signal } = {}) {
  const params = new URLSearchParams({ page: String(page) });
  const result = await request(
    `${API_PATH}/${encodeURIComponent(sid)}?${params.toString()}`,
    accessToken,
    { signal },
  );
  if (!result || typeof result !== "object" || !Array.isArray(result.items)) {
    throw new Error("정산 상세 응답 형식이 올바르지 않습니다.");
  }
  return {
    ...result,
    ...getPagination(result),
  };
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");
const COUPON_API_PATH = "/instructor/coupon";
const LECTURE_API_PATH = "/instructor/lectures";

async function request(path, accessToken, options = {}) {
  if (!API_BASE_URL) {
    throw new Error("강사 API 서버 주소가 설정되지 않았습니다.");
  }
  if (!accessToken) {
    throw new Error(
      "로그인 Access Token 공급자가 연결되지 않았습니다. 로그인 연동 후 다시 시도해 주세요.",
    );
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
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
      throw new Error(message || "필수 입력 정보 또는 요청 값을 확인해 주세요.");
    }
    if (response.status === 401) {
      throw new Error(message || "로그인이 필요하거나 인증이 만료되었습니다.");
    }
    if (response.status === 403) {
      throw new Error(message || "강사 권한이 없습니다.");
    }
    if (response.status === 404) {
      throw new Error(message || "요청한 정보를 찾을 수 없습니다.");
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

export async function getInstructorCoupons(accessToken, page, { signal } = {}) {
  const params = new URLSearchParams({ page: String(page) });
  const body = await request(
    `${COUPON_API_PATH}?${params.toString()}`,
    accessToken,
    { signal },
  );
  const result = unwrapResponse(body);
  if (!Array.isArray(result?.coupons)) {
    throw new Error("쿠폰 목록 응답 형식이 올바르지 않습니다.");
  }

  return {
    coupons: result.coupons,
    page: result.page ?? result.number ?? result.pagination?.page ?? null,
    totalPages:
      result.totalPages ?? result.pagination?.totalPages ?? null,
    hasNext: result.hasNext ?? result.pagination?.hasNext ?? null,
  };
}

export async function getInstructorLecturesForCoupons(accessToken, { signal } = {}) {
  const params = new URLSearchParams({ status: "", page: "1" });
  const body = await request(
    `${LECTURE_API_PATH}?${params.toString()}`,
    accessToken,
    { signal },
  );
  const result = unwrapResponse(body);
  if (!Array.isArray(result?.content)) {
    throw new Error("강의 목록 응답 형식이 올바르지 않습니다.");
  }
  return result.content;
}

export async function createInstructorCoupon(accessToken, values) {
  return request(COUPON_API_PATH, accessToken, {
    method: "POST",
    body: JSON.stringify({
      Lid: values.Lid,
      cname: values.cname,
      discount: values.discount,
      due: values.due,
      quantity: values.quantity,
    }),
  });
}

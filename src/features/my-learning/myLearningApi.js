import { authFetch, resolveApiAssetUrl } from "../../auth/session.js";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(
  /\/+$/,
  "",
);

// 내 학습 목록 조회 API 주소입니다.
export const MY_COURSES_API_PATH = "/mypage/lectures";

export function getLearningAssetUrl(path) {
  return resolveApiAssetUrl(path);
}

export class MyLearningApiError extends Error {
  constructor(code, message, status = 0) {
    super(message);
    this.name = "MyLearningApiError";
    this.code = code;
    this.status = status;
  }
}

export async function getMyCourses({
  accessToken,
  status = "ALL",
  sort = "RECENT_ENROLL",
  page = 0,
  size = 5,
  signal,
}) {
  if (!accessToken) {
    throw new MyLearningApiError(
      "AUTH_INTEGRATION_REQUIRED",
      "로그인 Access Token 연동이 완료되지 않아 내 학습 목록을 불러올 수 없습니다.",
    );
  }

  const params = new URLSearchParams({
    status,
    sort,
    page: String(page),
    size: String(size),
  });
  const response = await authFetch(
    `${API_BASE_URL}${MY_COURSES_API_PATH}?${params.toString()}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      signal,
    },
  );

  let body;
  try {
    body = await response.json();
  } catch {
    throw new MyLearningApiError(
      "INVALID_RESPONSE",
      "내 학습 서버 응답을 확인할 수 없습니다.",
      response.status,
    );
  }

  if (!response.ok) {
    throw new MyLearningApiError(
      body?.code ?? `HTTP_${response.status}`,
      body?.message ?? "내 학습 목록을 불러오지 못했습니다.",
      response.status,
    );
  }

  if (
    body?.code !== "MY_COURSES_FOUND" ||
    !body?.result ||
    !Array.isArray(body.result.courses) ||
    !body.result.page
  ) {
    throw new MyLearningApiError(
      body?.code ?? "INVALID_RESPONSE",
      body?.message ?? "내 학습 목록 응답 형식이 올바르지 않습니다.",
      response.status,
    );
  }

  return body.result;
}

// 강좌 리뷰 목록 (GET /mypage/{lectureid}/review, 기본 5개씩)
export async function getLectureReviews({
  accessToken,
  courseId,
  page = 0,
  size = 5,
  signal,
}) {
  if (!accessToken) {
    throw new MyLearningApiError(
      "AUTH_INTEGRATION_REQUIRED",
      "로그인 후 리뷰 목록을 볼 수 있습니다.",
    );
  }

  const params = new URLSearchParams({ page: String(page), size: String(size) });
  const response = await authFetch(
    `${API_BASE_URL}/mypage/${encodeURIComponent(courseId)}/review?${params.toString()}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      signal,
    },
  );

  let body;
  try {
    body = await response.json();
  } catch {
    throw new MyLearningApiError(
      "INVALID_RESPONSE",
      "리뷰 서버 응답을 확인할 수 없습니다.",
      response.status,
    );
  }

  if (!response.ok) {
    throw new MyLearningApiError(
      body?.code ?? `HTTP_${response.status}`,
      body?.code === "LECTURE_NOT_FOUND"
        ? "강좌를 찾을 수 없습니다."
        : (body?.message ?? "리뷰 목록을 불러오지 못했습니다."),
      response.status,
    );
  }

  if (
    body?.code !== "MY_REVIEWS_FOUND" ||
    !Array.isArray(body?.result?.reviews) ||
    !body.result.page
  ) {
    throw new MyLearningApiError(
      body?.code ?? "INVALID_RESPONSE",
      "리뷰 목록 응답 형식이 올바르지 않습니다.",
      response.status,
    );
  }

  return body.result;
}

export class ReviewApiNotConfiguredError extends Error {
  constructor() {
    super(
      "리뷰 등록 API 경로와 요청·응답 명세가 확인되지 않아 아직 등록할 수 없습니다.",
    );
    this.name = "ReviewApiNotConfiguredError";
  }
}

export async function submitReview() {
  throw new ReviewApiNotConfiguredError();
}

export function getCourseById(result, courseId) {
  if (!Array.isArray(result?.courses)) return null;
  return (
    result.courses.find(
      (course) => String(course?.courseId) === String(courseId),
    ) ?? null
  );
}

export function getLearningErrorMessage(error) {
  if (error.code === "AUTH_INTEGRATION_REQUIRED") return error.message;
  if (error.code === "UNAUTHORIZED") {
    return "로그인이 필요합니다. 로그인 인증 연결 후 다시 시도해주세요.";
  }
  if (error.code === "TOKEN_EXPIRED") {
    return "로그인 토큰이 만료되었습니다. 현재 프로젝트에는 토큰 갱신 연동이 없습니다.";
  }
  if (error.code === "INVALID_INPUT") {
    return "목록 조건을 확인할 수 없습니다. 필터와 정렬을 다시 선택해주세요.";
  }
  if (error.code === "INVALID_RESPONSE") return error.message;
  return error.message || "네트워크 오류가 발생했습니다. 다시 시도해주세요.";
}

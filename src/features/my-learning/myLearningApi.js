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
  size = 10,
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

export class ReviewApiNotConfiguredError extends Error {
  constructor() {
    super(
      "리뷰 등록 API 경로와 요청·응답 명세가 확인되지 않아 아직 등록할 수 없습니다.",
    );
    this.name = "ReviewApiNotConfiguredError";
  }
}

// REVIEW_API_CONNECTED
async function requestReviewApi(path, accessToken, options = {}) {
  if (!accessToken) {
    throw new MyLearningApiError(
      "UNAUTHORIZED",
      "로그인 후 이용해 주세요.",
      401,
    );
  }

  const response = await authFetch(
    `${API_BASE_URL || "/backend"}${path}`,
    {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        ...options.headers,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new MyLearningApiError(
      body?.code || `HTTP_${response.status}`,
      body?.message || `요청 실패: HTTP ${response.status}`,
      response.status,
    );
  }

  return response;
}

// 목록 첫 페이지에 없는 강의도 강의 번호로 직접 확인합니다.
export async function getReviewCourse({ courseId, accessToken, signal }) {
  if (!/^[1-9]\d*$/.test(String(courseId))) {
    throw new Error("강의 번호가 올바르지 않습니다.");
  }

  const response = await requestReviewApi(
    `/lectures/${courseId}`,
    accessToken,
    { signal },
  );
  const data = await response.json();

  if (
    String(data.lectureId) !== String(courseId) ||
    typeof data.name !== "string"
  ) {
    throw new Error("강의 정보 응답 형식이 올바르지 않습니다.");
  }

  if (data.viewerState !== "enrolled") {
    throw new Error("수강 중인 강의에만 수강평을 작성할 수 있습니다.");
  }

  return {
    courseId: data.lectureId,
    title: data.name,
    category: { name: data.category || "" },
  };
}

export async function submitReview({
  courseId,
  accessToken,
  rating,
  content,
}) {
  if (!/^[1-9]\d*$/.test(String(courseId))) {
    throw new Error("강의 번호가 올바르지 않습니다.");
  }

  const response = await requestReviewApi(
    `/lectures/${courseId}/reviews`,
    accessToken,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        star: rating,
        review: content.trim(),
      }),
    },
  );

  // 이 API는 등록 성공 시 본문 없이 201을 반환합니다.
  if (response.status !== 201) {
    throw new Error("리뷰 등록 결과를 확인하지 못했습니다.");
  }
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

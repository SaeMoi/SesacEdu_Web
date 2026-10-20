const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(
  /\/+$/,
  "",
);
const LECTURES_API_PATH = "/instructor/lectures";

export const INSTRUCTOR_LECTURE_FILES_API_PATH = (lid) =>
  `${LECTURES_API_PATH}/${encodeURIComponent(lid)}/files`;

export class InstructorCoursesApiError extends Error {
  constructor(code, message, status = 0) {
    super(message);
    this.name = "InstructorCoursesApiError";
    this.code = code;
    this.status = status;
  }
}

async function request(path, { accessToken, ...options } = {}) {
  if (!API_BASE_URL) {
    throw new InstructorCoursesApiError(
      "API_BASE_URL_REQUIRED",
      "강사 강의 API 서버 주소가 설정되지 않았습니다. VITE_API_BASE_URL 설정이 필요합니다.",
    );
  }
  if (!accessToken) {
    throw new InstructorCoursesApiError(
      "AUTH_REQUIRED",
      "로그인 Access Token 연동이 필요합니다.",
    );
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new InstructorCoursesApiError(
      "NETWORK_ERROR",
      "네트워크 오류가 발생했습니다. 연결을 확인한 뒤 다시 시도해주세요.",
    );
  }

  if (response.status === 204) return null;

  let body = null;
  try {
    body = await response.json();
  } catch (error) {
    if (response.ok) {
      throw new InstructorCoursesApiError(
        "INVALID_RESPONSE",
        "강의 서버 응답 형식을 확인할 수 없습니다.",
        response.status,
      );
    }
    if (error.name !== "SyntaxError") throw error;
  }
  if (!response.ok) {
    const message =
      response.status === 400
        ? body?.message ?? "필수 입력값을 확인해주세요."
        : response.status === 401
          ? "로그인이 필요하거나 로그인 정보가 만료되었습니다."
          : response.status === 404
            ? "강의 정보가 없거나 접근 권한이 없습니다."
            : response.status >= 500
              ? "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
              : body?.message ?? "강의 요청을 처리하지 못했습니다.";
    throw new InstructorCoursesApiError(
      body?.code ?? `HTTP_${response.status}`,
      message,
      response.status,
    );
  }
  return body;
}

export async function getInstructorLectures(
  accessToken,
  { status, page = 1, signal } = {},
) {
  const params = new URLSearchParams({
    status: status ?? "",
    page: String(page),
  });
  const body = await request(`${LECTURES_API_PATH}?${params}`, {
    method: "GET",
    accessToken,
    signal,
  });
  if (!Array.isArray(body?.content)) {
    throw new InstructorCoursesApiError(
      "INVALID_RESPONSE",
      "강의 목록 응답 형식이 올바르지 않습니다.",
      200,
    );
  }
  return body;
}

export async function getInstructorLecture(accessToken, lid, signal) {
  const body = await request(`${LECTURES_API_PATH}/${encodeURIComponent(lid)}`, {
    method: "GET",
    accessToken,
    signal,
  });
  if (!body || typeof body !== "object" || body.lid === undefined) {
    throw new InstructorCoursesApiError(
      "INVALID_RESPONSE",
      "강의 상세 응답 형식이 올바르지 않습니다.",
      200,
    );
  }
  return body;
}

export function createLectureFormData(values) {
  const formData = new FormData();
  formData.append("name", values.name.trim());
  formData.append("category", values.category.trim());
  formData.append("level", values.level.trim());
  formData.append("headline", values.headline.trim());
  formData.append("summary", values.summary.trim());
  formData.append("price", String(values.price));
  formData.append("status", values.status);
  if (values.thumbnail) formData.append("thumbnail", values.thumbnail);
  return formData;
}

export async function saveInstructorLecture(accessToken, values) {
  const editing = Boolean(values.lid);
  const path = editing
    ? `${LECTURES_API_PATH}/${encodeURIComponent(values.lid)}`
    : LECTURES_API_PATH;
  const body = await request(path, {
    method: editing ? "PUT" : "POST",
    accessToken,
    body: createLectureFormData(values),
  });
  const savedLid = body?.lid ?? values.lid;
  if (!Number.isInteger(Number(savedLid)) || Number(savedLid) <= 0) {
    throw new InstructorCoursesApiError(
      "INVALID_RESPONSE",
      "저장 응답에 유효한 강의 식별자(lid)가 없습니다.",
      200,
    );
  }
  return { ...body, lid: Number(savedLid) };
}

export function createLectureFilesFormData(files) {
  const formData = new FormData();
  if (files.video) formData.append("video", files.video);
  if (files.material) formData.append("material", files.material);
  return formData;
}

export async function uploadLectureFiles(accessToken, lid, files) {
  const formData = createLectureFilesFormData(files);
  if (formData.entries().next().done) {
    throw new InstructorCoursesApiError(
      "INVALID_INPUT",
      "업로드할 파일을 하나 이상 선택해주세요.",
    );
  }
  return request(INSTRUCTOR_LECTURE_FILES_API_PATH(lid), {
    method: "PUT",
    accessToken,
    body: formData,
  });
}

// 강의 과제 설정. title 을 비우면 과제를 없앱니다.
export async function saveInstructorLectureAssignment(accessToken, lid, values) {
  return request(`${LECTURES_API_PATH}/${encodeURIComponent(lid)}/assignment`, {
    method: "PUT",
    accessToken,
    body: JSON.stringify({
      title: values.title.trim(),
      content: values.content,
      fileType: values.fileType.trim(),
    }),
    headers: { "Content-Type": "application/json" },
  });
}

// slot: "video" 또는 "material"
export async function deleteInstructorLectureFiles(accessToken, lid, slot) {
  return request(`${INSTRUCTOR_LECTURE_FILES_API_PATH(lid)}/${encodeURIComponent(slot)}`, {
    method: "DELETE",
    accessToken,
  });
}

export function getInstructorCoursesErrorMessage(error) {
  if (
    error.code === "API_BASE_URL_REQUIRED" ||
    error.code === "AUTH_REQUIRED"
  ) {
    return error.message;
  }
  if (error.code === "TOKEN_EXPIRED") {
    return "로그인 토큰이 만료되었습니다. 기존 토큰 재발급 연동이 필요합니다.";
  }
  return error.message || "요청을 처리하지 못했습니다. 다시 시도해주세요.";
}

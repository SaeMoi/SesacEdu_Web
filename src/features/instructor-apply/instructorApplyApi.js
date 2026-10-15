import { authFetch } from "../../auth/session.js";

export class InstructorApplyApiError extends Error {
  constructor(code, message, status = 0) {
    super(message);
    this.name = "InstructorApplyApiError";
    this.code = code;
    this.status = status;
  }
}

function requireConfiguration(endpoint, accessToken) {
  if (!endpoint) {
    throw new InstructorApplyApiError(
      "API_ENDPOINT_REQUIRED",
      "강사 신청 API URL이 프로젝트 명세에 없어 연결이 필요합니다.",
    );
  }
  if (!accessToken) {
    throw new InstructorApplyApiError(
      "AUTH_REQUIRED",
      "로그인 Access Token 연동이 필요합니다.",
    );
  }
}

async function parseResponse(response) {
  let body = null;
  try {
    body = await response.json();
  } catch (error) {
    if (response.ok) {
      throw new InstructorApplyApiError(
        "INVALID_RESPONSE",
        "강사 신청 서버 응답을 확인할 수 없습니다.",
        response.status,
      );
    }
    if (error.name !== "SyntaxError") throw error;
  }

  if (!response.ok) {
    const message =
      response.status === 400
        ? "필수 정보를 확인해주세요."
        : response.status === 401
          ? "로그인이 필요하거나 로그인 정보가 만료되었습니다."
          : response.status >= 500
            ? "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
            : body?.message ?? "강사 신청 요청을 처리하지 못했습니다.";
    throw new InstructorApplyApiError(
      body?.code ?? `HTTP_${response.status}`,
      message,
      response.status,
    );
  }

  return body;
}

export async function getInstructorApplicationStatus({
  endpoint,
  accessToken,
  signal,
}) {
  requireConfiguration(endpoint, accessToken);
  let response;
  try {
    response = await authFetch(endpoint, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new InstructorApplyApiError(
      "NETWORK_ERROR",
      "신청 상태를 불러오지 못했습니다. 네트워크 연결을 확인해주세요.",
    );
  }

  const body = await parseResponse(response);
  if (
    !["NONE", "PENDING", "APPROVED"].includes(body?.status) ||
    typeof body?.message !== "string"
  ) {
    throw new InstructorApplyApiError(
      "INVALID_RESPONSE",
      "강사 신청 상태 응답 형식이 올바르지 않습니다.",
      response.status,
    );
  }
  return body;
}

export async function submitInstructorApplication({
  endpoint,
  accessToken,
  introduce,
  subject,
  career,
}) {
  requireConfiguration(endpoint, accessToken);
  const formData = new FormData();
  formData.append("introduce", introduce);
  formData.append("subject", subject);
  formData.append("career", career);

  let response;
  try {
    response = await authFetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });
  } catch {
    throw new InstructorApplyApiError(
      "NETWORK_ERROR",
      "신청을 전송하지 못했습니다. 네트워크 연결을 확인해주세요.",
    );
  }

  const body = await parseResponse(response);
  if (body?.status !== "PENDING" || typeof body?.message !== "string") {
    throw new InstructorApplyApiError(
      "INVALID_RESPONSE",
      "강사 신청 응답 형식이 올바르지 않습니다.",
      response.status,
    );
  }
  return body;
}

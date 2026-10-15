const SESSION_KEY = "sesacedu.auth";
const SESSION_EVENT = "sesacedu:auth-change";

// JWT의 만료 시간을 읽습니다.
// 이 함수는 서명을 검증하지 않습니다. 실제 인증 검증은 서버가 담당합니다.
function getExpiresAt(authorization) {
  const token = authorization.slice("Bearer ".length);
  const payload = token.split(".")[1];

  if (!payload) throw new Error("로그인 토큰 형식이 올바르지 않습니다.");

  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const claims = JSON.parse(atob(padded));

  if (!Number.isFinite(claims.exp)) {
    throw new Error("로그인 토큰에 만료 시간이 없습니다.");
  }

  return claims.exp * 1000;
}

// 로그인 성공 시 호출합니다.
export function saveSession(authorization, member) {
  const expiresAt = getExpiresAt(authorization);

  if (expiresAt <= Date.now()) {
    throw new Error("로그인 토큰이 만료되었습니다. 다시 로그인해 주세요.");
  }

  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ authorization, member, expiresAt }),
  );

  window.dispatchEvent(new Event(SESSION_EVENT));
}

// 로그아웃이나 인증 만료 시 사용할 함수입니다.
export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

// React가 변경 여부를 비교할 수 있도록 문자열을 반환합니다.
export function getSessionSnapshot() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw);

    if (
      !session.authorization?.startsWith("Bearer ") ||
      !session.member ||
      !Number.isFinite(session.expiresAt) ||
      session.expiresAt <= Date.now()
    ) {
      return null;
    }

    return raw;
  } catch {
    return null;
  }
}

// 이후 API 요청에서 JWT를 꺼낼 때도 사용할 수 있습니다.
export function getSession() {
  const raw = getSessionSnapshot();
  return raw ? JSON.parse(raw) : null;
}

// 저장 정보가 변경되거나 토큰이 만료되면 헤더를 갱신합니다.
export function subscribeSession(onChange) {
  window.addEventListener(SESSION_EVENT, onChange);
  window.addEventListener("storage", onChange);
  window.addEventListener("focus", onChange);

  const timer = window.setInterval(onChange, 1000);

  return () => {
    window.removeEventListener(SESSION_EVENT, onChange);
    window.removeEventListener("storage", onChange);
    window.removeEventListener("focus", onChange);
    window.clearInterval(timer);
  };
}
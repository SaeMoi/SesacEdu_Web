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
// ---------------------------------------------------------------------------
// 백엔드 연동: 토큰 재발급(/login/replc)·로그아웃(/logout)
// 서버는 "만료된" 토큰만 재발급하므로(만료 전 요청은 400 TOKEN_NOT_EXPIRED),
// 만료 직후 또는 API가 401 TOKEN_EXPIRED를 받은 시점에 재발급합니다.
// ---------------------------------------------------------------------------
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "/backend"
).replace(/\/+$/, "");

// 만료 여부와 관계없이 저장된 세션을 읽습니다. 재발급에 만료된 토큰이 필요합니다.
export function getStoredSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    return session?.authorization?.startsWith("Bearer ") ? session : null;
  } catch {
    return null;
  }
}

// API 래퍼에 넘길 순수 JWT입니다. 래퍼가 "Bearer "를 직접 붙입니다.
export function getAccessToken() {
  const session = getStoredSession();
  return session ? session.authorization.slice("Bearer ".length) : null;
}

let pendingReissue = null;

// 동시에 여러 요청이 만료돼도 재발급은 한 번만 보냅니다.
// 성공 시 새 "Bearer ..." 값, 실패 시 null을 돌려줍니다.
export function reissueSession() {
  if (!pendingReissue) {
    pendingReissue = requestReissue().finally(() => {
      pendingReissue = null;
    });
  }
  return pendingReissue;
}

async function requestReissue() {
  const stored = getStoredSession();
  if (!stored) return null;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/login/replc`, {
      method: "POST",
      headers: { Authorization: stored.authorization },
    });
  } catch {
    return null; // 네트워크 오류: 세션은 유지하고 다음 기회에 다시 시도합니다.
  }

  const authorization = response.headers.get("Authorization");
  if (response.ok && authorization?.startsWith("Bearer ")) {
    try {
      saveSession(authorization, stored.member);
      return authorization;
    } catch {
      clearSession();
      return null;
    }
  }

  // REISSUE_LIMIT·REISSUE_EXPIRED·UNAUTHORIZED·ACCOUNT_RESTRICTED → 다시 로그인
  if (response.status === 401 || response.status === 403) clearSession();
  return null;
}

// 보호된 API 호출용 fetch. 401 TOKEN_EXPIRED면 재발급 후 한 번만 다시 보냅니다.
export async function authFetch(url, init = {}) {
  const response = await fetch(url, init);
  if (response.status !== 401) return response;

  const code = await response
    .clone()
    .json()
    .then((body) => body?.code)
    .catch(() => null);

  if (code === "TOKEN_EXPIRED") {
    const authorization = await reissueSession();
    if (!authorization) return response;
    const headers = new Headers(init.headers);
    headers.set("Authorization", authorization);
    return fetch(url, { ...init, headers });
  }

  if (code === "UNAUTHORIZED") clearSession();
  return response;
}

// 서버는 토큰을 무효화하지 않으므로(204) 결과와 관계없이 브라우저의 토큰을 지웁니다.
export async function logout() {
  const stored = getStoredSession();
  if (stored) {
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: "POST",
        headers: { Authorization: stored.authorization },
      });
    } catch {
      // 서버에 닿지 않아도 로그아웃은 진행합니다.
    }
  }
  clearSession();
}

let keeperTimer = null;

// 토큰 만료 직후 자동으로 재발급합니다. 페이지당 한 번 호출합니다.
export function startSessionKeeper() {
  if (keeperTimer) return;
  keeperTimer = window.setInterval(() => {
    const stored = getStoredSession();
    if (stored && Number.isFinite(stored.expiresAt) && stored.expiresAt <= Date.now()) {
      reissueSession();
    }
  }, 5000);
}

// 백엔드가 준 "/images/..." 같은 경로를 브라우저에서 열 수 있는 주소로 바꿉니다.
// API_BASE_URL이 "/backend"처럼 상대 경로여도 동작합니다 (→ /backend/images/...).
export function resolveApiAssetUrl(path) {
  if (typeof path !== "string" || !path.trim()) return "";
  try {
    const base = new URL(`${API_BASE_URL}/`, window.location.origin);
    return new URL(path.replace(/^\/+/, ""), base).href;
  } catch {
    return "";
  }
}

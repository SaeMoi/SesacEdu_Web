import { useSyncExternalStore } from "react";
import { getAccessToken, subscribeSession } from "./session.js";

// 로그인 세션의 JWT(“Bearer ” 제외)를 반환합니다. 로그인·재발급·로그아웃 시 다시 렌더링됩니다.
// 만료된 토큰도 그대로 돌려주어 API 호출에서 401 TOKEN_EXPIRED → 재발급이 일어나게 합니다.
export function useAccessToken() {
  return useSyncExternalStore(subscribeSession, getAccessToken, () => null);
}

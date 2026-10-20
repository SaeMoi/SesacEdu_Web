import { useCallback, useMemo, useState } from "react";
import { ProfileEditSessionContext } from "./profileEditSessionContext.js";

export function ProfileEditSessionProvider({
  accessToken = null,
  children,
}) {
  const [reauthTokens, setReauthTokens] = useState({});
  const setReauthToken = useCallback((purpose, token, expiresIn) => {
    setReauthTokens((current) => ({
      ...current,
      [purpose]: {
        token,
        expiresAt: Date.now() + expiresIn * 1000,
      },
    }));
  }, []);
  const clearReauthToken = useCallback((purpose) => {
    setReauthTokens((current) => {
      const next = { ...current };
      delete next[purpose];
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      accessToken,
      reauthTokens,
      setReauthToken,
      clearReauthToken,
    }),
    [accessToken, clearReauthToken, reauthTokens, setReauthToken],
  );

  return (
    <ProfileEditSessionContext.Provider value={value}>
      {children}
    </ProfileEditSessionContext.Provider>
  );
}

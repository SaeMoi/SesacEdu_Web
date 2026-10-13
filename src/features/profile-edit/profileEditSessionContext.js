import { createContext, useContext } from "react";

export const ProfileEditSessionContext = createContext(null);

export function useProfileEditSession() {
  const session = useContext(ProfileEditSessionContext);
  if (!session) {
    throw new Error(
      "Profile edit pages must be rendered inside ProfileEditSessionProvider.",
    );
  }
  return session;
}

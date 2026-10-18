import { createContext, useContext } from "react";

export const MyLearningAuthContext = createContext(null);

export function useMyLearningAuth() {
  const auth = useContext(MyLearningAuthContext);
  if (!auth) {
    throw new Error(
      "My learning pages must be rendered inside MyLearningAuthProvider.",
    );
  }
  return auth;
}

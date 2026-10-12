import { createContext, useContext } from "react";

export const QnaAuthContext = createContext(null);

export function useQnaAuth() {
  const auth = useContext(QnaAuthContext);
  if (!auth) {
    throw new Error("Q&A pages must be rendered inside QnaAuthProvider.");
  }
  return auth;
}

import { QnaAuthContext } from "./qnaAuthContext.js";

export function QnaAuthProvider({ accessToken = null, children }) {
  return (
    <QnaAuthContext.Provider value={{ accessToken }}>
      {children}
    </QnaAuthContext.Provider>
  );
}

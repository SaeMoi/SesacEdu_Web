import { MyLearningAuthContext } from "./myLearningAuthContext.js";

export function MyLearningAuthProvider({ accessToken = null, children }) {
  return (
    <MyLearningAuthContext.Provider value={{ accessToken }}>
      {children}
    </MyLearningAuthContext.Provider>
  );
}

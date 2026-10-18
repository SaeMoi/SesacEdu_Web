import { createRoot } from "react-dom/client";
import Chatbot from "../components/chatbot/Chatbot";

// JSP 전용 진입점. React 앱 전체를 실행하지 않고 공통 챗봇만 마운트합니다.
const roots = new WeakMap();
export function mountChatbot(element, props = {}) {
  if (!(element instanceof HTMLElement)) throw new Error("챗봇을 표시할 요소가 필요합니다.");
  if (roots.has(element)) return roots.get(element);
  const root = createRoot(element);
  const handle = {unmount(){root.unmount();roots.delete(element);}};
  roots.set(element, handle);
  root.render(<Chatbot {...props} />);
  return handle;
}
const host = document.getElementById("shared-chatbot");
if (host) mountChatbot(host, {initialOpen:host.dataset.initialOpen === "true", courseId:host.dataset.courseId || null});

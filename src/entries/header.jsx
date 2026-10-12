import { createRoot } from "react-dom/client";
import Header from "../components/navigation/Header";

// 같은 HTML 요소에 root를 중복 생성하지 않도록 보관합니다.
const mountedHeaders = new WeakMap();

/**
 * JSP에서 import한 뒤 호출하는 공개 함수입니다.
 * React 전체 App을 실행하지 않고 전달된 요소 안에 헤더만 표시합니다.
 * 인증 확인 후 handle.update({ member, authLoading: false })로 갱신합니다.
 */
export function mountHeader(element, props = {}) {
  if (!(element instanceof HTMLElement)) {
    throw new Error("mountHeader에 헤더를 표시할 HTML 요소를 전달하세요.");
  }
  const previous = mountedHeaders.get(element);
  if (previous) {
    previous.update(props);
    return previous;
  }

  const root = createRoot(element);
  let currentProps = { basePath: element.dataset.basePath || "", ...props };
  const handle = {
    // 로그인 확인/로그아웃 후 전체 페이지를 새로고침하지 않고 메뉴를 갱신합니다.
    update(nextProps) {
      currentProps = { ...currentProps, ...nextProps };
      root.render(<Header {...currentProps} />);
    },
    // 헤더를 제거해야 할 때 React 리소스도 정리합니다.
    unmount() {
      root.unmount();
      mountedHeaders.delete(element);
    },
  };
  mountedHeaders.set(element, handle);
  handle.update({});
  return handle;
}

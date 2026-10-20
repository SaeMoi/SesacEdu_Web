import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { sendChatMessage } from "../../api/chatbot";
import ChatMessage from "./ChatMessage";
import styles from "./Chatbot.module.css";

const greeting = [{ role: "assistant", text: "안녕하세요! 강의와 학습에 대해 궁금한 내용을 물어보세요." }];
const storageKey = "sesac-chat-preview-v1";
function readMessages() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey));
    if (Array.isArray(saved) && saved.length && saved.length <= 40 && saved.every(item =>
      item && ["user", "assistant"].includes(item.role) && typeof item.text === "string" && item.text.length <= 2000)) return saved;
  } catch { /* 브라우저 저장소가 차단되어도 챗봇은 사용할 수 있습니다. */ }
  return greeting;
}

// 모든 React 페이지의 공통 레이아웃에 한 번만 배치합니다.
// JSP도 동일 컴포넌트를 사용하며, 대화는 같은 origin/탭의 sessionStorage에만 보관합니다.
// 로그인 연동 시 이 데모 저장소를 사용자별 서버 대화 이력으로 교체해야 합니다.
export default function Chatbot({ initialOpen = false, courseId = null }) {
  const [open, setOpen] = useState(initialOpen);
  const [messages, setMessages] = useState(readMessages);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const launcherRef = useRef(null);
  const logRef = useRef(null);
  const pending = useRef(false);
  const panelId = useId();
  useEffect(() => {
    try { sessionStorage.setItem(storageKey, JSON.stringify(messages)); } catch { /* 저장 실패 시 현재 화면에서만 유지합니다. */ }
  }, [messages]);
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);
  useEffect(() => {
    if (open && logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [open, messages]);
  function close() {
    setOpen(false);
    launcherRef.current?.focus();
  }
  async function submit(event) {
    event.preventDefault();
    const message = input.trim();
    if (!message || pending.current) return;
    pending.current = true;
    setBusy(true);setError("");setInput("");
    setMessages(previous => [...previous, {role:"user", text:message}].slice(-40));
    try {
      const reply = await sendChatMessage({ message, courseId });
      setMessages(previous => [...previous, {role:"assistant", text:reply}].slice(-40));
    } catch {
      setError("답변을 불러오지 못했어요. 잠시 후 다시 질문해 주세요.");
      setInput(message);
    } finally { pending.current=false;setBusy(false); }
  }
  // Portal을 사용해 B 페이지의 overflow/transform 스타일에 잘리지 않도록 합니다.
  return createPortal(<div className={styles.root}>
    {open && <section id={panelId} className={styles.panel} role="dialog" aria-label="학습 도우미" onKeyDown={event => {if(event.key === "Escape") close();}}>
      <header className={styles.heading}><div><h2>학습 도우미</h2><p>궁금한 내용을 물어보세요.</p></div><button type="button" onClick={close} aria-label="학습 도우미 닫기">×</button></header>
      <div className={styles.log} ref={logRef} role="log" aria-live="polite" aria-label="대화 내용">
        {messages.map((message, index) => <ChatMessage key={index} {...message} />)}
        {busy && <p>답변을 준비하고 있어요.</p>}
      </div>
      {error && <p role="alert" className={styles.notice}>{error}</p>}
      <form className={styles.form} onSubmit={submit}>
        <input ref={inputRef} aria-label="학습 도우미에게 질문" value={input} onChange={event => setInput(event.target.value)} maxLength={500} placeholder="궁금한 내용을 입력해 주세요." />
        <button type="submit" disabled={busy || !input.trim()} aria-label="질문 보내기">↑</button>
      </form>
      <div className={styles.footer}><span>예시 대화 · AI 서버 미연결<br/>이 탭에서만 대화 유지</span><button type="button" disabled={busy} onClick={() => {setMessages(greeting);setError("");setInput("");inputRef.current?.focus();}}>대화 지우기</button></div>
    </section>}
    <button className={styles.launcher} ref={launcherRef} type="button" aria-label={open ? "학습 도우미 접기" : "학습 도우미 열기"} aria-expanded={open} aria-controls={panelId} onClick={() => open ? close() : setOpen(true)}><span aria-hidden="true">🤖</span><small>학습 도우미</small></button>
  </div>, document.body);
}

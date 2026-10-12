import styles from "./Chatbot.module.css";

// React 기본 텍스트 출력으로 메시지의 HTML 태그를 실행하지 않습니다.
export default function ChatMessage({ role, text }) {
  return <p className={`${styles.message} ${role === "user" ? styles.user : styles.assistant}`}>
    <span className={styles.srOnly}>{role === "user" ? "나: " : "학습 도우미: "}</span>{text}
  </p>;
}

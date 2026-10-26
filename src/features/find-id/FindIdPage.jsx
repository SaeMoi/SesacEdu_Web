import { useState } from "react";
import { Link } from "react-router";
import Header from "../../components/navigation/Header.jsx";
import { findId, FindIdApiError } from "./findIdApi.js";

// 아이디(이메일) 찾기 화면. 이름 + 생년월일을 보내 가입 이메일을 받아 보여준다.
// 서버가 전체 이메일을 그대로 내려주므로 화면도 전체를 노출한다(의도된 취약점: 계정 열거·PII 노출).
export default function FindIdPage() {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [email, setEmail] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setEmail(null);
    setSubmitting(true);
    try {
      const found = await findId({ name: name.trim(), birthDate: birthDate.trim() });
      setEmail(found);
    } catch (err) {
      setError(err instanceof FindIdApiError ? err.message : "아이디 확인 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header />
      <main className="container">
        <section className="home-hero" style={{ maxWidth: "480px" }}>
          <h1>아이디(이메일) 찾기</h1>
          <p className="hero-description">
            가입 시 등록한 이름과 생년월일로 이메일을 확인합니다.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <label style={{ display: "block", marginBottom: "12px" }}>
              이름
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={50}
                autoComplete="name"
                required
              />
            </label>
            <label style={{ display: "block", marginBottom: "12px" }}>
              생년월일
              <input
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
                required
              />
            </label>
            <button className="button button-primary" type="submit" disabled={submitting}>
              {submitting ? "확인 중…" : "아이디 찾기"}
            </button>
          </form>

          {email && (
            <p style={{ marginTop: "16px" }} role="status">
              가입된 이메일: <strong>{email}</strong>
            </p>
          )}
          {error && (
            <p style={{ marginTop: "16px", color: "#c0392b" }} role="alert">
              {error}
            </p>
          )}

          <p style={{ marginTop: "16px" }}>
            <Link to="/">홈으로</Link>
          </p>
        </section>
      </main>
    </>
  );
}

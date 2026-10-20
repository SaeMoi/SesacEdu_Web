import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  ProfileApiError,
  verifyPassword,
} from "./profileApi.js";
import { useProfileEditSession } from "./profileEditSessionContext.js";
import {
  ProfileEditLayout,
  ProfilePageHeader,
} from "./ProfileEditLayout.jsx";
import "./profileEdit.css";

export function PasswordMismatchDialog({ onClose }) {
  const confirmRef = useRef(null);

  useEffect(() => {
    confirmRef.current?.focus();
    function handleEscape(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div className="profile-modal-backdrop">
      <section
        className="profile-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-mismatch-title"
        aria-describedby="password-mismatch-description"
        onKeyDown={(event) => {
          if (event.key === "Tab") {
            event.preventDefault();
            confirmRef.current?.focus();
          }
        }}
      >
        <h2 id="password-mismatch-title">비밀번호 확인</h2>
        <p className="profile-modal-error">비밀번호가 일치하지 않습니다.</p>
        <p id="password-mismatch-description">
          입력한 비밀번호를 확인하고 다시 시도해주세요.
        </p>
        <button
          className="button button-primary profile-modal-confirm"
          onClick={onClose}
          ref={confirmRef}
          type="button"
        >
          확인
        </button>
      </section>
    </div>
  );
}

function VerifyPasswordPage() {
  const navigate = useNavigate();
  const { accessToken, setReauthToken } = useProfileEditSession();
  const inputRef = useRef(null);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMismatch, setShowMismatch] = useState(false);
  const [error, setError] = useState("");
  const notice = useLocation().state?.notice;

  function closeMismatch() {
    setShowMismatch(false);
    setPassword("");
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    setError("");

    if (!password) {
      setError("현재 비밀번호를 입력해주세요.");
      inputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await verifyPassword(
        accessToken,
        password,
        "PROFILE_UPDATE",
      );
      if (
        typeof result?.reauthToken !== "string" ||
        !result.reauthToken ||
        !Number.isFinite(result.expiresIn) ||
        result.expiresIn <= 0
      ) {
        throw new ProfileApiError(
          "INVALID_RESPONSE",
          "본인 확인 토큰 응답을 확인할 수 없습니다.",
        );
      }
      setReauthToken(
        "PROFILE_UPDATE",
        result.reauthToken,
        result.expiresIn,
      );
      setPassword("");
      navigate("/mypage/profile");
    } catch (requestError) {
      if (requestError.code === "PASSWORD_MISMATCH") {
        setShowMismatch(true);
      } else if (requestError.code === "INVALID_INPUT") {
        setError("입력한 비밀번호를 확인해주세요.");
      } else if (requestError.code === "UNAUTHORIZED") {
        setError("로그인 인증 연동이 필요합니다. 다시 로그인한 뒤 시도해주세요.");
      } else if (requestError.code === "TOKEN_EXPIRED") {
        setError(
          "로그인 토큰이 만료되었습니다. 현재 프로젝트에는 토큰 재발급 연동이 없습니다.",
        );
      } else if (requestError.code === "AUTH_INTEGRATION_REQUIRED") {
        setError(requestError.message);
      } else if (requestError instanceof ProfileApiError) {
        setError(requestError.message);
      } else {
        setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ProfileEditLayout>
      <ProfilePageHeader
        title="현재 비밀번호 확인"
        description="프로필을 수정하기 전에 현재 비밀번호를 확인해주세요."
      />
      <section className="verify-password-card">
        <h2>본인 확인</h2>
        <p>현재 사용 중인 비밀번호를 입력해주세요.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="verify-password-input">현재 비밀번호</label>
          <input
            autoComplete="current-password"
            id="verify-password-input"
            maxLength={30}
            onChange={(event) => setPassword(event.target.value)}
            ref={inputRef}
            type="password"
            value={password}
          />
          {error && (
            <p className="profile-form-error" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="profile-form-notice" role="status">
              {notice}
            </p>
          )}
          <div className="verify-password-actions">
            <Link className="button profile-button-secondary" to="/mypage">
              취소
            </Link>
            <button
              className="button button-primary"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "확인 중..." : "확인"}
            </button>
          </div>
        </form>
      </section>
      {showMismatch && <PasswordMismatchDialog onClose={closeMismatch} />}
    </ProfileEditLayout>
  );
}

export default VerifyPasswordPage;

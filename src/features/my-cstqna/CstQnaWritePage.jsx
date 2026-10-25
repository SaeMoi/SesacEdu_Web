import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useAccessToken } from "../../auth/useAccessToken.js";
import { CstQnaLayout } from "./CstQnaLayout.jsx";
import {
  CONTENT_MAX,
  TITLE_MAX,
  createCstQna,
  getCstQnaDetail,
  updateCstQna,
} from "./cstQnaApi.js";

// 작성(/mypage/cstqna/posts → POST)과 수정(/mypage/cstqna/:iqid/edit → PUT)이 같은 폼을 씁니다.
function CstQnaWritePage() {
  const { iqid } = useParams();
  const isEdit = iqid !== undefined;
  const accessToken = useAccessToken();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loadState, setLoadState] = useState(isEdit ? "loading" : "ready");
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formMessage, setFormMessage] = useState("");
  const submitLock = useRef(false);

  // 수정이면 기존 내용을 불러옵니다. 답변이 달린 문의는 수정할 수 없습니다.
  useEffect(() => {
    if (!isEdit) return undefined;
    const controller = new AbortController();
    getCstQnaDetail({ accessToken, inquiryId: iqid, signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        if (!data.editable) {
          setLoadError("답변이 달린 문의는 수정할 수 없습니다.");
          setLoadState("error");
          return;
        }
        setTitle(data.title ?? "");
        setContent(data.content ?? "");
        setLoadState("ready");
      })
      .catch((error) => {
        if (error.name === "AbortError" || controller.signal.aborted) return;
        setLoadError(error.message || "문의를 불러오지 못했습니다.");
        setLoadState("error");
      });
    return () => controller.abort();
  }, [accessToken, iqid, isEdit]);

  function validate() {
    const errors = {};
    const t = title.trim();
    const c = content.trim();
    if (!t) errors.title = "제목을 입력해주세요.";
    else if (t.length > TITLE_MAX) errors.title = `제목은 ${TITLE_MAX}자 이하여야 합니다.`;
    if (!c) errors.content = "내용을 입력해주세요.";
    else if (c.length > CONTENT_MAX) errors.content = `내용은 ${CONTENT_MAX}자 이하여야 합니다.`;
    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitLock.current) return;
    const errors = validate();
    setFieldErrors(errors);
    setFormMessage("");
    if (Object.keys(errors).length > 0) return;

    submitLock.current = true;
    setSubmitting(true);
    try {
      const saved = isEdit
        ? await updateCstQna({ accessToken, inquiryId: iqid, title: title.trim(), content: content.trim() })
        : await createCstQna({ accessToken, title: title.trim(), content: content.trim() });
      navigate(`/mypage/cstqna/${saved.inquiryId}`, { replace: true });
    } catch (error) {
      // 400 INVALID_INPUT은 필드별로 표시합니다.
      const serverErrors = {};
      for (const e of error.errors ?? []) {
        if (e?.field && typeof e.reason === "string") serverErrors[e.field] = e.reason;
      }
      setFieldErrors(serverErrors);
      setFormMessage(error.message || "문의를 저장하지 못했습니다.");
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  const cancelTo = isEdit ? `/mypage/cstqna/${iqid}` : "/mypage/cstqna";

  return (
    <CstQnaLayout
      title={isEdit ? "1:1 문의 수정" : "1:1 문의하기"}
      description={isEdit ? "답변이 등록되기 전까지 문의를 수정할 수 있어요." : undefined}
    >
      {loadState === "loading" && (
        <p className="qna-state-message" role="status">
          문의를 불러오는 중입니다.
        </p>
      )}

      {loadState === "error" && (
        <section className="qna-state-message qna-state-error" role="alert">
          <p>{loadError}</p>
          <Link className="qna-retry-button" to={cancelTo}>
            돌아가기
          </Link>
        </section>
      )}

      {loadState === "ready" && (
        <form className="cstqna-form" noValidate onSubmit={handleSubmit}>
          <div className="cstqna-field">
            <label htmlFor="cstqna-title">
              제목 <span aria-hidden="true">*</span>
            </label>
            <input
              aria-describedby="cstqna-title-count"
              aria-invalid={Boolean(fieldErrors.title)}
              disabled={submitting}
              id="cstqna-title"
              maxLength={TITLE_MAX}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="문의 제목을 입력해주세요."
              value={title}
            />
            <div className="cstqna-field-footer">
              {fieldErrors.title ? (
                <p className="cstqna-field-error" role="alert">{fieldErrors.title}</p>
              ) : (
                <span />
              )}
              <span className="cstqna-count" id="cstqna-title-count">
                {title.length} / {TITLE_MAX}
              </span>
            </div>
          </div>

          <div className="cstqna-field">
            <label htmlFor="cstqna-content">
              내용 <span aria-hidden="true">*</span>
            </label>
            <textarea
              aria-describedby="cstqna-content-count"
              aria-invalid={Boolean(fieldErrors.content)}
              disabled={submitting}
              id="cstqna-content"
              maxLength={CONTENT_MAX}
              onChange={(event) => setContent(event.target.value)}
              placeholder="문의 내용을 자세히 적어주시면 더 정확하게 답변해 드릴 수 있어요."
              rows={10}
              value={content}
            />
            <div className="cstqna-field-footer">
              {fieldErrors.content ? (
                <p className="cstqna-field-error" role="alert">{fieldErrors.content}</p>
              ) : (
                <span />
              )}
              <span className="cstqna-count" id="cstqna-content-count">
                {content.length} / {CONTENT_MAX}
              </span>
            </div>
          </div>

          {formMessage && (
            <p className="cstqna-form-message is-error" role="alert">
              {formMessage}
            </p>
          )}

          <div className="cstqna-actions">
            <Link className="cstqna-secondary-button" to={cancelTo}>
              취소
            </Link>
            <button className="cstqna-primary-button" disabled={submitting} type="submit">
              {submitting ? "저장 중..." : isEdit ? "수정하기" : "등록하기"}
            </button>
          </div>
        </form>
      )}
    </CstQnaLayout>
  );
}

export default CstQnaWritePage;

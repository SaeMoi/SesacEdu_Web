import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useAccessToken } from "../../auth/useAccessToken.js";
import { CstQnaLayout } from "./CstQnaLayout.jsx";
import { deleteCstQna, formatDate, getCstQnaDetail } from "./cstQnaApi.js";

// GET /mypage/cstqna/:iqid 상세. 문의·답변은 텍스트로만 표시합니다 (HTML로 해석하지 않음).
function CstQnaDetailPage() {
  const { iqid } = useParams();
  const accessToken = useAccessToken();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loadState, setLoadState] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getCstQnaDetail({ accessToken, inquiryId: iqid, signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        setDetail(data);
        setLoadState("success");
      })
      .catch((error) => {
        if (error.name === "AbortError" || controller.signal.aborted) return;
        setErrorMessage(error.message || "문의를 불러오지 못했습니다.");
        setLoadState("error");
      });
    return () => controller.abort();
  }, [accessToken, iqid]);

  async function handleDelete() {
    if (deleting) return;
    if (!window.confirm("이 문의를 삭제할까요? 삭제한 문의는 되돌릴 수 없습니다.")) return;
    setDeleting(true);
    setActionMessage("");
    try {
      await deleteCstQna({ accessToken, inquiryId: iqid });
      navigate("/mypage/cstqna", { replace: true });
    } catch (error) {
      setActionMessage(error.message || "문의를 삭제하지 못했습니다.");
      setDeleting(false);
    }
  }

  return (
    <CstQnaLayout>
      {loadState === "loading" && (
        <p className="qna-state-message" role="status">
          문의를 불러오는 중입니다.
        </p>
      )}

      {loadState === "error" && (
        <section className="qna-state-message qna-state-error" role="alert">
          <p>{errorMessage}</p>
          <Link className="qna-retry-button" to="/mypage/cstqna">
            목록으로
          </Link>
        </section>
      )}

      {loadState === "success" && detail && (
        <article className="cstqna-detail">
          <header className="cstqna-detail-header">
            <span className={`qna-status ${detail.status === "ANSWERED" ? "is-answered" : ""}`}>
              {detail.status === "ANSWERED" ? "답변 완료" : "답변 대기"}
            </span>
            <h2>{detail.title}</h2>
            <p className="cstqna-detail-meta">
              작성일 <time dateTime={detail.createdAt}>{formatDate(detail.createdAt)}</time>
              {detail.updatedAt && (
                <>
                  {" · "}수정일 <time dateTime={detail.updatedAt}>{formatDate(detail.updatedAt)}</time>
                </>
              )}
            </p>
          </header>

          <p className="cstqna-text">{detail.content}</p>

          <section className="cstqna-answer" aria-label="관리자 답변">
            <h3>
              관리자 답변
              {detail.answeredAt && (
                <span className="cstqna-answer-meta">
                  {detail.answeredBy?.nickname ? `${detail.answeredBy.nickname} · ` : ""}
                  <time dateTime={detail.answeredAt}>{formatDate(detail.answeredAt)}</time>
                </span>
              )}
            </h3>
            <p className={`cstqna-text ${detail.answer == null ? "is-waiting" : ""}`}>
              {detail.answer ?? "답변 대기 중입니다."}
            </p>
          </section>

          {actionMessage && (
            <p className="cstqna-form-message is-error" role="alert">
              {actionMessage}
            </p>
          )}

          <div className="cstqna-actions">
            <Link className="cstqna-secondary-button" to="/mypage/cstqna">
              목록
            </Link>
            {detail.editable && (
              <>
                <Link className="cstqna-secondary-button" to={`/mypage/cstqna/${detail.inquiryId}/edit`}>
                  수정
                </Link>
                <button
                  className="cstqna-danger-button"
                  disabled={deleting}
                  onClick={handleDelete}
                  type="button"
                >
                  {deleting ? "삭제 중..." : "삭제"}
                </button>
              </>
            )}
          </div>
        </article>
      )}
    </CstQnaLayout>
  );
}

export default CstQnaDetailPage;

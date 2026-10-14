import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { InstructorCenterLayout as SharedInstructorCenterLayout } from "../instructor-center/InstructorCenterLayout.jsx";
import {
  deleteInstructorQnaAnswer,
  getInstructorQna,
  getInstructorQnaList,
  saveInstructorQnaAnswer,
} from "./instructorQnaApi.js";
import { useInstructorQnaAuth } from "./instructorQnaAuthContext.js";
import "./instructorQna.css";

const PAGE_SIZE = 10;
const FILTERS = [
  { value: "", label: "전체" },
  { value: "none", label: "미답변" },
  { value: "done", label: "답변 완료" },
];

function InstructorQnaLayout({ children }) {
  return (
    <SharedInstructorCenterLayout variant="qna">
      {children}
    </SharedInstructorCenterLayout>
  );
}

function InstructorQnaHeading({ title, description }) {
  return (
    <>
      <header className="instructor-qna-heading">
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      <nav className="instructor-qna-tabs" aria-label="강사센터 분류">
        <span aria-disabled="true">운영 현황</span>
        <Link to="/instructor/lectures">강의</Link>
        <span aria-current="page" aria-disabled="true" className="is-active">학습 관리</span>
        <span aria-disabled="true">정산</span>
      </nav>
    </>
  );
}

function LoadingState() {
  return <p className="instructor-qna-state" role="status">불러오는 중입니다...</p>;
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="instructor-qna-state is-error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          다시 시도
        </button>
      )}
    </div>
  );
}

function formatDate(date) {
  if (typeof date !== "string" || !date) return "-";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  return match ? `${match[2]}.${match[3]}` : date;
}

export function InstructorQnaListPage() {
  const auth = useInstructorQnaAuth();
  const accessToken = auth?.accessToken;
  const location = useLocation();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [qnaList, setQnaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadQnaList() {
      setLoading(true);
      setError("");
      try {
        const items = await getInstructorQnaList(accessToken, {
          status,
          signal: controller.signal,
        });
        if (active) setQnaList(items);
      } catch (loadError) {
        if (active && loadError.name !== "AbortError") setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadQnaList();
    return () => {
      active = false;
      controller.abort();
    };
  }, [accessToken, status, retry]);

  const pageCount = Math.ceil(qnaList.length / PAGE_SIZE);
  const visibleQna = useMemo(
    () => qnaList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [qnaList, page],
  );

  function selectFilter(value) {
    setStatus(value);
    setPage(1);
  }

  return (
    <InstructorQnaLayout>
      <InstructorQnaHeading
        title="Q&A 관리"
        description="강의별 질문을 확인하고 미답변 질문에 답변하세요."
      />
      {location.state?.notice && (
        <p className="instructor-qna-notice" role="status">{location.state.notice}</p>
      )}

      <div className="instructor-qna-filters" aria-label="답변 상태 필터">
        {FILTERS.map((filter) => (
          <button
            aria-pressed={status === filter.value}
            className={status === filter.value ? "is-active" : ""}
            key={filter.value || "all"}
            onClick={() => selectFilter(filter.value)}
            type="button"
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setRetry((count) => count + 1)} />
      ) : qnaList.length === 0 ? (
        <div className="instructor-qna-state">표시할 질문이 없습니다.</div>
      ) : (
        <div className="instructor-qna-table-wrap">
          <table className="instructor-qna-table">
            <thead>
              <tr>
                <th scope="col">강의</th>
                <th scope="col">질문</th>
                <th scope="col">상태</th>
                <th scope="col">작성일</th>
              </tr>
            </thead>
            <tbody>
              {visibleQna.map((item) => (
                <tr key={item.qid}>
                  <td>{item.lectureName || "-"}</td>
                  <td className="instructor-qna-title-cell">
                    <Link to={`/instructor/qna/${encodeURIComponent(item.qid)}`}>
                      {item.title || "(제목 없음)"}
                    </Link>
                  </td>
                  <td>
                    <span
                      className={`instructor-qna-status ${item.status === "done" ? "is-done" : "is-none"}`}
                    >
                      {item.status === "done" ? "답변 완료" : item.status === "none" ? "미답변" : "상태 확인 필요"}
                    </span>
                  </td>
                  <td>{formatDate(item.created)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && pageCount > 1 && (
        <nav className="instructor-qna-pagination" aria-label="Q&A 페이지">
          <button
            aria-label="이전 페이지"
            disabled={page === 1}
            onClick={() => setPage((current) => current - 1)}
            type="button"
          >
            ‹
          </button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
            <button
              aria-current={page === pageNumber ? "page" : undefined}
              className={page === pageNumber ? "is-current" : ""}
              key={pageNumber}
              onClick={() => setPage(pageNumber)}
              type="button"
            >
              {pageNumber}
            </button>
          ))}
          <button
            aria-label="다음 페이지"
            disabled={page === pageCount}
            onClick={() => setPage((current) => current + 1)}
            type="button"
          >
            ›
          </button>
        </nav>
      )}
    </InstructorQnaLayout>
  );
}

export function InstructorQnaDetailPage() {
  const auth = useInstructorQnaAuth();
  const accessToken = auth?.accessToken;
  const { qnaid } = useParams();
  const navigate = useNavigate();
  const [qna, setQna] = useState(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadQna() {
      setLoading(true);
      setError("");
      try {
        const result = await getInstructorQna(accessToken, qnaid, {
          signal: controller.signal,
        });
        if (!active) return;
        if (String(result.qid) !== String(qnaid)) {
          throw new Error("요청한 질문과 응답의 질문 ID가 일치하지 않습니다.");
        }
        setQna(result);
        setAnswer(result.answer ?? "");
      } catch (loadError) {
        if (active && loadError.name !== "AbortError") setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadQna();
    return () => {
      active = false;
      controller.abort();
    };
  }, [accessToken, qnaid, retry]);

  const hasAnswer = typeof qna?.answer === "string" && qna.answer.trim().length > 0;

  async function handleSave(event) {
    event.preventDefault();
    const normalizedAnswer = answer.trim();
    if (!normalizedAnswer) {
      setError("답변 내용을 입력해 주세요.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await saveInstructorQnaAnswer(accessToken, qnaid, normalizedAnswer);
      navigate("/instructor/qna", {
        state: { notice: "답변을 저장했습니다." },
      });
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!hasAnswer || busy) return;
    if (!window.confirm("작성한 답변을 삭제하시겠습니까? 질문 자체는 삭제되지 않습니다.")) {
      return;
    }

    setBusy(true);
    setError("");
    try {
      await deleteInstructorQnaAnswer(accessToken, qnaid);
      navigate("/instructor/qna", {
        state: { notice: "답변을 삭제했습니다." },
      });
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <InstructorQnaLayout>
      <InstructorQnaHeading
        title="Q&A 상세 / 답변 작성"
        description="학생의 질문을 확인하고 강사 답변을 작성하세요."
      />

      {loading ? (
        <LoadingState />
      ) : error && !qna ? (
        <ErrorState message={error} onRetry={() => setRetry((count) => count + 1)} />
      ) : qna ? (
        <form className="instructor-qna-detail" onSubmit={handleSave}>
          <section className="instructor-qna-question-card" aria-label="학생 질문">
            <h2>{qna.title || "(제목 없음)"}</h2>
            <p className="instructor-qna-question-meta">
              {qna.nickname || "-"} / {qna.lectureName || "-"}
            </p>
            <p className="instructor-qna-question-content">
              {qna.question || "질문 내용이 없습니다."}
            </p>
          </section>

          <label htmlFor="instructor-qna-answer">강사 답변</label>
          <textarea
            id="instructor-qna-answer"
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="질문에 대한 답변을 입력해주세요."
            rows={5}
            value={answer}
          />
          {error && <p className="instructor-qna-inline-error" role="alert">{error}</p>}
          <div className="instructor-qna-actions">
            <button
              className="instructor-qna-delete"
              disabled={!hasAnswer || busy}
              onClick={handleDelete}
              type="button"
            >
              답변 삭제
            </button>
            <button className="instructor-qna-save" disabled={busy} type="submit">
              {busy ? "저장 중..." : "답변 저장"}
            </button>
          </div>
        </form>
      ) : null}
    </InstructorQnaLayout>
  );
}

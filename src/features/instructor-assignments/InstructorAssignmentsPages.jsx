import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { InstructorCenterLayout as SharedInstructorCenterLayout } from "../instructor-center/InstructorCenterLayout.jsx";
import {
  deleteInstructorAssignmentFeedback,
  getInstructorAssignment,
  getInstructorAssignmentDownload,
  getInstructorAssignments,
  saveInstructorAssignmentFeedback,
} from "./instructorAssignmentsApi.js";
import { useInstructorCoursesAuth } from "../instructor-courses/instructorCoursesAuthContext.js";
import "./instructorAssignments.css";

const assignmentStatusLabels = {
  none: "미작성",
  done: "작성 완료",
};

function InstructorCenterLayout({ children }) {
  return (
    <SharedInstructorCenterLayout variant="assignments">
      {children}
    </SharedInstructorCenterLayout>
  );
}

function InstructorCenterTabs() {
  return (
    <nav className="assignment-top-tabs" aria-label="강사센터 영역">
      <span>운영 현황</span>
      <span>강의</span>
      <span className="is-active" aria-current="page">학습 관리</span>
      <span>정산</span>
    </nav>
  );
}

function PageHeading({ title, description }) {
  return (
    <div className="assignment-page-heading">
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}

function LoadingState() {
  return <p className="assignment-state" role="status">불러오는 중입니다...</p>;
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="assignment-state is-error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button className="assignment-retry" onClick={onRetry} type="button">
          다시 시도
        </button>
      )}
    </div>
  );
}

function formatSubmittedDate(value) {
  if (!value) return "-";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? `${match[2]}.${match[3]}` : value;
}

export function InstructorAssignmentsListPage() {
  const { accessToken } = useInstructorCoursesAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState(null);
  const [requestError, setRequestError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadAssignments() {
      setLoading(true);
      setRequestError("");
      try {
        const data = await getInstructorAssignments(accessToken, {
  page,
  ...(statusFilter !== "all" ? { status: statusFilter } : {}),
});
        if (active) setResult(data);
      } catch (error) {
        if (active) setRequestError(error.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAssignments();
    return () => {
      active = false;
    };
  }, [accessToken, page, retry, statusFilter]);

  const assignments = useMemo(
    () => result?.assignments ?? [],
    [result],
  );
  const canPaginate = Number.isInteger(result?.totalPages) && result.totalPages > 1;

  return (
    <InstructorCenterLayout>
      <PageHeading
        title="과제 피드백 목록"
        description="학생이 제출한 과제를 확인하고 피드백을 작성하세요."
      />
      <InstructorCenterTabs />

<div className="assignment-status-filters" aria-label="피드백 상태 필터">
  {[
    { value: "all", label: "전체" },
    { value: "none", label: "미작성" },
    { value: "done", label: "작성완료" },
  ].map((filter) => (
    <button
      key={filter.value}
      type="button"
      className={statusFilter === filter.value ? "is-active" : ""}
      aria-pressed={statusFilter === filter.value}
      onClick={() => {
        setStatusFilter(filter.value);
        setPage(1);
      }}
    >
      {filter.label}
    </button>
  ))}
</div>
      {location.state?.notice && (
        <p className="assignment-notice" role="status">{location.state.notice}</p>
      )}

      {loading ? (
        <LoadingState />
      ) : requestError ? (
        <ErrorState message={requestError} onRetry={() => setRetry((count) => count + 1)} />
      ) : assignments.length === 0 ? (
        <div className="assignment-state">표시할 과제가 없습니다.</div>
      ) : (
        <div className="assignment-table-wrap">
          <table className="assignment-table">
            <thead>
              <tr>
                <th scope="col">학생</th>
                <th scope="col">강의명</th>
                <th scope="col">제출일</th>
                <th scope="col">
                  <span className="assignment-feedback-column-title">
                    피드백 상세
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => {
                const feedbackStatus = assignmentStatusLabels[assignment.feedbackStatus];
                return (
                  <tr key={assignment.aid}>
                    <td>{assignment.nickname || "-"}</td>
                    <td>{assignment.lectureName || result.lectureName || "-"}</td>
                    <td>{formatSubmittedDate(assignment.submitted)}</td>
                    <td>
                      {feedbackStatus ? (
                        <button
                          className={`assignment-status-button ${assignment.feedbackStatus === "done" ? "is-done" : "is-none"}`}
                          onClick={() => navigate(`/instructor/assignments/${encodeURIComponent(assignment.aid)}`)}
                          type="button"
                        >
                          {feedbackStatus}
                        </button>
                      ) : (
                        <span className="assignment-unknown-status">상태 확인 필요</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {canPaginate && !loading && !requestError && (
        <nav className="assignment-pagination" aria-label="과제 목록 페이지">
          <button
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
            type="button"
            aria-label="이전 페이지"
          >
            ‹
          </button>
          {Array.from({ length: result.totalPages }, (_, index) => index + 1).map((number) => (
            <button
              aria-current={page === number ? "page" : undefined}
              className={page === number ? "is-current" : ""}
              key={number}
              onClick={() => setPage(number)}
              type="button"
            >
              {number}
            </button>
          ))}
          <button
            disabled={page >= result.totalPages}
            onClick={() => setPage((current) => current + 1)}
            type="button"
            aria-label="다음 페이지"
          >
            ›
          </button>
        </nav>
      )}
    </InstructorCenterLayout>
  );
}

export function InstructorAssignmentsDetailPage() {
  const { accessToken } = useInstructorCoursesAuth();
  const { assid } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAssignment() {
      setLoading(true);
      setError("");
      try {
        const data = await getInstructorAssignment(accessToken, assid);
        if (!active) return;
        setAssignment(data);
        setScore(data.score === null || data.score === undefined ? "" : String(data.score));
        setFeedback(data.feedback ?? "");
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAssignment();
    return () => {
      active = false;
    };
  }, [accessToken, assid, retry]);

  const hasFeedback = assignment?.feedback !== null &&
    assignment?.feedback !== undefined &&
    assignment.feedback !== "";

  async function handleDownload() {
    setDownloadError("");
    try {
      const file = await getInstructorAssignmentDownload(accessToken, assid);
      const response = await fetch(file.url);
      if (!response.ok) {
        throw new Error("첨부파일을 다운로드하지 못했습니다.");
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = file.fileName || assignment?.work || "assignment";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (downloadFailure) {
      setDownloadError(
        downloadFailure instanceof TypeError
          ? "파일 주소에 접근할 수 없습니다. 브라우저의 외부 파일 접근 제한 여부를 확인해 주세요."
          : downloadFailure.message,
      );
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!/^\d+$/.test(score) || Number(score) < 0 || Number(score) > 100) {
      setError("과제 점수는 0~100 사이의 정수로 입력해 주세요.");
      return;
    }
    if (!feedback.trim()) {
      setError("피드백 내용을 입력해 주세요.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await saveInstructorAssignmentFeedback(accessToken, assid, {
        score: Number(score),
        feedback: feedback.trim(),
      });
      navigate("/instructor/assignments", { state: { notice: "피드백을 저장했습니다." } });
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!hasFeedback || busy) return;
    if (!window.confirm("작성한 피드백을 삭제하시겠습니까? 학생의 과제 제출물은 삭제되지 않습니다.")) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      await deleteInstructorAssignmentFeedback(accessToken, assid);
      navigate("/instructor/assignments", { state: { notice: "피드백을 삭제했습니다." } });
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <InstructorCenterLayout>
      <PageHeading
        title="과제 상세 / 피드백 작성"
        description="제출 내용과 첨부 자료를 확인하고 피드백을 남겨주세요."
      />
      <InstructorCenterTabs />

      {loading ? (
        <LoadingState />
      ) : error && !assignment ? (
        <ErrorState message={error} onRetry={() => setRetry((count) => count + 1)} />
      ) : assignment ? (
        <form className="assignment-detail" onSubmit={handleSave}>
          <section className="assignment-student-card" aria-label="학생 과제 정보">
            <div className="assignment-student-copy">
              <h2>{assignment.nickname || "-"} / {assignment.lectureName || "-"}</h2>
              <p>{assignment.content || "제출된 과제 내용이 없습니다."}</p>
              <p className="assignment-attachment">
                첨부: {assignment.work || "첨부파일 없음"}
              </p>
            </div>
            <button
              className="assignment-download-button"
              disabled={!assignment.work || busy}
              onClick={handleDownload}
              type="button"
            >
              다운로드
            </button>
          </section>
          {downloadError && <p className="assignment-inline-error" role="alert">{downloadError}</p>}

          <label className="assignment-score-label" htmlFor="assignment-score">
            과제 점수 <span>*</span>
          </label>
          <div className="assignment-score-row">
            <input
              autoComplete="off"
              id="assignment-score"
              inputMode="numeric"
              max="100"
              min="0"
              onChange={(event) => setScore(event.target.value.replace(/[^\d]/g, ""))}
              placeholder="점수 입력"
              value={score}
            />
            <span>/ 100점</span>
            <small>0~100점 사이의 정수를 입력해주세요.</small>
          </div>

          <label className="assignment-feedback-label" htmlFor="assignment-feedback">
            피드백 내용
          </label>
          <textarea
            id="assignment-feedback"
            onChange={(event) => setFeedback(event.target.value)}
            placeholder="학생의 과제에 대한 피드백을 입력해주세요."
            rows={5}
            value={feedback}
          />
          <p className="assignment-form-hint">등록 후에는 동일 화면에서 수정·삭제할 수 있습니다.</p>

          {error && <p className="assignment-inline-error" role="alert">{error}</p>}
          <div className="assignment-form-actions">
            <button
              className="assignment-delete-button"
              disabled={!hasFeedback || busy}
              onClick={handleDelete}
              type="button"
            >
              피드백 삭제
            </button>
            <button className="assignment-save-button" disabled={busy} type="submit">
              {busy ? "처리 중..." : "피드백 저장"}
            </button>
          </div>
        </form>
      ) : null}
    </InstructorCenterLayout>
  );
}

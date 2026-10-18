import { useEffect, useRef, useState } from "react";
import { useQnaAuth } from "./qnaAuthContext.js";
import { getMyQna, getQnaErrorMessage } from "./qnaApi.js";
import { MyQnaLayout, QnaPageHeader } from "./MyQnaLayout.jsx";
import Pagination from "../../components/pagination/Pagination.jsx";
import "./myQna.css";

const PAGE_SIZE = 5; // 백엔드 기본값과 같은 5개씩

const statusFilters = [
  ["ALL", "전체", "all"],
  ["PENDING", "미답변", "pending"],
  ["ANSWERED", "답변 완료", "answered"],
];

function formatCreatedAt(value) {
  if (typeof value !== "string") return "—";
  const match = value.match(/^\d{4}-(\d{2})-(\d{2})/);
  return match ? `${match[1]}.${match[2]}` : "—";
}

function MyQnaPage() {
  const { accessToken } = useQnaAuth();
  const [status, setStatus] = useState("ALL");
  const [pageNumber, setPageNumber] = useState(0);
  const [result, setResult] = useState(null);
  const [loadState, setLoadState] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [detailNotice, setDetailNotice] = useState("");
  const [retry, setRetry] = useState(0);
  const requestSequence = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const sequence = requestSequence.current + 1;
    requestSequence.current = sequence;

    getMyQna({
      accessToken,
      status,
      sort: "RECENT",
      page: pageNumber,
      size: PAGE_SIZE,
      signal: controller.signal,
    })
      .then((data) => {
        if (controller.signal.aborted || sequence !== requestSequence.current) {
          return;
        }
        setResult(data);
        setLoadState("success");
      })
      .catch((error) => {
        if (
          error.name === "AbortError" ||
          controller.signal.aborted ||
          sequence !== requestSequence.current
        ) {
          return;
        }
        setErrorMessage(getQnaErrorMessage(error));
        setLoadState("error");
      });

    return () => controller.abort();
  }, [accessToken, pageNumber, retry, status]);

  const counts = result?.counts ?? {};
  const questions = Array.isArray(result?.questions) ? result.questions : [];
  const page = result?.page;
  const totalPages =
    Number.isInteger(page?.totalPages) && page.totalPages > 0
      ? page.totalPages
      : 0;
  const currentPage =
    Number.isInteger(page?.number) && page.number >= 0
      ? page.number
      : pageNumber;

  function changeStatus(nextStatus) {
    setStatus(nextStatus);
    setPageNumber(0);
    setLoadState("loading");
    setErrorMessage("");
    setDetailNotice("");
  }

  function changePage(nextPage) {
    if (nextPage < 0 || nextPage >= totalPages || nextPage === currentPage) {
      return;
    }
    setPageNumber(nextPage);
    setLoadState("loading");
    setErrorMessage("");
    setDetailNotice("");
  }

  function renderQuestion(question) {
    const qnaId = question?.qnaId;
    const title =
      typeof question?.title === "string" && question.title.trim()
        ? question.title
        : "제목 없음";
    const statusLabel =
      question?.status === "ANSWERED"
        ? "답변 완료"
        : question?.status === "PENDING"
          ? "미답변"
          : "상태 확인 필요";
    const lecturer =
      typeof question?.lecturer === "string" && question.lecturer.trim()
        ? question.lecturer
        : "담당 강사 미정";

    return (
      <tr key={qnaId}>
        <td className="qna-question-cell">
          <button
            aria-label={`질문 상세 보기, 질문 번호 ${qnaId}`}
            className="qna-title-button"
            onClick={() =>
              setDetailNotice(
                `질문 번호 ${qnaId} 상세 조회 화면/API가 준비되지 않았습니다.`,
              )
            }
            type="button"
          >
            <span className="qna-title">
              {question?.isSecret === true && (
                <span aria-label="비밀글" className="qna-lock-icon">
                  🔒
                </span>
              )}
              {title}
            </span>
          </button>
          <span className="qna-lecturer-mobile">{lecturer}</span>
        </td>
        <td className="qna-author-cell">나</td>
        <td>
          <span
            className={`qna-status ${
              question?.status === "ANSWERED" ? "is-answered" : ""
            }`}
          >
            {statusLabel}
          </span>
        </td>
        <td>
          <time dateTime={question?.createdAt}>
            {formatCreatedAt(question?.createdAt)}
          </time>
        </td>
      </tr>
    );
  }

  return (
    <MyQnaLayout>
      <QnaPageHeader />
      <section className="qna-list-controls" aria-label="질문 상태 필터">
        <div className="qna-filter-list">
          {statusFilters.map(([value, label, countKey]) => (
            <button
              aria-pressed={status === value}
              className={`qna-filter ${
                status === value ? "is-active" : ""
              }`}
              key={value}
              onClick={() => changeStatus(value)}
              type="button"
            >
              {label}
              <span>
                {Number.isFinite(counts[countKey]) ? counts[countKey] : "–"}
              </span>
            </button>
          ))}
        </div>
      </section>

      {detailNotice && (
        <p className="qna-detail-notice" role="status">
          {detailNotice}
        </p>
      )}

      {loadState === "loading" && (
        <p className="qna-state-message" role="status">
          질문 목록을 불러오는 중입니다.
        </p>
      )}

      {loadState === "error" && (
        <section className="qna-state-message qna-state-error" role="alert">
          <p>{errorMessage}</p>
          <button
            className="qna-retry-button"
            onClick={() => {
              setLoadState("loading");
              setErrorMessage("");
              setRetry((current) => current + 1);
            }}
            type="button"
          >
            다시 시도
          </button>
        </section>
      )}

      {loadState === "success" &&
        (questions.length > 0 ? (
          <div className="qna-table-scroll">
            <table className="qna-table">
              <thead>
                <tr>
                  <th scope="col">질문</th>
                  <th scope="col">작성자</th>
                  <th scope="col">상태</th>
                  <th scope="col">작성일</th>
                </tr>
              </thead>
              <tbody>{questions.map(renderQuestion)}</tbody>
            </table>
          </div>
        ) : (
          <p className="qna-state-message">
            {status === "PENDING"
              ? "미답변 질문이 없습니다."
              : status === "ANSWERED"
                ? "답변 완료된 질문이 없습니다."
                : "작성한 질문이 없습니다."}
          </p>
        ))}

      {loadState === "success" && (
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          onChange={changePage}
        />
      )}

      <p className="qna-detail-hint">
        질문을 선택하면 상세 내용과 강사의 답변을 확인할 수 있어요.
      </p>
    </MyQnaLayout>
  );
}

export default MyQnaPage;

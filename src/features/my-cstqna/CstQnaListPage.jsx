import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useAccessToken } from "../../auth/useAccessToken.js";
import Pagination from "../../components/pagination/Pagination.jsx";
import { CstQnaLayout } from "./CstQnaLayout.jsx";
import { formatDate, getCstQnaList } from "./cstQnaApi.js";

const PAGE_SIZE = 5; // 백엔드 기본값과 같은 5개씩

const statusFilters = [
  ["ALL", "전체", "all"],
  ["PENDING", "답변 대기", "pending"],
  ["ANSWERED", "답변 완료", "answered"],
];

// GET /mypage/cstqna 목록. 제목을 누르면 상세(/mypage/cstqna/:iqid)로 이동합니다.
function CstQnaListPage() {
  const accessToken = useAccessToken();
  const [status, setStatus] = useState("ALL");
  const [pageNumber, setPageNumber] = useState(0);
  const [result, setResult] = useState(null);
  const [loadState, setLoadState] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [retry, setRetry] = useState(0);
  const requestSequence = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const sequence = requestSequence.current + 1;
    requestSequence.current = sequence;

    getCstQnaList({
      accessToken,
      status,
      page: pageNumber,
      size: PAGE_SIZE,
      signal: controller.signal,
    })
      .then((data) => {
        if (controller.signal.aborted || sequence !== requestSequence.current) return;
        setResult(data);
        setLoadState("success");
      })
      .catch((error) => {
        if (error.name === "AbortError" || controller.signal.aborted || sequence !== requestSequence.current) {
          return;
        }
        setErrorMessage(error.message || "문의 목록을 불러오지 못했습니다.");
        setLoadState("error");
      });

    return () => controller.abort();
  }, [accessToken, pageNumber, retry, status]);

  const counts = result?.counts ?? {};
  const inquiries = Array.isArray(result?.inquiries) ? result.inquiries : [];
  const page = result?.page;
  const totalPages = Number.isInteger(page?.totalPages) && page.totalPages > 0 ? page.totalPages : 0;
  const currentPage = Number.isInteger(page?.number) && page.number >= 0 ? page.number : pageNumber;

  function changeStatus(nextStatus) {
    setStatus(nextStatus);
    setPageNumber(0);
    setLoadState("loading");
    setErrorMessage("");
  }

  function changePage(nextPage) {
    if (nextPage < 0 || nextPage >= totalPages || nextPage === currentPage) return;
    setPageNumber(nextPage);
    setLoadState("loading");
    setErrorMessage("");
  }

  return (
    <CstQnaLayout>
      <section className="qna-list-controls cstqna-list-controls" aria-label="문의 상태 필터">
        <div className="qna-filter-list">
          {statusFilters.map(([value, label, countKey]) => (
            <button
              aria-pressed={status === value}
              className={`qna-filter ${status === value ? "is-active" : ""}`}
              key={value}
              onClick={() => changeStatus(value)}
              type="button"
            >
              {label}
              <span>{Number.isFinite(counts[countKey]) ? counts[countKey] : "–"}</span>
            </button>
          ))}
        </div>
        <Link className="cstqna-primary-button" to="/mypage/cstqna/posts">
          문의하기
        </Link>
      </section>

      {loadState === "loading" && (
        <p className="qna-state-message" role="status">
          문의 목록을 불러오는 중입니다.
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
        (inquiries.length > 0 ? (
          <div className="qna-table-scroll">
            <table className="qna-table">
              <thead>
                <tr>
                  <th scope="col">제목</th>
                  <th scope="col">상태</th>
                  <th scope="col">작성일</th>
                  <th scope="col">답변일</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((item) => (
                  <tr key={item.inquiryId}>
                    <td className="qna-question-cell">
                      <Link className="cstqna-title-link" to={`/mypage/cstqna/${item.inquiryId}`}>
                        {typeof item.title === "string" && item.title.trim() ? item.title : "제목 없음"}
                      </Link>
                    </td>
                    <td>
                      <span className={`qna-status ${item.status === "ANSWERED" ? "is-answered" : ""}`}>
                        {item.status === "ANSWERED" ? "답변 완료" : "답변 대기"}
                      </span>
                    </td>
                    <td>
                      <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
                    </td>
                    <td>
                      {item.answeredAt ? (
                        <time dateTime={item.answeredAt}>{formatDate(item.answeredAt)}</time>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="qna-state-message">
            {status === "PENDING"
              ? "답변 대기 중인 문의가 없습니다."
              : status === "ANSWERED"
                ? "답변 완료된 문의가 없습니다."
                : "작성한 문의가 없습니다. 궁금한 점을 문의해 보세요."}
          </p>
        ))}

      {loadState === "success" && (
        <Pagination page={currentPage} totalPages={totalPages} onChange={changePage} />
      )}
    </CstQnaLayout>
  );
}

export default CstQnaListPage;

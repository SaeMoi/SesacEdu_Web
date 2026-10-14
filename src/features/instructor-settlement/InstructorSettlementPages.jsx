import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { InstructorCenterLayout as SharedInstructorCenterLayout } from "../instructor-center/InstructorCenterLayout.jsx";
import {
  getInstructorSettlement,
  getInstructorSettlements,
} from "./instructorSettlementApi.js";
import { useInstructorSettlementAuth } from "./instructorSettlementAuthContext.js";
import "./instructorSettlement.css";

function InstructorSettlementLayout({ children }) {
  return (
    <SharedInstructorCenterLayout variant="settlement">
      {children}
    </SharedInstructorCenterLayout>
  );
}

function SettlementHeading({ title, description }) {
  return (
    <>
      <header className="instructor-settlement-heading">
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      <nav className="instructor-settlement-tabs" aria-label="강사센터 분류">
        <span aria-disabled="true">운영 현황</span>
        <Link to="/instructor/lectures">강의</Link>
        <span aria-disabled="true">학습 관리</span>
        <Link
          aria-current="page"
          className="is-active"
          to="/instructor/settlement"
        >
          정산
        </Link>
      </nav>
    </>
  );
}

function LoadingState() {
  return <p className="instructor-settlement-state" role="status">불러오는 중입니다...</p>;
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="instructor-settlement-state is-error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} type="button">다시 시도</button>
      )}
    </div>
  );
}

function formatWon(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? `${amount.toLocaleString("ko-KR")}원` : "-";
}

function formatStatus(status) {
  if (status === "requested") return "승인 대기";
  if (status === "paid") return "지급 완료";
  return status || "-";
}

function Pagination({ page, totalPages, hasNext, loading, onPageChange }) {
  const pages = useMemo(() => {
    if (Number.isInteger(totalPages) && totalPages > 0) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    return [page];
  }, [page, totalPages]);

  const nextDisabled =
    loading ||
    hasNext === false ||
    (Number.isInteger(totalPages) && page >= totalPages);

  return (
    <nav className="instructor-settlement-pagination" aria-label="정산 페이지">
      <button
        aria-label="이전 페이지"
        disabled={page <= 1 || loading}
        onClick={() => onPageChange(page - 1)}
        type="button"
      >
        ‹
      </button>
      {pages.map((pageNumber) => (
        <button
          aria-current={pageNumber === page ? "page" : undefined}
          className={pageNumber === page ? "is-current" : ""}
          key={pageNumber}
          onClick={() => onPageChange(pageNumber)}
          type="button"
        >
          {pageNumber}
        </button>
      ))}
      <button
        aria-label="다음 페이지"
        disabled={nextDisabled}
        onClick={() => onPageChange(page + 1)}
        type="button"
      >
        {loading ? "…" : "›"}
      </button>
    </nav>
  );
}

export function InstructorSettlementListPage() {
  const { accessToken } = useInstructorSettlementAuth();
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadSettlements() {
      setError("");
      try {
        const result = await getInstructorSettlements(accessToken, page, {
          signal: controller.signal,
        });
        if (!active) return;
        setData({
          ...result,
          hasNext: result.hasNext ?? (result.settlements.length > 0 ? null : false),
        });
      } catch (loadError) {
        if (active && loadError.name !== "AbortError") setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSettlements();
    return () => {
      active = false;
      controller.abort();
    };
  }, [accessToken, page, retry]);

  function changePage(nextPage) {
    if (nextPage < 1 || loading || nextPage === page) return;
    if (data?.totalPages && nextPage > data.totalPages) return;
    if (data?.hasNext === false && nextPage > page) return;
    setLoading(true);
    setPage(nextPage);
  }

  return (
    <InstructorSettlementLayout>
      <SettlementHeading
        title="정산 관리"
        description="월별 매출과 정산 상태를 확인하세요."
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => {
          setLoading(true);
          setRetry((count) => count + 1);
        }} />
      ) : data ? (
        <>
          <section className="instructor-settlement-summary" aria-label="정산 요약">
            <article className="instructor-settlement-summary-card is-revenue">
              <p>총 매출</p>
              <strong>{formatWon(data.totalRevenue)}</strong>
            </article>
            <article className="instructor-settlement-summary-card is-upcoming">
              <p>정산 예정</p>
              <strong>{formatWon(data.upcomingAmount)}</strong>
            </article>
            <article className="instructor-settlement-summary-card is-status">
              <p>정산 상태</p>
              <strong>{formatStatus(data.latestStatus)}</strong>
            </article>
          </section>

          {data.settlements.length === 0 ? (
            <div className="instructor-settlement-state">정산 내역이 없습니다.</div>
          ) : (
            <div className="instructor-settlement-table-wrap">
              <table className="instructor-settlement-table">
                <thead>
                  <tr>
                    <th scope="col">정산 기간</th>
                    <th scope="col">정산 금액</th>
                    <th scope="col">상태</th>
                    <th scope="col">상세</th>
                  </tr>
                </thead>
                <tbody>
                  {data.settlements.map((settlement) => (
                    <tr key={settlement.sid}>
                      <td>{settlement.period || "-"}</td>
                      <td>{formatWon(settlement.amount)}</td>
                      <td>{formatStatus(settlement.status)}</td>
                      <td>
                        <Link
                          className="instructor-settlement-detail-link"
                          to={`/instructor/settlement/${encodeURIComponent(settlement.sid)}`}
                        >
                          상세 보기
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(data.settlements.length > 0 || page > 1) && (
            <Pagination
              hasNext={data.hasNext}
              loading={loading}
              onPageChange={changePage}
              page={page}
              totalPages={data.totalPages}
            />
          )}
          <p className="instructor-settlement-list-note">
            정산 내역은 월별로 확인할 수 있어요. 지급 완료 내역에서 상세를 확인하세요.
          </p>
        </>
      ) : null}
    </InstructorSettlementLayout>
  );
}

export function InstructorSettlementDetailPage() {
  const { accessToken } = useInstructorSettlementAuth();
  const { sid } = useParams();
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadSettlement() {
      setError("");
      try {
        const result = await getInstructorSettlement(accessToken, sid, page, {
          signal: controller.signal,
        });
        if (active && String(result.sid) !== String(sid)) {
          throw new Error("조회된 정산 정보가 요청한 정산 ID와 일치하지 않습니다.");
        }
        if (active) {
          setData({
            ...result,
            hasNext: result.hasNext ?? (result.items.length > 0 ? null : false),
          });
        }
      } catch (loadError) {
        if (active && loadError.name !== "AbortError") setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSettlement();
    return () => {
      active = false;
      controller.abort();
    };
  }, [accessToken, sid, page, retry]);

  function changePage(nextPage) {
    if (nextPage < 1 || loading || nextPage === page) return;
    if (data?.totalPages && nextPage > data.totalPages) return;
    if (data?.hasNext === false && nextPage > page) return;
    setLoading(true);
    setPage(nextPage);
  }

  return (
    <InstructorSettlementLayout>
      <SettlementHeading
        title="정산 상세"
        description="강의별 매출과 공제 금액, 지급 정보를 확인하세요."
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => {
          setLoading(true);
          setRetry((count) => count + 1);
        }} />
      ) : data ? (
        <>
          {data.items.length === 0 ? (
            <div className="instructor-settlement-state">강의별 정산 내역이 없습니다.</div>
          ) : (
            <div className="instructor-settlement-table-wrap instructor-settlement-items-wrap">
              <table className="instructor-settlement-table instructor-settlement-items">
                <thead>
                  <tr>
                    <th scope="col">강의</th>
                    <th scope="col">매출</th>
                    <th scope="col">공제</th>
                    <th scope="col">정산 금액</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, index) => (
                    <tr key={`${item.lectureName ?? "lecture"}-${index}`}>
                      <td>{item.lectureName || "-"}</td>
                      <td>{formatWon(item.revenue)}</td>
                      <td>{formatWon(item.deduction)}</td>
                      <td>{formatWon(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(data.items.length > 0 || page > 1) && (
            <Pagination
              hasNext={data.hasNext}
              loading={loading}
              onPageChange={changePage}
              page={page}
              totalPages={data.totalPages}
            />
          )}

          <section className="instructor-settlement-total-card">
            <div className="instructor-settlement-total-heading">
              <div>
                <h2>정산 합계</h2>
                <strong>{formatWon(data.amount)}</strong>
              </div>
              <span className="instructor-settlement-status-badge">
                {formatStatus(data.status)}
              </span>
            </div>
            <div className="instructor-settlement-account">
              <span>
                {data.status === "requested" ? "지급 예정일: 승인 후 안내" : null}
              </span>
              <span>은행: {data.bank || "-"}</span>
              <span>계좌: {data.account || "-"}</span>
            </div>
          </section>
        </>
      ) : null}
    </InstructorSettlementLayout>
  );
}

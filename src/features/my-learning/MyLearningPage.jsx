import { useContext, useEffect, useState } from "react";
import { Link } from "react-router";
import { MyLearningAuthContext } from "./myLearningAuthContext.js";
import {
  getLearningAssetUrl,
  getLearningErrorMessage,
  getMyCourses,
} from "./myLearningApi.js";
import {
  LearningPageHeader,
  MyLearningLayout,
} from "./MyLearningLayout.jsx";
import "./myLearning.css";

const PAGE_SIZE = 10;

const statusFilters = [
  ["ALL", "전체", "all"],
  ["IN_PROGRESS", "수강 중", "inProgress"],
  ["COMPLETED", "완료", "completed"],
];

const categoryStyles = {
  WEB_SECURITY: "web-security",
  LINUX_BASICS: "linux-basics",
  NETWORK: "network",
};

function MyLearningPage() {
  const { accessToken } = useContext(MyLearningAuthContext);
  const [status, setStatus] = useState("ALL");
  const [sort, setSort] = useState("RECENT_ENROLL");
  const [pageNumber, setPageNumber] = useState(0);
  const [result, setResult] = useState(null);
  const [loadState, setLoadState] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    getMyCourses({
      accessToken,
      status,
      sort,
      page: pageNumber,
      size: PAGE_SIZE,
      signal: controller.signal,
    })
      .then((data) => {
        setResult(data);
        setLoadState("success");
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        setErrorMessage(getLearningErrorMessage(error));
        setLoadState("error");
      });

    return () => controller.abort();
  }, [accessToken, pageNumber, retry, sort, status]);

  const counts = result?.counts ?? {};
  const courses = Array.isArray(result?.courses) ? result.courses : [];
  const pageInfo = result?.page;
  const totalPages =
    Number.isInteger(pageInfo?.totalPages) && pageInfo.totalPages > 0
      ? pageInfo.totalPages
      : 0;
  const currentPage =
    Number.isInteger(pageInfo?.number) && pageInfo.number >= 0
      ? pageInfo.number
      : pageNumber;

  function showUnavailable(feature) {
    setActionNotice(`${feature} 기능의 기존 화면/API가 확인되지 않았습니다.`);
  }

  function changeStatus(nextStatus) {
    setStatus(nextStatus);
    setPageNumber(0);
    setActionNotice("");
    setLoadState("loading");
    setErrorMessage("");
  }

  function changeSort(event) {
    setSort(event.target.value);
    setPageNumber(0);
    setActionNotice("");
    setLoadState("loading");
    setErrorMessage("");
  }

  function renderCourse(course) {
    const courseId = course?.courseId;
    const title =
      typeof course?.title === "string" && course.title.trim()
        ? course.title
        : "강좌 정보 없음";
    const categoryName =
      typeof course?.category?.name === "string" &&
      course.category.name.trim()
        ? course.category.name
        : "분류 없음";
    const categoryCode =
      typeof course?.category?.code === "string"
        ? course.category.code
        : "";
    const isCompleted = course?.status === "COMPLETED";
    const isInProgress = course?.status === "IN_PROGRESS";
    const statusText = isCompleted
      ? "완료"
      : isInProgress
        ? "수강 중"
        : "상태 확인 필요";
    const thumbnail =
      typeof course?.thumbnailUrl === "string" &&
      course.thumbnailUrl.trim()
        ? getLearningAssetUrl(course.thumbnailUrl)
        : "";

    return (
      <article className="learning-course-card" key={courseId}>
        <div
          className={`learning-course-thumbnail ${
            categoryStyles[categoryCode] ?? "default-category"
          }`}
        >
          {thumbnail ? (
            <img src={thumbnail} alt="" />
          ) : (
            <>
              <span>{categoryCode.replaceAll("_", " ") || "LEARNING"}</span>
              <strong>{categoryName}</strong>
            </>
          )}
        </div>
        <div className="learning-course-info">
          <div className="learning-course-title-row">
            <h2>{title}</h2>
            <span
              className={`learning-status-badge ${
                isCompleted ? "is-completed" : ""
              }`}
            >
              {statusText}
            </span>
          </div>
          <p>{categoryName}</p>
          {course?.enrolledAt && (
            <time dateTime={course.enrolledAt}>
              {new Date(course.enrolledAt).toLocaleDateString("ko-KR")}
            </time>
          )}
        </div>
        <div className="learning-course-actions">
          <div className="learning-primary-action">
            <button
              className="learning-resume-button"
              onClick={() => showUnavailable("이어서 학습")}
              type="button"
            >
              이어서 학습
            </button>
          </div>
          <div className="learning-secondary-actions">
            <button
              className="learning-action-button assignment"
              onClick={() => showUnavailable("과제")}
              type="button"
            >
              과제
            </button>
            {course?.reviewWritten === false && courseId != null ? (
              <Link
                className="learning-action-button"
                to={`/mypage/learning/${encodeURIComponent(courseId)}/review`}
                state={{ course }}
              >
                리뷰
              </Link>
            ) : (
              <button
                className="learning-action-button"
                disabled={course?.reviewWritten === true}
                onClick={() =>
                  showUnavailable(
                    course?.reviewWritten === true
                      ? "리뷰 수정/조회"
                      : "리뷰 작성",
                  )
                }
                type="button"
              >
                {course?.reviewWritten === true ? "작성 완료" : "리뷰"}
              </button>
            )}
            <button
              className="learning-action-button"
              onClick={() => showUnavailable("Q&A")}
              type="button"
            >
              Q&A
            </button>
            <button
              className="learning-action-button"
              disabled={course?.hasMaterials === false}
              onClick={() => showUnavailable("자료 다운로드")}
              type="button"
            >
              자료다운
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <MyLearningLayout>
      <LearningPageHeader
        title="내 학습"
        description="수강 중인 강의와 학습 활동을 확인하세요."
      />

      <section className="learning-list-controls" aria-label="강좌 필터">
        <div className="learning-filter-list">
          {statusFilters.map(([value, label, countKey]) => (
            <button
              aria-pressed={status === value}
              className={`learning-filter ${
                status === value ? "is-active" : ""
              }`}
              key={value}
              onClick={() => changeStatus(value)}
              type="button"
            >
              {label}{" "}
              {Number.isFinite(counts[countKey]) ? counts[countKey] : "–"}
            </button>
          ))}
        </div>
        <label className="learning-sort">
          <span className="visually-hidden">강좌 정렬</span>
          <select onChange={changeSort} value={sort}>
            <option value="RECENT_ENROLL">최근 구매순</option>
            <option value="TITLE">강좌명순</option>
          </select>
        </label>
      </section>

      {actionNotice && (
        <p className="learning-action-notice" role="status">
          {actionNotice}
        </p>
      )}

      {loadState === "loading" && (
        <p className="learning-state-message" role="status">
          내 학습 목록을 불러오는 중입니다.
        </p>
      )}

      {loadState === "error" && (
        <section className="learning-state-message learning-state-error" role="alert">
          <p>{errorMessage}</p>
          {accessToken && (
            <button
              className="learning-retry-button"
              onClick={() => {
                setLoadState("loading");
                setRetry((current) => current + 1);
              }}
              type="button"
            >
              다시 시도
            </button>
          )}
        </section>
      )}

      {loadState === "success" &&
        (courses.length ? (
          <section className="learning-course-list" aria-label="강좌 목록">
            {courses.map(renderCourse)}
          </section>
        ) : (
          <p className="learning-state-message">
            {status === "COMPLETED"
              ? "완료한 강좌가 없습니다."
              : status === "IN_PROGRESS"
                ? "수강 중인 강좌가 없습니다."
                : "학습 중인 강좌가 없습니다."}
          </p>
        ))}

      {loadState === "success" && totalPages > 1 && (
        <nav className="learning-pagination" aria-label="페이지 이동">
          <button
            aria-label="이전 페이지"
            disabled={currentPage <= 0}
            onClick={() => {
              setLoadState("loading");
              setPageNumber((current) => Math.max(0, current - 1));
            }}
            type="button"
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, index) => index).map(
            (page) => (
              <button
                aria-current={currentPage === page ? "page" : undefined}
                className={currentPage === page ? "is-current" : ""}
                key={page}
                onClick={() => {
                  setLoadState("loading");
                  setPageNumber(page);
                }}
                type="button"
              >
                {page + 1}
              </button>
            ),
          )}
          <button
            aria-label="다음 페이지"
            disabled={!pageInfo?.hasNext || currentPage >= totalPages - 1}
            onClick={() => {
              setLoadState("loading");
              setPageNumber((current) =>
                Math.min(totalPages - 1, current + 1),
              );
            }}
            type="button"
          >
            ›
          </button>
        </nav>
      )}
    </MyLearningLayout>
  );
}

export default MyLearningPage;

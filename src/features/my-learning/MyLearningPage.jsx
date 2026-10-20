import { useContext, useEffect, useState } from "react";
import { Link } from "react-router";
import { MyLearningAuthContext } from "./myLearningAuthContext.js";
import {
  downloadMaterial,
  getLearningAssetUrl,
  getLearningErrorMessage,
  getMyCourses,
} from "./myLearningApi.js";
import {
  LearningPageHeader,
  MyLearningLayout,
} from "./MyLearningLayout.jsx";
import Pagination from "../../components/pagination/Pagination.jsx";
import "./myLearning.css";

const PAGE_SIZE = 5; // 백엔드 기본값과 같은 5개씩

const statusFilters = [
  ["ALL", "전체", "all"],
  ["IN_PROGRESS", "수강 중", "inProgress"],
  ["COMPLETED", "완료", "completed"],
];

// 강의 학습 화면(JSP, /lectures/{id}/learn)으로 이동합니다. panel 값이 있으면 그 메뉴(과제·강의자료·질문)를 열어 둡니다.
function learnUrl(courseId, panel) {
  const base = `/lectures/${encodeURIComponent(courseId)}/learn`;
  return panel ? `${base}?panel=${panel}` : base;
}

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
  const [downloadingId, setDownloadingId] = useState(null);
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

  async function handleDownload(courseId) {
    if (downloadingId != null) return;
    setDownloadingId(courseId);
    setActionNotice("강의자료를 내려받고 있습니다.");
    try {
      const filename = await downloadMaterial({ courseId, accessToken });
      setActionNotice(`${filename} 다운로드를 요청했습니다.`);
    } catch (error) {
      setActionNotice(
        error instanceof TypeError
          ? "강의자료를 내려받지 못했습니다. 연결 상태를 확인해 주세요."
          : error.message || "강의자료를 내려받지 못했습니다.",
      );
    } finally {
      setDownloadingId(null);
    }
  }

  function changeStatus(nextStatus) {
    setStatus(nextStatus);
    setPageNumber(0);
    setActionNotice("");
    setLoadState("loading");
    setErrorMessage("");
  }

  function changePage(nextPage) {
    if (nextPage < 0 || nextPage >= totalPages || nextPage === currentPage) {
      return;
    }
    setPageNumber(nextPage);
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
            <a className="learning-resume-button" href={learnUrl(courseId)}>
              이어서 학습
            </a>
          </div>
          <div className="learning-secondary-actions">
            <a
              className="learning-action-button assignment"
              href={learnUrl(courseId, "assignment")}
            >
              과제
            </a>
            <Link
              className="learning-action-button"
              to={`/mypage/learning/${encodeURIComponent(courseId)}/review`}
              state={{ course }}
            >
              {course?.reviewWritten === true ? "리뷰 수정" : "리뷰"}
            </Link>
            <a
              className="learning-action-button"
              href={learnUrl(courseId, "qna")}
            >
              Q&A
            </a>
            <button
              className="learning-action-button"
              disabled={course?.hasMaterials === false || downloadingId === courseId}
              onClick={() => handleDownload(courseId)}
              type="button"
            >
              {downloadingId === courseId ? "받는 중" : "자료다운"}
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

      {loadState === "success" && (
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          onChange={changePage}
        />
      )}
    </MyLearningLayout>
  );
}

export default MyLearningPage;

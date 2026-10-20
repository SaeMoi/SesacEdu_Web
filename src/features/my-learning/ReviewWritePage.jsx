import { useContext, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { MyLearningAuthContext } from "./myLearningAuthContext.js";
import {
  getLearningErrorMessage,
  deleteReview,
  getLectureReviews,
  getReviewCourse,
  submitReview,
  updateReview,
} from "./myLearningApi.js";
import {
  LearningPageHeader,
  MyLearningLayout,
} from "./MyLearningLayout.jsx";
import Pagination from "../../components/pagination/Pagination.jsx";
import "./myLearning.css";

const ratingDescriptions = {
  1: "1점 · 아쉬워요",
  2: "2점 · 조금 아쉬워요",
  3: "3점 · 보통이에요",
  4: "4점 · 좋아요",
  5: "5점 · 아주 좋아요",
};

function ReviewWritePage() {
  const { courseId } = useParams();
  const location = useLocation();
  const { accessToken } = useContext(MyLearningAuthContext);
  const [course, setCourse] = useState(location.state?.course ?? null);
  const [courseState, setCourseState] = useState(
    location.state?.course ? "success" : "loading",
  );
  const [courseError, setCourseError] = useState("");
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retry, setRetry] = useState(0);
  const [reviewPage, setReviewPage] = useState(0);
  const [reviews, setReviews] = useState(null);
  const [reviewsState, setReviewsState] = useState("loading");
  const [reviewsError, setReviewsError] = useState("");
  // 등록·수정·삭제 뒤 리뷰 목록과 내 리뷰를 다시 읽기 위한 값
  const [reviewsReload, setReviewsReload] = useState(0);
  // 서버가 알려 준 내 리뷰 (GET /mypage/{id}/review 의 myReview). 있으면 새로 쓰지 않고 수정·삭제합니다.
  const myReview = reviews?.myReview ?? null;
  const hasMyReview = Boolean(myReview);
  const [filledFromMine, setFilledFromMine] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getLectureReviews({
      accessToken,
      courseId,
      page: reviewPage,
      signal: controller.signal,
    })
      .then((data) => {
        setReviews(data);
        setReviewsState("success");
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        setReviewsError(getLearningErrorMessage(error));
        setReviewsState("error");
      });
    return () => controller.abort();
  }, [accessToken, courseId, reviewPage, reviewsReload]);

  // 이미 쓴 리뷰가 있으면 입력칸을 그 내용으로 채워 바로 고칠 수 있게 합니다.
  useEffect(() => {
    if (!myReview || filledFromMine) return;
    setRating(Number(myReview.star) || 0);
    setContent(myReview.review ?? "");
    setFilledFromMine(true);
  }, [myReview, filledFromMine]);

  function reloadReviews() {
    setReviewsState("loading");
    setReviewsReload((current) => current + 1);
  }

  async function handleDelete() {
    if (isSubmitting || !hasMyReview) return;
    if (!window.confirm("작성한 리뷰를 삭제할까요?")) return;
    setNotice("");
    setIsSubmitting(true);
    try {
      await deleteReview({ courseId, accessToken });
      setRating(0);
      setContent("");
      setNotice("리뷰를 삭제했습니다. 다시 작성할 수 있습니다.");
      reloadReviews();
    } catch (error) {
      setNotice(error.message || "리뷰를 삭제하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function changeReviewPage(nextPage) {
    const total = reviews?.page?.totalPages ?? 0;
    if (nextPage < 0 || nextPage >= total || nextPage === reviewPage) return;
    setReviewsState("loading");
    setReviewPage(nextPage);
  }

  useEffect(() => {
    if (course && String(course.courseId) === String(courseId)) return undefined;
    const controller = new AbortController();

    getReviewCourse({
      courseId,
      accessToken,
      signal: controller.signal,
    })
      .then((found) => {
        if (controller.signal.aborted) return;
        setCourse(found);
        setCourseState("success");
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        setCourseError(getLearningErrorMessage(error));
        setCourseState("error");
      });

    return () => controller.abort();
  }, [accessToken, course, courseId, retry]);

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice("");
    if (isSubmitting) return;

    if (rating < 1 || rating > 5) {
      setFormError("강의 만족도를 선택해주세요.");
      return;
    }
    if (!content.trim()) {
      setFormError("리뷰 내용을 입력해주세요.");
      return;
    }
    if (content.length > 1000) {
      setFormError("리뷰는 1,000자 이내로 작성해주세요.");
      return;
    }
    setFormError("");
    setIsSubmitting(true);
    try {
      if (hasMyReview) {
        await updateReview({ courseId, accessToken, rating, content });
        setNotice("리뷰를 수정했습니다.");
      } else {
        await submitReview({ courseId, accessToken, rating, content });
        setNotice("수강평이 등록되었습니다. 강의 상세의 수강평 탭에서 확인할 수 있습니다.");
      }
      reloadReviews();
    } catch (error) {
      // 다른 화면에서 이미 쓴 경우(409)에는 내 리뷰를 다시 읽어 수정 화면으로 바꿉니다.
      if (error.status === 409) {
        setFilledFromMine(true);
        reloadReviews();
      }

      setNotice(
        error instanceof TypeError
          ? "등록 결과를 확인하지 못했습니다. 강의 상세에서 등록 여부를 확인해 주세요."
          : error.message || "리뷰 등록을 처리하지 못했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const categoryName =
    typeof course?.category?.name === "string" &&
    course.category.name.trim()
      ? course.category.name
      : "분류 없음";
  const title =
    typeof course?.title === "string" && course.title.trim()
      ? course.title
      : "강좌 정보 없음";

  return (
    <MyLearningLayout>
      <LearningPageHeader
        title="리뷰 작성"
        description="수강한 강의에 대한 솔직한 후기를 남겨주세요."
      />

      {(courseState === "loading" ||
        (course && String(course.courseId) !== String(courseId))) && (
        <p className="learning-state-message" role="status">
          강좌 정보를 확인하는 중입니다.
        </p>
      )}
      {courseState === "error" && (
        <section
          className="learning-state-message learning-state-error"
          role="alert"
        >
          <p>{courseError}</p>
          {accessToken && (
            <button
              className="learning-retry-button"
              onClick={() => {
                setCourseState("loading");
                setRetry((current) => current + 1);
              }}
              type="button"
            >
              다시 시도
            </button>
          )}
        </section>
      )}

      {courseState === "success" &&
        String(course?.courseId) === String(courseId) && (
        <>
          {hasMyReview && (
            <p className="learning-action-notice" role="status">
              이 강좌에는 이미 작성한 리뷰가 있습니다. 강좌당 리뷰는 하나라서 아래에서 수정하거나 삭제할 수 있습니다.
            </p>
          )}
          <section className="review-course-summary" aria-label="리뷰 대상 강좌">
            <div className="review-course-icon" aria-hidden="true">
              {categoryName.slice(0, 1)}
            </div>
            <div>
              <h2>{title}</h2>
              <p>{categoryName}</p>
            </div>
          </section>

          <form className="review-form" onSubmit={handleSubmit}>
            <fieldset className="review-rating-field">
              <legend>강의 만족도 <span>*</span></legend>
              <div className="review-rating-panel">
                <div
                  className="review-stars"
                  role="group"
                  aria-label="별점 선택"
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      aria-label={`${value}점`}
                      aria-pressed={rating === value}
                      className={rating >= value ? "is-selected" : ""}
                      key={value}
                      onClick={() => {
                        setRating(value);
                        setFormError("");
                      }}
                      type="button"
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p>
                  {rating
                    ? ratingDescriptions[rating]
                    : "별점을 선택해주세요."}
                </p>
              </div>
            </fieldset>

            <div className="review-content-field">
              <label htmlFor="review-content">
                리뷰 내용 <span>*</span>
              </label>
              <textarea
                id="review-content"
                maxLength={1000}
                onChange={(event) => {
                  setContent(event.target.value);
                  setFormError("");
                }}
                placeholder="강의에서 좋았던 점이나 도움이 된 내용을 작성해주세요."
                value={content}
              />
              <div className="review-character-count" aria-live="polite">
                {content.length.toLocaleString()} / 1,000
              </div>
              {formError && (
                <p className="learning-inline-error" role="alert">
                  {formError}
                </p>
              )}
            </div>

            <p className="review-privacy-note">
              작성한 리뷰는 강의 페이지에 공개됩니다.
            </p>
            {notice && (
              <p className="learning-action-notice" role="status">
                {notice}
              </p>
            )}

            <div className="review-form-actions">
              <Link className="review-cancel-button" to="/mypage/learning">
                취소
              </Link>
              {hasMyReview && (
                <button
                  className="review-cancel-button"
                  disabled={isSubmitting}
                  onClick={handleDelete}
                  type="button"
                >
                  삭제
                </button>
              )}
              <button
                className="review-submit-button"
                disabled={isSubmitting || reviewsState === "loading"}
                type="submit"
              >
                {isSubmitting
                  ? "처리 중..."
                  : hasMyReview
                    ? "리뷰 수정"
                    : "리뷰 등록"}
              </button>
            </div>
          </form>
        </>
      )}

      <section className="review-list" aria-label="이 강좌의 리뷰">
        <h2 className="review-list-title">
          수강생 리뷰
          {reviews?.summary && (
            <span>
              {reviews.summary.count}개
              {reviews.summary.averageStar != null &&
                ` · 평균 ★ ${reviews.summary.averageStar}`}
            </span>
          )}
        </h2>
        {reviewsState === "loading" && (
          <p className="learning-state-message" role="status">
            리뷰를 불러오는 중입니다.
          </p>
        )}
        {reviewsState === "error" && (
          <p className="learning-state-message learning-state-error" role="alert">
            {reviewsError}
          </p>
        )}
        {reviewsState === "success" &&
          (reviews.reviews.length ? (
            <ul className="review-list-items">
              {reviews.reviews.map((item, index) => (
                <li
                  className={item.isMine ? "is-mine" : ""}
                  key={`${reviews.page.number}-${index}`}
                >
                  <div className="review-list-meta">
                    <strong>{item.authorNickname ?? "수강생"}</strong>
                    {item.isMine && <span className="review-mine-badge">내 리뷰</span>}
                    <span className="review-list-stars" aria-label={`${item.star}점`}>
                      {"★".repeat(item.star ?? 0)}
                    </span>
                    {item.createdAt && (
                      <time dateTime={item.createdAt}>
                        {new Date(item.createdAt).toLocaleDateString("ko-KR")}
                      </time>
                    )}
                  </div>
                  <p>{item.review}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="learning-state-message">아직 작성된 리뷰가 없습니다.</p>
          ))}
        {reviewsState === "success" && (
          <Pagination
            page={reviews.page.number}
            totalPages={reviews.page.totalPages}
            onChange={changeReviewPage}
          />
        )}
      </section>
    </MyLearningLayout>
  );
}

export default ReviewWritePage;

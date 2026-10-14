import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { InstructorCenterLayout as SharedInstructorCenterLayout } from "../instructor-center/InstructorCenterLayout.jsx";
import {
  createInstructorCoupon,
  getInstructorCoupons,
  getInstructorLecturesForCoupons,
} from "./instructorCouponsApi.js";
import { useInstructorCouponsAuth } from "./instructorCouponsAuthContext.js";
import "./instructorCoupons.css";

const INITIAL_FORM = {
  Lid: "",
  cname: "",
  discount: "",
  due: "",
  quantity: "",
};

function InstructorCouponsLayout({ children }) {
  return (
    <SharedInstructorCenterLayout variant="coupons">
      {children}
    </SharedInstructorCenterLayout>
  );
}

function CouponsHeading({ title, description }) {
  return (
    <>
      <header className="instructor-coupons-heading">
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      <nav className="instructor-coupons-tabs" aria-label="강사센터 분류">
        <span aria-disabled="true">운영 현황</span>
        <Link aria-current="page" className="is-active" to="/instructor/coupon">
          강의
        </Link>
        <span aria-disabled="true">학습 관리</span>
        <span aria-disabled="true">정산</span>
      </nav>
    </>
  );
}

function formatWon(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? `${amount.toLocaleString("ko-KR")}원` : "-";
}

function formatDue(value) {
  if (typeof value !== "string" || !value) return "-";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : value;
}

function getPaginationInfo(data) {
  const totalPages = Number.isInteger(data.totalPages) && data.totalPages > 0
    ? data.totalPages
    : null;
  const hasNext = typeof data.hasNext === "boolean" ? data.hasNext : null;
  return { totalPages, hasNext };
}

function CouponList({ accessToken, notice, onAdd }) {
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [listRefreshError, setListRefreshError] = useState("");
  const [metadata, setMetadata] = useState({ totalPages: null, hasNext: null });
  const lastLoadedPage = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadCurrentPage() {
      setError("");
      setListRefreshError("");
      try {
        const result = await getInstructorCoupons(accessToken, page, {
          signal: controller.signal,
        });
        if (!active) return;
        const pagination = getPaginationInfo(result);
        if (
          page > lastLoadedPage.current &&
          result.coupons.length === 0 &&
          !pagination.totalPages &&
          pagination.hasNext !== true
        ) {
          setMetadata({ totalPages: null, hasNext: false });
          setPage(lastLoadedPage.current || 1);
          return;
        }
        setCoupons(result.coupons);
        setMetadata({
          totalPages: pagination.totalPages,
          hasNext: pagination.hasNext ?? (result.coupons.length > 0 ? null : false),
        });
        lastLoadedPage.current = page;
      } catch (loadError) {
        if (!active || loadError.name === "AbortError") return;
        if (notice) setListRefreshError(loadError.message);
        else setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCurrentPage();
    return () => {
      active = false;
      controller.abort();
    };
  }, [accessToken, page, retry, notice]);

  const pageNumbers = useMemo(() => {
    if (!metadata.totalPages) return [page];
    return Array.from({ length: metadata.totalPages }, (_, index) => index + 1);
  }, [metadata.totalPages, page]);

  async function goNext() {
    if (loading || metadata.hasNext === false) return;
    if (metadata.totalPages && page >= metadata.totalPages) return;
    setLoading(true);
    setPage((current) => current + 1);
  }

  function goToPage(targetPage) {
    if (targetPage < 1 || targetPage === page || loading) return;
    setLoading(true);
    setPage(targetPage);
  }

  function retryList() {
    setLoading(true);
    setRetry((count) => count + 1);
  }

  return (
    <>
      <CouponsHeading
        title="쿠폰 발행 목록"
        description="강의별 쿠폰 발행 수량과 쿠폰번호를 확인하세요."
      />
      {notice && <p className="instructor-coupons-notice" role="status">{notice}</p>}
      <div className="instructor-coupons-list-actions">
        <button className="instructor-coupons-add" onClick={onAdd} type="button">
          쿠폰 추가
        </button>
      </div>

      {loading ? (
        <p className="instructor-coupons-state" role="status">쿠폰 목록을 불러오는 중입니다...</p>
      ) : error ? (
        <div className="instructor-coupons-state is-error" role="alert">
          <p>{error}</p>
          <button onClick={retryList} type="button">다시 시도</button>
        </div>
      ) : listRefreshError ? (
        <div className="instructor-coupons-state is-error" role="alert">
          <p>쿠폰은 발행되었지만 목록을 갱신하지 못했습니다. {listRefreshError}</p>
          <button onClick={retryList} type="button">목록 다시 조회</button>
        </div>
      ) : coupons.length === 0 ? (
        <div className="instructor-coupons-state">발행된 쿠폰이 없습니다.</div>
      ) : (
        <div className="instructor-coupons-table-wrap">
          <table className="instructor-coupons-table">
            <thead>
              <tr>
                <th scope="col">강의</th>
                <th scope="col">할인 금액</th>
                <th scope="col">종료일</th>
                <th scope="col">발급 / 수량</th>
                <th scope="col">쿠폰번호</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.cid}>
                  <td>{coupon.lectureName || "-"}</td>
                  <td>{formatWon(coupon.discount)}</td>
                  <td>{formatDue(coupon.due)}</td>
                  <td>{coupon.issued ?? "-"} / {coupon.quantity ?? "-"}</td>
                  <td>{coupon.cname || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && coupons.length > 0 && (
        <nav className="instructor-coupons-pagination" aria-label="쿠폰 목록 페이지">
          <button
            aria-label="이전 페이지"
            disabled={page <= 1 || loading}
            onClick={() => goToPage(page - 1)}
            type="button"
          >
            ‹
          </button>
          {pageNumbers.map((pageNumber) => (
            <button
              aria-current={page === pageNumber ? "page" : undefined}
              className={page === pageNumber ? "is-current" : ""}
              key={pageNumber}
              onClick={() => goToPage(pageNumber)}
              type="button"
            >
              {pageNumber}
            </button>
          ))}
          <button
            aria-label="다음 페이지"
            disabled={
              loading ||
              metadata.hasNext === false ||
              (metadata.totalPages !== null && page >= metadata.totalPages)
            }
            onClick={goNext}
            type="button"
          >
            {loading ? "…" : "›"}
          </button>
        </nav>
      )}
    </>
  );
}

function getLocalDateString() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function CouponForm({ accessToken, onPublished }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [lectures, setLectures] = useState([]);
  const [lecturesLoading, setLecturesLoading] = useState(true);
  const [lectureError, setLectureError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadLectures() {
      setLecturesLoading(true);
      setLectureError("");
      try {
        const result = await getInstructorLecturesForCoupons(accessToken, {
          signal: controller.signal,
        });
        if (active) setLectures(result);
      } catch (error) {
        if (active && error.name !== "AbortError") setLectureError(error.message);
      } finally {
        if (active) setLecturesLoading(false);
      }
    }

    loadLectures();
    return () => {
      active = false;
      controller.abort();
    };
  }, [accessToken, retry]);

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
    setSubmitError("");
  }

  function validate() {
    const errors = {};
    const selectedLecture = lectures.find(
      (lecture) => String(lecture.lid) === form.Lid,
    );
    const discount = Number(form.discount);
    const quantity = Number(form.quantity);
    const today = getLocalDateString();

    if (!form.Lid || !selectedLecture || !Number.isInteger(Number(form.Lid))) {
      errors.Lid = "강의를 선택해 주세요.";
    }
    if (!form.cname.trim()) errors.cname = "쿠폰명을 입력해 주세요.";
    if (!/^\d+$/.test(form.discount) || !Number.isSafeInteger(discount) || discount <= 0) {
      errors.discount = "할인 금액은 양의 정수로 입력해 주세요.";
    } else if (
      selectedLecture &&
      Number.isFinite(Number(selectedLecture.price)) &&
      discount > Number(selectedLecture.price)
    ) {
      errors.discount = "할인 금액은 강의 가격을 초과할 수 없습니다.";
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.due) || form.due <= today) {
      errors.due = "종료일은 오늘보다 미래 날짜로 선택해 주세요.";
    }
    if (!/^\d+$/.test(form.quantity) || !Number.isSafeInteger(quantity) || quantity <= 0) {
      errors.quantity = "수량은 양의 정수로 입력해 주세요.";
    }
    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    setSubmitError("");
    if (Object.values(errors).some(Boolean)) return;

    setSubmitting(true);
    try {
      const response = await createInstructorCoupon(accessToken, {
        Lid: Number(form.Lid),
        cname: form.cname.trim(),
        discount: Number(form.discount),
        due: form.due,
        quantity: Number(form.quantity),
      });
      onPublished(response?.message || "쿠폰이 발행되었습니다.");
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <CouponsHeading
        title="쿠폰 추가"
        description="강의와 할인 조건을 입력하고 쿠폰을 발행하세요."
      />
      {submitError && <p className="instructor-coupons-form-error" role="alert">{submitError}</p>}

      <form className="instructor-coupons-form" onSubmit={handleSubmit} noValidate>
        <label className="instructor-coupons-field">
          <span>강의 선택 <b>*</b></span>
          <select
            disabled={lecturesLoading || Boolean(lectureError) || lectures.length === 0}
            name="Lid"
            onChange={updateForm}
            value={form.Lid}
          >
            <option value="">
              {lecturesLoading
                ? "강의 목록을 불러오는 중입니다..."
                : lectureError
                  ? "강의 목록을 불러오지 못했습니다."
                  : lectures.length === 0
                    ? "선택 가능한 강의가 없습니다."
                    : "강의를 선택해주세요"}
            </option>
            {lectures.map((lecture) => (
              <option key={lecture.lid} value={String(lecture.lid)}>
                {lecture.name}
              </option>
            ))}
          </select>
          {lectureError && (
            <span className="instructor-coupons-field-error">
              {lectureError}{" "}
              <button onClick={() => setRetry((count) => count + 1)} type="button">
                다시 시도
              </button>
            </span>
          )}
          {fieldErrors.Lid && <span className="instructor-coupons-field-error">{fieldErrors.Lid}</span>}
        </label>

        <label className="instructor-coupons-field">
          <span>쿠폰명 <b>*</b></span>
          <input
            name="cname"
            onChange={updateForm}
            placeholder="쿠폰명을 입력해주세요"
            value={form.cname}
          />
          {fieldErrors.cname && <span className="instructor-coupons-field-error">{fieldErrors.cname}</span>}
        </label>

        <label className="instructor-coupons-field">
          <span>할인 금액 <b>*</b></span>
          <div className="instructor-coupons-number-field">
            <input
              inputMode="numeric"
              name="discount"
              onChange={(event) => updateForm({
                target: { name: "discount", value: event.target.value.replace(/[^\d]/g, "") },
              })}
              placeholder="할인 금액을 입력해주세요"
              value={form.discount}
            />
            <span>원</span>
          </div>
          {fieldErrors.discount && <span className="instructor-coupons-field-error">{fieldErrors.discount}</span>}
        </label>

        <label className="instructor-coupons-field">
          <span>할인 종료일 <b>*</b></span>
          <input name="due" onChange={updateForm} type="date" value={form.due} />
          {fieldErrors.due && <span className="instructor-coupons-field-error">{fieldErrors.due}</span>}
        </label>

        <label className="instructor-coupons-field">
          <span>수량 <b>*</b></span>
          <div className="instructor-coupons-number-field">
            <input
              inputMode="numeric"
              name="quantity"
              onChange={(event) => updateForm({
                target: { name: "quantity", value: event.target.value.replace(/[^\d]/g, "") },
              })}
              placeholder="수량을 입력해주세요"
              value={form.quantity}
            />
            <span>개</span>
          </div>
          {fieldErrors.quantity && <span className="instructor-coupons-field-error">{fieldErrors.quantity}</span>}
        </label>

        <p className="instructor-coupons-guidance">
          강의 가격 이하의 할인 금액, 미래 종료일, 양수 수량을 확인해주세요.
        </p>

        <div className="instructor-coupons-form-actions">
          <button
            className="instructor-coupons-publish"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "발행 중..." : "쿠폰 발행"}
          </button>
        </div>
      </form>
    </>
  );
}

export function InstructorCouponPage() {
  const { accessToken } = useInstructorCouponsAuth();
  const [view, setView] = useState("list");
  const [listRevision, setListRevision] = useState(0);
  const [notice, setNotice] = useState("");

  function handlePublished(message) {
    setNotice(message);
    setView("list");
    setListRevision((revision) => revision + 1);
  }

  function openForm() {
    setNotice("");
    setView("form");
  }

  return (
    <InstructorCouponsLayout>
      {view === "form" ? (
        <CouponForm
          accessToken={accessToken}
          onPublished={handlePublished}
        />
      ) : (
        <CouponList
          accessToken={accessToken}
          key={listRevision}
          notice={notice}
          onAdd={openForm}
        />
      )}
    </InstructorCouponsLayout>
  );
}

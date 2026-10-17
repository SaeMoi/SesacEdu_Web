// 마이페이지 목록 페이지 번호 (2026-10-17): 커뮤니티와 같은 모양(< 1 2 3 ... >), 남색·연두 색.
// page는 백엔드와 같은 0부터. 번호는 10개씩 묶어서 보여준다.
import "./Pagination.css";

const BLOCK = 10;

function Chevron({ dir }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir === "prev" ? "M15 18l-6-6 6-6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}

export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages < 1) return null;
  const start = Math.floor(page / BLOCK) * BLOCK;
  const end = Math.min(start + BLOCK, totalPages);
  const numbers = [];
  for (let i = start; i < end; i += 1) numbers.push(i);

  return (
    <nav className="mypage-pagination" aria-label="페이지">
      <button type="button" className="page-arrow" aria-label="이전 페이지"
        disabled={page <= 0} onClick={() => onChange(page - 1)}>
        <Chevron dir="prev" />
      </button>
      {numbers.map((n) => (
        <button key={n} type="button" aria-label={`${n + 1} 페이지`}
          aria-current={n === page ? "page" : undefined}
          onClick={() => n !== page && onChange(n)}>
          {n + 1}
        </button>
      ))}
      <button type="button" className="page-arrow" aria-label="다음 페이지"
        disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>
        <Chevron dir="next" />
      </button>
    </nav>
  );
}

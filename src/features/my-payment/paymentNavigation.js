export function navigateToPayment(navigate, courseIds) {
  const validIds = Array.isArray(courseIds)
    ? [...new Set(courseIds.filter((id) => Number.isInteger(id) && id > 0))]
    : [];
  if (validIds.length === 0) return false;
  navigate("/mypage/buy", { state: { courseIds: validIds } });
  return true;
}

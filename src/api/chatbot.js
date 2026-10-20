// 데모 답변만 반환합니다. 실제 연결 시 비밀키 없이 자체 백엔드 API를 호출하세요.
// courseId는 문맥 정보일 뿐이며 서버가 사용자 인증·수강 권한을 별도로 검사해야 합니다.
export async function sendChatMessage({ message, courseId }) {
  if (message.includes("인증") || message.includes("인가")) {
    return "예시 답변 · 인증은 누구인지 확인하고, 인가는 허용된 행동인지 확인하는 과정이에요.";
  }
  return courseId
    ? "예시 답변 · 이 강의에서 궁금한 내용을 질문·답변에 남겨 주세요. AI 서버는 아직 연결되지 않았어요."
    : "예시 답변 · 강의 탐색과 학습에 관한 질문을 도와드릴 예정이에요. AI 서버는 아직 연결되지 않았어요.";
}

// 과제 미리보기 전용: 네트워크 전송/영구 저장 없이 현재 탭에서만 파일을 보관합니다.
const form = document.querySelector('#assignment-form');
if (form) {
  const el = (id) => document.getElementById(id);
  let selectedFile = null;
  let downloadUrl = null;
  const message = (text) => { el('assignment-status').textContent = text; };
  const selectFile = (file) => {
    selectedFile = null;
    el('assignment-file-name').textContent = '파일을 끌어 놓거나 파일 선택 버튼을 눌러 주세요.';
    if (!file) return;
    // 확장자 검사는 사용자 안내용이며 실제 서버는 파일 내용과 권한도 검증해야 합니다.
    if (!/\.pdf$/i.test(file.name) || file.size === 0 || file.size > 10 * 1024 * 1024) {
      el('assignment-file').value = '';
      message('내용이 있는 PDF 파일을 선택해 주세요. 최대 크기는 10MB입니다.');
      return;
    }
    selectedFile = file;
    el('assignment-file-name').textContent = `${file.name} (${(file.size / 1024).toFixed(1)}KB)`;
    message('파일이 선택되었습니다. 과제 제출을 누르면 제출 내역을 미리 볼 수 있습니다.');
  };
  el('assignment-file').addEventListener('change', (event) => selectFile(event.target.files[0]));
  const drop = el('assignment-drop');
  ['dragenter', 'dragover'].forEach((type) => drop.addEventListener(type, (event) => {event.preventDefault();drop.classList.add('dragging');}));
  ['dragleave', 'drop'].forEach((type) => drop.addEventListener(type, (event) => {event.preventDefault();drop.classList.remove('dragging');}));
  drop.addEventListener('drop', (event) => {
    if (event.dataTransfer.files.length !== 1) { message('PDF 파일 한 개만 놓아 주세요.'); return; }
    selectFile(event.dataTransfer.files[0]);
  });
  form.addEventListener('reset', () => { selectedFile = null;el('assignment-file-name').textContent = '파일을 끌어 놓거나 파일 선택 버튼을 눌러 주세요.';message('작성 중인 내용을 비웠습니다.'); });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!selectedFile) { message('제출할 PDF 파일을 먼저 선택해 주세요.');return; }
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = URL.createObjectURL(selectedFile);
    // 메모/파일명을 HTML로 해석하지 않도록 textContent로 출력합니다.
    el('assignment-submitted-name').textContent = selectedFile.name;
    el('assignment-submitted-memo').textContent = el('assignment-memo').value.trim() || '제출 메모가 없습니다.';
    el('assignment-time').textContent = new Date().toLocaleString('ko-KR');
    el('assignment-download').href = downloadUrl;
    el('assignment-download').download = selectedFile.name;
    el('assignment-state').textContent = '제출 완료 · 미리보기';
    form.hidden = true;
    el('assignment-submission').hidden = false;
    el('assignment-feedback').hidden = false;
    el('feedback-wait').hidden = false;el('feedback-example').hidden = true;
    el('feedback-state').textContent = '피드백 대기';el('feedback-toggle').textContent = '완료된 피드백 예시 보기';
    el('assignment-submission').scrollIntoView({behavior:'smooth',block:'start'});
  });
  el('assignment-edit').addEventListener('click', () => {form.hidden=false;form.scrollIntoView({behavior:'smooth'});message('새 파일이나 메모로 제출 내역을 다시 미리 볼 수 있습니다.');});
  el('feedback-toggle').addEventListener('click', () => {
    const show = el('feedback-example').hidden;
    el('feedback-example').hidden = !show;el('feedback-wait').hidden = show;
    el('feedback-state').textContent = show ? '피드백 완료 · 예시' : '피드백 대기';
    el('feedback-toggle').textContent = show ? '피드백 대기 화면 보기' : '완료된 피드백 예시 보기';
  });
  window.addEventListener('pagehide', () => {if(downloadUrl) URL.revokeObjectURL(downloadUrl);});
}

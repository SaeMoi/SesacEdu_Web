// 클라이언트 잠금은 UI 처리입니다. 실제 보호는 30초 전용 파일과 서버 권한 검사로 구현합니다.
const video = document.getElementById("preview-video");
if (video) {
  const el = id => document.getElementById(id);
  const limit = 30;
  let timer = null, elapsed = 0, lastTick = 0, locked = false;
  const hasMedia = Boolean(video.getAttribute("src") || video.querySelector("source[src]"));
  el("preview-demo").hidden = hasMedia;
  video.hidden = !hasMedia;
  const update = seconds => {
    const value = Math.min(limit, Math.max(0, seconds));
    el("preview-time").textContent = `00:${String(Math.floor(value)).padStart(2,"0")} / 00:30`;
    el("preview-progress").style.width = `${value/limit*100}%`;
  };
  const pauseDemo = () => {clearInterval(timer);timer=null;el("preview-demo-toggle").textContent=elapsed ? "시연 계속하기" : "30초 흐름 시연 시작";};
  const lock = () => {
    pauseDemo();video.pause();locked=true;
    el("preview-demo").hidden=true;
    el("preview-lock").hidden=false;
    el("preview-status").textContent="미리보기 이후의 영상과 학습 기능은 잠겨 있습니다. 로그인 및 수강권을 확인해 주세요.";
    el("preview-lock-title").focus({preventScroll:true});
  };
  const replay = () => {
    pauseDemo();locked=false;elapsed=0;video.pause();
    if(hasMedia) video.currentTime=0;
    update(0);el("preview-lock").hidden=true;el("preview-demo").hidden=hasMedia;
    el("preview-status").textContent=hasMedia ? "처음 30초를 다시 볼 수 있습니다." : "영상 연결 전입니다. 시연 시작 버튼으로 잠금 흐름을 확인하세요.";
    el("preview-demo-toggle").textContent="30초 흐름 시연 시작";
    (hasMedia ? video : el("preview-demo-toggle")).focus();
  };
  el("preview-demo-toggle").addEventListener("click",()=>{
    if(timer){pauseDemo();return;}
    if(locked)return;
    lastTick=performance.now();el("preview-demo-toggle").textContent="시연 일시정지";
    timer=setInterval(()=>{
      const now=performance.now();elapsed+=(now-lastTick)/1000;lastTick=now;update(elapsed);
      if(elapsed>=limit)lock();
    },100);
  });
  // 실제 영상 연결 후에는 재생 시간과 탐색(앞으로 이동)도 제한합니다.
  for(const event of ["timeupdate","seeking","play"]){video.addEventListener(event,()=>{
    if(locked || video.currentTime>=limit){lock();return;}update(video.currentTime);
  });}
  video.addEventListener("ended",lock);
  video.addEventListener("error",()=>{el("preview-status").textContent="미리보기 영상을 불러오지 못했습니다.";});
  el("preview-replay").addEventListener("click",replay);
  el("preview-first").addEventListener("click",replay);
  document.querySelectorAll("[data-preview-locked]").forEach(button=>button.addEventListener("click",lock));
  // 탭을 벗어나면 시연을 멈춥니다. 실제 영상의 버퍼링 시간은 재생시간에 포함되지 않습니다.
  document.addEventListener("visibilitychange",()=>{if(document.hidden){pauseDemo();video.pause();}});
  window.addEventListener("pagehide",pauseDemo);
}

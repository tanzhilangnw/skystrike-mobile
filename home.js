(() => {
  const frame = document.getElementById('game');
  const play = document.getElementById('play');
  const stage = document.getElementById('stage');
  const detail = document.getElementById('detail');
  const notice = document.getElementById('notice');
  const track = document.getElementById('track');
  const retry = document.getElementById('retry');
  let ready = false, requested = false, installPrompt = null, timer;
  const states = {
    runtime: ['正在准备飞行', '可以先看看玩法'],
    resources: ['正在准备战机与星空', '首次需要下载资源'],
    initializing: ['正在进入机库', '即将就绪'],
    ready: ['战机已就绪', '随时可以出发']
  };
  function enter() {
    document.body.classList.add('playing');
    frame.contentWindow.postMessage({type:'sky-focus'}, location.origin);
    frame.focus();
  }
  function setStage(name) {
    if (!states[name]) return;
    [stage.textContent, detail.textContent] = states[name];
  }
  function load() {
    ready = false; requested = false;
    play.disabled = false; play.innerHTML = '立即开始 <span>↗</span>';
    retry.hidden = true; track.className = 'track';
    setStage('runtime');
    frame.src = 'game.html?v=e393233f3b9d';
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (ready) return;
      detail.textContent = '当前网络加载较慢';
      notice.textContent = '仍在准备资源。可以继续等待，或点击重新加载。';
      retry.hidden = false;
    }, 35000);
  }
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frame.contentWindow || event.data?.type !== 'skystrike') return;
    const name = event.data.stage;
    if (ready && name !== 'error') return;
    if (name === 'error') {
      if (ready) return;
      clearTimeout(timer); stage.textContent = '加载未完成'; detail.textContent = '请重试';
      notice.textContent = '请检查网络后重新加载，已下载的资源会尽量复用。';
      retry.hidden = false; play.disabled = false; play.textContent = '重新准备游戏';
      track.classList.add('failed'); return;
    }
    setStage(name);
    if (name === 'ready') {
      ready = true; clearTimeout(timer); retry.hidden = true;
      track.classList.add('ready'); play.disabled = false;
      play.innerHTML = '开始游戏 <span>↗</span>';
      notice.textContent = '按住拖动移动，战机会自动射击。';
      if (requested) enter();
    }
  });
  play.addEventListener('click', () => {
    if (ready) return enter();
    if (track.classList.contains('failed')) load();
    requested = true; play.disabled = true; play.textContent = '准备好后自动进入…';
    notice.textContent = '已为你准备出发，加载完成会自动进入游戏。';
  });
  retry.addEventListener('click', load);
  window.addEventListener('offline', () => {
    if (!ready) { detail.textContent = '网络已断开'; retry.hidden = false; }
  });
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; });
  document.getElementById('install').addEventListener('click', async () => {
    if (installPrompt) { await installPrompt.prompt(); installPrompt = null; }
    else notice.textContent = /iPad|iPhone|iPod/.test(navigator.userAgent)
      ? '在 Safari 中点“分享”，再选“添加到主屏幕”，下次从桌面直接打开。'
      : '打开浏览器菜单，选择“添加到主屏幕”或“安装应用”。';
  });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
  // Two animation frames let the independent homepage paint before the runtime starts.
  requestAnimationFrame(() => requestAnimationFrame(load));
})();

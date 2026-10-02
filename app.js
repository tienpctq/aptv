const state = {
  channels: [],
  lastFocus: null,
  hls: null
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

function tickClock(){
  const d = new Date();
  $('#clock').textContent = d.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});
}
tickClock();
setInterval(tickClock,30000);

async function loadChannels(){
  try{
    const r = await fetch('channels.json',{cache:'no-store'});
    state.channels = await r.json();
  }catch(e){
    state.channels = [];
  }
  renderChannelGrid('#channelGrid', state.channels.slice(0,8));
  wireCards();
  focusFirst();
}

function renderChannelGrid(target, items){
  const root = $(target);
  root.innerHTML = '';
  items.forEach(ch=>{
    const b = document.createElement('button');
    b.className='card focusable';
    b.dataset.action='play';
    b.dataset.id=ch.id;
    b.innerHTML=`
      <span class="channel-logo">${escapeHtml(ch.short || ch.name.slice(0,3).toUpperCase())}</span>
      <span class="card-title">${escapeHtml(ch.name)}</span>
      <span class="card-subtitle">${escapeHtml(ch.group || 'Kênh')}</span>
    `;
    root.appendChild(b);
  });
}

function escapeHtml(s=''){
  return s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

function wireCards(){
  $$('.card').forEach(el=>{
    el.onclick=()=>handleAction(el);
  });
}

function handleAction(el){
  const action=el.dataset.action;
  if(action==='youtube'){
    location.href=el.dataset.url;
  }else if(action==='play'){
    const ch=state.channels.find(x=>x.id===el.dataset.id);
    if(ch) playChannel(ch);
  }else if(action==='category'){
    openCategory(el.dataset.category);
  }
}

function openCategory(cat){
  state.lastFocus=document.activeElement;
  let items=state.channels;
  let title='Tất cả kênh';

  if(cat==='favorites'){
    items=state.channels.filter(x=>x.favorite);
    title='Yêu thích';
  }else if(cat==='sports'){
    items=state.channels.filter(x=>(x.group||'').toLowerCase().includes('thể thao') || (x.group||'').toLowerCase().includes('sport'));
    title='Thể thao';
  }else if(cat==='tv'){
    title='Truyền hình';
  }

  $('#listTitle').textContent=title;
  renderChannelGrid('#listGrid',items);
  $('#listOverlay').classList.remove('hidden');
  wireCards();
  setTimeout(()=>$('#listGrid .focusable')?.focus(),30);
}

function closeList(){
  $('#listOverlay').classList.add('hidden');
  setTimeout(()=>state.lastFocus?.focus(),20);
}
$('#closeList').onclick=closeList;

function playChannel(ch){
  state.lastFocus=document.activeElement;
  $('#playerTitle').textContent=ch.name;
  $('#playerOverlay').classList.remove('hidden');

  const video=$('#video');
  const msg=$('#playerMessage');
  msg.classList.add('hidden');

  if(state.hls){
    state.hls.destroy();
    state.hls=null;
  }

  if(video.canPlayType('application/vnd.apple.mpegurl')){
    video.src=ch.url;
    video.play().catch(()=>showMessage('Nhấn OK/Play để bắt đầu phát.'));
  }else if(window.Hls && Hls.isSupported()){
    state.hls=new Hls({enableWorker:true,lowLatencyMode:true});
    state.hls.loadSource(ch.url);
    state.hls.attachMedia(video);
    state.hls.on(Hls.Events.MANIFEST_PARSED,()=>video.play().catch(()=>showMessage('Nhấn OK/Play để bắt đầu phát.')));
    state.hls.on(Hls.Events.ERROR,(_,data)=>{
      if(data.fatal) showMessage('Không phát được luồng này. Hãy kiểm tra URL hoặc quyền truy cập.');
    });
  }else{
    showMessage('Trình duyệt này không hỗ trợ HLS.');
  }

  setTimeout(()=>$('#closePlayer').focus(),30);
}

function showMessage(t){
  const el=$('#playerMessage');
  el.textContent=t;
  el.classList.remove('hidden');
}

function closePlayer(){
  const v=$('#video');
  v.pause();
  v.removeAttribute('src');
  v.load();
  if(state.hls){state.hls.destroy();state.hls=null}
  $('#playerOverlay').classList.add('hidden');
  setTimeout(()=>state.lastFocus?.focus(),20);
}
$('#closePlayer').onclick=closePlayer;

function focusFirst(){
  setTimeout(()=>$('.focusable')?.focus(),30);
}

document.addEventListener('keydown',(e)=>{
  if(e.key==='Escape' || e.key==='Backspace' || e.key==='BrowserBack'){
    if(!$('#playerOverlay').classList.contains('hidden')){e.preventDefault();closePlayer();return}
    if(!$('#listOverlay').classList.contains('hidden')){e.preventDefault();closeList();return}
  }

  const keys=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
  if(!keys.includes(e.key)) return;

  const current=document.activeElement;
  if(!current?.classList.contains('focusable')) return;

  e.preventDefault();
  const all=$$('.focusable').filter(x=>x.offsetParent!==null);
  const r=current.getBoundingClientRect();
  const cx=r.left+r.width/2, cy=r.top+r.height/2;

  let best=null, bestScore=Infinity;
  for(const el of all){
    if(el===current) continue;
    const q=el.getBoundingClientRect();
    const x=q.left+q.width/2, y=q.top+q.height/2;
    const dx=x-cx, dy=y-cy;

    const valid =
      (e.key==='ArrowRight' && dx>10) ||
      (e.key==='ArrowLeft' && dx<-10) ||
      (e.key==='ArrowDown' && dy>10) ||
      (e.key==='ArrowUp' && dy<-10);

    if(!valid) continue;

    const primary = (e.key==='ArrowLeft'||e.key==='ArrowRight') ? Math.abs(dx) : Math.abs(dy);
    const secondary = (e.key==='ArrowLeft'||e.key==='ArrowRight') ? Math.abs(dy) : Math.abs(dx);
    const score = primary + secondary*2.4;

    if(score<bestScore){bestScore=score;best=el}
  }
  best?.focus();
});

loadChannels();

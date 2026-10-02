const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let channels=[],hls=null,watchId=null;
let currentSpeed=0,speedLimit=null,speedLimitSource='Chưa kết nối nguồn bản đồ';
const OVERSPEED_MARGIN=3;
let lastAlertAt=0,audioCtx=null;

function applyAdaptiveLayout(){
  const w=window.innerWidth, h=window.innerHeight, ratio=w/Math.max(h,1);
  document.body.classList.remove('layout-low','layout-ultrawide','layout-portrait','layout-small');
  if(h<=720) document.body.classList.add('layout-low');
  if(ratio>=2.15) document.body.classList.add('layout-ultrawide');
  if(h>w) document.body.classList.add('layout-portrait');
  if(w<=760 || h<=520) document.body.classList.add('layout-small');
}
applyAdaptiveLayout();
window.addEventListener('resize',applyAdaptiveLayout);
window.addEventListener('orientationchange',()=>setTimeout(applyAdaptiveLayout,150));


function setRoadSpeedLimit(limit,source='Nguồn bản đồ'){
  const n=Number(limit);
  speedLimit=Number.isFinite(n)&&n>0?n:null;
  speedLimitSource=source||'Nguồn bản đồ';
  $('#speedLimitValue').textContent=speedLimit??'--';
  $('#speedLimitText').textContent=speedLimit?speedLimit+' km/h':'Chưa có dữ liệu';
  $('#speedLimitSource').textContent=speedLimitSource;
  $('#limitStateText').textContent=speedLimit?speedLimit+' km/h':'Chưa xác định';
  updateOverspeedState();
}
window.updateRoadSpeedLimit=setRoadSpeedLimit;

function updateOverspeedState(){
  const ring=$('#speedRing'),banner=$('#overspeedBanner');
  ring.classList.remove('speed-near','speed-over');
  banner.classList.add('hidden');
  if(!speedLimit)return;
  const diff=currentSpeed-speedLimit;
  if(diff>OVERSPEED_MARGIN){
    ring.classList.add('speed-over');
    $('#overspeedAmount').textContent=Math.max(1,Math.round(diff));
    banner.classList.remove('hidden');
    playOverspeedAlert();
  }else if(currentSpeed>=speedLimit-5){
    ring.classList.add('speed-near');
  }
}

function unlockAudio(){
  try{
    audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended')audioCtx.resume();
  }catch(e){}
}

function playOverspeedAlert(){
  const now=Date.now();
  if(now-lastAlertAt<5000)return;
  lastAlertAt=now;
  try{
    unlockAudio();
    if(!audioCtx)return;
    const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();
    osc.type='sine';osc.frequency.value=880;
    gain.gain.setValueAtTime(0.0001,audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18,audioCtx.currentTime+0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001,audioCtx.currentTime+0.45);
    osc.connect(gain);gain.connect(audioCtx.destination);
    osc.start();osc.stop(audioCtx.currentTime+0.5);
  }catch(e){}
}

function updateClock(){
  $('#clock').textContent=new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});
}
updateClock();setInterval(updateClock,30000);

function showView(name){
  $$('.tab').forEach(t=>t.classList.toggle('active',t.dataset.view===name));
  ['youtube','tv','apps'].forEach(v=>$('#'+v+'View').classList.toggle('hidden',v!==name));
  $('#viewTitle').textContent=name==='youtube'?'YouTube':name==='tv'?'Truyền hình':'Ứng dụng';
  setTimeout(()=>document.querySelector('#'+name+'View .focusable')?.focus(),20);
}
$$('.tab').forEach(t=>t.onclick=()=>showView(t.dataset.view));

async function loadChannels(){
  try{
    const r=await fetch('channels.json?ts='+Date.now(),{cache:'no-store'});
    channels=await r.json();
  }catch(e){channels=[]}
  const root=$('#channelList'); root.innerHTML='';
  channels.forEach(ch=>{
    const b=document.createElement('button');
    b.className='channel-btn focusable';
    b.innerHTML='<b>'+escapeHtml(ch.name)+'</b><span>'+escapeHtml(ch.group||'Kênh')+'</span>';
    b.onclick=()=>playChannel(ch);
    root.appendChild(b);
  });
}
function escapeHtml(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}

function playChannel(ch){
  const v=$('#tvPlayer'),msg=$('#tvMessage');msg.classList.add('hidden');
  if(hls){hls.destroy();hls=null}
  if(v.canPlayType('application/vnd.apple.mpegurl')){
    v.src=ch.url;v.play().catch(()=>showTvMessage('Nhấn Play để bắt đầu.'));
  }else if(window.Hls&&Hls.isSupported()){
    hls=new Hls({enableWorker:true,lowLatencyMode:true});
    hls.loadSource(ch.url);hls.attachMedia(v);
    hls.on(Hls.Events.MANIFEST_PARSED,()=>v.play().catch(()=>showTvMessage('Nhấn Play để bắt đầu.')));
    hls.on(Hls.Events.ERROR,(_,d)=>{if(d.fatal)showTvMessage('Không phát được luồng này.');});
  }else showTvMessage('Trình duyệt không hỗ trợ HLS.');
}
function showTvMessage(t){const m=$('#tvMessage');m.textContent=t;m.classList.remove('hidden');}

$('#openYoutube').onclick=()=>location.href='https://www.youtube.com/';
$('#retryButton').onclick=()=>$('#youtubeFrame').src=$('#youtubeFrame').src;
$('#playButton').onclick=()=>$('#youtubeFrame').focus();
$('#changeVideo').onclick=()=>{
  const q=prompt('Nhập link YouTube hoặc ID video:');
  if(!q)return;
  let id=q.trim();
  const m=id.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{6,})/);
  if(m)id=m[1];
  if(!/^[A-Za-z0-9_-]{6,}$/.test(id)){alert('Link/ID video không hợp lệ.');return;}
  $('#youtubeFrame').src='https://www.youtube.com/embed/'+id+'?rel=0&autoplay=1';
};
$('#zoomVideo').onclick=()=>{
  const el=$('.video-stage');
  if(document.fullscreenElement) document.exitFullscreen?.();
  else el.requestFullscreen?.();
};
$('#fitButton').onclick=()=>document.documentElement.requestFullscreen?.();
$('#utilityButton').onclick=()=>showView('apps');
$('#appsTvShortcut').onclick=()=>showView('tv');
$('#appsHomeShortcut').onclick=()=>showView('youtube');

function updateWeather(lat,lon){
  const url='https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon+'&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto';
  fetch(url).then(r=>r.json()).then(data=>{
    const c=data.current||{};
    $('#temperature').textContent=Math.round(c.temperature_2m??0)+'°C';
    const w=weatherFromCode(c.weather_code);
    $('#weatherIcon').textContent=w.icon;
    $('#weatherText').textContent=w.text;
    $('#weatherMeta').textContent='Gió '+Math.round(c.wind_speed_10m??0)+' km/h';
  }).catch(()=>$('#weatherMeta').textContent='Không lấy được dữ liệu thời tiết.');
}
function weatherFromCode(code){
  if(code===0)return{icon:'☀️',text:'Trời quang'};
  if([1,2].includes(code))return{icon:'🌤️',text:'Ít mây'};
  if(code===3)return{icon:'☁️',text:'Nhiều mây'};
  if([45,48].includes(code))return{icon:'🌫️',text:'Sương mù'};
  if([51,53,55,61,63,65,80,81,82].includes(code))return{icon:'🌧️',text:'Có mưa'};
  if([71,73,75,77,85,86].includes(code))return{icon:'❄️',text:'Có tuyết'};
  if([95,96,99].includes(code))return{icon:'⛈️',text:'Dông'};
  return{icon:'🌡️',text:'Thời tiết'};
}

function startGPS(){
  if(!navigator.geolocation){$('#gpsText').textContent='Không hỗ trợ';return;}
  $('#gpsText').textContent='Đang xác định...';
  watchId=navigator.geolocation.watchPosition(pos=>{
    const {latitude,longitude,accuracy,speed}=pos.coords;
    $('#gpsText').textContent='Đã bật';
    $('#accuracyText').textContent=Math.round(accuracy||0)+' m';
    currentSpeed=Math.max(0,Math.round((speed||0)*3.6));
    $('#speedValue').textContent=currentSpeed;
    updateOverspeedState();
    $('#gpsState').style.color='#55ff88';
    updateWeather(latitude,longitude);
  },err=>{
    $('#gpsText').textContent=err.code===1?'Bị từ chối':'Không có tín hiệu';
    $('#gpsState').style.color='#ff5577';
  },{enableHighAccuracy:true,maximumAge:3000,timeout:10000});
}

$('#limitSign').onclick=()=>{
  const raw=prompt('Nhập giới hạn tốc độ để thử cảnh báo (km/h). Để trống để xóa:');
  if(raw===null)return;
  if(raw.trim()===''){setRoadSpeedLimit(null,'Chưa kết nối nguồn bản đồ');return;}
  const n=Number(raw);
  if(Number.isFinite(n)&&n>0)setRoadSpeedLimit(n,'Giới hạn thử nghiệm thủ công');
};

$('#gpsButton').onclick=()=>{
  if(watchId!==null){
    navigator.geolocation.clearWatch(watchId);watchId=null;
    $('#gpsText').textContent='Đã tắt';$('#speedValue').textContent='0';$('#gpsButton').textContent='Bật GPS';
  }else{
    unlockAudio();startGPS();$('#gpsButton').textContent='Tắt GPS';
  }
};

document.addEventListener('keydown',e=>{
  if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;
  const cur=document.activeElement;if(!cur?.classList.contains('focusable'))return;
  e.preventDefault();
  const all=$$('.focusable').filter(x=>x.offsetParent!==null);
  const r=cur.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  let best=null,score=Infinity;
  for(const el of all){
    if(el===cur)continue;
    const q=el.getBoundingClientRect(),x=q.left+q.width/2,y=q.top+q.height/2,dx=x-cx,dy=y-cy;
    const ok=(e.key==='ArrowRight'&&dx>8)||(e.key==='ArrowLeft'&&dx<-8)||(e.key==='ArrowDown'&&dy>8)||(e.key==='ArrowUp'&&dy<-8);
    if(!ok)continue;
    const primary=(e.key==='ArrowLeft'||e.key==='ArrowRight')?Math.abs(dx):Math.abs(dy);
    const secondary=(e.key==='ArrowLeft'||e.key==='ArrowRight')?Math.abs(dy):Math.abs(dx);
    const s=primary+secondary*2.2;
    if(s<score){score=s;best=el}
  }
  best?.focus();
});

loadChannels();
setTimeout(()=>$('.focusable')?.focus(),50);
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let channels=[],hls=null,watchId=null,currentSpeed=0,speedLimit=null,onlineSpeedLimitEnabled=false,lastRoadPoint=null,lastSpeedLimitFetch=0,lastAlertAt=0,audioCtx=null;
const OVERSPEED_MARGIN=3;
const STARTER_VIDEOS=[
 {id:'aiI8Z4HHHt0',title:'VTV24 · Tin tức',channel:'VTV24',thumbnail:'https://i.ytimg.com/vi/aiI8Z4HHHt0/mqdefault.jpg',category:'Tin tức'},
 {id:'_ybtyOVLcnU',title:'VTV Thể Thao · Video nổi bật',channel:'VTV Thể Thao',thumbnail:'https://i.ytimg.com/vi/_ybtyOVLcnU/mqdefault.jpg',category:'Thể thao'},
 {id:'VQQRckXRlzw',title:'VTV Thể Thao · Tin thể thao',channel:'VTV Thể Thao',thumbnail:'https://i.ytimg.com/vi/VQQRckXRlzw/mqdefault.jpg',category:'Thể thao'},
 {id:'lC1gu4-wFV4',title:'Mầm Chồi Lá · Nhạc thiếu nhi',channel:'POPS Kids',thumbnail:'https://i.ytimg.com/vi/lC1gu4-wFV4/mqdefault.jpg',category:'Thiếu nhi'},
 {id:'Y98l-jj1DKM',title:'Liên khúc thiếu nhi sôi động',channel:'POPS Kids Music',thumbnail:'https://i.ytimg.com/vi/Y98l-jj1DKM/mqdefault.jpg',category:'Thiếu nhi'}
];


function mode(name){
 ['youtube','tv','apps'].forEach(x=>$('#'+x+'Mode')?.classList.toggle('hidden',x!==name));
 $$('.nav').forEach(b=>b.classList.toggle('active',b.dataset.mode===name));
}
$$('.nav').forEach(b=>b.onclick=()=>mode(b.dataset.mode));
$('#utilityBtn').onclick=()=>mode('apps');
$('#gpsApp').onclick=()=>{$('.right').scrollIntoView({behavior:'smooth'});};
$('#fitButton').onclick=()=>document.fullscreenElement?document.exitFullscreen?.():document.documentElement.requestFullscreen?.();
$('#swapBtn').onclick=()=>$('.shell').classList.toggle('swapped');
$('#videoFullscreen').onclick=()=>$('#playerWrap').classList.contains('hidden')?$('.left').requestFullscreen?.():$('#playerWrap').requestFullscreen?.();

function clock(){ $('#clock').textContent=new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}); } clock();setInterval(clock,30000);

function parseId(v=''){const m=v.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{6,})/);if(m)return m[1];return /^[A-Za-z0-9_-]{6,}$/.test(v.trim())?v.trim():null}
function playYouTube(v){
 const id=typeof v==='string'?v:v.id,title=typeof v==='string'?'YouTube':v.title;
 if(!id)return;$('#youtubeFrame').src='https://www.youtube.com/embed/'+id+'?rel=0&autoplay=1';$('#playerPlaceholder')?.classList.add('hidden');$('#playerWrap').classList.remove('hidden');$('#ytResults').classList.remove('hidden');$('#searchStatus').classList.remove('hidden');saveHistory(typeof v==='string'?{id,title,channel:'YouTube',thumbnail:'https://i.ytimg.com/vi/'+id+'/mqdefault.jpg'}:v);
}

function handleSearch(){const q=$('#ytSearch').value.trim();if(!q)return;const id=parseId(q);if(id)return playYouTube(id);searchYouTube(q)}
$('#ytSearchBtn').onclick=handleSearch;$('#ytSearch').addEventListener('keydown',e=>{if(e.key==='Enter')handleSearch()});
$$('[data-query]').forEach(b=>b.onclick=()=>{$('#ytSearch').value=b.dataset.query;searchYouTube(b.dataset.query)});
$('#recentBtn').onclick=()=>renderVideos(getHistory());

$('[data-yt-query]').forEach(b=>b.onclick=()=>{
  $('.yt-section').forEach(x=>x.classList.remove('active'));b.classList.add('active');
  const q=b.dataset.ytQuery,cat=q.includes('Thiếu nhi')?'Thiếu nhi':q.includes('Tin tức')?'Tin tức':q.includes('Thể thao')?'Thể thao':q.includes('Nhạc')?'Nhạc':q.includes('Du lịch')?'Du lịch':null;
  $('#ytSearch').value=q;
  const local=cat?STARTER_VIDEOS.filter(v=>v.category===cat):STARTER_VIDEOS;
  renderVideos(local);$('#searchStatus').classList.remove('hidden');
  $('#searchStatus').textContent=local.length?cat+' · '+local.length+' video':'Chưa có video cố định cho '+cat;
  if(window.APTV_CONFIG?.youtubeSearchApiUrl)searchYouTube(q);
});
$('[data-yt-section]').forEach(b=>b.onclick=()=>{
  $('.yt-section').forEach(x=>x.classList.remove('active'));b.classList.add('active');
  if(b.dataset.ytSection==='history'){
    $('#searchStatus').classList.remove('hidden');$('#searchStatus').textContent='Video đã xem gần đây';
    renderVideos(getHistory());
  }else{
    $('#ytSearch').value='';
    $('#searchStatus').classList.remove('hidden');
    $('#searchStatus').textContent='Trang chủ CarTube · chọn danh mục hoặc tìm kiếm YouTube.';
    renderVideos(STARTER_VIDEOS);
  }
});


async function searchYouTube(q){
 const ep=window.APTV_CONFIG?.youtubeSearchApiUrl;$('#searchStatus').classList.remove('hidden');$('#searchStatus').textContent='Đang tìm “'+q+'”...';
 if(!ep){$('#searchStatus').innerHTML='Chưa bật tìm kiếm toàn YouTube. <a class="inline-yt" href="https://www.youtube.com/results?search_query='+encodeURIComponent(q)+'" target="_blank" rel="noopener">Mở tìm kiếm trên YouTube ↗</a>';const cat=q.includes('Thiếu nhi')?'Thiếu nhi':q.includes('Tin tức')?'Tin tức':q.includes('Thể thao')?'Thể thao':q.includes('Nhạc')?'Nhạc':q.includes('Du lịch')?'Du lịch':null;const matched=cat?STARTER_VIDEOS.filter(v=>v.category===cat):STARTER_VIDEOS;renderVideos(matched.length?matched:STARTER_VIDEOS);return}
 try{const u=new URL(ep);u.searchParams.set('q',q);const r=await fetch(u,{cache:'no-store'}),d=await r.json();if(!r.ok)throw 0;renderVideos(d.items||[]);$('#searchStatus').textContent=(d.items||[]).length+' kết quả cho “'+q+'”'}catch(e){$('#searchStatus').textContent='Không lấy được kết quả YouTube.'}
}
function renderVideos(items){const root=$('#ytResults');root.classList.remove('hidden');root.innerHTML='';items.forEach(v=>{const b=document.createElement('button');b.className='video-card focusable';b.innerHTML='<img src="'+esc(v.thumbnail||('https://i.ytimg.com/vi/'+v.id+'/mqdefault.jpg'))+'"><b>'+esc(v.title||'Video')+'</b><small>'+esc(v.channel||'YouTube')+'</small>';b.onclick=()=>playYouTube(v);root.appendChild(b)})}
function getHistory(){try{return JSON.parse(localStorage.getItem('aptvHistory')||'[]')}catch{return[]}}
function saveHistory(v){let h=getHistory();h=[v,...h.filter(x=>x.id!==v.id)].slice(0,20);localStorage.setItem('aptvHistory',JSON.stringify(h));renderPlaylist()}
function renderPlaylist(){const root=$('#playlist'),h=getHistory();root.innerHTML=h.length?'':'<div class="status">Video gần đây sẽ hiện ở đây.</div>';h.forEach(v=>{const b=document.createElement('button');b.className='playlist-item focusable';b.innerHTML='<img src="'+esc(v.thumbnail||('https://i.ytimg.com/vi/'+v.id+'/mqdefault.jpg'))+'"><span><b>'+esc(v.title||'Video')+'</b><small>'+esc(v.channel||'YouTube')+'</small></span>';b.onclick=()=>playYouTube(v);root.appendChild(b)})}
$('#clearHistory').onclick=()=>{localStorage.removeItem('aptvHistory');renderPlaylist()};
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

async function loadChannels(){try{channels=await(await fetch('channels.json?ts='+Date.now(),{cache:'no-store'})).json()}catch{channels=[]}const root=$('#channelList');root.innerHTML='';channels.forEach(ch=>{const b=document.createElement('button');b.className='channel-btn focusable';b.innerHTML='<b>'+esc(ch.name)+'</b><span>'+esc(ch.group||'Kênh')+'</span>';b.onclick=()=>playChannel(ch);root.appendChild(b)})}
function playChannel(ch){const v=$('#tvPlayer');if(hls){hls.destroy();hls=null}if(v.canPlayType('application/vnd.apple.mpegurl')){v.src=ch.url;v.play().catch(()=>{})}else if(window.Hls&&Hls.isSupported()){hls=new Hls();hls.loadSource(ch.url);hls.attachMedia(v);hls.on(Hls.Events.MANIFEST_PARSED,()=>v.play().catch(()=>{}))}}

function setLimit(n,src='Nguồn bản đồ'){n=Number(n);speedLimit=Number.isFinite(n)&&n>0?n:null;$('#speedLimitValue').textContent=speedLimit??'--';$('#speedLimitSource').textContent=src;$('#limitStateText').textContent=speedLimit?'Giới hạn '+speedLimit+' km/h':'';overspeed()}
function overspeed(){const r=$('#speedRing'),b=$('#overspeedBanner');r.classList.remove('speed-near','speed-over');b.classList.add('hidden');if(!speedLimit)return;const d=currentSpeed-speedLimit;if(d>OVERSPEED_MARGIN){r.classList.add('speed-over');$('#overspeedAmount').textContent=Math.round(d);b.classList.remove('hidden');tone()}else if(currentSpeed>=speedLimit-5)r.classList.add('speed-near')}
function tone(){if(Date.now()-lastAlertAt<5000)return;lastAlertAt=Date.now();try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=880;g.gain.value=.1;o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.3)}catch{}}
function dist(a,b,c,d){const R=6371000,t=x=>x*Math.PI/180,x=t(c-a),y=t(d-b),z=Math.sin(x/2)**2+Math.cos(t(a))*Math.cos(t(c))*Math.sin(y/2)**2;return 2*R*Math.atan2(Math.sqrt(z),Math.sqrt(1-z))}
async function roadLimit(lat,lon){if(!onlineSpeedLimitEnabled)return;const ep=window.APTV_CONFIG?.speedLimitApiUrl;if(!ep){$('#speedLimitSource').textContent='Chưa cấu hình HERE API';return}const now=Date.now(),p={lat,lon};if(!lastRoadPoint){lastRoadPoint=p;return}if(now-lastSpeedLimitFetch<8000||dist(lastRoadPoint.lat,lastRoadPoint.lon,lat,lon)<15)return;lastSpeedLimitFetch=now;try{const u=new URL(ep);u.searchParams.set('lat',lat);u.searchParams.set('lon',lon);u.searchParams.set('prevLat',lastRoadPoint.lat);u.searchParams.set('prevLon',lastRoadPoint.lon);const d=await(await fetch(u)).json();setLimit(d.speedLimit,d.speedLimit?'HERE':'HERE · chưa xác định')}catch{$('#speedLimitSource').textContent='Lỗi API HERE'}finally{lastRoadPoint=p}}
async function weather(lat,lon){try{const u='https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon+'&current=temperature_2m,weather_code&timezone=auto',d=await(await fetch(u)).json(),c=d.current||{};$('#temperature').textContent=Math.round(c.temperature_2m??0)+'°C';const code=c.weather_code;$('#weatherIcon').textContent=code===0?'☀️':code<4?'🌤️':code<50?'☁️':code<70?'🌧️':'⛈️';$('#weatherText').textContent='Thời tiết theo vị trí GPS'}catch{}}
function startGPS(){if(!navigator.geolocation){$('#gpsText').textContent='Không hỗ trợ GPS';return}$('#gpsText').textContent='Đang xác định...';watchId=navigator.geolocation.watchPosition(p=>{const {latitude,longitude,accuracy,speed}=p.coords;currentSpeed=Math.max(0,Math.round((speed||0)*3.6));$('#speedValue').textContent=currentSpeed;$('#gpsText').textContent='GPS đang bật';$('#gpsState').style.color='#55ff88';$('#accuracyText').textContent='±'+Math.round(accuracy||0)+' m';overspeed();roadLimit(latitude,longitude);weather(latitude,longitude)},()=>$('#gpsText').textContent='Không có tín hiệu',{enableHighAccuracy:true,maximumAge:3000,timeout:10000})}
$('#gpsButton').onclick=()=>{if(watchId!==null){navigator.geolocation.clearWatch(watchId);watchId=null;currentSpeed=0;$('#speedValue').textContent='0';$('#gpsText').textContent='GPS đã tắt';$('#gpsButton').textContent='Bật GPS'}else{startGPS();$('#gpsButton').textContent='Tắt GPS'}};
$('#speedLimitOnlineButton').onclick=()=>{onlineSpeedLimitEnabled=!onlineSpeedLimitEnabled;$('#speedLimitOnlineButton').textContent=onlineSpeedLimitEnabled?'Tắt giới hạn':'Giới hạn online';if(!onlineSpeedLimitEnabled){lastRoadPoint=null;setLimit(null,'Đã tắt dữ liệu trực tuyến')}};
$('#limitSign').onclick=()=>{const x=prompt('Nhập giới hạn tốc độ thử nghiệm:');if(x!==null)setLimit(x,'Thử nghiệm thủ công')};

document.addEventListener('keydown',e=>{if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;const cur=document.activeElement;if(!cur?.classList.contains('focusable'))return;e.preventDefault();const all=$$('.focusable').filter(x=>x.offsetParent!==null),r=cur.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let best=null,score=1e9;for(const el of all){if(el===cur)continue;const q=el.getBoundingClientRect(),dx=q.left+q.width/2-cx,dy=q.top+q.height/2-cy,ok=(e.key==='ArrowRight'&&dx>8)||(e.key==='ArrowLeft'&&dx<-8)||(e.key==='ArrowDown'&&dy>8)||(e.key==='ArrowUp'&&dy<-8);if(!ok)continue;const p=/Left|Right/.test(e.key)?Math.abs(dx):Math.abs(dy),s=/Left|Right/.test(e.key)?Math.abs(dy):Math.abs(dx),v=p+s*2;if(v<score){score=v;best=el}}best?.focus()});
loadChannels();renderPlaylist();mode('youtube');renderVideos(STARTER_VIDEOS);$('#searchStatus').textContent='Chọn video để xem trực tiếp · hoặc dán link YouTube vào ô tìm kiếm.';
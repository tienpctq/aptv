const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let channels=[],hls=null,watchId=null,currentSpeed=0,speedLimit=null,onlineSpeedLimitEnabled=false,lastRoadPoint=null,lastSpeedLimitFetch=0,lastAlertAt=0,audioCtx=null;
const OVERSPEED_MARGIN=3, pages=['dashboard','cartube','player','tv','gps','history'];

function showPage(name){
 pages.forEach(p=>$('#'+p+'Page')?.classList.toggle('hidden',p!==name));
 $$('.rail-btn').forEach(b=>b.classList.toggle('active',b.dataset.page===name));
 $('#pageTitle').textContent=({dashboard:'Giải trí',cartube:'CarTube',player:'Đang phát',tv:'TV / IPTV',gps:'GPS Drive',history:'Đã xem'})[name]||'APTV Car';
 setTimeout(()=>document.querySelector('#'+name+'Page .focusable')?.focus(),20);
}
$$('[data-page]').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
$$('[data-query]').forEach(b=>b.onclick=()=>{showPage('cartube');$('#ytSearch').value=b.dataset.query;searchYouTube(b.dataset.query);});
$('#fitButton').onclick=()=>document.fullscreenElement?document.exitFullscreen?.():document.documentElement.requestFullscreen?.();
$('#gpsQuick').onclick=()=>showPage('gps');

function parseYouTubeId(v=''){const m=v.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{6,})/);if(m)return m[1];return /^[A-Za-z0-9_-]{6,}$/.test(v.trim())?v.trim():null}
function playYouTube(id,title='YouTube'){
 if(!id)return; $('#youtubeFrame').src='https://www.youtube.com/embed/'+id+'?rel=0&autoplay=1';$('#nowPlaying').textContent=title;saveHistory({id,title,channel:'YouTube'});showPage('player');
}
$('#backToResults').onclick=()=>showPage('cartube');
$('#pastePlay').onclick=()=>{const q=prompt('Dán link YouTube hoặc ID video:');if(!q)return;const id=parseYouTubeId(q);if(id)playYouTube(id);else alert('Link/ID không hợp lệ.');};
$('#ytSearchBtn').onclick=()=>handleSearch();
$('#ytSearch').addEventListener('keydown',e=>{if(e.key==='Enter')handleSearch()});
function handleSearch(){const q=$('#ytSearch').value.trim();if(!q)return;const id=parseYouTubeId(q);if(id)return playYouTube(id);searchYouTube(q)}

async function searchYouTube(q){
 const endpoint=window.APTV_CONFIG?.youtubeSearchApiUrl;
 $('#searchStatus').textContent='Đang tìm “'+q+'”...';$('#manualYoutube').classList.add('hidden');
 if(!endpoint){$('#searchStatus').textContent='Chưa cấu hình YouTube Search API. Anh vẫn có thể dán link video để phát.';$('#manualYoutube').classList.remove('hidden');return}
 try{const u=new URL(endpoint);u.searchParams.set('q',q);const r=await fetch(u,{cache:'no-store'}),d=await r.json();if(!r.ok)throw 0;renderVideos(d.items||[]);$('#searchStatus').textContent=(d.items||[]).length+' kết quả cho “'+q+'”';}
 catch(e){$('#searchStatus').textContent='Không lấy được kết quả YouTube.';$('#manualYoutube').classList.remove('hidden')}
}
function renderVideos(items,root=$('#ytResults')){
 root.innerHTML='';items.forEach(v=>{const b=document.createElement('button');b.className='video-card focusable';b.innerHTML='<img src="'+escapeHtml(v.thumbnail||'')+'" alt=""><b>'+escapeHtml(v.title||'Video')+'</b><small>'+escapeHtml(v.channel||'')+'</small>';b.onclick=()=>playYouTube(v.id,v.title);root.appendChild(b)});
}
function saveHistory(v){let h=JSON.parse(localStorage.getItem('aptvHistory')||'[]');h=[v,...h.filter(x=>x.id!==v.id)].slice(0,30);localStorage.setItem('aptvHistory',JSON.stringify(h));renderHistory()}
function renderHistory(){const h=JSON.parse(localStorage.getItem('aptvHistory')||'[]');$('#emptyHistory').classList.toggle('hidden',h.length>0);renderVideos(h,$('#historyResults'))}
function escapeHtml(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

async function loadChannels(){try{channels=await (await fetch('channels.json?ts='+Date.now(),{cache:'no-store'})).json()}catch(e){channels=[]}const root=$('#channelList');root.innerHTML='';channels.forEach(ch=>{const b=document.createElement('button');b.className='channel-btn focusable';b.innerHTML='<b>'+escapeHtml(ch.name)+'</b><span>'+escapeHtml(ch.group||'Kênh')+'</span>';b.onclick=()=>playChannel(ch);root.appendChild(b)})}
function playChannel(ch){const v=$('#tvPlayer');if(hls){hls.destroy();hls=null}if(v.canPlayType('application/vnd.apple.mpegurl')){v.src=ch.url;v.play().catch(()=>{})}else if(window.Hls&&Hls.isSupported()){hls=new Hls();hls.loadSource(ch.url);hls.attachMedia(v);hls.on(Hls.Events.MANIFEST_PARSED,()=>v.play().catch(()=>{}))}}

function setRoadSpeedLimit(limit,source='Nguồn bản đồ'){const n=Number(limit);speedLimit=Number.isFinite(n)&&n>0?n:null;$('#speedLimitValue').textContent=speedLimit??'--';$('#speedLimitText').textContent=speedLimit?speedLimit+' km/h':'Chưa có giới hạn';$('#speedLimitSource').textContent=source;$('#limitStateText').textContent=speedLimit?'Giới hạn '+speedLimit+' km/h':'Chưa xác định';updateOverspeed()}
function updateOverspeed(){const r=$('#speedRing'),b=$('#overspeedBanner');r.classList.remove('speed-near','speed-over');b.classList.add('hidden');if(!speedLimit)return;const d=currentSpeed-speedLimit;if(d>OVERSPEED_MARGIN){r.classList.add('speed-over');$('#overspeedAmount').textContent=Math.round(d);b.classList.remove('hidden');alertTone()}else if(currentSpeed>=speedLimit-5)r.classList.add('speed-near')}
function alertTone(){if(Date.now()-lastAlertAt<5000)return;lastAlertAt=Date.now();try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=880;g.gain.value=.12;o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.35)}catch(e){}}
function distanceMeters(a,b,c,d){const R=6371000,t=x=>x*Math.PI/180,x=t(c-a),y=t(d-b),z=Math.sin(x/2)**2+Math.cos(t(a))*Math.cos(t(c))*Math.sin(y/2)**2;return 2*R*Math.atan2(Math.sqrt(z),Math.sqrt(1-z))}
async function fetchRoadSpeedLimit(lat,lon){if(!onlineSpeedLimitEnabled)return;const ep=window.APTV_CONFIG?.speedLimitApiUrl;if(!ep){$('#speedLimitSource').textContent='Chưa cấu hình API HERE';return}const now=Date.now(),p={lat,lon};if(!lastRoadPoint){lastRoadPoint=p;return}if(now-lastSpeedLimitFetch<8000||distanceMeters(lastRoadPoint.lat,lastRoadPoint.lon,lat,lon)<15)return;lastSpeedLimitFetch=now;try{const u=new URL(ep);u.searchParams.set('lat',lat);u.searchParams.set('lon',lon);u.searchParams.set('prevLat',lastRoadPoint.lat);u.searchParams.set('prevLon',lastRoadPoint.lon);const r=await fetch(u),d=await r.json();setRoadSpeedLimit(d.speedLimit,d.speedLimit?'HERE':'HERE · chưa xác định')}catch(e){$('#speedLimitSource').textContent='Lỗi API HERE'}finally{lastRoadPoint=p}}
function startGPS(){if(!navigator.geolocation){$('#gpsText').textContent='Không hỗ trợ';return}$('#gpsText').textContent='Đang xác định...';watchId=navigator.geolocation.watchPosition(p=>{const {latitude,longitude,accuracy,speed}=p.coords;currentSpeed=Math.max(0,Math.round((speed||0)*3.6));$('#speedValue').textContent=currentSpeed;$('#gpsText').textContent='Đã bật';$('#accuracyText').textContent=Math.round(accuracy||0)+' m';updateOverspeed();fetchRoadSpeedLimit(latitude,longitude)},()=>$('#gpsText').textContent='Không có tín hiệu',{enableHighAccuracy:true,maximumAge:3000,timeout:10000})}
$('#gpsButton').onclick=()=>{if(watchId!==null){navigator.geolocation.clearWatch(watchId);watchId=null;currentSpeed=0;$('#speedValue').textContent='0';$('#gpsText').textContent='Đã tắt';$('#gpsButton').textContent='Bật GPS'}else{startGPS();$('#gpsButton').textContent='Tắt GPS'}};
$('#speedLimitOnlineButton').onclick=()=>{onlineSpeedLimitEnabled=!onlineSpeedLimitEnabled;$('#speedLimitOnlineButton').textContent=onlineSpeedLimitEnabled?'Tắt giới hạn tốc độ trực tuyến':'Bật giới hạn tốc độ trực tuyến';if(!onlineSpeedLimitEnabled){lastRoadPoint=null;setRoadSpeedLimit(null,'Đã tắt dữ liệu trực tuyến')}};
$('#limitSign').onclick=()=>{const x=prompt('Nhập giới hạn tốc độ thử nghiệm:');if(x!==null)setRoadSpeedLimit(x,'Thử nghiệm thủ công')};

document.addEventListener('keydown',e=>{if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;const cur=document.activeElement;if(!cur?.classList.contains('focusable'))return;e.preventDefault();const all=$$('.focusable').filter(x=>x.offsetParent!==null),r=cur.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let best=null,score=Infinity;for(const el of all){if(el===cur)continue;const q=el.getBoundingClientRect(),dx=q.left+q.width/2-cx,dy=q.top+q.height/2-cy,ok=(e.key==='ArrowRight'&&dx>8)||(e.key==='ArrowLeft'&&dx<-8)||(e.key==='ArrowDown'&&dy>8)||(e.key==='ArrowUp'&&dy<-8);if(!ok)continue;const p=(e.key==='ArrowLeft'||e.key==='ArrowRight')?Math.abs(dx):Math.abs(dy),s=(e.key==='ArrowLeft'||e.key==='ArrowRight')?Math.abs(dy):Math.abs(dx),v=p+s*2;if(v<score){score=v;best=el}}best?.focus()});
loadChannels();renderHistory();showPage('dashboard');
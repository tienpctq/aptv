(function(){
function q(s){return document.querySelector(s)}
var btn=q('#gpsButton'),ring=q('#speedRing'),value=q('#speedValue'),state=q('#gpsState'),txt=q('#gpsText'),acc=q('#accuracyText'),sign=q('#limitSign'),limitEl=q('#speedLimitValue'),banner=q('#overspeedBanner'),amount=q('#overspeedAmount'),limitState=q('#limitStateText');
if(!btn||!ring||!value)return;
var watchId=null,target=0,shown=0,last=null,lastT=0,limit=parseInt(localStorage.getItem('aptvSpeedLimit')||'60',10)||60;
function setLimit(n){limit=Math.max(10,Math.min(130,n||60));localStorage.setItem('aptvSpeedLimit',limit);if(limitEl)limitEl.textContent=limit;updateAlert()}
setLimit(limit);
if(sign){sign.title='Chạm để đổi giới hạn tốc độ';sign.onclick=function(){var n=parseInt(prompt('Giới hạn tốc độ (km/h)',limit),10);if(n)setLimit(n)}}
function dist(a,b){var R=6371000,p=Math.PI/180,d1=(b.lat-a.lat)*p,d2=(b.lon-a.lon)*p,x=Math.sin(d1/2),y=Math.sin(d2/2),z=x*x+Math.cos(a.lat*p)*Math.cos(b.lat*p)*y*y;return 2*R*Math.atan2(Math.sqrt(z),Math.sqrt(1-z))}
function updateAlert(){var near=shown>=Math.max(0,limit-5),over=shown>=limit;ring.className='speed-ring speedometer'+(over?' speed-over':near?' speed-near':'');if(sign)sign.className='limit-sign'+(over?' limit-over':near?' limit-near':'');if(banner)banner.className=over?'overspeed':'overspeed hidden';if(amount)amount.textContent=Math.max(0,Math.round(shown-limit));if(limitState)limitState.textContent=over?'Vượt giới hạn':near?'Sắp tới giới hạn':'Trong giới hạn'}
function animate(){shown+=(target-shown)*0.16;if(Math.abs(target-shown)<.15)shown=target;var km=Math.max(0,Math.min(200,shown));value.textContent=Math.round(km);ring.style.setProperty('--needle-angle',(-130+(km/200)*260)+'deg');updateAlert();requestAnimationFrame(animate)}
function got(p){var c=p.coords,now=p.timestamp||Date.now(),km=null;if(typeof c.speed==='number'&&c.speed>=0)km=c.speed*3.6;if(km===null&&last&&now>lastT){var dt=(now-lastT)/1000;if(dt>.5&&dt<15)km=(dist(last,{lat:c.latitude,lon:c.longitude})/dt)*3.6}last={lat:c.latitude,lon:c.longitude};lastT=now;if(km!==null&&isFinite(km)){if(km<2)km=0;target=Math.min(200,Math.max(0,km))}if(state){state.textContent='●';state.className='gps-on'}if(txt)txt.textContent='GPS đang hoạt động';if(acc)acc.textContent='±'+Math.round(c.accuracy||0)+' m';btn.textContent='Tắt GPS'}
function fail(e){if(state)state.className='gps-error';if(txt)txt.textContent=e&&e.code===1?'Chưa cấp quyền vị trí':'Không lấy được GPS';btn.textContent='Bật GPS'}
function start(){if(!navigator.geolocation){if(txt)txt.textContent='Thiết bị không hỗ trợ GPS';return}if(watchId!==null){navigator.geolocation.clearWatch(watchId);watchId=null;target=0;btn.textContent='Bật GPS';if(txt)txt.textContent='GPS đã tắt';return}if(txt)txt.textContent='Đang bắt GPS...';watchId=navigator.geolocation.watchPosition(got,fail,{enableHighAccuracy:true,maximumAge:1000,timeout:12000})}
btn.onclick=start;animate();
})();
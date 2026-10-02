(function(){
function el(id){return document.getElementById(id)}
var wid=null,lat=null,lon=null;
function txt(id,v){var x=el(id);if(x)x.textContent=v}
function getWeather(a,b){
 txt('weatherText','Đang cập nhật...');
 var x=new XMLHttpRequest();
 x.open('GET','https://api.open-meteo.com/v1/forecast?latitude='+encodeURIComponent(a)+'&longitude='+encodeURIComponent(b)+'&current=temperature_2m,weather_code&timezone=auto',true);
 x.onreadystatechange=function(){
  if(x.readyState!==4)return;
  if(x.status<200||x.status>=300){txt('weatherText','Không cập nhật được');return}
  try{var d=JSON.parse(x.responseText),c=d.current||{},k=Number(c.weather_code),t=Math.round(Number(c.temperature_2m)||0);
   txt('temperature',t+'°C');txt('weatherIcon',k===0?'☀️':k<4?'🌤️':k<50?'☁️':k<70?'🌧️':'⛈️');txt('weatherText','Theo vị trí GPS');
  }catch(e){txt('weatherText','Lỗi dữ liệu thời tiết')}
 };
 x.send();
}
function onPos(p){
 lat=p.coords.latitude;lon=p.coords.longitude;
 txt('speedValue',Math.max(0,Math.round((p.coords.speed||0)*3.6)));
 txt('gpsText','GPS đang bật');txt('accuracyText','±'+Math.round(p.coords.accuracy||0)+' m');
 var s=el('gpsState');if(s)s.style.color='#55ff88';
 getWeather(lat,lon);
}
function onErr(e){txt('gpsText',e&&e.code===1?'Cần cấp quyền vị trí':'Không có tín hiệu GPS')}
function start(){
 if(!navigator.geolocation){txt('gpsText','Không hỗ trợ GPS');return}
 txt('gpsText','Đang xác định vị trí...');
 wid=navigator.geolocation.watchPosition(onPos,onErr,{enableHighAccuracy:true,maximumAge:5000,timeout:12000});
 var b=el('gpsButton');if(b)b.textContent='Tắt GPS';
}
function stop(){
 if(wid!==null&&navigator.geolocation)navigator.geolocation.clearWatch(wid);wid=null;
 txt('speedValue','0');txt('gpsText','GPS đã tắt');txt('accuracyText','--');
 var b=el('gpsButton');if(b)b.textContent='Bật GPS';
}
var b=el('gpsButton');if(b)b.onclick=function(){wid===null?start():stop()};
var r=el('weatherRefresh');if(r)r.onclick=function(){
 if(lat!==null){getWeather(lat,lon);return}
 if(navigator.geolocation)navigator.geolocation.getCurrentPosition(function(p){lat=p.coords.latitude;lon=p.coords.longitude;getWeather(lat,lon)},onErr,{enableHighAccuracy:true,timeout:10000});
};
function clock(){txt('clock',new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}))}
clock();setInterval(clock,30000);
})();
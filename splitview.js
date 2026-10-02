(function(){
function el(id){return document.getElementById(id)}
var wid=null,lat=null,lon=null,lastGeo=0,lastLimit=0;
function txt(id,v){var x=el(id);if(x)x.textContent=v}
function getPlace(a,b){
 var n=new XMLHttpRequest();n.open('GET','https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat='+encodeURIComponent(a)+'&lon='+encodeURIComponent(b)+'&accept-language=vi&zoom=14',true);
 n.onreadystatechange=function(){if(n.readyState!==4)return;if(n.status>=200&&n.status<300)try{var d=JSON.parse(n.responseText),z=d.address||{},parts=[],v=z.suburb||z.quarter||z.village||z.town||z.city_district||z.city;if(v)parts.push(v);var p=z.city||z.town||z.county;if(p&&parts.indexOf(p)<0)parts.push(p);var pr=z.state;if(pr)parts.push(pr);txt('weatherPlace',parts.join(', ')||d.display_name||'Vị trí GPS')}catch(e){}};
 n.send();
}
function getLimit(a,b){
 var api=window.APTV_CONFIG&&window.APTV_CONFIG.speedLimitApiUrl;
 if(!api){txt('speedLimitValue','--');txt('speedLimitSource','Chưa cấu hình nguồn giới hạn tốc độ');return}
 var sep=api.indexOf('?')>=0?'&':'?',x=new XMLHttpRequest();x.open('GET',api+sep+'lat='+encodeURIComponent(a)+'&lon='+encodeURIComponent(b),true);
 x.onreadystatechange=function(){if(x.readyState!==4)return;if(x.status>=200&&x.status<300)try{var d=JSON.parse(x.responseText),v=d.speedLimit||d.limit||d.speed_limit;if(v){txt('speedLimitValue',Math.round(Number(v)));txt('speedLimitSource',d.source||'Giới hạn online')}else{txt('speedLimitValue','--');txt('speedLimitSource','Không có dữ liệu đường')}}catch(e){txt('speedLimitSource','Lỗi dữ liệu giới hạn')}else txt('speedLimitSource','Không lấy được giới hạn')};x.send();
}
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
 getWeather(lat,lon);var now=Date.now();if(now-lastGeo>60000){lastGeo=now;getPlace(lat,lon)}if(now-lastLimit>15000){lastLimit=now;getLimit(lat,lon)}
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
var lb=el('speedLimitOnlineButton');if(lb)lb.onclick=function(){if(lat!==null){lastLimit=0;getLimit(lat,lon)}else txt('speedLimitSource','Bật GPS trước')};
var r=el('weatherRefresh');if(r)r.onclick=function(){
 if(lat!==null){getWeather(lat,lon);return}
 if(navigator.geolocation)navigator.geolocation.getCurrentPosition(function(p){lat=p.coords.latitude;lon=p.coords.longitude;getWeather(lat,lon)},onErr,{enableHighAccuracy:true,timeout:10000});
};
function clock(){txt('clock',new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}))}
clock();setInterval(clock,30000);
})();
(function(){
function q(s){return document.querySelector(s)} function qa(s){return document.querySelectorAll(s)}
function esc(s){return String(s||'').replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]})}
var api=(window.APTV_CONFIG&&window.APTV_CONFIG.youtubeSearchApiUrl)||'https://aptv-two.vercel.app/api/youtube-search';
var status=q('#searchStatus'), results=q('#ytResults'), input=q('#ytSearch'), currentVideo=null, ytPlayer=null, ytReady=false, retryTimer=null, browseScroll=0, lastItems=[], localSearchCache={};
function savedVideos(){try{return JSON.parse(localStorage.getItem('aptvSaved')||'[]')}catch(e){return[]}}
function isSaved(id){var a=savedVideos();for(var i=0;i<a.length;i++)if(a[i].id===id)return true;return false}
function toggleSaved(v){var a=savedVideos(),next=[],found=false;for(var i=0;i<a.length;i++){if(a[i].id===v.id)found=true;else next.push(a[i])}if(!found)next.unshift(v);localStorage.setItem('aptvSaved',JSON.stringify(next.slice(0,60)));updateSaveButton();return !found}
function updateSaveButton(){var b=q('#saveCurrentVideo');if(b&&currentVideo)b.textContent=isSaved(currentVideo.id)?'★ Đã lưu':'☆ Lưu'}
function saveRecent(v){try{var hist=JSON.parse(localStorage.getItem('aptvRecent')||'[]');hist=hist.filter(function(x){return x.id!==v.id});hist.unshift(v);localStorage.setItem('aptvRecent',JSON.stringify(hist.slice(0,30)));localStorage.setItem('aptvNowPlaying',JSON.stringify(v))}catch(e){}updateMini()}
function resetModalPlayerContainer(){
  var old=document.getElementById('modalPlayer');
  if(old){
    var fresh=document.createElement('div');
    fresh.id='modalPlayer';
    if(old.parentNode)old.parentNode.replaceChild(fresh,old);
    return fresh;
  }
  var host=document.querySelector('.modal-player');
  if(host){var d=document.createElement('div');d.id='modalPlayer';host.appendChild(d);return d}
  return null;
}
function hardStopPlayback(){
  try{if(ytPlayer&&ytPlayer.stopVideo)ytPlayer.stopVideo()}catch(e){}
  try{if(ytPlayer&&ytPlayer.destroy)ytPlayer.destroy()}catch(e){}
  ytPlayer=null;ytReady=false;
  var old=document.getElementById('youtubeFrame');
  if(old&&old.parentNode){
    try{old.src='about:blank'}catch(e){}
    var fresh=old.cloneNode(false);
    fresh.removeAttribute('src');
    fresh.style.display='none';
    old.parentNode.replaceChild(fresh,old);
  }
  resetModalPlayerContainer();
  var vm=q('#videoModal');if(vm){vm.classList.add('hidden');vm.classList.remove('velora-open')}
}
function loadInlineVideo(v){
  hardStopPlayback();
  var f=q('#youtubeFrame');if(!f)return;
  f.src='https://www.youtube.com/embed/'+encodeURIComponent(v.id)+'?autoplay=1&playsinline=1&rel=0&enablejsapi=1&origin='+encodeURIComponent(location.origin)+'&cb='+Date.now();
  f.style.display='block';
}
function updateMini(){var bar=q('#miniMediaBar'),title=q('#miniMediaTitle');if(!bar||!title)return;try{var v=JSON.parse(localStorage.getItem('aptvNowPlaying')||'null');if(v&&v.id){title.textContent=v.title||'Video YouTube';bar.className='mini-media'}else bar.className='mini-media hidden'}catch(e){bar.className='mini-media hidden'}}
function render(items){lastItems=items||[];results.innerHTML='';for(var i=0;i<items.length;i++){(function(v){var wrap=document.createElement('div');wrap.className='video-card-wrap';var b=document.createElement('button');b.className='video-card focusable';var thumb=v.thumbnail||('https://aptv-two.vercel.app/api/youtube-thumb?id='+encodeURIComponent(v.id||''));b.innerHTML='<img src="'+esc(thumb)+'"><b>'+esc(v.title||'Video')+'</b><small>'+esc(v.channel||'YouTube')+'</small>';b.onclick=function(){play(v)};var f=document.createElement('button');f.className='video-save focusable';f.textContent=isSaved(v.id)?'★':'☆';f.title='Lưu video';f.onclick=function(e){e.stopPropagation();toggleSaved(v);f.textContent=isSaved(v.id)?'★':'☆'};wrap.appendChild(b);wrap.appendChild(f);results.appendChild(wrap)})(items[i])}}
function search(term){if(!term)return;var ck=String(term).toLowerCase();if(localSearchCache[ck]){render(localSearchCache[ck]);status.textContent=localSearchCache[ck].length+' kết quả cho “'+term+'” · cache';return}status.textContent='Đang tìm “'+term+'”...';var x=new XMLHttpRequest();x.open('GET',api+'?q='+encodeURIComponent(term),true);x.onreadystatechange=function(){if(x.readyState!==4)return;if(x.status>=200&&x.status<300){try{var d=JSON.parse(x.responseText),items=d.items||[];localSearchCache[ck]=items;render(items);status.textContent=items.length+' kết quả cho “'+term+'”'+(d.cached?' · cache':'')}catch(e){status.textContent='Lỗi đọc kết quả YouTube.'}}else{try{var er=JSON.parse(x.responseText||'{}');if(er.error==='quota_exceeded')status.textContent='YouTube API đã hết hạn mức hôm nay.';else if(er.error==='api_key_invalid'||er.error==='api_key_missing')status.textContent='YouTube API key đang có lỗi cấu hình.';else status.textContent='Không lấy được kết quả từ YouTube ('+x.status+').' }catch(e){status.textContent='Không lấy được kết quả từ YouTube ('+x.status+').'}}};x.send()}
function makePlayer(v,autoPlay){
  currentVideo=v;
  try{if(ytPlayer&&ytPlayer.stopVideo)ytPlayer.stopVideo()}catch(e){}
  try{if(ytPlayer&&ytPlayer.destroy)ytPlayer.destroy()}catch(e){}
  ytPlayer=null;ytReady=false;
  var box=resetModalPlayerContainer();if(!box)return;
  if(window.YT&&window.YT.Player){
    ytPlayer=new YT.Player('modalPlayer',{
      width:'100%',height:'100%',videoId:v.id,
      playerVars:{playsinline:1,rel:0,autoplay:autoPlay?1:0},
      events:{
        onReady:function(e){ytReady=true;if(autoPlay){try{e.target.loadVideoById(v.id);e.target.playVideo()}catch(x){}}},
        onError:function(){var h=q('#modalHelp');if(h)h.textContent='Video không phát được trong trình nhúng. Có thể mở YouTube gốc.'}
      }
    });
  }else{
    box.innerHTML='<iframe style="width:100%;height:100%;border:0" src="https://www.youtube.com/embed/'+encodeURIComponent(v.id)+'?autoplay='+(autoPlay?'1':'0')+'&playsinline=1&rel=0&cb='+Date.now()+'" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
  }
}
function play(v){currentVideo=v;updateSaveButton();if(document.body.className.indexOf('youtube-split')>=0){saveRecent(v);browseScroll=results?results.scrollTop:0;updateSaveButton();var f=q('#youtubeFrame'),ph=q('#playerPlaceholder'),wrap=q('#playerWrap'),orig=q('#inlineOriginal');document.body.className=document.body.className.replace(/\s*player-mode/g,'')+' player-mode';if(f){loadInlineVideo(v);f=q('#youtubeFrame')}if(ph)ph.style.display='none';if(wrap)wrap.className=wrap.className.replace(/\s*playing/g,'')+' playing';if(orig)orig.href='https://www.youtube.com/watch?v='+v.id;var nt=q('#nowTitle'),nc=q('#nowChannel'),np=q('#nowPlaying');if(nt)nt.textContent=v.title||'Video YouTube';if(nc)nc.textContent=v.channel||'YouTube';if(np)np.className='now-playing';var ic=q('#inlineControls'),cv=q('#changeVideo');if(ic)ic.className=ic.className.replace(/\s*hidden/g,'');if(cv)cv.className=cv.className.replace(/\s*hidden/g,'');return}hardStopPlayback();var m=q('#videoModal'),title=q('#modalTitle'),ch=q('#modalChannel'),orig=q('#modalOriginal');currentVideo=v;saveRecent(v);updateSaveButton();title.textContent=v.title||'YouTube';ch.textContent=v.channel||'YouTube';orig.href='https://www.youtube.com/watch?v='+v.id;m.classList.remove('hidden');m.classList.add('velora-open');q('#modalHelp').textContent='Đang tải trình phát… Nếu không tự chạy, chạm ▶ Phát hoặc ↻ Thử lại.';makePlayer(v,true)}
window.aptvPlayVideo=play;window.aptvHardStop=hardStopPlayback;window.aptvPlayInline=loadInlineVideo;
var searchBtn=q('#ytSearchBtn');if(searchBtn)searchBtn.onclick=function(){search(input.value.replace(/^\s+|\s+$/g,''))};if(input)input.onkeydown=function(e){e=e||window.event;if((e.keyCode||e.which)===13)search(input.value.replace(/^\s+|\s+$/g,''))};
var cats=qa('[data-yt-query]');for(var i=0;i<cats.length;i++)cats[i].onclick=function(){input.value=this.getAttribute('data-yt-query');search(input.value)};
var chips=qa('[data-query]');for(var j=0;j<chips.length;j++)chips[j].onclick=function(){input.value=this.getAttribute('data-query');search(input.value)};
var el_swapBtn=q('#swapBtn');if(el_swapBtn)el_swapBtn.onclick=function(){var w=q('.workspace');if(w.className.indexOf('swapped-layout')>=0)w.className=w.className.replace(/\s*swapped-layout/g,'');else w.className+=' swapped-layout'};
var el_modalClose=q('#modalClose');if(el_modalClose)el_modalClose.onclick=function(){hardStopPlayback();currentVideo=null};var el_videoModal=q('#videoModal');if(el_videoModal)el_videoModal.onclick=function(e){if(e.target===q('#videoModal'))q('#modalClose').click()};
var el_modalPlay=q('#modalPlay');if(el_modalPlay)el_modalPlay.onclick=function(){if(!currentVideo)return;if(ytPlayer&&ytReady&&ytPlayer.playVideo){try{ytPlayer.playVideo();q('#modalHelp').textContent='Đang phát...';return}catch(e){}}makePlayer(currentVideo,true);q('#modalHelp').textContent='Đang yêu cầu phát video...'};
var el_modalRetry=q('#modalRetry');if(el_modalRetry)el_modalRetry.onclick=function(){if(!currentVideo)return;var b=q('#modalRetry');b.disabled=true;b.textContent='↻ Đang tải lại…';q('#modalHelp').textContent='Đang tạo lại trình phát YouTube…';try{if(ytPlayer&&ytPlayer.destroy)ytPlayer.destroy()}catch(e){}ytPlayer=null;ytReady=false;q('#modalPlayer').innerHTML='';clearTimeout(retryTimer);retryTimer=setTimeout(function(){makePlayer(currentVideo,true);b.disabled=false;b.textContent='↻ Thử lại';q('#modalHelp').textContent='Đã tải lại. Nếu WebView chặn tự phát, chạm ▶ Phát.'},250)};
var el_settingsBtn=q('#settingsBtn');if(el_settingsBtn)el_settingsBtn.onclick=function(){q('#settingsModal').classList.remove('hidden')};var el_settingsClose=q('#settingsClose');if(el_settingsClose)el_settingsClose.onclick=function(){q('#settingsModal').classList.add('hidden')};
var el_fitButton=q('#fitButton');if(el_fitButton)el_fitButton.onclick=function(){document.documentElement.style.zoom=document.documentElement.style.zoom==='0.9'?'1':'0.9'};
var el_videoFullscreen=q('#videoFullscreen');if(el_videoFullscreen)el_videoFullscreen.onclick=function(){var p=q('#playerWrap');if(!p)return;var fn=p.requestFullscreen||p.webkitRequestFullscreen||p.msRequestFullscreen;if(fn){try{fn.call(p)}catch(e){}}else{document.body.className=document.body.className.replace(/\s*soft-fullscreen/g,'')+' soft-fullscreen'}};
function fsState(){var on=!!(document.fullscreenElement||document.webkitFullscreenElement||document.msFullscreenElement)||document.body.className.indexOf('soft-fullscreen')>=0;var ex=q('#exitFullscreen'),vf=document.querySelector('#videoFullscreen');if(ex)ex.className=on?'small focusable':'small focusable hidden';if(vf)vf.className=on?'small focusable hidden':'small focusable'}
document.addEventListener('fullscreenchange',fsState);document.addEventListener('webkitfullscreenchange',fsState);
var exf=document.querySelector('#exitFullscreen');if(exf)exf.onclick=function(){var d=document,fn=d.exitFullscreen||d.webkitExitFullscreen||d.msExitFullscreen;if(d.fullscreenElement||d.webkitFullscreenElement||d.msFullscreenElement){if(fn)try{fn.call(d)}catch(e){}}document.body.className=document.body.className.replace(/\s*soft-fullscreen/g,'');fsState();var cv=document.querySelector('#changeVideo');if(cv)cv.click()};

// Vietnamese voice search
(function(){
 var vb=q('#voiceSearchBtn'),inp=q('#ytSearch'),sb=q('#ytSearchBtn'),rec=null,timer=null,heard='';
 if(!vb||!inp)return;
 var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SR){vb.onclick=function(){status.textContent='Thiết bị này chưa hỗ trợ tìm kiếm bằng giọng nói.'};return}
 function clean(t){return (t||'').replace(/\s+/g,' ').replace(/^\s+|\s+$/g,'')}
 function command(t){var x=clean(t),low=x.toLowerCase();var words=['tìm kiếm','tìm đi','tìm','xong','dừng tìm kiếm','dừng'];for(var i=0;i<words.length;i++){var w=words[i],p=low.lastIndexOf(w);if(p>=0&&p+w.length>=low.length-1){return {go:true,text:clean(x.substring(0,p))}}}return {go:false,text:x}}
 function finish(){if(timer){clearTimeout(timer);timer=null}var c=command(heard);var t=clean(c.text||heard);if(t){inp.value=t;status.textContent='Đang tìm: '+t;if(sb)sb.click()}else status.textContent='Không nghe rõ nội dung. Chạm 🎤 để thử lại.';try{if(rec)rec.stop()}catch(e){}}
 function arm(){if(timer)clearTimeout(timer);timer=setTimeout(finish,1300)}
 vb.onclick=function(){try{heard='';rec=new SR();rec.lang='vi-VN';rec.interimResults=false;rec.continuous=false;rec.maxAlternatives=1;rec.onresult=function(e){var all='';for(var i=0;i<e.results.length;i++)if(e.results[i][0])all+=e.results[i][0].transcript+' ';heard=clean(all);var c=command(heard);inp.value=c.text||heard;status.textContent='🎤 '+(inp.value||'Đang nghe...');if(c.go)finish();else arm()};rec.onerror=function(e){if(timer)clearTimeout(timer);vb.className='voice-search focusable';status.textContent=e&&e.error==='not-allowed'?'Chưa được cấp quyền micro. Hãy cho phép APTV sử dụng micro.':'Không nhận được giọng nói. Chạm 🎤 để thử lại.'};rec.onend=function(){vb.className='voice-search focusable';if(heard)finish()};vb.className='voice-search focusable listening';status.textContent='🎤 Đang nghe... nói “tìm kiếm”, “xong” hoặc ngừng nói.';rec.start()}catch(e){}};
})();
var saveBtn=q('#saveCurrentVideo');if(saveBtn)saveBtn.onclick=function(){if(!currentVideo)return;var added=toggleSaved(currentVideo);status.textContent=added?'Đã lưu video vào Yêu thích.':'Đã bỏ video khỏi Yêu thích.'};
var miniOpen=q('#miniMediaOpen');if(miniOpen)miniOpen.onclick=function(){try{var v=JSON.parse(localStorage.getItem('aptvNowPlaying')||'null');if(v&&v.id)play(v)}catch(e){}};
var miniClose=q('#miniMediaClose');if(miniClose)miniClose.onclick=function(){localStorage.removeItem('aptvNowPlaying');hardStopPlayback();document.body.className=document.body.className.replace(/\s*player-mode/g,'');var wrap=q('#playerWrap');if(wrap)wrap.className=wrap.className.replace(/\s*playing/g,'');var ph=q('#playerPlaceholder');if(ph)ph.style.display='';var ic=q('#inlineControls');if(ic)ic.className='inline-controls hidden';var np=q('#nowPlaying');if(np)np.className='now-playing hidden';var cv=q('#changeVideo');if(cv)cv.className='small focusable hidden';currentVideo=null;updateMini()};
document.addEventListener('click',function(e){
      var t=e.target&&e.target.closest?e.target.closest('#miniMediaClose'):null;
      if(!t)return;
      e.preventDefault();e.stopPropagation();
      t.setAttribute('data-aptv-mini-stop','1');
      localStorage.removeItem('aptvNowPlaying');
      hardStopPlayback();
      document.body.className=document.body.className.replace(/\s*player-mode/g,'');
      currentVideo=null;
      updateMini();
    },true);
updateMini();
try{var qp=new URLSearchParams(location.search),vid=qp.get('video');if(vid){setTimeout(function(){if(window.aptvPlayVideo)window.aptvPlayVideo({id:vid,title:'YouTube',channel:'YouTube'})},120)}}catch(e){}
window.addEventListener('pagehide',function(){try{hardStopPlayback()}catch(e){}});
status.textContent='CarTube sẵn sàng · chọn danh mục hoặc tìm kiếm YouTube.';
})();
(function(){
function q2(s){return document.querySelector(s)}var results2=q2('#ytResults');
var cv=q2('#changeVideo'),ip=q2('#inlinePlay'),ir=q2('#inlineRetry');
if(cv)cv.onclick=function(){document.body.className=document.body.className.replace(/\s*player-mode/g,'');if(window.aptvHardStop)window.aptvHardStop();var w=q2('#playerWrap');if(w)w.className=w.className.replace(/\s*playing/g,'');var p=q2('#playerPlaceholder');if(p)p.style.display='';var ic=q2('#inlineControls');if(ic)ic.className='inline-controls hidden';var np=q2('#nowPlaying');if(np)np.className='now-playing hidden';if(cv)cv.className='small focusable hidden';var ex=q2('#exitFullscreen');if(ex)ex.className='small focusable hidden';setTimeout(function(){if(results2)results2.scrollTop=browseScroll},0)};
if(ip)ip.onclick=function(){if(!currentVideo)return;if(window.aptvPlayInline)window.aptvPlayInline(currentVideo)};
if(ir)ir.onclick=function(){if(!currentVideo)return;if(window.aptvPlayInline)setTimeout(function(){window.aptvPlayInline(currentVideo)},80)};
})();
(function(){
function q3(s){return document.querySelector(s)}var status3=q3('#searchStatus'),results3=q3('#ytResults');function render3(items){results3.innerHTML='';for(var i=0;i<(items||[]).length;i++){(function(v){var b=document.createElement('button');b.className='video-card focusable';var thumb='https://aptv-two.vercel.app/api/youtube-thumb?id='+encodeURIComponent(v.id||'');b.innerHTML='<img src="'+thumb+'"><b>'+String(v.title||'Video')+'</b><small>'+String(v.channel||'YouTube')+'</small>';b.onclick=function(){if(window.aptvPlayVideo)window.aptvPlayVideo(v)};results3.appendChild(b)})(items[i])}}
var recent=q3('#recentBtn'),saved=q3('#savedBtn');
if(recent)recent.onclick=function(){try{var a=JSON.parse(localStorage.getItem('aptvRecent')||'[]');render3(a);status3.textContent=a.length?a.length+' video đã mở gần đây':'Chưa có video gần đây'}catch(e){render3([])}};
if(saved)saved.onclick=function(){try{var a=JSON.parse(localStorage.getItem('aptvSaved')||'[]');render3(a);status3.textContent=a.length?a.length+' bài đã lưu':'Chưa có bài đã lưu'}catch(e){render3([])}};
})();
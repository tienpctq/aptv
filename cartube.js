(function(){
function q(s){return document.querySelector(s)} function qa(s){return document.querySelectorAll(s)}
function esc(s){return String(s||'').replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]})}
var api=(window.APTV_CONFIG&&window.APTV_CONFIG.youtubeSearchApiUrl)||'https://aptv-two.vercel.app/api/youtube-search';
var status=q('#searchStatus'), results=q('#ytResults'), input=q('#ytSearch');
function render(items){results.innerHTML='';for(var i=0;i<items.length;i++){(function(v){var b=document.createElement('button');b.className='video-card focusable';b.innerHTML='<img src="'+esc(v.thumbnail||('https://i.ytimg.com/vi/'+v.id+'/mqdefault.jpg'))+'"><b>'+esc(v.title||'Video')+'</b><small>'+esc(v.channel||'YouTube')+'</small>';b.onclick=function(){play(v)};results.appendChild(b)})(items[i])}}
function search(term){if(!term)return;status.textContent='Đang tìm “'+term+'”...';var x=new XMLHttpRequest();x.open('GET',api+'?q='+encodeURIComponent(term),true);x.onreadystatechange=function(){if(x.readyState!==4)return;if(x.status>=200&&x.status<300){try{var d=JSON.parse(x.responseText);render(d.items||[]);status.textContent=(d.items||[]).length+' kết quả cho “'+term+'”'}catch(e){status.textContent='Lỗi đọc kết quả YouTube.'}}else status.textContent='Không lấy được kết quả YouTube.'};x.send()}
function play(v){var m=q('#videoModal'),title=q('#modalTitle'),ch=q('#modalChannel'),orig=q('#modalOriginal'),box=q('#modalPlayer');title.textContent=v.title||'YouTube';ch.textContent=v.channel||'YouTube';orig.href='https://www.youtube.com/watch?v='+v.id;box.innerHTML='<iframe style="width:100%;height:100%;border:0" src="https://www.youtube.com/embed/'+encodeURIComponent(v.id)+'?autoplay=1&playsinline=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';m.classList.remove('hidden')}
q('#ytSearchBtn').onclick=function(){search(input.value.replace(/^\s+|\s+$/g,''))};input.onkeydown=function(e){e=e||window.event;if((e.keyCode||e.which)===13)search(input.value.replace(/^\s+|\s+$/g,''))};
var cats=qa('[data-yt-query]');for(var i=0;i<cats.length;i++)cats[i].onclick=function(){input.value=this.getAttribute('data-yt-query');search(input.value)};
var chips=qa('[data-query]');for(var j=0;j<chips.length;j++)chips[j].onclick=function(){input.value=this.getAttribute('data-query');search(input.value)};
q('#swapBtn').onclick=function(){var w=q('.workspace');if(w.className.indexOf('swapped-layout')>=0)w.className=w.className.replace(/\s*swapped-layout/g,'');else w.className+=' swapped-layout'};
q('#modalClose').onclick=function(){q('#videoModal').classList.add('hidden');q('#modalPlayer').innerHTML=''};
q('#modalPlay').onclick=function(){var f=q('#modalPlayer iframe');if(f)f.src=f.src};
q('#modalRetry').onclick=function(){var f=q('#modalPlayer iframe');if(f)f.src=f.src};
q('#settingsBtn').onclick=function(){q('#settingsModal').classList.remove('hidden')};q('#settingsClose').onclick=function(){q('#settingsModal').classList.add('hidden')};
q('#fitButton').onclick=function(){document.documentElement.style.zoom=document.documentElement.style.zoom==='0.9'?'1':'0.9'};
q('#videoFullscreen').onclick=function(){var p=q('#playerWrap');if(p.requestFullscreen)p.requestFullscreen()};
status.textContent='CarTube sẵn sàng · chọn danh mục hoặc tìm kiếm YouTube.';
})();
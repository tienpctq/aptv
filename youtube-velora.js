(function(){
function q(x){return document.getElementById(x)}
var swap=q('swapBtn'),util=q('utilityBtn'),fit=q('fitButton'),levels=[.9,1,.8],fi=1;
if(swap)swap.onclick=function(){document.body.classList.toggle('swap-sides')};
if(util)util.onclick=function(){var m=q('settingsModal');if(m)m.classList.remove('hidden')};
if(fit)fit.onclick=function(){fi=(fi+1)%levels.length;var z=levels[fi],app=q('cockpitApp');if(app){app.style.transform='scale('+z+')';app.style.transformOrigin='top center';app.style.width=(100/z)+'%';app.style.height=(100/z)+'%'}fit.textContent='⛶ Fit '+Math.round(z*100)+'%'};
var i=q('ytSearch'),b=q('ytSplitClear');if(i&&b){function s(){i.parentNode.className=i.value?'yt-input-wrap has-text':'yt-input-wrap'}i.addEventListener('input',s);b.onclick=function(e){e.preventDefault();i.value='';s();i.focus()};s()}
})();
/* Reliable YouTube split player controls v3 */
(function(){
 function e(id){return document.getElementById(id)}
 function video(){try{return JSON.parse(sessionStorage.getItem('aptvSplitVideo')||'null')}catch(x){return null}}
 function embed(v){var old=e('youtubeFrame');if(!old||!old.parentNode||!v||!v.id)return;var f=document.createElement('iframe');f.id='youtubeFrame';f.title='YouTube';f.allow='autoplay; encrypted-media; picture-in-picture';f.allowFullscreen=true;f.style.cssText='width:100%;height:100%;border:0;display:block';f.src='https://www.youtube.com/embed/'+encodeURIComponent(v.id)+'?autoplay=1&playsinline=1&rel=0&modestbranding=1&cb='+Date.now();old.parentNode.replaceChild(f,old)}
 document.addEventListener('click',function(ev){var card=ev.target;while(card&&card!==document&&!(card.classList&&card.classList.contains('video-card')))card=card.parentNode;if(card&&card.classList&&card.classList.contains('video-card')){setTimeout(function(){var t=e('nowTitle'),c=e('nowChannel'),id='';var fr=e('youtubeFrame');if(fr){var m=(fr.src||'').match(/embed\/([^?]+)/);if(m)id=decodeURIComponent(m[1])}if(id)sessionStorage.setItem('aptvSplitVideo',JSON.stringify({id:id,title:t?t.textContent:'YouTube',channel:c?c.textContent:'YouTube'}))},250)}},true);
 var play=e('inlinePlay'),retry=e('inlineRetry'),change=e('changeVideo');
 if(play)play.addEventListener('click',function(){var v=video();if(v)embed(v)});
 if(retry)retry.addEventListener('click',function(){var v=video();if(v){var fr=e('youtubeFrame');if(fr){var blank=document.createElement('iframe');blank.id='youtubeFrame';blank.style.cssText='width:100%;height:100%;border:0';fr.parentNode.replaceChild(blank,fr)}setTimeout(function(){embed(v)},100)}});
 if(change)change.addEventListener('click',function(){var fr=e('youtubeFrame');if(fr){var blank=document.createElement('iframe');blank.id='youtubeFrame';blank.style.cssText='display:none;width:100%;height:100%;border:0';fr.parentNode.replaceChild(blank,fr)}sessionStorage.removeItem('aptvSplitVideo');var ph=e('playerPlaceholder');if(ph)ph.style.display='';var ic=e('inlineControls');if(ic)ic.className='inline-controls hidden';var np=e('nowPlaying');if(np)np.className='now-playing hidden';change.className='small focusable hidden';var inp=e('ytSearch');if(inp)inp.focus()});
})();

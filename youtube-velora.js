(function(){
function e(id){return document.getElementById(id)}
function current(){
 var fr=e('youtubeFrame'),src=fr?String(fr.src||''):'',m=src.match(/\/embed\/([^?&#]+)/);
 if(m&&m[1])return {id:decodeURIComponent(m[1])};
 try{return JSON.parse(sessionStorage.getItem('aptvSplitVideo')||'null')}catch(x){return null}
}
function remember(){
 var v=current(),t=e('nowTitle'),c=e('nowChannel');
 if(v&&v.id){v.title=t?t.textContent:'YouTube';v.channel=c?c.textContent:'YouTube';try{sessionStorage.setItem('aptvSplitVideo',JSON.stringify(v))}catch(x){}}
 return v
}
function frame(v){
 if(!v||!v.id)return false;
 var old=e('youtubeFrame'),host=old&&old.parentNode;if(!host)return false;
 var f=document.createElement('iframe');f.id='youtubeFrame';f.title='YouTube';f.setAttribute('allow','autoplay; encrypted-media; picture-in-picture');f.setAttribute('allowfullscreen','');f.style.cssText='width:100%;height:100%;border:0;display:block';f.src='https://www.youtube.com/embed/'+encodeURIComponent(v.id)+'?autoplay=1&playsinline=1&rel=0&modestbranding=1&cb='+Date.now();host.replaceChild(f,old);return true
}
document.addEventListener('click',function(ev){
 var n=ev.target;
 while(n&&n!==document&&!(n.classList&&n.classList.contains('video-card')))n=n.parentNode;
 if(n&&n.classList&&n.classList.contains('video-card'))setTimeout(remember,80)
},true);
var play=e('inlinePlay');if(play)play.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation()}var v=remember();if(v)frame(v)};
var retry=e('inlineRetry');if(retry)retry.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation()}var v=remember();if(!v)return;var old=e('youtubeFrame');if(old)old.src='about:blank';setTimeout(function(){frame(v)},80)};
var change=e('changeVideo');if(change)change.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation()}remember();var fr=e('youtubeFrame');if(fr)fr.src='about:blank';document.body.className=document.body.className.replace(/\s*player-mode/g,'');var ph=e('playerPlaceholder');if(ph)ph.style.display='';var ic=e('inlineControls');if(ic)ic.className='inline-controls hidden';var np=e('nowPlaying');if(np)np.className='now-playing hidden';change.className='small focusable hidden';var inp=e('ytSearch');if(inp){inp.focus();try{inp.scrollIntoView({block:'nearest'})}catch(x){}}};
var swap=e('swapBtn');if(swap)swap.onclick=function(){document.body.classList.toggle('swap-sides')};
var util=e('utilityBtn');if(util)util.onclick=function(){var m=e('settingsModal');if(m)m.classList.remove('hidden')};
var i=e('ytSearch'),b=e('ytSplitClear');if(i&&b){function sync(){i.parentNode.className=i.value?'yt-input-wrap has-text':'yt-input-wrap'}i.oninput=sync;i.onkeyup=sync;b.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation()}i.value='';sync();i.focus()};sync()}
})();
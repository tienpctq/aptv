(function(){
function q(x){return document.getElementById(x)}
var swap=q('swapBtn'),util=q('utilityBtn'),fit=q('fitButton'),levels=[.9,1,.8],fi=1;
if(swap)swap.onclick=function(){document.body.classList.toggle('swap-sides')};
if(util)util.onclick=function(){var m=q('settingsModal');if(m)m.classList.remove('hidden')};
if(fit)fit.onclick=function(){fi=(fi+1)%levels.length;var z=levels[fi],app=q('cockpitApp');if(app){app.style.transform='scale('+z+')';app.style.transformOrigin='top center';app.style.width=(100/z)+'%';app.style.height=(100/z)+'%'}fit.textContent='⛶ Fit '+Math.round(z*100)+'%'};
var i=q('ytSearch'),b=q('ytSplitClear');if(i&&b){function s(){i.parentNode.className=i.value?'yt-input-wrap has-text':'yt-input-wrap'}i.addEventListener('input',s);b.onclick=function(e){e.preventDefault();i.value='';s();i.focus()};s()}
})();
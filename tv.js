(function(){
var channels=[
{id:'vtv1',name:'VTV1',group:'VTV',url:'https://vtvgo.vn/channel/xem-truc-tuyen-kenh-vtv1'},
{id:'vtv2',name:'VTV2',group:'VTV',url:'https://vtvgo.vn/channel/xem-truc-tuyen-kenh-vtv2'},
{id:'vtv3',name:'VTV3',group:'VTV',url:'https://vtvgo.vn/channel/xem-truc-tuyen-kenh-vtv3'},
{id:'vtv5',name:'VTV5',group:'VTV',url:'https://vtvgo.vn/channel/xem-truc-tuyen-kenh-vtv5'},
{id:'vtv6',name:'VTV6',group:'VTV',url:'https://vtvgo.vn/channel/xem-truc-tuyen-kenh-vtv6'},
{id:'vtv8',name:'VTV8',group:'VTV',url:'https://vtvgo.vn/channel/xem-truc-tuyen-kenh-vtv8'},
{id:'vtv9',name:'VTV9',group:'VTV',url:'https://vtvgo.vn/channel/xem-truc-tuyen-kenh-vtv9'},
{id:'vtvcantho',name:'VTV Cần Thơ',group:'VTV',url:'https://vtvgo.vn/'},
{id:'vtc1',name:'VTC1',group:'Thiết yếu',url:'https://vtvgo.vn/'},
{id:'vnews',name:'VNews',group:'Thiết yếu',url:'https://vtvgo.vn/'},
{id:'antv',name:'ANTV',group:'Thiết yếu',url:'https://vtvgo.vn/'},
{id:'qpvn',name:'QPVN',group:'Thiết yếu',url:'https://vtvgo.vn/'},
{id:'qhvn',name:'QHVN',group:'Thiết yếu',url:'https://vtvgo.vn/'},
{id:'nhandan',name:'Truyền hình Nhân Dân',group:'Thiết yếu',url:'https://vtvgo.vn/'},
{id:'local',name:'Kênh địa phương',group:'Địa phương',url:'https://vtvgo.vn/schedule'}
],current=-1,group='all';
function q(s){return document.querySelector(s)}function qa(s){return document.querySelectorAll(s)}
function favs(){try{return JSON.parse(localStorage.getItem('aptvTvFav')||'[]')}catch(e){return[]}}
function isFav(id){return favs().indexOf(id)>=0}
function toggleFav(id){var a=favs(),i=a.indexOf(id);if(i>=0)a.splice(i,1);else a.push(id);localStorage.setItem('aptvTvFav',JSON.stringify(a));render()}
function filtered(){var term=(q('#tvSearch').value||'').toLowerCase(),a=[];for(var i=0;i<channels.length;i++){var c=channels[i];if(group==='fav'&&!isFav(c.id))continue;if(group!=='all'&&group!=='fav'&&c.group!==group)continue;if(term&&c.name.toLowerCase().indexOf(term)<0)continue;a.push(c)}return a}
function openChannel(id){for(var i=0;i<channels.length;i++)if(channels[i].id===id){current=i;var c=channels[i];q('#tvNow').textContent=c.name+' · '+c.group;q('#tvFrame').src=c.url;q('#tvFrame').style.display='block';q('#tvPlaceholder').style.display='none';localStorage.setItem('aptvTvLast',id);render();return}}
function card(c,quick){var d=document.createElement('div');d.className=quick?'tv-quick-item':'tv-channel-card';var b=document.createElement('button');b.className='focusable tv-channel-open'+(current>=0&&channels[current].id===c.id?' active':'');b.innerHTML='<span class="tv-logo">'+c.name.replace('Truyền hình ','').substring(0,6)+'</span><span><b>'+c.name+'</b><small>'+c.group+'</small></span>';b.onclick=function(){openChannel(c.id)};d.appendChild(b);if(!quick){var f=document.createElement('button');f.className='tv-fav focusable';f.textContent=isFav(c.id)?'★':'☆';f.onclick=function(){toggleFav(c.id)};d.appendChild(f)}return d}
function render(){var a=filtered(),box=q('#tvChannels'),quick=q('#tvQuickList');box.innerHTML='';quick.innerHTML='';for(var i=0;i<a.length;i++){box.appendChild(card(a[i],false));quick.appendChild(card(a[i],true))}q('#tvCount').textContent=a.length+' kênh'}
function step(n){if(!channels.length)return;current=current<0?0:(current+n+channels.length)%channels.length;openChannel(channels[current].id)}
q('#tvSearch').oninput=render;var gs=qa('[data-group]');for(var i=0;i<gs.length;i++)gs[i].onclick=function(){group=this.getAttribute('data-group');for(var j=0;j<gs.length;j++)gs[j].className='chip focusable';this.className='chip focusable active';render()};
q('#tvPrev').onclick=function(){step(-1)};q('#tvNext').onclick=function(){step(1)};q('#tvPrevFoot').onclick=function(){step(-1)};q('#tvNextFoot').onclick=function(){step(1)};q('#tvListFoot').onclick=function(){q('#tvChannels').scrollIntoView({behavior:'smooth',block:'start'})};
q('#tvFullscreen').onclick=function(){var p=q('#tvPlayerWrap'),fn=p.requestFullscreen||p.webkitRequestFullscreen;if(fn)try{fn.call(p)}catch(e){}};
render();var last=localStorage.getItem('aptvTvLast');if(last)openChannel(last);
})();
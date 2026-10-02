var CACHE_TTL=21600000;
var cache=globalThis.__aptvYoutubeCache||(globalThis.__aptvYoutubeCache={});
function normalize(items){var out=[];for(var i=0;i<(items||[]).length;i++){var x=items[i]||{},id=x.videoId||x.id;if(typeof id==="object")id=id.videoId;var t=x.title||"",ch=x.author||x.channel||x.channelTitle||"",thumb=x.videoThumbnails&&x.videoThumbnails.length?x.videoThumbnails[0].url:(x.thumbnail||"");if(id)out.push({id:id,title:t,channel:ch,thumbnail:thumb})}return out}
async function fallback(q){
  var bases=["https://pipedapi.kavin.rocks","https://pipedapi.tokhmi.xyz","https://pipedapi.moomoo.me","https://pipedapi.syncpundit.io","https://api-piped.mha.fi","https://piped-api.garudalinux.org"];
  for(var i=0;i<bases.length;i++){try{var r=await fetch(bases[i]+"/search?q="+encodeURIComponent(q)+"&filter=videos",{headers:{"User-Agent":"APTV/1.0"}});if(!r.ok)continue;var d=await r.json(),items=normalize(d.items||d);if(items.length)return items.slice(0,18)}catch(e){}}
  var iv=["https://inv.nadeko.net","https://invidious.nerdvpn.de","https://yt.chocolatemoo53.com","https://invidious.tiekoetter.com","https://invidious.f5.si"];
  for(var j=0;j<iv.length;j++){try{var z=await fetch(iv[j]+"/api/v1/search?q="+encodeURIComponent(q)+"&type=video",{headers:{"User-Agent":"APTV/1.0"}});if(!z.ok)continue;var zd=await z.json(),zi=normalize(zd);if(zi.length)return zi.slice(0,18)}catch(e){}}
  return [];
}
export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Cache-Control","public, s-maxage=21600, stale-while-revalidate=86400");
  if(req.method==="OPTIONS")return res.status(204).end();
  if(req.method!=="GET")return res.status(405).json({error:"method_not_allowed"});
  var q=String((req.query&&req.query.q)||"").replace(/^\s+|\s+$/g,"");
  if(!q)return res.status(400).json({error:"missing_query",message:"Thiếu nội dung tìm kiếm."});
  var ck=q.toLowerCase(),now=Date.now(),hit=cache[ck];
  if(hit&&now-hit.time<CACHE_TTL)return res.status(200).json({items:hit.items,query:q,cached:true,source:hit.source||"cache"});
  var key=process.env.YOUTUBE_API_KEY;
  if(key){try{
    var url="https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=18&safeSearch=moderate&regionCode=VN&relevanceLanguage=vi&q="+encodeURIComponent(q)+"&key="+encodeURIComponent(key);
    var r=await fetch(url),data=await r.json();
    if(r.ok){var src=data&&data.items?data.items:[],items=[];for(var i=0;i<src.length;i++){var x=src[i],id=x&&x.id&&x.id.videoId,s=x&&x.snippet;if(id)items.push({id:id,title:s&&s.title?s.title:"",channel:s&&s.channelTitle?s.channelTitle:"",thumbnail:s&&s.thumbnails&&s.thumbnails.medium?s.thumbnails.medium.url:(s&&s.thumbnails&&s.thumbnails["default"]?s.thumbnails["default"].url:"")})}if(items.length){cache[ck]={time:now,items:items,source:"youtube"};return res.status(200).json({items:items,query:q,cached:false,source:"youtube"})}}
  }catch(e){}}
  var alt=await fallback(q);
  if(alt.length){cache[ck]={time:now,items:alt,source:"fallback"};return res.status(200).json({items:alt,query:q,cached:false,source:"fallback"})}
  if(hit)return res.status(200).json({items:hit.items,query:q,cached:true,stale:true,source:hit.source||"cache"});
  return res.status(503).json({error:"search_unavailable",message:"Cả YouTube API và nguồn tìm kiếm dự phòng hiện không khả dụng."});
}

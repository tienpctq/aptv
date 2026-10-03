var CACHE_TTL=600000;
var cache=globalThis.__aptvYoutubeFastCache||(globalThis.__aptvYoutubeFastCache={});

function normalize(items){
 var out=[];
 for(var i=0;i<(items||[]).length;i++){
  var x=items[i]||{},id=x.videoId||x.id;
  if(typeof id==="object")id=id.videoId;
  if(!id)continue;
  out.push({id:id,title:x.title||"",channel:x.author||x.channel||x.channelTitle||"",thumbnail:"https://i.ytimg.com/vi/"+encodeURIComponent(id)+"/hqdefault.jpg"});
 }
 return out;
}
async function timedFetch(url,ms){
 var ctl=typeof AbortController!=="undefined"?new AbortController():null;
 var t=setTimeout(function(){if(ctl)ctl.abort()},ms);
 try{return await fetch(url,{headers:{"User-Agent":"APTV/1.0"},signal:ctl?ctl.signal:undefined})}
 finally{clearTimeout(t)}
}
async function fastFallback(q){
 var bases=["https://pipedapi.kavin.rocks","https://pipedapi.tokhmi.xyz"];
 for(var i=0;i<bases.length;i++){
  try{
   var r=await timedFetch(bases[i]+"/search?q="+encodeURIComponent(q)+"&filter=videos",1800);
   if(!r.ok)continue;
   var d=await r.json(),items=normalize(d.items||d);
   if(items.length)return items.slice(0,18);
  }catch(e){}
 }
 return [];
}
export default async function handler(req,res){
 res.setHeader("Access-Control-Allow-Origin","*");
 res.setHeader("Cache-Control","public, s-maxage=600, stale-while-revalidate=3600");
 if(req.method==="OPTIONS")return res.status(204).end();
 if(req.method!=="GET")return res.status(405).json({error:"method_not_allowed"});
 var q=String((req.query&&req.query.q)||"").replace(/^\s+|\s+$/g,"");
 if(!q)return res.status(400).json({error:"missing_query"});
 var ck=q.toLowerCase(),now=Date.now(),hit=cache[ck];
 if(hit&&now-hit.time<CACHE_TTL)return res.status(200).json({items:hit.items,query:q,cached:true,source:hit.source});
 var key=process.env.YOUTUBE_API_KEY;
 if(key){
  try{
   var url="https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=18&safeSearch=moderate&regionCode=VN&relevanceLanguage=vi&q="+encodeURIComponent(q)+"&key="+encodeURIComponent(key);
   var r=await timedFetch(url,2600),data=await r.json();
   if(r.ok&&data&&data.items){
    var items=[];
    for(var i=0;i<data.items.length;i++){var x=data.items[i],id=x&&x.id&&x.id.videoId,s=x&&x.snippet;if(id)items.push({id:id,title:s&&s.title?s.title:"",channel:s&&s.channelTitle?s.channelTitle:"",thumbnail:"https://i.ytimg.com/vi/"+id+"/hqdefault.jpg"})}
    if(items.length){cache[ck]={time:now,items:items,source:"youtube"};return res.status(200).json({items:items,query:q,cached:false,source:"youtube"})}
   }
  }catch(e){}
 }
 var alt=await fastFallback(q);
 if(alt.length){cache[ck]={time:now,items:alt,source:"fallback"};return res.status(200).json({items:alt,query:q,cached:false,source:"fallback"})}
 if(hit)return res.status(200).json({items:hit.items,query:q,cached:true,stale:true,source:hit.source});
 return res.status(200).json({items:[],query:q,cached:false,source:"unavailable"});
}

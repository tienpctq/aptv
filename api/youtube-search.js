var CACHE_TTL=21600000;
var cache=globalThis.__aptvYoutubeCache||(globalThis.__aptvYoutubeCache={});
export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Cache-Control","public, s-maxage=21600, stale-while-revalidate=86400");
  if(req.method==="OPTIONS")return res.status(204).end();
  if(req.method!=="GET")return res.status(405).json({error:"method_not_allowed"});
  var key=process.env.YOUTUBE_API_KEY;
  if(!key)return res.status(500).json({error:"api_key_missing",message:"YouTube API key chưa được cấu hình trên Vercel."});
  var q=String((req.query&&req.query.q)||"").replace(/^\s+|\s+$/g,"");
  if(!q)return res.status(400).json({error:"missing_query",message:"Thiếu nội dung tìm kiếm."});
  var ck=q.toLowerCase(),now=Date.now(),hit=cache[ck];
  if(hit&&now-hit.time<CACHE_TTL)return res.status(200).json({items:hit.items,query:q,cached:true});
  try{
    var url="https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=18&safeSearch=moderate&regionCode=VN&relevanceLanguage=vi&q="+encodeURIComponent(q)+"&key="+encodeURIComponent(key);
    var r=await fetch(url),data=await r.json();
    if(!r.ok){
      var reason=data&&data.error&&data.error.errors&&data.error.errors[0]&&data.error.errors[0].reason;
      if(hit)return res.status(200).json({items:hit.items,query:q,cached:true,stale:true});
      var quota=(r.status===429)||(data&&data.error&&data.error.status==="RESOURCE_EXHAUSTED")||reason==="quotaExceeded"||reason==="rateLimitExceeded";
      return res.status(r.status||502).json({error:quota?"quota_exceeded":reason==="keyInvalid"?"api_key_invalid":"youtube_api_error",message:reason||"YouTube API request failed"});
    }
    var src=data&&data.items?data.items:[],items=[];
    for(var i=0;i<src.length;i++){var x=src[i],id=x&&x.id&&x.id.videoId,s=x&&x.snippet;if(id)items.push({id:id,title:s&&s.title?s.title:"",channel:s&&s.channelTitle?s.channelTitle:"",thumbnail:s&&s.thumbnails&&s.thumbnails.medium?s.thumbnails.medium.url:(s&&s.thumbnails&&s.thumbnails["default"]?s.thumbnails["default"].url:"")})}
    cache[ck]={time:now,items:items};
    return res.status(200).json({items:items,query:q,cached:false});
  }catch(e){
    if(hit)return res.status(200).json({items:hit.items,query:q,cached:true,stale:true});
    return res.status(502).json({error:"youtube_unreachable",message:"Không kết nối được YouTube API."});
  }
}

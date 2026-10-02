export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  if(req.method==="OPTIONS")return res.status(204).end();
  if(req.method!=="GET")return res.status(405).json({error:"Method not allowed"});
  const key=process.env.YOUTUBE_API_KEY;
  if(!key)return res.status(500).json({error:"YOUTUBE_API_KEY is not configured"});
  const q=String(req.query.q||"").trim();
  if(!q)return res.status(400).json({error:"Missing q"});
  const params=new URLSearchParams({part:"snippet",type:"video",maxResults:"18",q,key,safeSearch:"moderate",regionCode:"VN",relevanceLanguage:"vi"});
  const r=await fetch("https://www.googleapis.com/youtube/v3/search?"+params);
  const data=await r.json();
  if(!r.ok)return res.status(r.status).json({error:"YouTube request failed",detail:data});
  const items=(data.items||[]).map(x=>({id:x.id?.videoId,title:x.snippet?.title||"",channel:x.snippet?.channelTitle||"",thumbnail:x.snippet?.thumbnails?.medium?.url||x.snippet?.thumbnails?.default?.url||""})).filter(x=>x.id);
  res.status(200).json({items});
}
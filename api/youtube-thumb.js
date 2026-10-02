export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  var id=String((req.query&&req.query.id)||"").replace(/[^A-Za-z0-9_-]/g,"");
  if(!id)return res.status(400).end();
  var hosts=["https://i.ytimg.com/vi/","https://img.youtube.com/vi/"];
  var names=["hqdefault.jpg","mqdefault.jpg","default.jpg"];
  for(var h=0;h<hosts.length;h++)for(var n=0;n<names.length;n++){try{
    var r=await fetch(hosts[h]+id+"/"+names[n]);
    if(!r.ok)continue;
    var b=Buffer.from(await r.arrayBuffer());
    res.setHeader("Content-Type",r.headers.get("content-type")||"image/jpeg");
    res.setHeader("Cache-Control","public, s-maxage=604800, stale-while-revalidate=2592000");
    return res.status(200).send(b);
  }catch(e){}}
  return res.status(404).end();
}

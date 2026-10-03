const CACHE="mr-tien-cockpit-v2";
const STATIC=[
  "./",
  "./index.html",
  "./cartube.html",
  "./youtube.html",
  "./tv.html",
  "./apps.html",
  "./styles.css",
  "./config.js",
  "./app.js",
  "./cartube.js",
  "./tv.js",
  "./gps-speedometer.js",
  "./splitview.js",
  "./channels.json",
  "./assets/evn-logo.svg"
];
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(STATIC)).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin)return;
  event.respondWith(
    fetch(event.request).then(response=>{
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
      return response;
    }).catch(()=>caches.match(event.request).then(r=>r||caches.match("./index.html")))
  );
});
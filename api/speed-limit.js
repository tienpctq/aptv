export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.HERE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "HERE_API_KEY is not configured" });

  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  const prevLat = Number(req.query.prevLat);
  const prevLon = Number(req.query.prevLon);

  if (![lat, lon, prevLat, prevLon].every(Number.isFinite)) {
    return res.status(400).json({ error: "lat, lon, prevLat, prevLon are required" });
  }

  const trace = {
    type: "FeatureCollection",
    features: [{
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [[prevLon, prevLat], [lon, lat]]
      }
    }]
  };

  const qs = new URLSearchParams({
    routeMatch: "1",
    mode: "fastest;car;traffic:disabled",
    attributes: "APPLICABLE_SPEED_LIMIT(*)",
    apiKey
  });

  const hereRes = await fetch("https://routematching.hereapi.com/v8/match/routelinks?" + qs.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(trace)
  });

  const text = await hereRes.text();
  if (!hereRes.ok) {
    return res.status(hereRes.status).json({ error: "HERE request failed", detail: text.slice(0, 500) });
  }

  let data;
  try { data = JSON.parse(text); }
  catch { return res.status(502).json({ error: "Invalid HERE response" }); }

  const limits = [];
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    if (Object.prototype.hasOwnProperty.call(node, "APPLICABLE_SPEED_LIMIT")) {
      const raw = node.APPLICABLE_SPEED_LIMIT;
      if (typeof raw === "string" || typeof raw === "number") {
        const n = Number(raw);
        if (Number.isFinite(n) && n > 0) {
          limits.push({
            value: n,
            unit: node.SPEED_LIMIT_UNIT || "K",
            source: node.SOURCE || "HERE"
          });
        }
      }
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === "object") walk(value);
    }
  };
  walk(data);

  if (!limits.length) {
    return res.status(200).json({ speedLimit: null, source: "HERE", matched: false });
  }

  const last = limits[limits.length - 1];
  let kmh = last.value;
  if (String(last.unit).toUpperCase().startsWith("M")) kmh = Math.round(last.value * 1.609344);

  return res.status(200).json({
    speedLimit: Math.round(kmh),
    source: last.source || "HERE",
    matched: true
  });
}

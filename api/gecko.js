const GECKO_BASE = "https://api.geckoterminal.com/api/v2";

function getGeckoPath(req) {
  if (req.query?.path) {
    const q = req.query.path;
    return Array.isArray(q) ? q.join("/") : String(q);
  }

  const raw = (req.url || "").split("?")[0];
  return raw.replace(/^\/api\/gecko\/?/, "");
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const path = getGeckoPath(req);
  if (!path) {
    sendJson(res, 400, { error: "Missing GeckoTerminal path" });
    return;
  }

  try {
    const upstream = await fetch(`${GECKO_BASE}/${path}`, {
      headers: { Accept: "application/json" },
    });
    const body = await upstream.text();
    res.statusCode = upstream.status;
    res.setHeader(
      "Content-Type",
      upstream.headers.get("content-type") || "application/json"
    );
    res.setHeader("Cache-Control", "public, max-age=5");
    res.end(body);
  } catch (err) {
    console.error("Gecko proxy error:", err);
    sendJson(res, 502, { error: "Trade feed unavailable" });
  }
};

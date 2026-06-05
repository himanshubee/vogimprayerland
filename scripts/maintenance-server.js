/**
 * Tiny zero-dependency maintenance server.
 *
 * Started by deploy.sh (via pm2) on the same PORT the real app uses, so nginx
 * keeps proxying to one port and no nginx changes are needed during a deploy.
 *
 * Responds 503 + Retry-After to every request (so crawlers don't deindex) and
 * serves a branded "we'll be right back" page in the white/red/gold palette.
 */
const http = require("http");

const PORT = Number(process.env.PORT) || 4400;
const RETRY_AFTER = 120; // seconds

const HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>We'll be right back — VOGIM Prayer Land</title>
<style>
  :root { --red:#7A0E1A; --red-dark:#4A0610; --gold:#D4A437; }
  * { box-sizing: border-box; }
  html,body { height:100%; margin:0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: radial-gradient(circle at 50% 30%, #7A0E1A 0%, #4A0610 70%, #3A0610 100%);
    color: #fff; display:flex; align-items:center; justify-content:center;
    text-align:center; padding:24px;
  }
  .card { max-width: 560px; }
  .badge {
    width:56px; height:56px; border:1px solid rgba(212,164,55,.5);
    color:var(--gold); display:flex; align-items:center; justify-content:center;
    margin:0 auto 28px; font-size:24px;
  }
  .eyebrow {
    letter-spacing:.32em; text-transform:uppercase; font-size:.72rem;
    color:var(--gold); font-weight:600; margin-bottom:18px;
  }
  h1 {
    font-family: Georgia, "Times New Roman", serif; font-weight:500;
    font-size: clamp(2rem, 6vw, 3.25rem); line-height:1.1; margin:0 0 18px;
  }
  h1 em { color:var(--gold); font-style:italic; }
  p { color:rgba(255,255,255,.8); line-height:1.7; font-size:1.05rem; margin:0 auto; max-width:30rem; }
  .rule { width:64px; height:1px; background:var(--gold); opacity:.7; margin:32px auto; }
  .verse { font-family:Georgia, serif; font-style:italic; color:rgba(255,255,255,.7); font-size:.95rem; }
</style>
</head>
<body>
  <div class="card">
    <div class="badge">✦</div>
    <div class="eyebrow">VOGIM Prayer Land</div>
    <h1>We will be <em>right back.</em></h1>
    <p>Our site is being updated with fresh content and prayers. Please check
       back in a couple of minutes — the Lord's work continues.</p>
    <div class="rule"></div>
    <p class="verse">&ldquo;He restoreth my soul.&rdquo; — Psalm 23:3</p>
  </div>
</body>
</html>`;

const server = http.createServer((req, res) => {
  // Lightweight health endpoint so deploy tooling can confirm the maint server.
  if (req.url === "/__maint_health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("maintenance");
    return;
  }
  res.writeHead(503, {
    "Content-Type": "text/html; charset=utf-8",
    "Retry-After": String(RETRY_AFTER),
    "Cache-Control": "no-store",
  });
  res.end(HTML);
});

server.listen(PORT, () => {
  console.log(`[maintenance] serving 503 page on :${PORT}`);
});

// Graceful shutdown when pm2 stops/deletes the process.
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => server.close(() => process.exit(0)));
}

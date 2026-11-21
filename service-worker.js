/* 手機唯讀快照：全部「網路優先」，抓不到才用快取。改版時把 VER 加 1，手機下次打開就換新版。
   網址在 GitHub Pages 的 /儲存庫名稱/ 底下 → 路徑都相對於這個檔案所在的資料夾（self.registration.scope）。 */
const VER = 'v2';
const CACHE = 'snap-' + VER;
const SHELL = ['./', 'app.js', 'style.css', 'manifest.json', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== location.origin) return;
  let key = u.origin + u.pathname;                     // 不含 ?t=…，同一個檔只存一份
  if (key.endsWith('/index.html')) key = key.slice(0, -'index.html'.length);
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try {
      const r = await fetch(req, { cache: 'no-store' });
      if (r.ok) c.put(key, r.clone());
      return r;
    } catch (err) {
      const hit = await c.match(key);
      if (!hit) throw err;
      const h = new Headers(hit.headers); h.set('X-Offline', '1');   // 告訴畫面：這是快取（離線）
      return new Response(await hit.blob(), { status: 200, headers: h });
    }
  })());
});

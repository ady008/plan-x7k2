/* 手機唯讀快照：只抓 data.json 顯示，沒有任何修改功能。
   網址在 GitHub Pages 的 /儲存庫名稱/ 底下，所以路徑全部用相對路徑。
   GitHub Pages 會快取約 10 分鐘、不能改 Cache-Control → 抓 data.json 加 ?t=時間戳 ＋ cache: no-store */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const f2 = x => (+x || 0).toFixed(2);
const hm = d => `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
let D = null, OFF = false, T = '成型';
try { T = localStorage.getItem('snapTab') || '成型'; } catch (e) {}

async function load(btn) {
  if (btn) $('rf').textContent = '…';
  try {
    const r = await fetch('data.json?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error(r.status);
    OFF = r.headers.get('X-Offline') === '1';
    D = await r.json();
  } catch (e) { OFF = true; }
  if (btn) $('rf').textContent = '重新整理';
  show();
}
function tab(t) { T = t; try { localStorage.setItem('snapTab', t); } catch (e) {} show(); window.scrollTo(0, 0); }
function show() {
  $('t1').className = T === '成型' ? 'on' : ''; $('t2').className = T === '交期' ? 'on' : '';
  const w = $('warn');
  if (!D) { $('tm').textContent = ''; w.className = 'warn off'; w.textContent = '連不上，也沒有之前的資料。請確認網路後按「重新整理」。'; $('main').innerHTML = ''; return; }
  const g = new Date(D.產生), age = (Date.now() - g) / 60000;
  $('tm').textContent = `資料更新 ${hm(g)}（${age < 1 ? '剛剛' : Math.round(age) + ' 分鐘前'}）`;
  if (OFF) { w.className = 'warn off'; w.textContent = `離線中，顯示的是 ${hm(g)} 的資料`; }
  else if (age > 30) { w.className = 'warn old'; w.textContent = `⚠ 資料可能過期：已經 ${Math.round(age)} 分鐘沒更新`; }
  else { w.className = 'warn'; w.textContent = ''; }
  $('main').innerHTML = T === '成型' ? sch(D.成型) : jq(D.交期);
}
function sch(s) {
  if (!s || !s.單.length) return '<div class="empty">沒有資料</div>';
  const st = x => x === 'OK' ? `<span class="st ok">OK</span>` : x === '壓板' ? `<span class="st p">壓板</span>` : x === '現交' ? `<span class="st x">現交</span>` : x ? `<span class="st o">${esc(x)}</span>` : '';
  let h = `<div class="sum">訂單量 <b>${f2(s.訂單量)}</b> 噸・${s.單.length} 張${s.更新 ? `・看板 ${esc(s.更新)}` : ''}${s.錯誤 ? '・<span class="star">這次更新失敗</span>' : ''}</div>`, blk = '';
  for (const o of s.單) {
    if (o.區塊 !== blk) { blk = o.區塊; h += `<div class="blk ${blk === '優先生產' ? 'pri' : 'norm'}">${esc(blk || '一般')}</div>`; }
    h += `<div class="o${o.狀態 === 'OK' ? ' done' : ''}"><div class="r1"><span class="no">${o.順序}</span><span class="k">${esc(o.交單)}</span><span class="q">${f2(o.訂單量)} t</span></div>
      <div class="c">${esc(o.客戶)}</div>
      <div class="r3"><span>交期 ${esc(o.交期.slice(5).replace('-', '/'))}</span>${st(o.狀態)}<span>${esc(o.料別)}</span><span>${o.完成率}%</span></div>
      <div class="bar"><i style="width:${Math.min(100, Math.max(0, o.完成率))}%"></i></div></div>`;
  }
  return h;
}
function jq(j) {
  if (!j || !j.天.length) return '<div class="empty">沒有資料</div>';
  const td = new Date(), key = `${td.getMonth() + 1}/${td.getDate()}`;
  let h = `<div class="sum">還沒排進成型的彎料（未打彎／未切，噸）${j.更新 ? `・B31 ${esc(j.更新)}` : ''}${j.錯誤 ? '・<span class="star">這次更新失敗</span>' : ''}<br>紅字＝外部交期（不算進當天合計）、★＝不可延／務必準時出貨</div>`;
  for (const d of j.天) {
    const ds = String(d.日期), today = ds.includes(key) || ds === td.toISOString().slice(0, 10);
    h += `<div class="day${today ? ' today' : ''}"><h2>${esc(ds)}<small>未打彎 <b>${f2(d.未打彎)}</b>・未切 <b>${f2(d.未切)}</b></small></h2>`;
    for (const i of d.單) h += `<div class="it${i.紅 ? ' red' : ''}"><div class="nm"><b>${esc(i.交單)}${i.星號 ? '<span class="star">★</span>' : ''}</b>${esc(String(i.名稱).replace(new RegExp('-?' + i.交單 + '$'), ''))}</div><div class="v">打彎 ${f2(i.未打彎)}<br>未切 ${f2(i.未切)}</div></div>`;
    h += '</div>';
  }
  return h;
}
$('rf').addEventListener('click', () => load(true));
$('t1').addEventListener('click', () => tab('成型'));
$('t2').addEventListener('click', () => tab('交期'));
load();
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') load(); });
setInterval(() => { if (document.visibilityState === 'visible') load(); }, 120000);   // 開著不動每 2 分鐘
setInterval(show, 60000);                                                              // 「幾分鐘前」每分鐘更新
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js', { scope: './' }).then(r => r.update()).catch(() => {});
  let re = false; const had = !!navigator.serviceWorker.controller;   // 第一次裝好不用重載，之後換新版才重載
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (had && !re) { re = true; location.reload(); } });
}

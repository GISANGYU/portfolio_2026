/* FILTERED — 스테이지 공용 도구: 드럼 패턴, 코드 진행, 헬퍼 */

window.KIT = (function () {
  const step = i => ((i % 16) + 16) % 16;
  const bar = i => Math.floor(i / 16);

  // p = { k, s, h, o, c, sh } 각 16칸 패턴 문자열
  function drums(i, t, p, v) {
    const s = step(i), on = AU.on;
    if (p.k && on(p.k, s)) AU.kick(t, (v || 1) * on(p.k, s));
    if (p.s && on(p.s, s)) AU.snare(t, v);
    if (p.c && on(p.c, s)) AU.clap(t, v);
    if (p.h && on(p.h, s)) AU.hat(t, 0.7 * (v || 1) * on(p.h, s));
    if (p.o && on(p.o, s)) AU.hat(t, 0.6 * (v || 1), true);
    if (p.sh && on(p.sh, s)) AU.shaker(t, v);
  }

  // chords = [[베이스음, [화음...]], ...] 마디마다 하나씩 순환
  // bassPat: 16칸 문자열 (x = 근음, o = 옥타브 위)
  function harmony(i, t, spb, chords, bassPat, padOn) {
    if (i < 0) return;
    const s = step(i), [root, notes] = chords[bar(i) % chords.length];
    const c = bassPat[s];
    if (c === 'x') AU.bass(t, root, spb * 0.45);
    if (c === 'o') AU.bass(t, root + 12, spb * 0.3, 0.8);
    if (padOn && s === 0) AU.pad(t, notes, spb * 3.8);
  }

  const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const fmt = n => Math.round(n).toLocaleString('ko-KR');

  function tween(ms, fn) {
    const s = performance.now();
    return new Promise(r => { (function f(now) { const p = Math.min(1, (now - s) / ms); fn(1 - Math.pow(1 - p, 3)); p < 1 ? requestAnimationFrame(f) : r(); })(s); });
  }

  return { step, bar, drums, harmony, shuffle, el, fmt, tween };
})();

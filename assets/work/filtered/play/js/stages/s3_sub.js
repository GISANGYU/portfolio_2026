/* STAGE 3 · 자막 바꿔치기 — 허위 번역
   외국 연설자가 말하는 리듬을 듣고, 말이 끝난 "다음 박"에 가짜 자막을 위로 밀어 올려 끼운다. */

(function () {
  // n: 음절 수, step: 음절 간격(박), fake: 가짜 자막, real: 실제 뜻
  const LINES = [
    { n: 3, step: 1, fake: '전쟁을 선포한다', real: '평화를 약속한다' },
    { n: 2, step: 1, fake: '우리가 졌다', real: '우리가 이겼다' },
    { n: 4, step: 0.5, fake: '세금 두 배', real: '세금 동결' },
    { n: 3, step: 1, fake: '국경 폐쇄', real: '국경 개방' },
    { n: 5, step: 0.5, fake: '전부 거짓말', real: '전부 사실' },
    { n: 2, step: 1, fake: '협상 결렬', real: '협상 타결' },
    { n: 6, step: 0.5, fake: '지원 중단', real: '지원 확대' },
    { n: 3, step: 1, fake: '사과 안 한다', real: '진심으로 사과한다' },
  ];
  const PRACTICE = [{ n: 2, step: 1, fake: '연습 자막', real: '연습' }, { n: 2, step: 1, fake: '연습 자막', real: '연습' }];
  const GL = 'aeiouyøæåŋšžλ';
  const gib = n => Array.from({ length: n }, () => { const l = 2 + Math.floor(Math.random() * 3); let w = ''; for (let i = 0; i < l; i++) w += (i % 2 ? GL[Math.floor(Math.random() * GL.length)] : 'bdgklmnprstvz'[Math.floor(Math.random() * 13)]); return w; }).join(' ');

  let last = null;

  GAME.register({
    no: 3, id: 'sub', name: '자막 바꿔치기', technique: '허위 자막', input: '위로 밀기',
    line: '말이 끝난 다음 박에, 위로 밀어 넣어라', tip: '원래 말과 번역이 같은지 확인하라.',
    color: '#95d5b2', bpm: 120,
    boss: { top: '감쪽같다. 아무도 원어 안 들어봐.', ok: '타이밍이 조금 빗나갔어.', bad: '자막이 입이랑 안 맞잖아. 다시.' },

    setup(el, api) {
      el.innerHTML = `<div class="s3">
        <div class="s3-tv"><div class="scr" id="s3scr"></div><div class="sub" id="s3sub"></div><span class="live">LIVE</span></div>
        <div class="s3-card" id="s3card"><span id="s3fake"></span></div>
        <div class="s3-arrow">위로</div>
      </div>`;
      this.drawSpeaker(el, false);
      const card = el.querySelector('#s3card');
      let y0 = null, fired = false;
      api.pointer(el, {
        down(e, t, x, y) { y0 = y; fired = false; },
        move(e, t, x, y) {
          if (y0 == null || fired) return;
          card.style.transform = `translate(-50%, ${Math.min(0, (y - y0) * 100)}%)`;
          if (y0 - y > 0.07) { fired = true; card.style.transform = ''; AU.swish(AU.now()); card.classList.remove('fly'); void card.offsetWidth; card.classList.add('fly'); api.tap(t); }
        },
        up() { y0 = null; card.style.transform = ''; },
      });
    },

    drawSpeaker(el, talk) {
      el.querySelector('#s3scr').innerHTML = DR.svg('0 0 300 170', `<rect width="300" height="170" fill="#1b4332"/><rect x="0" y="120" width="300" height="50" fill="#2d6a4f"/>` + [40, 260].map(x => `<rect x="${x - 6}" y="20" width="12" height="100" fill="#d8f3dc" stroke="${DR.INK}" stroke-width="3"/>`).join('') +
        DR.person(150, 172, 1.25, { body: '#6a4c93', tie: '#e63946', mouth: talk ? 'open' : 'flat', hair: '#d4a373', eyes: 'dot' }));
    },

    music(i, t, api) {
      if (i < 0) { if (i % 4 === 0) AU.kick(t, 0.5); return; }
      KIT.drums(i, t, { k: 'x...x...x...x...', s: '....x.......x...', o: '..x...x...x...x.' }, 0.85);
      KIT.harmony(i, t, api.spb, [[45, [57, 60, 64]], [41, [57, 60, 65]], [48, [60, 64, 67]], [43, [59, 62, 67]]], 'x.x.x.x.x.x.x.x.', false);
    },

    async run(api) {
      const el = api.el, sub = el.querySelector('#s3sub'), fake = el.querySelector('#s3fake');
      const list = api.practice ? PRACTICE : LINES;
      let b = 0;
      list.forEach((ln, k) => {
        const base = b, g = gib(ln.n > 3 ? 3 : ln.n);
        api.at(base - 0.5, () => { fake.textContent = ln.fake; sub.textContent = ''; sub.className = 'sub'; });
        for (let s = 0; s < ln.n; s++) {
          const bt = base + s * ln.step;
          AU.voice(api.time(bt), 57 + (s % 3) * 2, api.spb * ln.step * 0.8, s % 5, 1);
          api.at(bt, () => { this.drawSpeaker(el, true); sub.textContent = g; setTimeout(() => this.drawSpeaker(el, false), 120); });
        }
        const hitBeat = base + ln.n * ln.step + ln.step;
        api.target({
          beat: hitBeat, x: 50, y: 44,
          onHit: () => { sub.textContent = ln.fake; sub.className = 'sub fake'; last = ln; },
          onMiss: () => { sub.className = 'sub keep'; },
        });
        b = hitBeat + 2;
        b = Math.ceil(b);
      });
      await api.wait(b);
      return last;
    },

    reveal(el, d) {
      const ln = d || LINES[0];
      el.innerHTML = `<div class="rv3"><p class="x"><s>${ln.fake}</s></p><p class="o">${ln.real}</p></div>`;
    },
  });
})();

/* STAGE 4 · 그때 그 사진 — 과거 사진 재활용
   사진이 "쿵" 떨어지면, 쉐이커 소리가 나는 동안 날짜를 문질러 지우고, 4박째에 "오늘" 도장을 쾅. */

(function () {
  const I = DR.INK;
  const PHOTOS = [
    `<rect width="300" height="220" fill="#8ecae6"/><rect y="120" width="300" height="100" fill="#219ebc"/><path d="M0 130 q40 -12 80 0 t80 0 t80 0 t80 0" stroke="#fff" stroke-width="4" fill="none"/><rect x="110" y="96" width="80" height="36" rx="10" fill="#e63946" stroke="${I}" stroke-width="4"/><rect x="122" y="84" width="56" height="20" rx="6" fill="#bde0fe" stroke="${I}" stroke-width="4"/><rect x="20" y="30" width="50" height="95" fill="#adb5bd" stroke="${I}" stroke-width="4"/><rect x="230" y="40" width="54" height="85" fill="#ced4da" stroke="${I}" stroke-width="4"/>`,
    `<rect width="300" height="220" fill="#495057"/><rect x="80" y="60" width="140" height="160" fill="#adb5bd" stroke="${I}" stroke-width="4"/>${[0, 1].map(r => [0, 1, 2].map(c => `<rect x="${95 + c * 42}" y="${80 + r * 50}" width="28" height="30" fill="#ffba08" stroke="${I}" stroke-width="3"/>`).join('')).join('')}<path d="M90 60 q20 -50 40 -10 q15 -45 35 -5 q20 -40 40 0" fill="#f48c06" stroke="${I}" stroke-width="4"/><path d="M110 58 q12 -26 22 -4 q10 -22 22 2" fill="#ffba08"/>`,
    `<rect width="300" height="220" fill="#e9ecef"/>${Array.from({ length: 14 }, (_, k) => `<circle cx="${20 + (k % 7) * 44}" cy="${120 + Math.floor(k / 7) * 50}" r="20" fill="${['#ffd9b8', '#f4c095', '#e0ac69'][k % 3]}" stroke="${I}" stroke-width="3"/>`).join('')}<rect x="80" y="20" width="140" height="36" fill="#264653" stroke="${I}" stroke-width="4"/><text x="150" y="45" text-anchor="middle" font-family="Pretendard" font-weight="800" font-size="18" fill="#fff">STATION</text>`,
    `<rect width="300" height="220" fill="#caf0f8"/><path d="M0 150 L120 150 L140 175 L160 140 L300 140 L300 220 L0 220Z" fill="#6c757d" stroke="${I}" stroke-width="4"/><path d="M120 150 l20 25 l20 -35" stroke="#212529" stroke-width="6" fill="none"/><rect x="200" y="70" width="12" height="70" fill="#ffb703" stroke="${I}" stroke-width="3"/><path d="M186 70 l40 0 l-20 -30z" fill="#fb8500" stroke="${I}" stroke-width="3"/>`,
  ];
  const DATES = ['2015.08.14', '2012.03.02', '2009.11.27', '2017.07.19'];
  const PRACTICE = [0, 0];
  const MAIN = [0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0]; // 1 = 도장 두 번 (속보 + 오늘)
  const NEED = 1.6; // 문질러야 하는 거리 (화면 폭 기준)

  let last = 0;

  GAME.register({
    no: 4, id: 'date', name: '그때 그 사진', technique: '과거 사진 재활용', input: '문지르기 + 탭',
    line: '날짜를 문질러 지우고, 박자에 "오늘" 도장', tip: '사진이 처음 올라온 날짜를 확인하라.',
    color: '#f4a261', bpm: 124,
    boss: { top: '11년 전 사진이 오늘 속보가 됐네. 완벽해.', ok: '날짜가 살짝 보인다. 조심해.', bad: '날짜 다 보이잖아. 다시.' },

    setup(el, api) {
      el.innerHTML = `<div class="s4">
        <div class="s4-ph" id="s4ph"><div class="img" id="s4img"></div><div class="date" id="s4date"></div><div class="stamps" id="s4st"></div></div>
        <div class="s4-meter"><i id="s4m"></i></div>
        <div class="s4-er" id="s4er"></div>
      </div>`;
      const self = this;
      let px = null, py = null;
      const er = el.querySelector('#s4er');
      api.pointer(el, {
        down(e, t, x, y) { px = x; py = y; api.tap(t); er.style.left = x * 100 + '%'; er.style.top = y * 100 + '%'; er.classList.add('on'); },
        move(e, t, x, y) {
          if (px == null) return;
          const d = Math.abs(x - px) + Math.abs(y - py) * 0.6;
          px = x; py = y;
          er.style.left = x * 100 + '%'; er.style.top = y * 100 + '%';
          if (self.win && d > 0.004) { self.rub += d; if (Math.random() < 0.35) AU.rub(AU.now()); self.paint(); }
        },
        up() { px = null; er.classList.remove('on'); },
      });
    },
    win: false, rub: 0, el: null,
    paint() {
      const p = Math.min(1, this.rub / NEED);
      const d = this.el.querySelector('#s4date'); if (d) d.style.opacity = String(1 - p * 0.95);
      const m = this.el.querySelector('#s4m'); if (m) m.style.width = p * 100 + '%';
    },

    music(i, t, api) {
      if (i < 0) { if (i % 4 === 0) AU.kick(t, 0.6); return; }
      KIT.drums(i, t, { k: 'x...x...x...x...', o: '..x...x...x...x.', c: '....x.......x...' }, 0.8);
      KIT.harmony(i, t, api.spb, [[50, [62, 65, 69]], [46, [58, 62, 65]], [48, [60, 64, 67]], [45, [57, 61, 64]]], 'x..xx..xx..xx..x', false);
    },

    async run(api) {
      const el = api.el; this.el = el;
      const ph = el.querySelector('#s4ph'), img = el.querySelector('#s4img'), date = el.querySelector('#s4date'), stp = el.querySelector('#s4st');
      const list = api.practice ? PRACTICE : MAIN;
      list.forEach((dbl, k) => {
        const base = k * 4, pi = k % PHOTOS.length;
        AU.thud(api.time(base));
        [0.5, 1, 1.5, 2, 2.5].forEach(o => AU.shaker(api.time(base + o), 1.4));
        api.at(base - 0.2, () => {
          img.innerHTML = DR.svg('0 0 300 220', PHOTOS[pi]);
          date.textContent = DATES[pi]; date.style.opacity = '1';
          stp.innerHTML = ''; this.rub = 0; this.paint();
          ph.classList.remove('drop'); void ph.offsetWidth; ph.classList.add('drop');
        });
        api.at(base + 0.4, () => { this.win = true; ph.classList.add('rubbing'); });
        const rt = api.target({ beat: base + 2.95, noTap: true, x: 50, y: 60 });
        api.at(base + 2.85, () => {
          this.win = false; ph.classList.remove('rubbing');
          const p = this.rub / NEED;
          api.judge(rt, p >= 1 ? 'perfect' : p >= 0.55 ? 'good' : 'miss');
        });
        const marks = dbl ? [[3, '속보'], [3.5, '오늘']] : [[3, '오늘']];
        marks.forEach(([o, txt], j) => {
          api.target({
            beat: base + o, x: 50, y: 30,
            onHit: () => { AU.stamp(AU.now()); stp.insertAdjacentHTML('beforeend', `<span class="st st${j}">${txt}</span>`); last = pi; },
          });
        });
      });
      await api.wait(list.length * 4 + 0.5);
      return { pi: last };
    },

    reveal(el, d) {
      const pi = (d && d.pi) || 0;
      el.innerHTML = `<div class="rv4"><div class="img">${DR.svg('0 0 300 220', PHOTOS[pi])}</div><span class="date">${DATES[pi]}</span><span class="st"><s>오늘</s></span></div>`;
    },
  });
})();

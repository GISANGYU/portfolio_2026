/* STAGE 5 · 그래프 늘리기 — 통계 눈속임
   "쿵 쿵 쿵" 세 번 들리는 동안 세로축을 끌어올리고, 네 번째 박에 손을 뗀다. 점선 구간 안에서 놓아야 성공. */

(function () {
  // a, b: 두 막대 값 / band: 세로축 시작값 목표 구간
  const GRAPHS = [
    { a: 51, b: 49, band: [42, 47] }, { a: 52, b: 48, band: [40, 46] }, { a: 30, b: 27, band: [20, 25] },
    { a: 68, b: 65, band: [56, 62] }, { a: 41, b: 39, band: [32, 37] }, { a: 55, b: 50, band: [42, 48] },
    { a: 33, b: 31, band: [25, 30] }, { a: 75, b: 72, band: [64, 70] }, { a: 49, b: 47, band: [39, 45] },
    { a: 62, b: 58, band: [48, 55] },
  ];
  const PRACTICE = [{ a: 51, b: 49, band: [40, 47] }, { a: 51, b: 49, band: [40, 47] }];

  let last = GRAPHS[0];

  GAME.register({
    no: 5, id: 'graph', name: '그래프 늘리기', technique: '그래프 축 조작', input: '끌어올렸다 놓기',
    line: '쿵 쿵 쿵, 끌어올리고 넷에 놓아라', tip: '세로축이 0에서 시작하는지 보라.',
    color: '#cdb4db', bpm: 96,
    boss: { top: '2% 차이가 절벽이 됐네. 예술이다.', ok: '조금만 더 과감하게.', bad: '너무 티 나거나 너무 밋밋해. 다시.' },

    setup(el, api) {
      el.innerHTML = `<div class="s5">
        <div class="s5-panel">
          <div class="axis"><div class="band" id="s5band"></div><div class="knob" id="s5knob"><span id="s5base">0</span></div></div>
          <div class="bars"><div class="bar a" id="s5a"><b></b><i>우리</i></div><div class="bar b" id="s5b"><b></b><i>상대</i></div></div>
          <div class="lock" id="s5lock">고정</div>
        </div>
        <div class="s5-count" id="s5cnt"></div>
      </div>`;
      const self = this;
      let y0 = null, base0 = 0;
      api.pointer(el, {
        down(e, t, x, y) { if (self.locked) return; y0 = y; base0 = self.base; self.holding = true; AU.chak(AU.now()); },
        move(e, t, x, y) {
          if (y0 == null || self.locked) return;
          self.base = Math.max(0, Math.min(self.g.b - 1, base0 + (y0 - y) * self.g.b * 1.2));
          self.draw();
        },
        up(e, t) {
          if (y0 == null) return;
          y0 = null; self.holding = false;
          if (self.locked || !self.tg) return;
          self.release(api, t);
        },
      });
    },
    g: null, base: 0, locked: false, tg: null, el: null,

    draw() {
      const el = this.el, g = this.g; if (!el || !g) return;
      const top = g.a + 5, base = this.base;
      const h = v => Math.max(2, (v - base) / (top - base) * 100);
      el.querySelector('#s5a').style.height = h(g.a) + '%';
      el.querySelector('#s5b').style.height = h(g.b) + '%';
      el.querySelector('#s5a b').textContent = g.a + '%';
      el.querySelector('#s5b b').textContent = g.b + '%';
      el.querySelector('#s5base').textContent = Math.round(base);
      const kp = base / (g.b - 1) * 100;
      el.querySelector('#s5knob').style.bottom = kp + '%';
      const band = el.querySelector('#s5band');
      band.style.bottom = g.band[0] / (g.b - 1) * 100 + '%';
      band.style.height = (g.band[1] - g.band[0]) / (g.b - 1) * 100 + '%';
      band.classList.toggle('in', base >= g.band[0] && base <= g.band[1]);
    },

    release(api, t) {
      const tg = this.tg, g = this.g;
      const dt = Math.abs(t - tg.t);
      let grade = dt <= 0.075 ? 'perfect' : dt <= 0.15 ? 'good' : 'miss';
      const inBand = this.base >= g.band[0] && this.base <= g.band[1];
      const near = this.base >= g.band[0] - 2 && this.base <= g.band[1] + 2;
      if (!inBand) grade = near && grade === 'perfect' ? 'good' : 'miss';
      this.locked = true; this.tg = null;
      AU.lock(AU.now());
      const lk = this.el.querySelector('#s5lock');
      lk.className = 'lock on ' + grade; lk.textContent = grade === 'miss' ? (inBand ? '박자!' : '범위!') : '고정';
      if (grade !== 'miss') last = Object.assign({ base: this.base }, g);
      api.judge(tg, grade);
    },

    music(i, t, api) {
      if (i < 0) { if (i % 4 === 0) AU.hat(t, 0.5); return; }
      KIT.drums(i, t, { k: 'x.......x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' }, 0.7);
      KIT.harmony(i, t, api.spb, [[41, [57, 60, 64, 65]], [40, [55, 59, 62, 64]], [38, [53, 57, 60, 62]], [36, [52, 55, 59, 60]]], 'x.......x...x...', true);
    },

    async run(api) {
      const el = api.el; this.el = el;
      const cnt = el.querySelector('#s5cnt'), lk = el.querySelector('#s5lock');
      const list = api.practice ? PRACTICE : GRAPHS;
      list.forEach((g, k) => {
        const base = k * 4;
        AU.thud(api.time(base));
        [0, 1, 2].forEach(o => AU.wood(api.time(base + o), 79, 1));
        api.at(base - 0.3, () => { this.g = g; this.base = 0; this.locked = false; lk.className = 'lock'; this.draw(); });
        [0, 1, 2].forEach(o => api.at(base + o, () => { cnt.textContent = ['쿵', '쿵', '쿵'][o]; cnt.className = 's5-count c' + o; }));
        api.at(base + 2.6, () => { cnt.textContent = '놓기!'; cnt.className = 's5-count go'; });
        const tg = api.target({ beat: base + 3, noTap: true, x: 50, y: 20, onMiss: () => { this.locked = true; this.tg = null; lk.className = 'lock on miss'; lk.textContent = '놓침'; } });
        api.at(base - 0.3, () => { this.tg = tg; });
        api.at(base + 3.5, () => { cnt.textContent = ''; });
      });
      await api.wait(list.length * 4);
      return last;
    },

    reveal(el, d) {
      const g = d || GRAPHS[0], top = g.a + 5;
      el.innerHTML = `<div class="rv5"><div class="bars"><div class="bar a" style="height:${g.a / top * 100}%"><b>${g.a}%</b></div><div class="bar b" style="height:${g.b / top * 100}%"><b>${g.b}%</b></div></div><p class="zero">0부터 보면</p></div>`;
    },
  });
})();

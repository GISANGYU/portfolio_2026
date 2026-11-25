/* STAGE 7 · 얼굴 붙이기 — 합성·딥페이크
   1마디: 얼굴 부위가 박자에 맞춰 순서대로 번쩍인다. 2마디: 같은 박자, 같은 순서로 따라 탭하면 얼굴이 합성된다. */

(function () {
  const PADS = [ // 부위: 왼눈, 오른눈, 코, 입 (얼굴 SVG 좌표 기준 %)
    { x: 35, y: 49, n: '눈' }, { x: 65, y: 49, n: '눈' }, { x: 50, y: 60, n: '코' }, { x: 50, y: 72, n: '입' },
  ];
  const TONE = [72, 76, 79, 84];
  // [박 위치, 부위]
  const SEQS = [
    [[0, 0], [1, 1], [2, 2], [3, 3]],
    [[0, 3], [1, 2], [2, 1], [3, 0]],
    [[0, 0], [1, 0], [2, 3], [3, 3]],
    [[0, 1], [0.5, 0], [1, 2], [2, 3], [3, 3]],
    [[0, 2], [1, 2], [1.5, 1], [2, 0], [3, 3]],
    [[0, 0], [0.5, 1], [1, 2], [1.5, 3], [2, 2], [3, 0]],
  ];
  const PRACTICE = [[[0, 0], [1, 1], [2, 2], [3, 3]]];
  const SKINS = ['#ffd9b8', '#e0ac69', '#f1c27d', '#c68642'];

  GAME.register({
    no: 7, id: 'face', name: '얼굴 붙이기', technique: '얼굴 합성', input: '따라 탭',
    line: '번쩍인 순서 그대로, 같은 박자에', tip: '얼굴 경계, 피부색, 그림자가 어색한지 보라.',
    color: '#a0c4ff', bpm: 104,
    boss: { top: '본인도 속겠다. 바로 올려.', ok: '경계가 좀 보여. 더 정확히.', bad: '얼굴이 엉망이잖아. 다시.' },

    setup(el, api) {
      el.innerHTML = `<div class="s7">
        <div class="s7-src"><div id="s7src"></div><span>원본</span></div>
        <div class="s7-mode" id="s7mode"></div>
        <div class="s7-face"><div id="s7face"></div>${PADS.map((p, k) => `<button class="pad" data-k="${k}" style="left:${p.x}%;top:${p.y}%"><i></i></button>`).join('')}</div>
      </div>`;
      el.querySelector('#s7src').innerHTML = DR.svg('0 0 120 120', DR.face(60, 62, 44, { hair: '#ffbe0b', eyes: 'wide', mouth: 'grin', blush: true }));
      this.drawFace(el, 0, []);
      el.querySelectorAll('.pad').forEach(p => api.pointer(p, {
        down: (e, t) => {
          const k = +p.dataset.k;
          AU.bell(AU.now(), TONE[k], 0.8);
          p.classList.remove('tap'); void p.offsetWidth; p.classList.add('tap');
          api.tap(t, k);
        },
      }));
    },

    drawFace(el, who, pasted) {
      const skin = SKINS[who % SKINS.length];
      let s = DR.face(100, 105, 78, { skin, hair: ['#343a40', '#6f1d1b', '#495057', '#212529'][who % 4], eyes: 'dot', mouth: 'flat' });
      // 붙인 부위: 원본 얼굴의 부위를 다른 색 조각으로 덧댄다 (경계가 살짝 보이게)
      const P = { 0: [72, 97], 1: [128, 97], 2: [100, 118], 3: [100, 140] };
      pasted.forEach(k => {
        const [x, y] = P[k];
        s += `<ellipse cx="${x}" cy="${y}" rx="${k === 3 ? 30 : 20}" ry="${k === 3 ? 16 : 16}" fill="#ffd9b8" stroke="#ff006e" stroke-width="2" stroke-dasharray="4 3"/>`;
        if (k < 2) s += `<circle cx="${x}" cy="${y}" r="11" fill="#fff" stroke="${DR.INK}" stroke-width="3"/><circle cx="${x}" cy="${y}" r="5" fill="${DR.INK}"/>`;
        if (k === 2) s += `<path d="M${x} ${y - 10} l-6 14 l12 0z" fill="#f4a3a8" stroke="${DR.INK}" stroke-width="2"/>`;
        if (k === 3) s += `<path d="M${x - 20} ${y - 5} q20 22 40 0 z" fill="#fff" stroke="${DR.INK}" stroke-width="3"/>`;
      });
      el.querySelector('#s7face').innerHTML = DR.svg('0 0 200 200', s);
    },

    music(i, t, api) {
      if (i < 0) { if (i % 4 === 0) AU.hat(t, 0.5); return; }
      KIT.drums(i, t, { k: 'x...x...x...x...', s: '....x.......x...', h: '..x...x...x...x.' }, 0.6);
      KIT.harmony(i, t, api.spb, [[43, [55, 59, 62]], [43, [55, 59, 62]], [40, [55, 59, 64]], [40, [55, 59, 64]]], 'x.......x.......', true);
    },

    async run(api) {
      const el = api.el, mode = el.querySelector('#s7mode'), pads = [...el.querySelectorAll('.pad')];
      const list = api.practice ? PRACTICE : SEQS;
      let pasted = [], who = 0;
      list.forEach((seq, si) => {
        const base = si * 8;
        api.at(base - 0.5, () => { who = si; pasted = []; this.drawFace(el, who, pasted); mode.textContent = '보기'; mode.className = 's7-mode see'; });
        seq.forEach(([o, k]) => {
          AU.bell(api.time(base + o), TONE[k], 1);
          api.at(base + o, () => { pads[k].classList.remove('flash'); void pads[k].offsetWidth; pads[k].classList.add('flash'); });
          api.target({
            beat: base + 4 + o, lane: k, x: PADS[k].x, y: 30 + PADS[k].y * 0.6,
            onHit: () => { if (!pasted.includes(k)) pasted.push(k); this.drawFace(el, who, pasted); },
          });
        });
        api.at(base + 3.6, () => { mode.textContent = '따라!'; mode.className = 's7-mode go'; api.strict = true; });
        api.at(base + 7.6, () => { api.strict = false; mode.textContent = ''; mode.className = 's7-mode'; });
      });
      await api.wait(list.length * 8);
      return { pasted };
    },

    reveal(el, d) {
      el.innerHTML = `<div class="rv7"><div id="s7face"></div></div>`;
      this.drawFace(el, 0, [0, 1, 2, 3]);
      el.querySelector('.rv7').classList.add('seams');
    },
  });
})();

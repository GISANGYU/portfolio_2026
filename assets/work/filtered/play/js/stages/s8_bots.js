/* STAGE 8 · 좋아요 공장 — 봇 여론 조작
   정통 리듬 3레인. 떨어지는 하트가 선에 닿는 박자에 그 줄을 탭하면 봇 계정이 좋아요를 누른다. */

(function () {
  // 마디별 패턴: 3줄 × 8칸(8분음표)
  const BARS = [
    ['x...x...', '........', '........'],
    ['x.......', '..x.....', '....x...'],
    ['x...x...', '..x...x.', '........'],
    ['x.x.x.x.', '........', '........'],
    ['x.......', '....x...', '..x...x.'],
    ['..x...x.', 'x...x...', '........'],
    ['x...x...', '..x.....', '......x.'],
    ['x.x.....', '....x.x.', '........'],
    ['x...x...', '..x...x.', '.x...x..'],
    ['x.x.x.x.', '.x.x.x.x', '........'],
    ['x.......', '..x.....', '....x.x.'],
    ['x...x...', 'x...x...', '..x...x.'],
    ['x.x.x...', '......x.', '.......x'],
    ['x...x.x.', '..x.....', '.....x..'],
    ['x.x.x.x.', '........', '.x.x.x.x'],
    ['x.......', 'x.......', 'x.......'],
  ];
  const PRACTICE = [['x...x...', '........', '........'], ['x.......', '..x.....', '....x...']];
  const FALL = 2; // 하트가 떨어지는 데 걸리는 박

  GAME.register({
    no: 8, id: 'bots', name: '좋아요 공장', technique: '봇 여론 조작', input: '3줄 탭',
    line: '하트가 선에 닿을 때 그 줄을 탭', tip: '계정이 언제 만들어졌는지, 활동 기록이 있는지 보라.',
    color: '#ff6b6b', bpm: 140,
    boss: { top: '여론 완성. 이게 민심이다.', ok: '좋아요가 좀 비어. 더 몰아.', bad: '봇이 다 놀고 있잖아. 다시.' },

    setup(el, api) {
      el.innerHTML = `<div class="s8">
        <div class="s8-top"><span>좋아요</span><b id="s8n">0</b><div class="op"><i id="s8op"></i></div></div>
        <div class="s8-field" id="s8f">
          ${[0, 1, 2].map(k => `<div class="lane" data-k="${k}"></div>`).join('')}
          <div class="line"></div>
        </div>
        <div class="s8-bots">${[0, 1, 2].map(k => `<div class="bot" id="s8b${k}">${DR.svg('0 0 80 80', DR.face(40, 42, 30, { skin: '#ced4da', eyes: 'dot', mouth: 'flat' }))}</div>`).join('')}</div>
      </div>`;
      const f = el.querySelector('#s8f');
      api.pointer(el, {
        down(e, t, x) {
          const k = Math.max(0, Math.min(2, Math.floor(x * 3)));
          const b = el.querySelector('#s8b' + k);
          b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit');
          f.children[k].classList.remove('tap'); void f.children[k].offsetWidth; f.children[k].classList.add('tap');
          api.tap(t, k);
        },
      });
    },

    music(i, t, api) {
      if (i < 0) { if (i % 4 === 0) AU.kick(t, 0.7); AU.hat(t, 0.3); return; }
      KIT.drums(i, t, { k: 'x...x...x...x...', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx', o: '..x...x...x...x.' }, 0.75);
      KIT.harmony(i, t, api.spb, [[40, [52, 55, 59]], [36, [52, 55, 60]], [43, [55, 59, 62]], [38, [54, 57, 62]]], 'xoxoxoxoxoxoxoxo', false);
    },

    async run(api) {
      const el = api.el, f = el.querySelector('#s8f'), nEl = el.querySelector('#s8n'), op = el.querySelector('#s8op');
      const list = api.practice ? PRACTICE : BARS;
      const notes = [];
      let likes = 0, got = 0, total = 0;
      list.forEach((bar, bi) => {
        bar.forEach((pat, lane) => {
          for (let s = 0; s < 8; s++) {
            if (pat[s] !== 'x') continue;
            const beat = bi * 4 + s * 0.5;
            total++;
            const n = { beat, lane, el: null };
            notes.push(n);
            api.at(beat - FALL, () => { n.el = KIT.el(`<div class="heart">${DR.svg('-14 -8 28 36', DR.heart(0, 0, 1))}</div>`); f.children[lane].appendChild(n.el); });
            api.target({
              beat, lane, x: 17 + lane * 33, y: 70,
              onHit: () => {
                if (n.el) { n.el.classList.add('pop'); const e = n.el; setTimeout(() => e.remove(), 300); n.el = null; }
                AU.coin(AU.now(), 84 + lane * 3);
                got++; const add = 800 + Math.random() * 1600;
                likes += add; nEl.textContent = KIT.fmt(likes);
                op.style.width = Math.min(100, got / total * 100) + '%';
              },
              onMiss: () => { if (n.el) { n.el.classList.add('miss'); } },
            });
          }
        });
      });
      api.frame(b => {
        for (const n of notes) {
          if (!n.el) continue;
          const y = 82 - (n.beat - b) / FALL * 88;
          n.el.style.top = y + '%';
          if (b > n.beat + 1) { n.el.remove(); n.el = null; }
        }
      });
      await api.wait(list.length * 4 + 0.5);
      return { likes };
    },

    reveal(el) {
      const faces = Array.from({ length: 12 }, () => `<div class="b">${DR.svg('0 0 80 80', DR.face(40, 42, 30, { skin: '#ced4da', eyes: 'dot', mouth: 'flat' }))}<small>가입 1일</small></div>`).join('');
      el.innerHTML = `<div class="rv8">${faces}</div>`;
    },
  });
})();

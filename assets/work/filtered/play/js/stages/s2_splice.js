/* STAGE 2 · 짜깁기 — 발언 편집
   1마디: 인터뷰를 듣는다. 2마디: 같은 박자로 다시 흐를 때 빨간 단어만 탭해서 잡는다. 3마디: 잘라 붙인 말이 헤드라인이 된다. */

(function () {
  // w: 단어, at: 마디 안 박 위치, red: 잡을 단어
  const PHRASES = [
    { words: [['그 가게', 0, 1], ['맛없다는', 1, 1], ['소문은', 2], ['거짓말', 3]] },
    { words: [['저는', 0, 1], ['약속을', 1, 1], ['어긴 적', 2, 1], ['없어요', 3]] },
    { words: [['우리 동네', 0, 1], ['위험하다는', 1, 1], ['말', 2], ['믿지 마세요', 3]] },
    { words: [['이 약', 0, 1], ['효과', 0.5, 1], ['없다는', 1, 1], ['연구는', 2], ['틀렸다', 3]] },
    { words: [['그 선수', 0, 1], ['약물', 1, 1], ['검사', 1.5], ['통과했다', 2.5]] },
    { words: [['시장님은', 0, 1], ['사퇴', 1, 1], ['안 한다고', 2], ['했다', 2.5, 0], ['밝혔다', 3]] },
  ];
  const PRACTICE = [{ words: [['하나', 0], ['둘', 1, 1], ['셋', 2], ['넷', 3, 1]] }];
  const syl = w => w.replace(/\s/g, '').length;

  let last = null;

  GAME.register({
    no: 2, id: 'splice', name: '짜깁기', technique: '발언 짜깁기', input: '빨간 단어에 탭',
    line: '한 번 듣고, 빨간 말만 잡아라', tip: '따옴표 속 말의 앞뒤 문장을 찾아라.',
    color: '#7bdff2', bpm: 100,
    boss: { top: '완벽한 인용이다. 한 글자도 안 지어냈잖아.', ok: '쓸 만해. 조금 더 딱딱 끊어.', bad: '엉뚱한 말까지 붙였잖아. 다시.' },

    setup(el, api) {
      el.innerHTML = `<div class="s2">
        <div class="s2-who" id="s2who"></div>
        <div class="s2-mode" id="s2mode"></div>
        <div class="s2-words" id="s2w"></div>
        <div class="s2-out" id="s2out"><span class="lb">오늘의 이슈</span><p id="s2head"></p></div>
      </div>`;
      this.drawWho(el, false);
      api.pointer(el, { down(e, t) { AU.chak(AU.now()); api.tap(t); } });
    },

    drawWho(el, talk) {
      el.querySelector('#s2who').innerHTML = DR.svg('0 0 200 170', `<rect x="70" y="120" width="60" height="50" fill="#adb5bd" stroke="${DR.INK}" stroke-width="4"/><circle cx="100" cy="112" r="10" fill="${DR.INK}"/>` + DR.person(100, 170, 1.25, { body: '#3a86ff', tie: '#ffbe0b', mouth: talk ? 'open' : 'flat', hair: '#333' }));
    },

    music(i, t, api) {
      if (i < 0) { if (i % 4 === 0) AU.hat(t, 0.4); return; }
      KIT.drums(i, t, { k: 'x......xx.x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.xx' }, 0.8);
      KIT.harmony(i, t, api.spb, [[50, [62, 65, 69, 72]], [43, [59, 62, 65, 67]], [48, [60, 64, 67, 71]], [45, [57, 60, 64, 67]]], 'x.....x...x.....', true);
    },

    async run(api) {
      const el = api.el, wBox = el.querySelector('#s2w'), mode = el.querySelector('#s2mode'), head = el.querySelector('#s2head'), out = el.querySelector('#s2out');
      const list = api.practice ? PRACTICE : PHRASES;
      let b = 0;
      list.forEach((ph, pi) => {
        const base = b, n = ph.words.length;
        const pos = k => ({ x: 14 + (k + 0.5) * (72 / n), y: 58 });
        let blocks = [], grabbed = [];
        api.at(base - 0.6, () => {
          wBox.innerHTML = ph.words.map(([w, , red], k) => `<span class="blk${red ? ' red' : ''}">${w}</span>`).join('');
          blocks = [...wBox.children];
          head.textContent = ''; out.classList.remove('on');
          mode.textContent = '듣기'; mode.className = 's2-mode listen';
        });
        ph.words.forEach(([w, at, red], k) => {
          const n2 = syl(w), next = (ph.words[k + 1] ? ph.words[k + 1][1] : 4), dur = Math.min(next - at, 1) * api.spb * 0.85;
          // 1마디: 듣기
          for (let s = 0; s < n2; s++) AU.voice(api.time(base + at) + s * dur / n2, 60 + ((k * 3 + s * 2) % 7), dur / n2 * 0.9, (k + s) % 5, 0.9);
          api.at(base + at, () => { blocks[k] && blocks[k].classList.add('lit'); this.drawWho(el, true); setTimeout(() => this.drawWho(el, false), 180); });
          // 2마디: 따라 잡기 (같은 말이 작게 다시 흐른다)
          for (let s = 0; s < n2; s++) AU.voice(api.time(base + 4 + at) + s * dur / n2, 60 + ((k * 3 + s * 2) % 7), dur / n2 * 0.9, (k + s) % 5, 0.28);
          api.at(base + 4 + at, () => { blocks[k] && blocks[k].classList.add('ghost'); });
          if (red) {
            api.target({
              beat: base + 4 + at, x: pos(k).x, y: 50,
              onHit: () => { blocks[k] && blocks[k].classList.add('got'); grabbed.push(w); },
              onMiss: () => { blocks[k] && blocks[k].classList.add('lost'); },
            });
          }
        });
        api.at(base + 3.6, () => {
          blocks.forEach(x => x.classList.remove('lit'));
          mode.textContent = '잡아!'; mode.className = 's2-mode grab'; api.strict = true;
        });
        api.at(base + 7.6, () => { api.strict = false; mode.textContent = ''; mode.className = 's2-mode'; });
        // 3마디: 헤드라인
        AU.stamp(api.time(base + 8));
        api.at(base + 8, () => {
          head.textContent = grabbed.length ? `"${grabbed.join(' ')}"` : '...';
          out.classList.add('on');
          last = { words: ph.words.map(x => x[0]), red: ph.words.map(x => !!x[2]), grabbed: grabbed.slice() };
        });
        b += 12;
      });
      await api.wait(b - 1.5);
      return last;
    },

    reveal(el, d) {
      const words = (d && d.words) || ['그 가게', '맛없다는', '소문은', '거짓말'], red = (d && d.red) || [1, 1, 0, 0];
      el.innerHTML = `<div class="rv2"><p class="full">"${words.map((w, k) => red[k] ? `<mark>${w}</mark>` : `<span>${w}</span>`).join(' ')}"</p></div>`;
    },
  });
})();

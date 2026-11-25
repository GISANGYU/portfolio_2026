/* STAGE 1 · 싹둑 — 맥락 자르기
   "착, 착" 하고 들린 간격 그대로 한 박 뒤에 탭하면 가위가 자극적인 부분만 잘라낸다. */

(function () {
  const I = DR.INK;
  const bg = (c) => `<rect width="400" height="300" fill="${c}"/>`;
  const label = (x, y, t, fs, fill) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Pretendard, sans-serif" font-weight="800" font-size="${fs || 22}" fill="${fill || I}">${t}</text>`;

  // 각 장면: 원본 전체 + 잘라낼 영역(crop)
  const SCENES = [
    { // 요리 교실 → 칼 든 남자
      svg: bg('#ffe8cc') + `<rect x="120" y="18" width="160" height="40" rx="8" fill="#fff" stroke="${I}" stroke-width="4"/>` + label(200, 46, '요리 교실') +
        DR.person(110, 280, 1.2, { body: '#577590', apron: true, eyes: 'squint', mouth: 'flat', arm: 'up', hair: '#222' }) + DR.knife(128, 190, 1.2) +
        DR.person(235, 280, 1.1, { body: '#f9c74f', apron: true, mouth: 'grin', hair: '#6d4c41' }) +
        DR.person(330, 280, 1.2, { body: '#fff', hat: 'chef', mouth: 'grin', eyes: 'closed' }) +
        `<rect x="0" y="262" width="400" height="38" fill="#c08457" stroke="${I}" stroke-width="4"/><circle cx="230" cy="258" r="10" fill="#f8961e" stroke="${I}" stroke-width="3"/>`,
      crop: { x: 45, y: 120, w: 150, h: 112 },
    },
    { // 생일 파티 → 우는 아이
      svg: bg('#e0f0ff') + `<path d="M20 30 Q200 70 380 30" stroke="${I}" stroke-width="3" fill="none"/>` + label(200, 70, 'HAPPY BIRTHDAY', 24, '#e63946') +
        DR.person(80, 290, 1.1, { body: '#90be6d', mouth: 'grin', eyes: 'closed', hair: '#333' }) +
        DR.person(200, 290, 1.3, { body: '#f15bb5', mouth: 'grin', eyes: 'cry', hair: '#4a2c2a' }) +
        DR.person(320, 290, 1.1, { body: '#00bbf9', mouth: 'grin', eyes: 'closed', hair: '#222' }) +
        `<rect x="150" y="250" width="100" height="40" rx="6" fill="#fff" stroke="${I}" stroke-width="4"/><rect x="196" y="228" width="8" height="22" fill="#ffd166" stroke="${I}" stroke-width="2"/><path d="M200 214 q6 8 0 14 q-6 -6 0 -14" fill="#f77f00"/>`,
      crop: { x: 160, y: 118, w: 80, h: 60 },
    },
    { // 입고 중 → 텅 빈 진열대
      svg: bg('#f1f1f1') + `<rect x="20" y="50" width="180" height="230" fill="#fff" stroke="${I}" stroke-width="4"/>` +
        [100, 160, 220].map(y => `<rect x="20" y="${y}" width="180" height="10" fill="#adb5bd" stroke="${I}" stroke-width="3"/>`).join('') +
        `<rect x="250" y="20" width="120" height="36" rx="6" fill="#ffd166" stroke="${I}" stroke-width="4"/>` + label(310, 46, '입고 중') +
        DR.person(300, 290, 1.1, { body: '#e76f51', hat: 'cap', capColor: '#264653', mouth: 'smile' }) +
        [0, 1, 2].map(k => `<rect x="${336 - k * 4}" y="${236 - k * 34}" width="50" height="34" fill="#d4a373" stroke="${I}" stroke-width="3"/>`).join(''),
      crop: { x: 25, y: 60, w: 170, h: 128 },
    },
    { // 운동회 줄다리기 → 싸움
      svg: bg('#b7e4c7') + `<rect x="100" y="16" width="200" height="40" rx="8" fill="#fff" stroke="${I}" stroke-width="4"/>` + label(200, 44, '가을 운동회') +
        `<path d="M0 228 L400 228" stroke="#8d6e63" stroke-width="10"/><path d="M200 214 l0 28" stroke="#e63946" stroke-width="6"/>` +
        DR.person(70, 285, 1.05, { body: '#4361ee', eyes: 'angry', mouth: 'strain', arm: 'pull', pullDir: -1 }) +
        DR.person(150, 285, 1.1, { body: '#4361ee', eyes: 'angry', mouth: 'strain', arm: 'pull', pullDir: -1, hair: '#222' }) +
        DR.person(250, 285, 1.1, { body: '#e63946', eyes: 'angry', mouth: 'strain', arm: 'pull', pullDir: 1, hair: '#5a3825' }) +
        DR.person(330, 285, 1.05, { body: '#e63946', eyes: 'angry', mouth: 'strain', arm: 'pull', pullDir: 1 }),
      crop: { x: 115, y: 130, w: 170, h: 90 },
    },
    { // 추모식 묵념 → 조는 사람
      svg: bg('#e9ecef') + `<rect x="120" y="14" width="160" height="40" rx="8" fill="#343a40" stroke="${I}" stroke-width="4"/>` + label(200, 42, '추모식', 22, '#fff') +
        DR.person(90, 290, 1.15, { body: '#212529', tie: '#6c757d', eyes: 'closed', mouth: 'flat', hair: '#222' }) +
        DR.person(200, 290, 1.15, { body: '#212529', tie: '#6c757d', eyes: 'closed', mouth: 'flat', hair: '#555' }) +
        DR.person(310, 290, 1.15, { body: '#212529', tie: '#6c757d', eyes: 'closed', mouth: 'flat', hair: '#333' }) +
        `<circle cx="370" cy="200" r="26" fill="#fff" stroke="${I}" stroke-width="4"/><circle cx="370" cy="200" r="12" fill="#adb5bd"/>`,
      crop: { x: 150, y: 110, w: 100, h: 75 },
    },
  ];
  const sceneSVG = (sc, crop) => `<svg viewBox="${crop ? `${crop.x} ${crop.y} ${crop.w} ${crop.h}` : '0 0 400 300'}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${sc.svg}</svg>`;

  // 패턴: cues = 신호 박, cut = 자를 박, len = 차지하는 박 수
  const P = {
    A: { cues: [0, 1], cut: 2, len: 4 },
    B: { cues: [0, 1, 2], cut: 3, len: 4 },
    C: { cues: [0, 0.5], cut: 1, len: 2 },
    D: { cues: [0, 2], cut: 4, len: 8 },
  };
  const PRACTICE = 'AA', MAIN = 'AABACCABDACBA';

  let st = null;

  GAME.register({
    no: 1, id: 'cut', name: '싹둑', technique: '맥락 자르기', input: '탭',
    line: '"착, 착" 다음 박자에 잘라라', tip: '잘린 사진 바깥에 무엇이 있었을까?',
    color: '#ffd23f', bpm: 112,
    boss: { top: '이거지. 조회수 폭발이다.', ok: '나쁘지 않아. 좀 더 날카롭게.', bad: '박자가 안 맞잖아. 다시 잘라.' },

    setup(el, api) {
      st = { views: 0, last: 0 };
      el.innerHTML = `<div class="s1">
        <div class="s1-views">조회수 <b id="s1v">0</b></div>
        <div class="s1-sc" id="s1sc"><i class="bl a"></i><i class="bl b"></i><i class="pin"></i></div>
        <div class="s1-lane" id="s1lane"></div>
        <div class="s1-belt"></div>
        <div class="s1-board" id="s1board"></div>
      </div>`;
      const sc = el.querySelector('#s1sc');
      api.pointer(el, {
        down(e, t) {
          AU.snip(AU.now());
          sc.classList.remove('snap'); void sc.offsetWidth; sc.classList.add('snap');
          api.tap(t);
        },
      });
    },

    music(i, t, api) {
      if (i < 0) { if (i % 2 === 0) AU.hat(t, 0.4); return; }
      KIT.drums(i, t, { k: 'x...x...x...x...', s: '....x.......x...', h: '..x...x...x...x.', sh: 'x.x.x.x.x.x.x.x.' }, 0.9);
      KIT.harmony(i, t, api.spb, [[48, [60, 64, 67]], [45, [57, 60, 64]], [41, [57, 60, 65]], [43, [59, 62, 67]]], 'x..x..x.x..x.x..', true);
    },

    async run(api) {
      const el = api.el, lane = el.querySelector('#s1lane'), board = el.querySelector('#s1board'), sc = el.querySelector('#s1sc'), vEl = el.querySelector('#s1v');
      const seq = (api.practice ? PRACTICE : MAIN).split('');
      let b = 0, n = 0;
      for (const key of seq) {
        const p = P[key], base = b, k = n++ % SCENES.length, scene = SCENES[k];
        p.cues.forEach(c => {
          AU.chak(api.time(base + c));
          api.at(base + c, () => { sc.classList.remove('cue'); void sc.offsetWidth; sc.classList.add('cue'); });
        });
        let card;
        api.at(base - 0.75, () => {
          card = KIT.el(`<div class="s1-card"><div class="in">${sceneSVG(scene)}</div></div>`);
          lane.appendChild(card);
          requestAnimationFrame(() => card.classList.add('on'));
        });
        api.target({
          beat: base + p.cut, x: 50, y: 42,
          onHit(g) {
            if (!card) return;
            card.querySelector('.in').innerHTML = sceneSVG(scene, scene.crop);
            card.classList.add('cut');
            st.last = k;
            const add = g === 'perfect' ? 42000 + Math.random() * 9000 : 18000 + Math.random() * 6000;
            KIT.tween(400, e => { vEl.textContent = KIT.fmt(st.views + add * e); }).then(() => { st.views += add; });
            const th = KIT.el(`<div class="th">${sceneSVG(scene, scene.crop)}</div>`);
            board.prepend(th);
            while (board.children.length > 5) board.lastChild.remove();
          },
          onMiss() { if (card) card.classList.add('fail'); },
        });
        api.at(base + p.cut + 0.9, () => { if (card) { card.classList.add('off'); const c = card; setTimeout(() => c.remove(), 500); } });
        b += p.len;
      }
      await api.wait(b + 0.5);
      return { last: st.last };
    },

    reveal(el, data) {
      const sc = SCENES[data.last || 0];
      el.innerHTML = `<div class="rv1">${sceneSVG(sc)}<div class="box" style="left:${sc.crop.x / 4}%;top:${sc.crop.y / 3}%;width:${sc.crop.w / 4}%;height:${sc.crop.h / 3}%"></div></div>`;
    },
  });
})();

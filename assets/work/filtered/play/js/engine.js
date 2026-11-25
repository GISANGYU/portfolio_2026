/* FILTERED — 엔진: 화면 전환, 박자 시계, 판정, 결과, 스테이지 맵
   입력은 탭(pointerdown)과 드래그(pointermove)만 쓴다. 키보드·휠·호버 없음.

   스테이지 모듈 형식 (js/stages/*.js 에서 GAME.register 로 등록):
   {
     no, id, name, technique, input, line, tip, color, bpm,
     boss: { top, ok, bad },           // 결과 한 줄
     setup(el, api),                    // DOM 만들기
     music(i, t, api),                  // 16분음표 i번째(음수 = 인트로 마디)에 악기 예약
     async run(api) -> data,            // 차트를 예약하고, 끝나면 data 반환
     reveal(el, data),                  // 원본 되감기 그림
   }
*/

window.GAME = (function () {
  const stages = [];
  const root = document.getElementById('game');
  const PERFECT = 0.075, GOOD = 0.15;
  const W = { perfect: 1, good: 0.65, miss: 0 };
  let flow = 0;
  const AUTO = /[?&]auto=1/.test(location.search); // 개발용 자동 플레이

  let save = {};
  try { save = JSON.parse(localStorage.getItem('filtered_edit_v2') || '{}') || {}; } catch (e) { save = {}; }
  const persist = () => { try { localStorage.setItem('filtered_edit_v2', JSON.stringify(save)); } catch (e) {} };

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tapOnce = el => new Promise(r => el.addEventListener('pointerdown', function h(e) { e.preventDefault(); el.removeEventListener('pointerdown', h); r(); }));

  function show(html, cls, color) {
    root.className = 'scr ' + (cls || '');
    root.style.setProperty('--c', color || '#f7f3ea');
    root.innerHTML = html;
  }

  /* ───────── 타이틀 ───────── */
  function title() {
    flow++;
    show(`<div class="title">
      <p class="kicker">허위조작정보 리듬 편집실</p>
      <h1><span>FILTE</span><span class="cut">RED</span></h1>
      <div class="scissor"></div>
      <button class="big" id="go">탭해서 출근</button>
      <p class="small">소리를 켜 주세요 · 휴대폰은 무음 모드 해제</p>
    </div>`, 'is-title', '#ffe45e');
    root.querySelector('#go').addEventListener('pointerdown', e => { e.preventDefault(); AU.init(); AU.coin(AU.now(), 84); map(); }, { once: true });
  }

  /* ───────── 스테이지 맵 ───────── */
  const GRADE_TXT = { top: '최고', ok: '괜찮네', bad: '다시 해' };
  function map() {
    flow++;
    const cells = stages.map(s => {
      const g = save[s.id];
      return `<button class="mon" data-id="${s.id}" style="--mc:${s.color}">
        <span class="no">${s.no}</span><span class="nm">${esc(s.name)}</span>
        ${g ? `<span class="gd g-${g}">${GRADE_TXT[g]}</span>` : ''}
      </button>`;
    }).join('');
    show(`<div class="map">
      <header><b>오늘의 이슈</b><span>조작 편집실</span></header>
      <div class="grid">${cells}</div>
      <button class="home" id="home">처음으로</button>
    </div>`, 'is-map', '#2b2d42');
    root.querySelectorAll('.mon').forEach(b => b.addEventListener('pointerdown', e => {
      e.preventDefault(); AU.init(); AU.coin(AU.now(), 79);
      intro(stages.find(s => s.id === b.dataset.id));
    }));
    root.querySelector('#home').addEventListener('pointerdown', e => { e.preventDefault(); title(); });
  }

  /* ───────── 스테이지 소개 ───────── */
  async function intro(st) {
    const my = ++flow;
    show(`<div class="intro">
      <p class="no">STAGE ${st.no}</p>
      <h2>${esc(st.name)}</h2>
      <p class="line">${esc(st.line)}</p>
      <p class="inp">${esc(st.input)}</p>
      <p class="tapgo">탭해서 시작</p>
    </div>`, 'is-intro', st.color);
    await tapOnce(root);
    if (my !== flow) return;
    AU.init();

    // 연습: 한 번이라도 맞히면 통과, 최대 3번
    let pr;
    for (let k = 0; k < 3; k++) {
      pr = await session(st, true, my);
      if (my !== flow) return;
      if (pr.hits > 0) break;
      await banner('한 번 더', 900, my);
    }
    if (my !== flow) return;
    await banner('좋아, 실전!', 1000, my);
    if (my !== flow) return;

    const res = await session(st, false, my);
    if (my !== flow) return;
    await reveal(st, res, my);
    if (my !== flow) return;
    result(st, res);
  }

  async function banner(text, ms, my) {
    if (my !== flow) return;
    show(`<div class="banner"><p>${esc(text)}</p></div>`, 'is-banner', root.style.getPropertyValue('--c'));
    await sleep(ms);
  }

  /* ───────── 한 판 ───────── */
  function session(st, practice, my) {
    return new Promise(async resolve => {
      show(`<div class="play">
        <div class="stagebox" id="sb"></div>
        <div class="fx" id="fx"></div>
        <div class="hud">${practice ? '<span class="tag">연습</span>' : ''}<button class="quit" id="quit">나가기</button></div>
      </div>`, 'is-play', st.color);
      const sb = root.querySelector('#sb'), fx = root.querySelector('#fx');
      const bus = AU.session();
      const bpm = st.bpm, spb = 60 / bpm, lead = 4;
      const lat = AU.latency();
      const t0 = AU.now() + 0.35 + lead * spb;
      const timers = [], frames = [], targets = [];
      const tally = { perfect: 0, good: 0, miss: 0 };
      let raf = 0, ended = false;

      const api = {
        bpm, spb, t0, practice, lat, el: sb, fx, strict: false,
        time: b => t0 + b * spb,
        beatNow: () => (AU.now() - lat - t0) / spb,
        audioBeat: () => (AU.now() - t0) / spb,
        inputTime: () => AU.now() - lat,
        at(b, fn) { timers.push({ b, fn }); },
        wait(b) { return new Promise(r => timers.push({ b, fn: r })); },
        frame(fn) { frames.push(fn); },
        target(o) { const tg = Object.assign({ done: false }, o, { t: t0 + o.beat * spb }); targets.push(tg); return tg; },
        tap(t, lane) {
          let best = null, bd = 1e9;
          for (const tg of targets) {
            if (tg.done || tg.noTap) continue;
            if (lane != null && tg.lane != null && tg.lane !== lane) continue;
            const d = Math.abs(t - tg.t);
            if (d < bd) { bd = d; best = tg; }
          }
          if (best && bd <= GOOD) {
            best.done = true;
            const g = bd <= PERFECT ? 'perfect' : 'good';
            api.hit(g, best.x, best.y);
            if (best.onHit) best.onHit(g, t - best.t);
            return best;
          }
          if (api.strict) api.hit('miss');
          return null;
        },
        judge(tg, g) { if (tg.done) return; tg.done = true; api.hit(g, tg.x, tg.y); },
        hit(g, x, y) {
          if (ended) return;
          tally[g]++;
          const p = document.createElement('div');
          p.className = 'pop p-' + g;
          p.textContent = g === 'perfect' ? '딱!' : g === 'good' ? '좋아' : '놓침';
          p.style.left = (x == null ? 50 : x) + '%';
          p.style.top = (y == null ? 18 : y) + '%';
          fx.appendChild(p);
          setTimeout(() => p.remove(), 700);
          if (g === 'miss') { AU.miss(AU.now()); if (navigator.vibrate) try { navigator.vibrate(25); } catch (e) {} }
        },
        pointer(el, h) {
          const pos = e => { const r = sb.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
          el.addEventListener('pointerdown', e => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (_) {} const t = api.inputTime(); h.down && h.down(e, t, ...pos(e)); });
          el.addEventListener('pointermove', e => { const t = api.inputTime(); h.move && h.move(e, t, ...pos(e)); });
          const up = e => { const t = api.inputTime(); h.up && h.up(e, t, ...pos(e)); };
          el.addEventListener('pointerup', up);
          el.addEventListener('pointercancel', up);
        },
      };

      // 카운트인 (인트로 마디 4박)
      for (let b = -lead; b < 0; b++) AU.wood(api.time(b), b === -lead ? 91 : 84, 0.8);

      st.setup(sb, api);
      const seq = st.ownClock ? null : AU.sequencer(bpm, t0, (i, t) => st.music(i, t, api), -lead * 4);

      // 판정·진행: 10ms 타이머 (탭이 가려져도 멈추지 않음)
      function logic() {
        if (ended) return;
        const b = api.beatNow();
        const due = timers.filter(x => x.b <= b).sort((p, q) => p.b - q.b);
        if (due.length) { for (const d of due) timers.splice(timers.indexOf(d), 1); due.forEach(d => d.fn()); }
        const heard = AU.now() - lat;
        if (AUTO) for (const tg of targets) if (!tg.done && !tg.noTap && heard >= tg.t) api.tap(tg.t, tg.lane);
        for (const tg of targets) {
          if (!tg.done && heard > tg.t + GOOD) { tg.done = true; api.hit('miss', tg.x, tg.y); if (tg.onMiss) tg.onMiss(); }
        }
      }
      const logicId = setInterval(logic, 10);
      // 화면 애니메이션: rAF
      function loop() {
        if (ended) return;
        frames.forEach(f => f(api.beatNow()));
        raf = requestAnimationFrame(loop);
      }
      raf = requestAnimationFrame(loop);

      function finish(data) {
        if (ended) return;
        ended = true;
        cancelAnimationFrame(raf); clearInterval(logicId);
        if (seq) seq.stop();
        if (st.stop) st.stop();
        bus.end(0.35);
        const total = tally.perfect + tally.good + tally.miss;
        const score = total ? (tally.perfect * W.perfect + tally.good * W.good) / total : 0;
        resolve({ score, hits: tally.perfect + tally.good, total, tally, data });
      }

      root.querySelector('#quit').addEventListener('pointerdown', e => { e.preventDefault(); finish(null); map(); });
      window.__api = api;
      const data = await st.run(api);
      if (my !== flow) return finish(null);
      await sleep(250);
      finish(data);
    });
  }

  /* ───────── 원본 되감기 ───────── */
  async function reveal(st, res, my) {
    show(`<div class="reveal">
      <p class="rw">원본 되감기</p>
      <div class="rv" id="rv"></div>
      <div class="tech"><span>${esc(st.technique)}</span></div>
      <p class="tip">${esc(st.tip)}</p>
      <p class="tapgo">탭해서 계속</p>
    </div>`, 'is-reveal', st.color);
    AU.tape(AU.now(), false);
    st.reveal(root.querySelector('#rv'), res.data || {});
    setTimeout(() => { const t = root.querySelector('.tech'); if (t) { t.classList.add('in'); AU.stamp(AU.now()); } }, 1200);
    await sleep(1400);
    if (my !== flow) return;
    await tapOnce(root);
  }

  /* ───────── 결과 ───────── */
  function result(st, res) {
    const grade = res.score >= 0.85 ? 'top' : res.score >= 0.6 ? 'ok' : 'bad';
    const order = { bad: 0, ok: 1, top: 2 };
    if (!save[st.id] || order[grade] > order[save[st.id]]) { save[st.id] = grade; persist(); }
    show(`<div class="result">
      <p class="no">STAGE ${st.no} · ${esc(st.name)}</p>
      <div class="boss"><div class="bf">${DR.svg('0 0 120 120', DR.face(60, 62, 44, { hair: '#3a2a22', eyes: grade === 'bad' ? 'angry' : grade === 'top' ? 'closed' : 'dot', mouth: grade === 'bad' ? 'frown' : grade === 'top' ? 'grin' : 'flat' }))}</div>
        <p class="say">${esc(st.boss[grade])}</p></div>
      <div class="grade g-${grade}">${GRADE_TXT[grade]}</div>
      <p class="acc">정확도 ${Math.round(res.score * 100)}%</p>
      <div class="btns"><button id="again">다시</button><button id="next" class="pri">편집실로</button></div>
    </div>`, 'is-result', st.color);
    AU.fanfare(AU.now() + 0.1, grade !== 'bad');
    root.querySelector('#again').addEventListener('pointerdown', e => { e.preventDefault(); intro(st); });
    root.querySelector('#next').addEventListener('pointerdown', e => { e.preventDefault(); map(); });
  }

  function register(s) { stages.push(s); stages.sort((a, b) => a.no - b.no); }

  function start() {
    const q = new URLSearchParams(location.search).get('s');
    if (q) { const st = stages.find(s => String(s.no) === q); if (st) { show('<div class="banner"><p>탭</p></div>', 'is-banner', st.color); tapOnce(root).then(() => { AU.init(); intro(st); }); return; } }
    title();
  }

  return { register, start, stages };
})();

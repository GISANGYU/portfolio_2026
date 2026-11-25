/* STAGE 6 · 느리게 — 영상 속도 조작
   다이얼을 돌려 연설 영상을 늦춘다. 오른쪽 메트로놈(목표 템포)과 영상의 박자가 딱 맞으면 성공.
   이 스테이지는 음악 템포 자체가 플레이어 손에 달려 있어서, 자체 시계로 음악을 돌린다. */

(function () {
  const BASE = 120;
  const SEGS = [{ target: 0.8 }, { target: 0.66 }, { target: 0.74 }];
  const PRACTICE = [{ target: 0.8, settle: 3, judged: 3 }];
  const CHORDS = [[45, [57, 60, 64]], [41, [57, 60, 65]], [43, [59, 62, 67]], [40, [55, 59, 64]]];

  let S = null;

  GAME.register({
    no: 6, id: 'slow', name: '느리게', technique: '속도 조작', input: '다이얼 돌리기',
    line: '메트로놈과 박자가 맞을 때까지 늦춰라', tip: '목소리와 배경 소리의 속도가 자연스러운지 들어라.',
    color: '#ff99c8', bpm: 120, ownClock: true,
    boss: { top: '완벽하게 취한 목소리네. 클립 뽑아.', ok: '살짝 어긋나. 귀를 더 열어.', bad: '박자가 따로 놀잖아. 다시.' },

    setup(el, api) {
      S = { r: 1, p: 0, lastT: 0, next8: 0, v: 0, timer: 0, seg: null };
      el.innerHTML = `<div class="s6">
        <div class="s6-tv"><div id="s6man"></div><span class="spd" id="s6spd">1.00x</span></div>
        <div class="s6-rings"><div class="ring me" id="s6me"><span>영상</span></div><div class="ring ref" id="s6ref"><span>목표</span></div></div>
        <div class="s6-dial" id="s6dial"><div class="knob" id="s6knob"><i></i></div><span class="lo">느리게</span><span class="hi">원래</span></div>
      </div>`;
      this.drawMan(el, 0, false);
      const dial = el.querySelector('#s6dial');
      let lastA = null;
      const ang = e => { const r = dial.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)); };
      dial.addEventListener('pointerdown', e => { e.preventDefault(); try { dial.setPointerCapture(e.pointerId); } catch (_) {} lastA = ang(e); });
      dial.addEventListener('pointermove', e => {
        if (lastA == null) return;
        const a = ang(e); let d = a - lastA; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; lastA = a;
        S.v = Math.max(0, Math.min(1, S.v + d / (Math.PI * 1.4)));
        S.r = 1 - 0.5 * S.v;
        el.querySelector('#s6knob').style.transform = `rotate(${-135 + S.v * 270}deg)`;
        el.querySelector('#s6spd').textContent = S.r.toFixed(2) + 'x';
      });
      const up = () => { lastA = null; };
      dial.addEventListener('pointerup', up); dial.addEventListener('pointercancel', up);
    },

    drawMan(el, droop, talk) {
      const e = el.querySelector('#s6man'); if (!e) return;
      const eyes = droop > 0.35 ? 'closed' : droop > 0.15 ? 'squint' : 'dot';
      e.innerHTML = DR.svg('0 0 300 200', `<rect width="300" height="200" fill="#5c677d"/><rect x="95" y="140" width="110" height="60" fill="#8d6e63" stroke="${DR.INK}" stroke-width="4"/><circle cx="150" cy="138" r="8" fill="${DR.INK}"/>` +
        `<g transform="rotate(${droop * 14} 150 150)">` + DR.person(150, 190, 1.35, { body: '#2b2d42', tie: '#d90429', mouth: talk ? 'open' : 'flat', eyes, hair: '#adb5bd', blush: droop > 0.2 }) + '</g>');
    },

    stop() { if (S && S.timer) clearInterval(S.timer); },

    async run(api) {
      const el = api.el;
      const me = el.querySelector('#s6me'), ref = el.querySelector('#s6ref');
      const pulse = n => { n.classList.remove('p'); void n.offsetWidth; n.classList.add('p'); };
      const segs = api.practice ? PRACTICE : SEGS.map(s => Object.assign({ settle: 4, judged: 8 }, s));

      // 자체 시계: 플레이어 속도 r 로 음악을 8분음표마다 실시간 재생
      S.p = 0; S.next8 = 0; S.lastT = api.t0;
      S.timer = setInterval(() => {
        const now = AU.now();
        if (now < api.t0) { S.lastT = now; return; }
        const dt = now - S.lastT; S.lastT = now;
        S.p += dt * (BASE / 60) * S.r;
        // 목표에 가까우면 위상을 목표 메트로놈 쪽으로 살짝 당긴다
        if (S.seg && Math.abs(S.r - S.seg.target) < 0.03) {
          const q = (now - S.seg.t0) / S.seg.spb, d = ((q - S.p) % 1 + 1.5) % 1 - 0.5;
          S.p += d * 0.06;
        }
        while (S.next8 <= S.p * 2) {
          const k = S.next8, t = now + 0.03, spb = 60 / (BASE * S.r);
          const beat = Math.floor(k / 2), bar = Math.floor(beat / 4), onBeat = k % 2 === 0;
          const [root, notes] = CHORDS[bar % 4];
          if (onBeat && beat % 2 === 0) AU.kick(t, 0.9);
          if (onBeat && beat % 2 === 1) AU.snare(t, 0.9);
          AU.hat(t, 0.5);
          if (onBeat) AU.bass(t, root, spb * 0.4);
          if (onBeat && beat % 4 === 0) AU.pad(t, notes, spb * 3.5, 1);
          if (onBeat) {
            AU.voice(t, 55 - (1 - S.r) * 10, spb * 0.5, beat % 5, 0.9, null, 1);
            setTimeout(() => { pulse(me); this.drawMan(el, 1 - S.r, true); setTimeout(() => this.drawMan(el, 1 - S.r, false), 120); }, 30 + api.lat * 1000);
          }
          S.next8++;
        }
      }, 10);

      // 목표 메트로놈: 오디오 시각에 정확히 예약하고, 박마다 속도 차이로 판정
      let tStart = api.t0 + 0.2;
      for (const sg of segs) {
        const spb = 60 / (BASE * sg.target), n = sg.settle + sg.judged;
        const seg = { t0: tStart, spb, target: sg.target };
        const segBeat = (tStart - api.t0) / api.spb;
        api.at(segBeat - 0.3, () => { S.seg = seg; });
        for (let k = 0; k < n; k++) {
          const t = tStart + k * spb, eb = (t - api.t0) / api.spb;
          AU.wood(t, k % 4 === 0 ? 96 : 89, 1.3);
          api.at(eb, () => pulse(ref));
          if (k >= sg.settle) {
            const tg = api.target({ beat: eb, noTap: true, x: 72, y: 50 });
            api.at(eb - 0.05, () => { const d = Math.abs(S.r - sg.target); api.judge(tg, d <= 0.025 ? 'perfect' : d <= 0.06 ? 'good' : 'miss'); });
          }
        }
        tStart += n * spb + 1.2;
        // 구간이 바뀌면 테이프 되감기
        const back = (tStart - 0.9 - api.t0) / api.spb;
        AU.tape(tStart - 0.9, true);
        api.at(back, () => { S.v = 0; S.r = 1; el.querySelector('#s6knob').style.transform = 'rotate(-135deg)'; el.querySelector('#s6spd').textContent = '1.00x'; });
      }
      await api.wait((tStart - api.t0) / api.spb);
      clearInterval(S.timer);
      return { r: segs[segs.length - 1].target };
    },

    reveal(el) {
      el.innerHTML = `<div class="rv6"><div id="s6man"></div><span class="spd">1.00x</span></div>`;
      this.drawMan(el, 0, true);
    },
  });
})();

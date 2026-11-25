/* FILTERED — 오디오: 신디사이저 + 시퀀서 (WebAudio 코드 합성, 외부 음원 없음)
   모든 소리는 "오디오 시각 t"에 예약된다. 판정도 같은 시계를 쓴다. */

window.AU = (function () {
  let ctx = null, master, music, sfx, noiseBuf;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = 0.9;
    master.connect(comp).connect(ctx.destination);
    music = ctx.createGain(); music.gain.value = 0.55; music.connect(master);
    sfx = ctx.createGain(); sfx.gain.value = 1; sfx.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // iOS 무음 해제용 빈 소리
    const s = ctx.createBufferSource(); s.buffer = ctx.createBuffer(1, 1, 22050); s.connect(ctx.destination); s.start(0);
    return ctx;
  }
  const now = () => (ctx ? ctx.currentTime : 0);
  // 소리가 귀에 닿기까지의 지연 (판정·화면 보정용)
  const latency = () => (ctx ? Math.min(0.2, (ctx.outputLatency || 0) + (ctx.baseLatency || 0.01)) : 0);
  const m2f = m => 440 * Math.pow(2, (m - 69) / 12);

  function g(t, peak, a, d, bus) {
    const n = ctx.createGain();
    n.gain.setValueAtTime(0.0001, t);
    n.gain.exponentialRampToValueAtTime(peak, t + a);
    n.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    n.connect(bus || sfx);
    return n;
  }
  function osc(type, f, t, dur, out) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    o.connect(out); o.start(t); o.stop(t + dur + 0.05); return o;
  }
  function noise(t, dur, out, filterType, freq, q) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = filterType || 'highpass'; f.frequency.value = freq || 6000; if (q) f.Q.value = q;
    s.connect(f).connect(out); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
    return f;
  }

  /* ── 드럼 ── */
  function kick(t, v, bus) { const o = osc('sine', 150, t, 0.35, g(t, 0.95 * (v || 1), 0.002, 0.32, bus || music)); o.frequency.exponentialRampToValueAtTime(42, t + 0.14); }
  function snare(t, v, bus) { noise(t, 0.18, g(t, 0.55 * (v || 1), 0.002, 0.16, bus || music), 'bandpass', 1900, 0.7); osc('triangle', 190, t, 0.1, g(t, 0.35 * (v || 1), 0.002, 0.08, bus || music)); }
  function hat(t, v, open, bus) { noise(t, open ? 0.22 : 0.05, g(t, 0.22 * (v || 1), 0.001, open ? 0.2 : 0.04, bus || music), 'highpass', 7500); }
  function clap(t, v, bus) { for (let i = 0; i < 3; i++) noise(t + i * 0.012, 0.08, g(t + i * 0.012, 0.35 * (v || 1), 0.001, i === 2 ? 0.14 : 0.02, bus || music), 'bandpass', 1400, 1.2); }
  function shaker(t, v, bus) { noise(t, 0.07, g(t, 0.12 * (v || 1), 0.02, 0.05, bus || music), 'highpass', 5000); }
  function wood(t, midi, v, bus) { osc('sine', m2f(midi || 84), t, 0.08, g(t, 0.5 * (v || 1), 0.001, 0.06, bus || sfx)); osc('square', m2f((midi || 84) + 12), t, 0.03, g(t, 0.06 * (v || 1), 0.001, 0.02, bus || sfx)); }

  /* ── 음정 악기 ── */
  function bass(t, midi, dur, v, bus) {
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(220, t + dur);
    f.connect(g(t, 0.42 * (v || 1), 0.005, dur, bus || music));
    osc('sawtooth', m2f(midi), t, dur, f); osc('square', m2f(midi - 12), t, dur, f);
  }
  function pluck(t, midi, dur, v, type, bus) {
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(3200, t); f.frequency.exponentialRampToValueAtTime(500, t + dur);
    f.connect(g(t, 0.2 * (v || 1), 0.004, dur, bus || music));
    osc(type || 'square', m2f(midi), t, dur, f);
  }
  function pad(t, midis, dur, v, bus) { midis.forEach(m => osc('triangle', m2f(m), t, dur, g(t, 0.07 * (v || 1), 0.04, dur, bus || music))); }
  function bell(t, midi, v, bus) { osc('sine', m2f(midi), t, 0.6, g(t, 0.25 * (v || 1), 0.002, 0.5, bus || music)); osc('sine', m2f(midi) * 2.76, t, 0.2, g(t, 0.08 * (v || 1), 0.002, 0.15, bus || music)); }

  // 말소리 흉내 (동물의숲식 옹알이). vowel: 0~4
  const FORM = [800, 1150, 400, 500, 350];
  function voice(t, midi, dur, vowel, v, bus, rate) {
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = FORM[(vowel || 0) % 5] * (rate || 1); f.Q.value = 2.2;
    f.connect(g(t, 0.55 * (v || 1), 0.01, dur, bus || sfx));
    const o = osc('sawtooth', m2f(midi) * (rate || 1), t, dur, f);
    o.frequency.linearRampToValueAtTime(m2f(midi - 1) * (rate || 1), t + dur);
    osc('square', m2f(midi) * (rate || 1), t, dur, g(t, 0.04 * (v || 1), 0.01, dur, bus || sfx));
  }

  /* ── 효과음 ── */
  function snip(t) { noise(t, 0.05, g(t, 0.6, 0.001, 0.05), 'highpass', 4000); noise(t + 0.06, 0.05, g(t + 0.06, 0.8, 0.001, 0.06), 'highpass', 3000); osc('triangle', 2400, t + 0.06, 0.04, g(t + 0.06, 0.12, 0.001, 0.03)); }
  function chak(t) { noise(t, 0.04, g(t, 0.5, 0.001, 0.035), 'bandpass', 3500, 2); }
  function thud(t) { const o = osc('sine', 110, t, 0.25, g(t, 0.8, 0.002, 0.22)); o.frequency.exponentialRampToValueAtTime(50, t + 0.2); noise(t, 0.08, g(t, 0.25, 0.001, 0.07), 'lowpass', 600); }
  function stamp(t) { noise(t, 0.12, g(t, 0.9, 0.001, 0.12), 'lowpass', 900); const o = osc('square', 90, t, 0.1, g(t, 0.3, 0.001, 0.09)); o.frequency.exponentialRampToValueAtTime(45, t + 0.1); }
  function whoosh(t, dur) { const f = noise(t, dur || 0.25, g(t, 0.25, (dur || 0.25) * 0.6, (dur || 0.25) * 0.4), 'bandpass', 800, 1); f.frequency.exponentialRampToValueAtTime(4000, t + (dur || 0.25)); }
  function coin(t, midi) { osc('square', m2f(midi || 88), t, 0.06, g(t, 0.12, 0.001, 0.05)); osc('square', m2f((midi || 88) + 7), t + 0.06, 0.12, g(t + 0.06, 0.12, 0.001, 0.1)); }
  function swish(t) { const f = noise(t, 0.12, g(t, 0.4, 0.02, 0.1), 'bandpass', 1500, 2); f.frequency.exponentialRampToValueAtTime(6000, t + 0.12); }
  function rub(t) { noise(t, 0.05, g(t, 0.18, 0.005, 0.04), 'bandpass', 2600, 3); }
  function lock(t) { osc('square', m2f(72), t, 0.05, g(t, 0.25, 0.001, 0.04)); osc('square', m2f(84), t + 0.04, 0.1, g(t + 0.04, 0.2, 0.001, 0.09)); kick(t, 0.7, sfx); }
  function miss(t) { const o = osc('square', 220, t, 0.18, g(t, 0.1, 0.002, 0.17)); o.frequency.linearRampToValueAtTime(150, t + 0.17); }
  function tape(t, up) { const o = osc('sawtooth', up ? 200 : 900, t, 0.5, g(t, 0.12, 0.01, 0.48)); o.frequency.exponentialRampToValueAtTime(up ? 900 : 150, t + 0.5); }
  function fanfare(t, good) {
    const seq = good ? [72, 76, 79, 84] : [67, 64, 60];
    seq.forEach((m, i) => { pluck(t + i * 0.1, m, 0.3, 1.2, 'square', sfx); });
  }

  /* ── 시퀀서: 16분음표 단위로 step(i, t) 호출 ── */
  function sequencer(bpm, t0, stepFn, fromStep) {
    const spb = 60 / bpm, sps = spb / 4;
    let i = fromStep || 0, alive = true;
    function tick() {
      if (!alive) return;
      while (t0 + i * sps < now() + 0.15) {
        const t = t0 + i * sps;
        if (t >= now() - 0.02) stepFn(i, t);
        i++;
      }
    }
    const id = setInterval(tick, 20); tick();
    return { stop() { alive = false; clearInterval(id); } };
  }

  // 패턴 문자열 헬퍼: 'x...x...' 에서 i번째가 x면 true
  const on = (pat, i) => { const c = pat[i % pat.length]; return c === 'x' || c === 'X' ? (c === 'X' ? 1.2 : 1) : 0; };

  // 스테이지 한 판 전용 버스. end()하면 미리 예약된 소리까지 전부 끊긴다
  function session() {
    const baseMusic = music, baseSfx = sfx;
    const m = ctx.createGain(); m.gain.value = 0.55; m.connect(master);
    const x = ctx.createGain(); x.gain.value = 1; x.connect(master);
    music = m; sfx = x;
    return {
      end(fade) {
        const t = now(), d = fade == null ? 0.3 : fade;
        [m, x].forEach(n => { n.gain.cancelScheduledValues(t); n.gain.setValueAtTime(n.gain.value, t); n.gain.linearRampToValueAtTime(0, t + d); });
        setTimeout(() => { try { m.disconnect(); x.disconnect(); } catch (e) {} }, d * 1000 + 100);
        if (music === m) music = baseMusic;
        if (sfx === x) sfx = baseSfx;
      },
    };
  }

  function fadeMusic(t) { music.gain.cancelScheduledValues(now()); music.gain.setValueAtTime(music.gain.value, now()); music.gain.linearRampToValueAtTime(0.0001, now() + (t || 0.4)); setTimeout(() => { music.gain.setValueAtTime(0.55, now()); }, (t || 0.4) * 1000 + 60); }

  return {
    init, now, latency, m2f, on, sequencer, fadeMusic, session,
    get ctx() { return ctx; }, get sfxBus() { return sfx; }, get musicBus() { return music; },
    kick, snare, hat, clap, shaker, wood, bass, pluck, pad, bell, voice,
    snip, chak, thud, stamp, whoosh, coin, swish, rub, lock, miss, tape, fanfare,
  };
})();

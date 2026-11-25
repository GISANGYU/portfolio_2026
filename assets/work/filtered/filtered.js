/* FILTERED 상세 페이지 — 게임 불러오기 · 박자 판정 체험 · 버전 탭 · 영상 */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 1. 게임 불러오기 */
  var ph = $("[data-game]");
  if (ph) $("[data-act=load]", ph).addEventListener("click", function () {
    var f = document.createElement("iframe");
    f.src = "assets/work/filtered/play/index.html"; f.title = "FILTERED 조작 편집실"; f.allow = "autoplay";
    ph.innerHTML = ""; ph.appendChild(f);
    f.addEventListener("load", function () { try { f.contentWindow.focus(); } catch (e) {} });
  });

  /* 2. 박자 판정 체험 — 게임 엔진과 같은 규칙 */
  var B = $("[data-beat]");
  if (B) {
    var q = function (k) { return $("[data-b=" + k + "]", B); };
    var BPM = 100, SPB = 60 / BPM, LEAD = 4, PERFECT = 0.075, GOOD = 0.15;
    var ctx = null, running = false, t0 = 0, nextBeat = 0, sched = null, ui = null, beats = [];
    var tally = { perfect: 0, good: 0, miss: 0 };
    var dots = B.querySelectorAll(".fl-dots i"), btn = q("start"), tap = q("tap"), marks = q("marks"), log = q("log");
    var lat = function () { return ctx ? Math.min(0.2, (ctx.outputLatency || 0) + (ctx.baseLatency || 0.01)) : 0; };
    function click(t, hi, count) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = count ? "triangle" : "square"; o.frequency.value = hi ? 1568 : count ? 880 : 1046;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(count ? 0.25 : 0.18, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.1);
    }
    function blip(f) {
      var o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
      o.type = "sine"; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.06);
      g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.13);
    }
    function schedule() { // 오디오 시계 기준 미리 예약 (게임의 시퀀서와 같은 방식)
      while (nextBeat * SPB + t0 < ctx.currentTime + 0.12) {
        var b = nextBeat, t = t0 + b * SPB;
        click(t, b % 4 === 0, b < LEAD);
        if (b >= LEAD) beats.push({ t: t, done: false, b: b });
        nextBeat++;
      }
      var heard = ctx.currentTime - lat();
      beats.forEach(function (x) { if (!x.done && heard > x.t + GOOD) { x.done = true; judge("miss", null); } });
      beats = beats.filter(function (x) { return !x.done || heard - x.t < 1; });
    }
    function draw() {
      if (!running) return;
      var p = (ctx.currentTime - lat() - t0) / SPB, b = Math.floor(p);
      dots.forEach(function (d, i) { d.className = b >= 0 && b % 4 === i && p - b < 0.25 ? (b < LEAD ? "cnt" : "on") : ""; });
      ui = requestAnimationFrame(draw);
    }
    function judge(g, d) {
      tally[g]++;
      var n = tally.perfect + tally.good + tally.miss, sc = (tally.perfect + tally.good * 0.65) / n;
      q("perfect").textContent = tally.perfect; q("good").textContent = tally.good; q("miss").textContent = tally.miss;
      q("acc").textContent = Math.round(sc * 100) + "%";
      q("grade").textContent = n < 4 ? "…" : sc >= 0.85 ? "최고" : sc >= 0.6 ? "괜찮네" : "다시 해";
      var li = document.createElement("li"), lab = { perfect: "딱!", good: "좋아", miss: "놓침" }[g];
      li.className = g === "miss" ? "down" : "up";
      li.innerHTML = "<code>" + (d == null ? "—" : (d > 0 ? "+" : "") + Math.round(d * 1000) + "ms") + "</code><span>" + (d == null ? "박을 지나침" : d < 0 ? "빨랐음" : d > 0 ? "늦었음" : "정박") + "</span><b>" + lab + "</b>";
      log.insertBefore(li, log.firstChild); while (log.children.length > 6) log.removeChild(log.lastChild);
      if (d != null) {
        var m = document.createElement("i");
        m.style.left = 50 + (d / GOOD) * 50 + "%"; m.style.setProperty("--c", g === "perfect" ? "#39d98a" : "#7fb2ff");
        marks.appendChild(m); var all = marks.children;
        for (var i = 0; i < all.length; i++) all[i].style.setProperty("--o", Math.max(0.15, 1 - (all.length - 1 - i) * 0.12));
        while (marks.children.length > 10) marks.removeChild(marks.firstChild);
        blip(g === "perfect" ? 880 : 660);
      }
    }
    function hit() {
      if (!running) return;
      tap.classList.add("hit"); setTimeout(function () { tap.classList.remove("hit"); }, 80);
      var t = ctx.currentTime - lat(), best = null, bd = 1e9;
      beats.forEach(function (x) { if (!x.done && Math.abs(t - x.t) < bd) { bd = Math.abs(t - x.t); best = x; } });
      if (best && bd <= GOOD) { best.done = true; judge(bd <= PERFECT ? "perfect" : "good", t - best.t); }
    }
    function start() {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "interactive" });
      if (ctx.state === "suspended") ctx.resume();
      tally = { perfect: 0, good: 0, miss: 0 }; beats = []; marks.innerHTML = ""; log.innerHTML = "";
      ["perfect", "good", "miss"].forEach(function (k) { q(k).textContent = "0"; }); q("acc").textContent = "—"; q("grade").textContent = "—";
      t0 = ctx.currentTime + 0.3; nextBeat = 0; running = true;
      sched = setInterval(schedule, 10); draw();
      btn.textContent = "■ 멈추기"; btn.classList.add("on"); tap.disabled = false; B.classList.add("live");
    }
    function stop() {
      running = false; clearInterval(sched); cancelAnimationFrame(ui);
      dots.forEach(function (d) { d.className = ""; });
      btn.textContent = "▶ 메트로놈 100 BPM"; btn.classList.remove("on"); tap.disabled = true; B.classList.remove("live");
    }
    btn.addEventListener("click", function () { running ? stop() : start(); });
    tap.addEventListener("pointerdown", function (e) { e.preventDefault(); hit(); });
    document.addEventListener("keydown", function (e) {
      if (!running || e.code !== "Space" || e.repeat) return;
      if (/INPUT|TEXTAREA|BUTTON/.test(document.activeElement.tagName) && document.activeElement !== tap && document.activeElement !== btn) return;
      e.preventDefault(); hit();
    });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { if (!en[0].isIntersecting && running) stop(); }).observe(B);
  }

  /* 3. 버전 탭 */
  var V = $("[data-ver]");
  if (V) {
    var tabs = V.querySelectorAll("[data-v]"), panes = V.querySelectorAll("[data-p]");
    var sel = function (v) {
      tabs.forEach(function (t) { t.setAttribute("aria-selected", t.dataset.v === v ? "true" : "false"); });
      panes.forEach(function (p) { p.hidden = p.dataset.p !== v; });
    };
    tabs.forEach(function (t) { t.addEventListener("click", function () { sel(t.dataset.v); }); });
    V.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      var cur = +$("[aria-selected=true]", V).dataset.v, n = Math.min(7, Math.max(1, cur + (e.key === "ArrowRight" ? 1 : -1)));
      sel(String(n)); $("[data-v='" + n + "']", V).focus();
    });
  }

  /* 4. 영상: 화면에 들어오면 재생 */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting && !reduce) e.target.play().catch(function () {}); else e.target.pause(); });
    }, { threshold: 0.3 });
    document.querySelectorAll("video[data-auto]").forEach(function (v) { io.observe(v); });
  }
})();

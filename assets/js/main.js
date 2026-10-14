/* ==========================================================
   유기상 포트폴리오 v2 — 인터랙션
   콘텐츠는 모두 HTML에 있고, html.fx일 때만 연출을 붙인다.
   장면 구성:  INTRO(점→선→프레임→컷)  MAIN(슬릿스캔)  ABOUT(필름 스트립)
               WORK(프로그램 모니터)  CONTACT(카운트다운 리더)
   ========================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var FX = root.classList.contains("fx");
  var FPS = 24;

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }
  function tc(frames) {
    var s = Math.floor(frames / FPS);
    return pad(Math.floor(s / 3600)) + ":" + pad(Math.floor(s / 60) % 60) + ":" + pad(s % 60) + ":" + pad(frames % FPS);
  }
  /* 고정 장면(스크롤 길이 > 화면 높이)의 진행률 0~1 */
  function progress(el) {
    var r = el.getBoundingClientRect();
    var max = r.height - window.innerHeight;
    return max <= 0 ? 0 : clamp(-r.top / max, 0, 1);
  }
  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, val);
    } catch (e) {
      return null;
    }
  }

  /* ---------- MOTION 토글 ---------- */
  var toggle = document.querySelector("[data-motion-toggle]");
  if (toggle) {
    toggle.textContent = "MOTION — " + (FX ? "ON" : "OFF");
    toggle.setAttribute("aria-pressed", FX ? "true" : "false");
    toggle.addEventListener("click", function () {
      store("gy-motion", FX ? "off" : "on");
      location.reload();
    });
  }

  /* ---------- 헤더 타임코드: 스크롤 6px = 1프레임 ---------- */
  var tcEl = document.querySelector("[data-tc]");
  function updateTC() {
    if (tcEl) tcEl.textContent = tc(Math.floor(window.scrollY / 6));
  }

  /* ---------- 이미지 스크럽: 마우스 가로 위치 = 재생 위치 ---------- */
  Array.prototype.forEach.call(document.querySelectorAll(".scrub"), function (s) {
    var label = s.querySelector(".scrub-tc");
    var dur = parseFloat(s.getAttribute("data-dur") || "10");
    s.addEventListener("pointermove", function (e) {
      var r = s.getBoundingClientRect();
      var x = clamp((e.clientX - r.left) / r.width, 0, 1);
      s.style.setProperty("--sx", (x * 100).toFixed(2) + "%");
      if (label) label.textContent = tc(Math.floor(x * dur * FPS));
    });
  });

  if (!FX) {
    window.addEventListener("scroll", updateTC, { passive: true });
    updateTC();
    return;
  }

  /* ==========================================================
     이하 모션 모드 전용
     ========================================================== */

  /* ---------- AF 브래킷 커서 ---------- */
  var af = document.querySelector(".af");
  var fine = window.matchMedia("(pointer: fine)").matches;
  var mouse = { x: -100, y: -100 };
  var afCur = { x: -100, y: -100, w: 22, h: 22 };
  var afTarget = null;
  if (af && fine) {
    root.classList.add("fx-ready");
    window.addEventListener("pointermove", function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      afTarget = e.target.closest ? e.target.closest("a, button, [data-af]") : null;
    });
  }
  function updateAF() {
    if (!af || !fine) return;
    var tx, ty, tw, th;
    if (afTarget && document.body.contains(afTarget)) {
      var r = afTarget.getBoundingClientRect();
      tw = r.width + 14;
      th = r.height + 10;
      tx = r.left - 7;
      ty = r.top - 5;
    } else {
      tw = th = 22;
      tx = mouse.x - 11;
      ty = mouse.y - 11;
    }
    afCur.x += (tx - afCur.x) * 0.28;
    afCur.y += (ty - afCur.y) * 0.28;
    afCur.w += (tw - afCur.w) * 0.22;
    afCur.h += (th - afCur.h) * 0.22;
    af.style.setProperty("--x", afCur.x.toFixed(1) + "px");
    af.style.setProperty("--y", afCur.y.toFixed(1) + "px");
    af.style.setProperty("--w", afCur.w.toFixed(1) + "px");
    af.style.setProperty("--h", afCur.h.toFixed(1) + "px");
    af.style.setProperty("--dot", afTarget ? "0" : "1");
  }

  /* ---------- 상세 페이지 등장: 화면 아래 90% 선을 넘은 요소를 켠다 ----------
     IntersectionObserver는 빠르게 건너뛴 요소를 놓칠 수 있어, 위치를 매 프레임 직접 비교한다. */
  var reveals = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
  function updateReveal() {
    if (!reveals.length) return;
    var line = window.innerHeight * 0.9;
    reveals = reveals.filter(function (el) {
      if (el.getBoundingClientRect().top < line) {
        el.classList.add("is-in");
        return false;
      }
      return true;
    });
  }

  /* ---------- INTRO: 세션당 1회 ---------- */
  var intro = document.querySelector(".intro");
  var played = false;
  try {
    played = sessionStorage.getItem("gy-intro") === "1";
  } catch (e) {}
  if (intro && !played && window.scrollY < 10) playIntro();

  function playIntro() {
    intro.hidden = false;
    root.style.overflow = "hidden";
    var timers = [];
    var done = false;
    // [시각(ms), 그 시점의 상태 클래스]
    var seq = [
      [0, "s1"],
      [900, "s2"],
      [1450, "s2 s3"],
      [2050, "s2 s3 w1"],
      [2650, "w2"],
      [3200, "w3"],
      [3800, "w4"],
      [4450, "card"],
      [5400, "flash"],
      [5480, "flash out"]
    ];
    var codeEl = intro.querySelector(".w-code");
    seq.forEach(function (step) {
      timers.push(
        setTimeout(function () {
          intro.className = "intro " + step[1];
          if (step[1] === "w4") scramble(codeEl, "CODE.", 520);
        }, step[0])
      );
    });
    timers.push(setTimeout(finish, 6200));

    function finish() {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      intro.hidden = true;
      root.style.overflow = "";
      try {
        sessionStorage.setItem("gy-intro", "1");
      } catch (e) {}
    }
    function skip() {
      if (done) return;
      intro.className = "intro out";
      timers.forEach(clearTimeout);
      setTimeout(finish, 700);
    }
    intro.addEventListener("click", skip);
    window.addEventListener("keydown", skip, { once: true });
    window.addEventListener("wheel", skip, { once: true, passive: true });
    window.addEventListener("touchstart", skip, { once: true, passive: true });
  }

  /* CODE: 무작위 문자가 한 글자씩 확정되는 디코딩 */
  function scramble(el, text, dur) {
    if (!el) return;
    var chars = "<>/{}[]=+*#01";
    var t0 = performance.now();
    (function step(now) {
      var k = clamp((now - t0) / dur, 0, 1);
      var fixed = Math.floor(k * text.length);
      var out = "";
      for (var i = 0; i < text.length; i++) {
        out += i < fixed ? text[i] : chars[Math.floor(Math.random() * chars.length)];
      }
      el.textContent = out;
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ==========================================================
     MAIN — 슬릿스캔 이름 + 키프레임 트랙 + CRT 전환
     ========================================================== */
  var sceneMain = document.querySelector(".scene-main");
  var crt = sceneMain && sceneMain.querySelector(".crt");
  var canvas = sceneMain && sceneMain.querySelector(".slit canvas");
  var ctx = canvas && canvas.getContext("2d");
  var off = document.createElement("canvas");
  var octx = off.getContext("2d");
  var slices = [];
  var SLICE = 5; // CSS px
  var mainVisible = true;
  var lastMX = null;
  var tracking = { y: -1, t: 0 };

  function buildSlit() {
    if (!canvas) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = canvas.clientWidth;
    var h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    off.width = canvas.width;
    off.height = canvas.height;
    var text = "YU GISANG";
    octx.clearRect(0, 0, off.width, off.height);
    octx.font = "400 100px Anton, Impact, sans-serif";
    var mw = octx.measureText(text).width;
    var size = Math.min((off.width * 0.9 * 100) / mw, off.height * 0.98);
    octx.font = "400 " + size + "px Anton, Impact, sans-serif";
    octx.fillStyle = "#0b0b0b";
    octx.textAlign = "center";
    octx.textBaseline = "middle";
    octx.fillText(text, off.width / 2, off.height / 2 + size * 0.04);
    var n = Math.ceil(h / SLICE);
    slices = [];
    for (var i = 0; i < n; i++) slices.push(0);
  }

  function drawSlit(now) {
    if (!ctx || !mainVisible) return;
    var dpr = canvas.width / Math.max(1, canvas.clientWidth);
    var sh = SLICE * dpr;
    var t = now / 1000;

    // 3.2초마다 VHS 트래킹 띠가 위에서 아래로 지나간다
    if (now - tracking.t > 3200) {
      tracking.t = now;
      tracking.y = -40;
    }
    if (tracking.y > -60) tracking.y += 9;
    if (tracking.y > canvas.clientHeight + 60) tracking.y = -999;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < slices.length; i++) {
      slices[i] *= 0.9;
      var y = i * SLICE;
      var idle = Math.sin(t * 1.3 + i * 0.21) * 1.2;
      var band = Math.abs(y - tracking.y) < 22 ? (22 - Math.abs(y - tracking.y)) * 1.1 : 0;
      var dx = (slices[i] + idle + band) * dpr;
      ctx.drawImage(off, 0, i * sh, off.width, sh, dx, i * sh, off.width, sh);
    }
  }

  if (sceneMain) {
    sceneMain.addEventListener("pointermove", function (e) {
      if (!canvas) return;
      var r = canvas.getBoundingClientRect();
      var my = e.clientY - r.top;
      if (lastMX !== null) {
        var vx = clamp(e.clientX - lastMX, -80, 80);
        for (var i = 0; i < slices.length; i++) {
          var d = (i * SLICE - my) / 46;
          slices[i] += vx * 1.6 * Math.exp(-d * d);
        }
      }
      lastMX = e.clientX;
    });
    sceneMain.addEventListener("pointerleave", function () {
      lastMX = null;
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        mainVisible = en[0].isIntersecting;
      }).observe(sceneMain);
    }
  }

  /* 키프레임: 가장 가까운 기술 라벨을 켠다 */
  var keys = document.querySelector("[data-keys]");
  var keyItems = keys ? Array.prototype.slice.call(keys.querySelectorAll("li[data-x]")) : [];
  var keyHead = keys && keys.querySelector(".keys-head");
  keyItems.forEach(function (li) {
    li.style.setProperty("--x", li.getAttribute("data-x"));
  });
  var mainKeys = keys ? Array.prototype.slice.call(keys.querySelectorAll(".keys-main li")) : [];
  var keyX = -1;
  if (keys && sceneMain) {
    sceneMain.addEventListener("pointermove", function (e) {
      var r = keys.getBoundingClientRect();
      keyX = clamp(e.clientX - r.left, 0, r.width);
      keyHead.style.setProperty("--kx", keyX.toFixed(1) + "px");
      keys.classList.add("has-pointer");
      var best = null;
      var bestD = 1e9;
      mainKeys.forEach(function (li) {
        if (li.offsetParent === null) return;
        var d = Math.abs((parseFloat(li.getAttribute("data-x")) / 100) * r.width - keyX);
        if (d < bestD) {
          bestD = d;
          best = li;
        }
      });
      mainKeys.forEach(function (li) {
        li.classList.toggle("is-near", li === best && bestD < r.width * 0.07);
      });
    });
  }

  function updateMain() {
    if (!sceneMain || !crt) return;
    var p = progress(sceneMain);
    // 0.35 ~ 0.75: 세로로 접힘 / 0.75 ~ 0.95: 선이 점으로
    var a = clamp((p - 0.35) / 0.4, 0, 1);
    var b = clamp((p - 0.75) / 0.2, 0, 1);
    var ea = a * a * (3 - 2 * a);
    crt.style.setProperty("--cy", Math.max(0.004, 1 - ea).toFixed(4));
    crt.style.setProperty("--cx", Math.max(0.001, 1 - b).toFixed(4));
    crt.style.setProperty("--cb", (1 + ea * 1.4).toFixed(3));
  }

  /* ==========================================================
     ABOUT — 필름 스트립
     ========================================================== */
  var sceneAbout = document.querySelector(".scene-about");
  var strip = document.querySelector("[data-strip]");
  var frames = strip ? Array.prototype.slice.call(strip.querySelectorAll(".frame")) : [];
  var stripBtns = Array.prototype.slice.call(document.querySelectorAll(".strip-nav [data-go]"));
  var stripX = 0;

  function sceneScrollTo(scene, p) {
    var top = scene.getBoundingClientRect().top + window.scrollY;
    var max = scene.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + max * p, behavior: "smooth" });
  }

  function updateAbout() {
    if (!sceneAbout || !frames.length) return;
    var p = progress(sceneAbout);
    var n = frames.length;
    // 앞뒤 8%는 여유 구간
    var q = clamp((p - 0.06) / 0.88, 0, 1);
    var fw = frames[0].offsetWidth;
    var gap = frames.length > 1 ? frames[1].offsetLeft - frames[0].offsetLeft : fw;
    var target = window.innerWidth / 2 - fw / 2 - q * (n - 1) * gap;
    stripX += (target - stripX) * 0.14;
    strip.style.setProperty("--sx", stripX.toFixed(1) + "px");
    var idx = Math.round(q * (n - 1));
    frames.forEach(function (f, i) {
      f.classList.toggle("is-on", i === idx);
    });
    stripBtns.forEach(function (b, i) {
      b.classList.toggle("is-on", i === idx);
    });
  }

  stripBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      var i = parseInt(b.getAttribute("data-go"), 10);
      sceneScrollTo(sceneAbout, 0.06 + (i / (frames.length - 1)) * 0.88);
    });
  });

  // 드래그로 스크럽: 가로 이동량을 세로 스크롤로 환산
  if (sceneAbout) {
    var drag = null;
    sceneAbout.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || e.target.closest("a, button")) return;
      drag = { x: e.clientX, y: window.scrollY };
      sceneAbout.setPointerCapture(e.pointerId);
    });
    sceneAbout.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var max = sceneAbout.offsetHeight - window.innerHeight;
      var ratio = max / ((frames.length - 1) * (frames[0].offsetWidth * 1.06));
      window.scrollTo(0, drag.y - (e.clientX - drag.x) * ratio);
    });
    ["pointerup", "pointercancel"].forEach(function (t) {
      sceneAbout.addEventListener(t, function () {
        drag = null;
      });
    });
  }

  /* ==========================================================
     WORK — 프로그램 모니터
     ========================================================== */
  var sceneWork = document.querySelector(".scene-work");
  var cuts = sceneWork ? Array.prototype.slice.call(sceneWork.querySelectorAll(".cut")) : [];
  var cutList = sceneWork && sceneWork.querySelector(".cut-list");
  var cutNo = sceneWork && sceneWork.querySelector("[data-cut-no]");
  var ruler = sceneWork && sceneWork.querySelector(".ruler-head");
  var cutIdx = -1;

  function updateWork() {
    if (!sceneWork || !cuts.length) return;
    var p = progress(sceneWork);
    var idx = clamp(Math.floor(p * cuts.length), 0, cuts.length - 1);
    if (ruler) ruler.style.setProperty("--rx", (p * window.innerWidth).toFixed(1) + "px");
    if (idx === cutIdx) return;
    cutIdx = idx;
    cuts.forEach(function (c, i) {
      c.classList.toggle("is-on", i === idx);
    });
    if (cutList) cutList.style.setProperty("--ci", idx);
    if (cutNo) cutNo.textContent = pad(idx + 1);
  }

  /* ==========================================================
     CONTACT — 카운트다운 리더 3·2·1 → 엔드 카드
     ========================================================== */
  var sceneContact = document.querySelector(".scene-contact");
  var leader = sceneContact && sceneContact.querySelector(".leader");
  var leaderNo = sceneContact && sceneContact.querySelector("[data-leader]");
  var C = 427.26;

  function updateContact() {
    if (!sceneContact || !leader) return;
    var p = progress(sceneContact);
    var k = clamp(p / 0.62, 0, 1) * 3; // 0~3
    var num = Math.min(3, 3 - Math.floor(k));
    var frac = k - Math.floor(k);
    if (leaderNo) leaderNo.textContent = String(Math.max(1, num));
    leader.style.setProperty("--sw", (C * (1 - (k >= 3 ? 1 : frac))).toFixed(1));
    sceneContact.classList.toggle("is-end", p > 0.64);
  }

  /* ---------- 루프 ---------- */
  function onResize() {
    buildSlit();
    cutIdx = -1;
  }
  window.addEventListener("resize", onResize);
  if (document.fonts && document.fonts.load) {
    document.fonts.load("400 100px Anton").then(buildSlit, buildSlit);
  }
  buildSlit();

  // 다른 장면이 화면에 올라오면 헤더 메뉴에 표시
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav a[href^="#"]'));
  function updateNav() {
    var mid = window.innerHeight / 2;
    navLinks.forEach(function (a) {
      var t = document.querySelector(a.getAttribute("href"));
      if (!t) return;
      var r = t.getBoundingClientRect();
      a.classList.toggle("is-on", r.top <= mid && r.bottom >= mid);
    });
  }

  (function loop(now) {
    updateTC();
    updateAF();
    updateReveal();
    updateMain();
    drawSlit(now);
    updateAbout();
    updateWork();
    updateContact();
    updateNav();
    requestAnimationFrame(loop);
  })(performance.now());
})();

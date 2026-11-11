/* SMILE PIZZA · 피자 만들기 — 웹 버전
   Unity 원본(PizzaMaker/*.cs, 프리팹 값)의 규칙과 수치를 그대로 옮겼다.
   좌표는 Unity 월드 단위(카메라 y=1, 세로 시야 11.55u)를 캔버스 픽셀로 바꿔 쓴다. */
(function () {
  "use strict";
  var root = document.querySelector("[data-pizza]");
  if (!root) return;

  var BASE = "assets/work/smilepizza/";
  // 원본 플레이 영상(게임 뷰 684×899)을 540×710으로 맞춰 스프라이트 위치 · 크기를 측정한 값
  var W = 540, H = 710, U = 71;                               // 세로 10u(직교 크기 5) → 1u = 71px
  function px(x) { return W / 2 + x * U; }
  function py(y) { return H / 2 - y * U; }
  var R = {
    bg: [-7, -26, 564, 752], board: [-1, 559, 543, 154],
    chef: { top: 468, w: 126, h: 142 }, fireY: 486, landY: 600,
    score: [11, 8, 139, 45], scoreNum: [118, 30],
    time: [325, 10, 196, 39], timeText: [340, 30], bar: [407, 20.5, 103, 17.5]
  };

  /* ── 원본 값 ───────────────────────────────────────── */
  var CFG = {
    timeLimit: 60,                                   // GameManager.timeLimit
    chef: { speed: 7, xLimit: 2.6, cooldown: 0.25 }, // Chef.cs
    bullet: { speed: 8, destroyY: 6, w: 3.57 * 0.06, h: 5.34 * 0.06 }, // Bullet.prefab
    ing: { w: 1.21 * 0.5, h: 1.25 * 0.5, destroyY: -6 },  // 재료 프리팹(scale 0.5)
    spawn: { x: 2.4, y: 5.5 },                       // Spawner.cs
    phases: [                                        // Spawner.SpawnLoop
      { until: 20, interval: 1.2, fall: 2, good: 0.7, name: "워밍업" },
      { until: 40, interval: 0.9, fall: 3, good: 0.5, name: "가속" },
      { until: 1e9, interval: 0.6, fall: 4, good: 0.4, name: "폭주" }
    ],
    score: { landGood: 10, landBad: -15, shotGood: -10, shotBad: 5 },
    grades: [[480, "A+", "Aplus"], [380, "A", "A"], [280, "B", "B"], [180, "C", "C"], [80, "D", "D"], [-1e9, "F", "F"]]
  };
  var FIRE_Y = (H / 2 - R.fireY) / U;                // 셰프 손 높이(월드)
  var BOARD_TOP = (H / 2 - R.landY) / U;             // 재료 아랫면이 닿으면 안착(영상에서 측정)

  var GOOD = ["tomato", "mozzarella", "pepperoni", "mushroom", "basil", "olive"];
  var BAD = ["rock", "fish", "sock", "teeth"];
  var NAMES = { tomato: "토마토", mozzarella: "모짜렐라", pepperoni: "페퍼로니", mushroom: "버섯", basil: "바질", olive: "올리브", rock: "돌멩이", fish: "생선", sock: "양말", teeth: "금이빨" };

  /* ── 리소스 ───────────────────────────────────────── */
  var IMG = {};
  ["bg", "board", "chef", "chef_shoot", "bullet", "SCORE", "TIME"]
    .concat(GOOD.map(function (n) { return "good_" + n; }), BAD.map(function (n) { return "bad_" + n; }))
    .forEach(function (n) { var im = new Image(); im.src = BASE + "img/" + n + ".webp"; IMG[n] = im; });
  var muted = false;
  var SND = {};
  [["shoot", 0.6], ["hit_good", 0.11], ["hit_bad", 1], ["land_good", 0.7]].forEach(function (s) { SND[s[0]] = { src: BASE + "snd/" + s[0] + ".mp3", vol: s[1] }; });
  var bgm = new Audio(BASE + "snd/bgm.mp3"); bgm.loop = true; bgm.volume = 0.35; bgm.preload = "none";
  function sfx(k) {
    if (muted || !SND[k]) return;
    var a = new Audio(SND[k].src); a.volume = SND[k].vol; a.play().catch(function () {});
  }

  /* ── DOM ─────────────────────────────────────────── */
  var stage = root.querySelector(".sp-stage");
  var cv = stage.querySelector("canvas"), ctx = cv.getContext("2d");
  var ovStart = stage.querySelector(".sp-start"), ovGuide = stage.querySelector(".sp-guide"), ovEnd = stage.querySelector(".sp-end"), ovPause = stage.querySelector(".sp-pause");
  var logic = root.querySelector(".sp-logic");
  var L = {
    time: logic.querySelector("[data-l=time]"), score: logic.querySelector("[data-l=score]"),
    good: logic.querySelector("[data-l=good]"), bad: logic.querySelector("[data-l=bad]"),
    grade: logic.querySelector("[data-l=grade]"), log: logic.querySelector("[data-l=log]"),
    rows: logic.querySelectorAll("[data-phase]"), boxes: logic.querySelector("[data-l=boxes]")
  };
  var btnSound = root.querySelector("[data-act=sound]");

  function fit() {
    var d = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  fit();
  window.addEventListener("resize", fit);

  /* ── 상태 ─────────────────────────────────────────── */
  var S;
  function reset() {
    S = { state: "start", score: 0, remaining: CFG.timeLimit, goodLanded: 0, badShot: 0,
      chefX: 0, lastFire: -999, shootUntil: 0, t: 0, nextSpawn: 0,
      ings: [], bullets: [], parts: [], floats: [], log: [] };
    L.log.innerHTML = "";
    syncPanel();
  }
  function elapsed() { return CFG.timeLimit - S.remaining; }
  function phaseIdx() { var e = elapsed(); for (var i = 0; i < CFG.phases.length; i++) if (e < CFG.phases[i].until) return i; return 2; }
  function grade(s) { for (var i = 0; i < CFG.grades.length; i++) if (s >= CFG.grades[i][0]) return CFG.grades[i]; return CFG.grades[5]; }

  var showBoxes = false;
  function addScore(v, who, what, x, y) {
    S.score += v;
    var li = document.createElement("li");
    li.className = v > 0 ? "up" : "down";
    li.innerHTML = "<code>" + who + "</code><span>" + what + "</span><b>" + (v > 0 ? "+" : "−") + Math.abs(v) + "</b>";
    L.log.insertBefore(li, L.log.firstChild);
    while (L.log.children.length > 7) L.log.removeChild(L.log.lastChild);
    if (showBoxes) S.floats.push({ x: x, y: y, v: v, life: 0.9 });
  }

  /* ── 흐름 (GameManager / UIManager) ───────────────── */
  function startGame() {
    reset();
    S.state = "play";
    ovStart.hidden = true; ovGuide.hidden = true; ovEnd.hidden = true;
    stage.focus({ preventScroll: true });
    if (!muted) { bgm.currentTime = 0; bgm.play().catch(function () {}); }
  }
  function endGame() {
    S.state = "end";
    var g = grade(S.score);
    ovEnd.querySelector("img").src = BASE + "img/ending_" + g[2] + ".webp";
    ovEnd.querySelector("img").alt = "엔딩 " + g[1] + " 등급 피자";
    ovEnd.querySelector("[data-e=score]").textContent = S.score;
    ovEnd.querySelector("[data-e=good]").textContent = S.goodLanded;
    ovEnd.querySelector("[data-e=bad]").textContent = S.badShot;
    ovEnd.hidden = false;
    bgm.pause();
    syncPanel();
  }
  function toStart() { reset(); paused = false; ovPause.hidden = true; ovEnd.hidden = true; ovStart.hidden = false; bgm.pause(); stage.focus({ preventScroll: true }); }

  root.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (!b) return;
    var a = b.getAttribute("data-act");
    if (a === "start") startGame();
    if (a === "restart") toStart();       // 원본 Restart()는 씬을 다시 불러 시작 화면으로 돌아간다
    if (a === "guide") ovGuide.hidden = false;
    if (a === "close") ovGuide.hidden = true;
    if (a === "resume") resume();
    if (a === "sound") {
      muted = !muted;
      b.setAttribute("aria-pressed", muted ? "false" : "true");
      b.textContent = muted ? "소리 끔" : "소리 켬";
      if (muted) bgm.pause(); else if (S.state === "play") bgm.play().catch(function () {});
    }
    if (a === "boxes") { showBoxes = !showBoxes; b.setAttribute("aria-pressed", showBoxes ? "true" : "false"); }
  });

  /* ── 입력 (Chef.cs: 좌우 + Space, GameManager: R) ── */
  var keys = {}, touch = { l: false, r: false };
  function onStageKeys() { return S.state === "play" || S.state === "end" || document.activeElement === stage; }
  window.addEventListener("keydown", function (e) {
    if (!inView || !onStageKeys()) return;
    var k = e.key;
    if (S.state === "play" && (k === "ArrowLeft" || k === "ArrowRight" || k === " " || k === "a" || k === "d" || k === "A" || k === "D")) {
      e.preventDefault();
      keys[k.toLowerCase()] = true;
      if (k === " " && !e.repeat) fire();
    }
    if ((k === "r" || k === "R") && S.state !== "start") { e.preventDefault(); toStart(); }
  });
  window.addEventListener("keyup", function (e) { keys[e.key.toLowerCase()] = false; });
  root.querySelectorAll("[data-touch]").forEach(function (b) {
    var k = b.getAttribute("data-touch");
    function on(e) { e.preventDefault(); if (k === "fire") { if (S.state === "play") fire(); } else touch[k] = true; }
    function off() { touch[k] = false; }
    b.addEventListener("pointerdown", on);
    b.addEventListener("pointerup", off); b.addEventListener("pointerleave", off); b.addEventListener("pointercancel", off);
  });

  function fire() {
    if (S.t - S.lastFire < CFG.chef.cooldown) return;
    S.lastFire = S.t;
    S.bullets.push({ x: S.chefX, y: FIRE_Y });
    S.shootUntil = S.t + 0.1;                          // 발사 스프라이트 0.1초
    sfx("shoot");
  }

  /* ── 화면 밖 · 탭 숨김이면 멈춤 (웹 버전 추가) ─────── */
  var inView = true, paused = false;
  function pause() { if (S.state === "play" && !paused) { paused = true; ovPause.hidden = false; bgm.pause(); } }
  function resume() { if (!paused) return; paused = false; ovPause.hidden = true; last = performance.now(); if (!muted) bgm.play().catch(function () {}); stage.focus({ preventScroll: true }); }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { inView = en[0].isIntersecting && en[0].intersectionRatio > 0.35; if (!inView) pause(); }, { threshold: [0, 0.35, 1] }).observe(stage);
  }
  document.addEventListener("visibilitychange", function () { if (document.hidden) pause(); });
  ovPause.addEventListener("click", resume);

  /* ── 업데이트 ─────────────────────────────────────── */
  function overlap(a, aw, ah, b, bw, bh) { return Math.abs(a.x - b.x) * 2 < aw + bw && Math.abs(a.y - b.y) * 2 < ah + bh; }
  function burst(x, y, color, n) {
    for (var i = 0; i < n; i++) {
      var ang = Math.random() * Math.PI * 2, sp = 1.5 + Math.random() * 3.5;
      S.parts.push({ x: x, y: y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp + 1, life: 0.35 + Math.random() * 0.3, c: color, r: 2 + Math.random() * 4 });
    }
  }

  function update(dt) {
    S.t += dt;
    var i, j;
    // GameManager.Update — 제한시간
    S.remaining -= dt;
    if (S.remaining <= 0) { S.remaining = 0; endGame(); return; }

    // Chef.Update — 이동 후 ±xLimit 고정
    var h = (keys.arrowright || keys.d || touch.r ? 1 : 0) - (keys.arrowleft || keys.a || touch.l ? 1 : 0);
    S.chefX = Math.max(-CFG.chef.xLimit, Math.min(CFG.chef.xLimit, S.chefX + h * CFG.chef.speed * dt));

    // Spawner.SpawnLoop — 구간별 간격 · 낙하속도 · 좋은 재료 비율
    var ph = CFG.phases[phaseIdx()];
    S.nextSpawn -= dt;
    if (S.nextSpawn <= 0) {
      var good = Math.random() < ph.good, pool = good ? GOOD : BAD;
      S.ings.push({ x: (Math.random() * 2 - 1) * CFG.spawn.x, y: CFG.spawn.y, good: good, kind: pool[(Math.random() * pool.length) | 0], fall: ph.fall, age: 0 });
      S.nextSpawn += ph.interval;
    }

    // Bullet.Update + OnTriggerEnter2D — 격추 점수는 Bullet에서만 처리
    for (i = S.bullets.length - 1; i >= 0; i--) {
      var b = S.bullets[i];
      b.y += CFG.bullet.speed * dt;
      if (b.y > CFG.bullet.destroyY) { S.bullets.splice(i, 1); continue; }
      for (j = S.ings.length - 1; j >= 0; j--) {
        var g = S.ings[j];
        if (!overlap(b, CFG.bullet.w, CFG.bullet.h, g, CFG.ing.w, CFG.ing.h)) continue;
        if (g.good) { addScore(CFG.score.shotGood, "Bullet.cs", NAMES[g.kind] + " 오발", g.x, g.y); sfx("hit_good"); burst(g.x, g.y, "#e8a33a", 10); }
        else { addScore(CFG.score.shotBad, "Bullet.cs", NAMES[g.kind] + " 격추", g.x, g.y); S.badShot++; sfx("hit_bad"); burst(g.x, g.y, "#c8251f", 14); }
        S.ings.splice(j, 1); S.bullets.splice(i, 1);
        break;
      }
    }

    // Ingredient.Update + OnTriggerEnter2D — 안착 점수는 Ingredient에서만 처리
    for (i = S.ings.length - 1; i >= 0; i--) {
      var n = S.ings[i];
      n.y -= n.fall * dt; n.age += dt;
      if (n.y - CFG.ing.h / 2 <= BOARD_TOP) {
        if (n.good) { addScore(CFG.score.landGood, "Ingredient.cs", NAMES[n.kind] + " 토핑 성공", n.x, n.y); S.goodLanded++; sfx("land_good"); burst(n.x, n.y, "#ffe08a", 8); }
        else { addScore(CFG.score.landBad, "Ingredient.cs", NAMES[n.kind] + " 오염", n.x, n.y); burst(n.x, n.y, "#6b6b6b", 10); }
        S.ings.splice(i, 1); continue;
      }
      if (n.y < CFG.ing.destroyY) S.ings.splice(i, 1);
    }

    for (i = S.parts.length - 1; i >= 0; i--) { var p = S.parts[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy -= 9 * dt; if (p.life <= 0) S.parts.splice(i, 1); }
    for (i = S.floats.length - 1; i >= 0; i--) { var f = S.floats[i]; f.life -= dt; f.y += 1.2 * dt; if (f.life <= 0) S.floats.splice(i, 1); }
  }

  /* ── 그리기 ───────────────────────────────────────── */
  function draw(im, x, y, w, h, alpha) {
    if (!im.complete || !im.naturalWidth) return;
    if (alpha != null) ctx.globalAlpha = alpha;
    ctx.drawImage(im, x, y, w, h);
    ctx.globalAlpha = 1;
  }
  function box(x, y, w, h, color) {
    ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    ctx.strokeRect(px(x - w / 2), py(y + h / 2), w * U, h * U);
  }
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function hud() {
    ctx.textBaseline = "middle";
    // SCORE 판 + 숫자
    draw(IMG.SCORE, R.score[0], R.score[1], R.score[2], R.score[3]);
    ctx.fillStyle = "#f6c12f"; ctx.font = "700 19px Inter, 'Pretendard Variable', sans-serif"; ctx.textAlign = "center";
    ctx.fillText(String(S.score), R.scoreNum[0], R.scoreNum[1]);
    // TIME 판 + 분:초 + 타임바 (UIManager.UpdateTime)
    draw(IMG.TIME, R.time[0], R.time[1], R.time[2], R.time[3]);
    var t = Math.max(0, Math.ceil(S.remaining));
    ctx.fillStyle = "#fff"; ctx.font = "600 18px Inter, 'Pretendard Variable', sans-serif"; ctx.textAlign = "left";
    ctx.fillText("00:" + (t < 10 ? "0" : "") + t, R.timeText[0], R.timeText[1]);
    var b = R.bar, fill = Math.max(0, S.remaining / CFG.timeLimit);
    if (fill > 0) { ctx.fillStyle = "#f5c02e"; ctx.save(); rr(b[0] + 2.5, b[1] + 2.5, b[2] - 5, b[3] - 5, 5); ctx.clip(); ctx.fillRect(b[0] + 2.5, b[1] + 2.5, (b[2] - 5) * fill, b[3] - 5); ctx.restore(); }
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; rr(b[0] + 1, b[1] + 1, b[2] - 2, b[3] - 2, 7); ctx.stroke();
  }
  function render() {
    ctx.clearRect(0, 0, W, H);
    draw(IMG.bg, R.bg[0], R.bg[1], R.bg[2], R.bg[3]);

    var i;
    for (i = 0; i < S.ings.length; i++) {
      var g = S.ings[i];
      draw(IMG[(g.good ? "good_" : "bad_") + g.kind], px(g.x - CFG.ing.w / 2), py(g.y + CFG.ing.h / 2), CFG.ing.w * U, CFG.ing.h * U, Math.min(1, g.age / 0.12));
    }
    var chefIm = S.t < S.shootUntil ? IMG.chef_shoot : IMG.chef;
    draw(chefIm, px(S.chefX) - R.chef.w / 2, R.chef.top, R.chef.w, R.chef.h);
    draw(IMG.board, R.board[0], R.board[1], R.board[2], R.board[3]);   // 셰프 발은 도마 뒤로 가려짐
    for (i = 0; i < S.bullets.length; i++) {
      var b = S.bullets[i];
      draw(IMG.bullet, px(b.x - CFG.bullet.w / 2), py(b.y + CFG.bullet.h / 2), CFG.bullet.w * U, CFG.bullet.h * U);
    }
    for (i = 0; i < S.parts.length; i++) {
      var p = S.parts[i];
      ctx.globalAlpha = Math.max(0, p.life * 2); ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(px(p.x), py(p.y), p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (showBoxes) { // 로직 보기 — 충돌 박스와 판정선
      ctx.setLineDash([6, 5]); ctx.strokeStyle = "rgba(229,35,43,0.9)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, py(BOARD_TOP)); ctx.lineTo(W, py(BOARD_TOP)); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.beginPath(); ctx.moveTo(px(-CFG.chef.xLimit), R.chef.top + 20); ctx.lineTo(px(CFG.chef.xLimit), R.chef.top + 20); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px(-CFG.spawn.x), py(CFG.spawn.y)); ctx.lineTo(px(CFG.spawn.x), py(CFG.spawn.y)); ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = "600 11px Inter, sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "rgba(229,35,43,0.95)"; ctx.fillText("Board 판정선", 10, py(BOARD_TOP) - 6);
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fillText("Chef xLimit ±" + CFG.chef.xLimit + "u", px(-CFG.chef.xLimit) + 4, R.chef.top + 14);
      for (i = 0; i < S.ings.length; i++) box(S.ings[i].x, S.ings[i].y, CFG.ing.w, CFG.ing.h, S.ings[i].good ? "#39d98a" : "#ff3b41");
      for (i = 0; i < S.bullets.length; i++) box(S.bullets[i].x, S.bullets[i].y, CFG.bullet.w, CFG.bullet.h, "#ffd25a");
      ctx.font = "700 18px 'Chakra Petch', sans-serif"; ctx.textAlign = "center";
      for (i = 0; i < S.floats.length; i++) {
        var f = S.floats[i];
        ctx.globalAlpha = Math.min(1, f.life * 2); ctx.fillStyle = f.v > 0 ? "#39d98a" : "#ff3b41";
        ctx.fillText((f.v > 0 ? "+" : "−") + Math.abs(f.v), px(f.x), py(f.y));
      }
      ctx.globalAlpha = 1;
    }
    if (S.state !== "start") hud();
    if (S.state === "start") { ctx.fillStyle = "rgba(0,0,0,0.57)"; ctx.fillRect(0, 0, W, H); }
  }

  /* ── 로직 패널 동기화 ─────────────────────────────── */
  var lastPanel = 0;
  function syncPanel() {
    var t = Math.max(0, Math.ceil(S.remaining)), e = elapsed();
    L.time.textContent = (S.state === "start" ? "60" : t) + "s";
    L.score.textContent = S.score;
    L.good.textContent = S.goodLanded;
    L.bad.textContent = S.badShot;
    L.grade.textContent = grade(S.score)[1];
    var pi = S.state === "play" ? phaseIdx() : -1;
    L.rows.forEach(function (r, k) { r.classList.toggle("on", k === pi); });
    logic.style.setProperty("--elapsed", Math.min(1, e / CFG.timeLimit));
    logic.classList.toggle("live", S.state === "play");
  }

  /* ── 루프 ─────────────────────────────────────────── */
  var last = performance.now();
  function loop(now) {
    var dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    if (S.state === "play" && !paused) update(dt);
    else if (S.state === "end") { // 원본 Ingredient.Update는 isPlaying을 보지 않아 종료 후에도 남은 재료가 떨어진다(점수 반영 없이 표시만)
      for (var k = S.ings.length - 1; k >= 0; k--) { var n = S.ings[k]; n.y -= n.fall * dt; if (n.y - CFG.ing.h / 2 <= BOARD_TOP) S.ings.splice(k, 1); }
    }
    render();
    if (now - lastPanel > 100) { lastPanel = now; syncPanel(); }
    requestAnimationFrame(loop);
  }
  reset();
  requestAnimationFrame(loop);

  // 점검용: ?pizzatest 이면 규칙 검사 결과를 콘솔에 출력
  if (/[?&]pizzatest/.test(location.search)) {
    var ok = [grade(480)[1] === "A+", grade(479)[1] === "A", grade(80)[1] === "D", grade(79)[1] === "F",
      CFG.phases[0].good === 0.7, CFG.score.shotGood === -10, CFG.score.landBad === -15];
    console.log("[pizzatest]", ok.every(Boolean) ? "PASS" : "FAIL", ok);
  }
  window.SmilePizza = { cfg: CFG, state: function () { return S; }, start: startGame, end: endGame };
})();

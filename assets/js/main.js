/* PORTFOLIO 2026 — CORE 테마 스크립트 (라이브러리: Lenis만 선택 사용) */
(function () {
  "use strict";
  var P = window.PROJECTS || [];
  var CATS = window.CATS || {};
  var PF = window.PROFILE || {};
  var RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var body = document.body;
  var mouse = { x: -9999, y: -9999, nx: 0, ny: 0 };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  function val(s) {
    if (Array.isArray(s)) s = s.filter(Boolean).join(" · ");
    return s ? esc(s) : '<span class="blank" aria-label="비어 있음"></span>';
  }
  function byId(id) { for (var i = 0; i < P.length; i++) if (P[i].id === id) return P[i]; return null; }
  function href(p) { return "project.html?id=" + encodeURIComponent(p.id); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function progress(el) { // 섹션 안에서 스크롤 진행도 0~1
    var r = el.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, r.height - window.innerHeight), 0, 1);
  }

  window.addEventListener("mousemove", function (e) {
    mouse.x = e.clientX; mouse.y = e.clientY;
    mouse.nx = e.clientX / window.innerWidth - 0.5; mouse.ny = e.clientY / window.innerHeight - 0.5;
  });

  /* ── 부드러운 스크롤 (Lenis가 있으면) ── */
  var lenis = null;
  if (window.Lenis && !RM) {
    lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
  }

  /* ── 헤더: 내릴 때 숨김, 올릴 때 표시 ── */
  var hd = document.querySelector(".hd"), lastY = 0;
  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    if (hd) hd.classList.toggle("hide", y > 200 && y > lastY);
    lastY = y;
  }, { passive: true });

  /* ── 회로 배경 (캔버스) ── */
  function circuit(cv) {
    var ctx = cv.getContext("2d"), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W, H, paths = [], pulses = [], visible = true;
    function build() {
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paths = [];
      var n = Math.round((W * H) / 52000) + 8, g = 24;
      for (var i = 0; i < n; i++) {
        var x = Math.round((Math.random() * W) / g) * g, y = Math.round((Math.random() * H) / g) * g;
        var pts = [[x, y]], horiz = Math.random() < 0.5, segs = 2 + Math.floor(Math.random() * 3);
        for (var s = 0; s < segs; s++) {
          var len = (3 + Math.floor(Math.random() * 10)) * g * (Math.random() < 0.5 ? -1 : 1);
          if (horiz) x += len; else y += len;
          pts.push([x, y]); horiz = !horiz;
        }
        var L = 0;
        for (var k = 1; k < pts.length; k++) L += Math.abs(pts[k][0] - pts[k - 1][0]) + Math.abs(pts[k][1] - pts[k - 1][1]);
        paths.push({ pts: pts, len: L });
      }
      pulses = paths.filter(function () { return Math.random() < 0.45; }).map(function (p) { return { p: p, t: Math.random(), v: 0.0012 + Math.random() * 0.002 }; });
    }
    function at(p, t) {
      var d = t * p.len;
      for (var k = 1; k < p.pts.length; k++) {
        var a = p.pts[k - 1], b = p.pts[k], seg = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
        if (d <= seg) { var r = seg ? d / seg : 0; return [a[0] + (b[0] - a[0]) * r, a[1] + (b[1] - a[1]) * r]; }
        d -= seg;
      }
      return p.pts[p.pts.length - 1];
    }
    function draw() {
      if (visible) {
        ctx.clearRect(0, 0, W, H);
        var ox = mouse.nx * -14, oy = mouse.ny * -14;
        ctx.save(); ctx.translate(ox, oy);
        ctx.lineWidth = 1; ctx.strokeStyle = "#1b1c21";
        paths.forEach(function (p) {
          ctx.beginPath(); ctx.moveTo(p.pts[0][0], p.pts[0][1]);
          for (var k = 1; k < p.pts.length; k++) ctx.lineTo(p.pts[k][0], p.pts[k][1]);
          ctx.stroke();
          var e = p.pts[p.pts.length - 1];
          ctx.fillStyle = "#5e1418"; ctx.beginPath(); ctx.arc(e[0], e[1], 2, 0, 7); ctx.fill();
        });
        pulses.forEach(function (q) {
          if (!RM) q.t += q.v; if (q.t > 1) q.t = 0;
          for (var j = 0; j < 10; j++) {
            var tt = q.t - j * 0.006; if (tt < 0) break;
            var pt = at(q.p, tt);
            ctx.fillStyle = "rgba(229,35,43," + (0.9 - j * 0.09) + ")";
            ctx.fillRect(pt[0] - 1.2, pt[1] - 1.2, 2.4, 2.4);
          }
        });
        ctx.restore();
      }
      requestAnimationFrame(draw);
    }
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(cv);
    build(); draw();
    var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(build, 200); });
  }
  document.querySelectorAll("canvas.circuit").forEach(circuit);

  /* ── 큐브 회전 (마우스 + 자동) ── */
  function spinCubes() {
    var cubes = document.querySelectorAll("[data-cube]");
    if (!cubes.length) return;
    var t = 0, rx = -24, ry = 38;
    (function loop() {
      t += RM ? 0 : 0.25;
      rx += ((-24 + mouse.ny * -30) - rx) * 0.06;
      ry += ((38 + t + mouse.nx * 50) - ry) * 0.06;
      cubes.forEach(function (c) {
        var extra = parseFloat(c.getAttribute("data-cube")) || 0;
        c.style.transform = "rotateX(" + (rx * (extra ? 0.4 : 1)) + "deg) rotateY(" + (ry + extra) + "deg)";
      });
      requestAnimationFrame(loop);
    })();
  }

  /* ═══════════ HOME ═══════════ */
  function home() {
    /* 히어로 글자 분리 */
    document.querySelectorAll("[data-split]").forEach(function (el) {
      var i = 0;
      el.innerHTML = el.textContent.split("").map(function (c) {
        return '<span class="ch" style="transition-delay:' + (0.15 + i++ * 0.045) + 's">' + (c === " " ? "&nbsp;" : esc(c)) + "</span>";
      }).join("");
    });
    requestAnimationFrame(function () { document.documentElement.classList.add("ready"); });
    spinCubes();

    /* INTRO: 스크롤로 단어 채우기 */
    var intro = document.querySelector(".intro"), seq = intro ? intro.querySelectorAll(".w, .tag") : [], hex = document.querySelector(".hex");
    /* HOW: 타일 + 단계 */
    var how = document.querySelector(".how"), floor = document.querySelector(".floor"), tiles = [];
    if (floor) {
      var N = 14;
      for (var i = 0; i < N * N; i++) {
        var t = document.createElement("i"); t.className = "tile";
        var cx = (i % N) - (N - 1) / 2, cy = Math.floor(i / N) - (N - 1) / 2;
        t._d = Math.sqrt(cx * cx + cy * cy); t._r = Math.random();
        floor.appendChild(t); tiles.push(t);
      }
    }
    var steps = document.querySelectorAll(".how-step"), dots = document.querySelectorAll(".how-dots i"), curStep = -1;
    var howCube = document.querySelector(".how-cube .cube");

    function onScroll() {
      if (intro) {
        var p = progress(intro), k = Math.floor(p * 1.25 * seq.length);
        seq.forEach(function (el, j) { el.classList.toggle("on", j < k); });
        if (hex) hex.classList.toggle("on", p > 0.22);
      }
      if (how) {
        var q = progress(how), s = Math.min(steps.length - 1, Math.floor(q * steps.length));
        if (s !== curStep) {
          curStep = s;
          steps.forEach(function (el, j) { el.classList.toggle("on", j === s); });
          dots.forEach(function (el, j) { el.classList.toggle("on", j <= s); });
        }
        var R = 1.2 + q * 6;
        tiles.forEach(function (t) {
          var on = t._d < R && t._d > R - 1.6;
          t.classList.toggle("glow", on);
          t.style.transform = RM ? "" : "translateZ(" + (on ? 10 + t._r * 18 : 0) + "px)";
        });
        if (howCube) howCube.setAttribute("data-cube", String(q * 180));
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* SKILL 목록 */
    var svc = document.querySelector("[data-svc]");
    if (svc) svc.innerHTML = (window.SERVICES || []).map(function (s, i) {
      return '<a class="svc-row" href="skills.html"><span class="n">' + pad(i + 1) + "</span><h3>" + esc(s.ko) + "<small>" + esc(s.en) + "</small></h3><p>" + esc(s.desc) +
        '</p><span class="st' + (s.ok ? " ok" : "") + '">' + esc(s.status) + '</span><span class="arr" aria-hidden="true">→</span></a>';
    }).join("");

    /* CORE PROJECTS */
    var core = (window.CORE || []).map(byId).filter(Boolean);
    var colL = document.querySelector(".work-col.l"), colR = document.querySelector(".work-col.r");
    core.forEach(function (p, i) {
      var chips = [CATS[p.cat]].concat((p.stack || []).slice(0, 2)).filter(Boolean).map(function (c) { return '<span class="chip">' + esc(c) + "</span>"; }).join("") +
        (p.ai ? '<span class="chip ai">AI</span>' : "") + '<span class="chip go" aria-hidden="true">↗</span>';
      var a = document.createElement("a");
      a.className = "wcard"; a.href = href(p);
      a.innerHTML = '<div class="wcard-img"><img src="' + esc(p.thumb) + '" alt="' + esc(p.title) + ' 대표 화면" loading="lazy" decoding="async"></div>' +
        '<span class="no">' + pad(i + 1) + "</span><h3>" + esc(p.title) + '</h3><p class="ko">' + esc(p.titleKo || "") + '</p><div class="chips">' + chips + "</div>";
      (i % 2 ? colR : colL).appendChild(a);
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -10% 0px" });
    document.querySelectorAll(".wcard").forEach(function (c) { io.observe(c); });

    /* 카드 이미지 패럴랙스 */
    var imgs = document.querySelectorAll(".wcard-img");
    function para() {
      if (!RM) imgs.forEach(function (w) {
        var r = w.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        var c = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
        w.firstChild.style.setProperty("--py", clamp(c * -8, -6.5, 6.5).toFixed(2) + "%");
      });
      requestAnimationFrame(para);
    }
    para();

    /* 빨간 원형 커서 */
    var vc = document.querySelector(".vcur"), vx = 0, vy = 0;
    if (vc) {
      document.addEventListener("mouseover", function (e) { vc.classList.toggle("on", !!(e.target.closest && e.target.closest(".wcard-img"))); });
      (function f() { vx += (mouse.x - vx) * 0.2; vy += (mouse.y - vy) * 0.2; vc.style.left = vx + "px"; vc.style.top = vy + "px"; requestAnimationFrame(f); })();
    }

    /* WALL: 나머지 작업 카드 벽 */
    var rest = P.filter(function (p) { return p.thumb && (window.CORE || []).indexOf(p.id) < 0; });
    var plane = document.querySelector(".wall-plane");
    var cnt = document.querySelector("[data-all]");
    if (cnt) cnt.textContent = "(" + P.length + ")";
    if (plane && rest.length) {
      var rows = [];
      for (var r = 0; r < 3; r++) {
        var row = document.createElement("div"); row.className = "wall-row";
        var items = rest.filter(function (_, j) { return j % 3 === r; });
        if (items.length < 4) items = items.concat(rest.slice(0, 4));
        var html = items.map(function (p) {
          return '<a class="wall-card" href="' + href(p) + '" tabindex="-1"><img src="' + esc(p.thumb) + '" alt="" loading="lazy"><span>' + esc(p.title) + "<small>" + esc(CATS[p.cat] || "") + "</small></span></a>";
        }).join("");
        row.innerHTML = html + html + html;
        plane.appendChild(row);
        rows.push({ el: row, x: -r * 220, dir: r % 2 ? 1 : -1 });
      }
      var lastS = window.scrollY, boost = 0;
      (function move() {
        var s = window.scrollY; boost = boost * 0.9 + Math.abs(s - lastS) * 0.06; lastS = s;
        rows.forEach(function (o) {
          var w = o.el.scrollWidth / 3;
          if (!RM) o.x += o.dir * (0.45 + boost);
          if (o.x < -w) o.x += w; if (o.x > 0) o.x -= w;
          o.el.style.transform = "translate3d(" + o.x.toFixed(1) + "px,0,0)";
        });
        requestAnimationFrame(move);
      })();
    }
  }

  /* ═══════════ FOOTER: 파티클 호버 배경 ═══════════ */
  function footer() {
    var cv = document.querySelector(".ft canvas");
    if (!cv) return;
    var ctx = cv.getContext("2d"), dpr = Math.min(window.devicePixelRatio || 1, 2), W, H, pts = [], rot = 0, visible = false, mx = -9999, my = -9999;
    var N = 3800;
    function build() {
      W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pts = [];
      for (var i = 0; i < N; i++) { // 피보나치 구 표면 분포
        var y = 1 - (i / (N - 1)) * 2, rr = Math.sqrt(1 - y * y), th = i * 2.399963;
        pts.push({ sx: Math.cos(th) * rr, sy: y, sz: Math.sin(th) * rr, x: 0, y: 0, vx: 0, vy: 0, ox: 0, oy: 0, h: 0, red: Math.random() < 0.06 });
      }
    }
    cv.parentElement.addEventListener("mousemove", function (e) { var r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
    cv.parentElement.addEventListener("mouseleave", function () { mx = my = -9999; });
    function draw() {
      if (visible) {
        ctx.clearRect(0, 0, W, H);
        if (!RM) rot += 0.0016;
        var R = Math.max(W * 0.5, H * 0.7), cx = W * 0.56, cy = H * 1.12, c = Math.cos(rot), s = Math.sin(rot), tilt = 0.32, ct = Math.cos(tilt), st = Math.sin(tilt);
        for (var i = 0; i < pts.length; i++) {
          var p = pts[i];
          var x = p.sx * c - p.sz * s, z = p.sx * s + p.sz * c, y = p.sy * ct - z * st; z = p.sy * st + z * ct;
          if (z < -0.15) continue; // 뒷면 생략
          var hx = cx + x * R, hy = cy - y * R;
          // 마우스 반발 + 스프링 복귀
          var dx = hx + p.ox - mx, dy = hy + p.oy - my, d2 = dx * dx + dy * dy, rad = 150;
          if (d2 < rad * rad) {
            var d = Math.sqrt(d2) || 1, f = (1 - d / rad) * 4.2;
            p.vx += (dx / d) * f; p.vy += (dy / d) * f; p.h = Math.min(1, p.h + 0.25);
          }
          p.vx += -p.ox * 0.06; p.vy += -p.oy * 0.06; p.vx *= 0.82; p.vy *= 0.82;
          p.ox += p.vx; p.oy += p.vy; p.h *= 0.965;
          var a = 0.22 + z * 0.62, size = 0.7 + z * 1.3 + p.h * 1.8;
          var hv = Math.max(p.h, p.red ? 0.75 : 0), rC = Math.round(96 + (229 - 96) * hv), gC = Math.round(96 - 61 * hv), bC = Math.round(104 - 61 * hv);
          ctx.fillStyle = "rgba(" + rC + "," + gC + "," + bC + "," + Math.min(1, a + p.h * 0.6) + ")";
          ctx.beginPath(); ctx.arc(hx + p.ox, hy + p.oy, size, 0, 6.283); ctx.fill();
        }
        if (mx > -1000) { // 커서 주변 빛
          var g = ctx.createRadialGradient(mx, my, 0, mx, my, 220);
          g.addColorStop(0, "rgba(229,35,43,0.12)"); g.addColorStop(1, "rgba(229,35,43,0)");
          ctx.fillStyle = g; ctx.fillRect(mx - 220, my - 220, 440, 440);
        }
      }
      requestAnimationFrame(draw);
    }
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(cv);
    build(); draw();
    var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(build, 200); });

    var ph = document.querySelector("[data-phone]");
    if (ph) ph.innerHTML = PF.phone ? '<a href="tel:' + esc(PF.phone) + '">' + esc(PF.phone) + "</a>" : val("");
  }

  /* ═══════════ INDEX ═══════════ */
  function index() {
    var tb = document.querySelector("[data-rows]"), pv = document.querySelector(".preview"), pvi = pv.querySelector("img"), rows = "";
    P.forEach(function (p, i) {
      rows += '<tr class="row" data-cat="' + esc(p.cat) + '" data-href="' + href(p) + '" data-thumb="' + esc(p.thumb || "") + '">' +
        '<td class="no">' + pad(i + 1) + '</td><td class="nm"><a href="' + href(p) + '"><b>' + esc(p.title) + "</b></a><small>" + val(p.titleKo) + "</small></td>" +
        '<td class="hide-m">' + val(CATS[p.cat]) + '</td><td class="hide-m">' + val(p.period) + '</td><td class="hide-m">' +
        ((p.stack || []).length ? p.stack.map(function (s) { return '<span class="chip">' + esc(s) + "</span>"; }).join(" ") : val("")) +
        '</td><td class="hide-m">' + val(p.team) + '</td><td><span class="pill' + (p.status === "배포" || p.status === "운영" ? " ok" : "") + '">' + esc(p.status || "미확인") + "</span>" +
        (p.ai ? ' <span class="pill" title="' + esc(p.ai) + '">AI</span>' : "") + "</td></tr>";
    });
    for (var k = 0; k < (window.EMPTY_SLOTS || 0); k++) {
      rows += '<tr class="empty" data-cat="empty"><td class="no">' + pad(P.length + k + 1) + '</td><td class="nm"><b>Empty</b><small>추가 예정</small></td><td class="hide-m"></td><td class="hide-m"></td><td class="hide-m"></td><td class="hide-m"></td><td><span class="pill">비어 있음</span></td></tr>';
    }
    tb.innerHTML = rows;
    document.querySelector("[data-total]").textContent = P.length + " / " + (P.length + (window.EMPTY_SLOTS || 0));
    tb.addEventListener("click", function (e) { var tr = e.target.closest("tr.row"); if (tr && !e.target.closest("a")) location.href = tr.getAttribute("data-href"); });
    tb.addEventListener("mousemove", function (e) {
      var tr = e.target.closest("tr.row"), src = tr && tr.getAttribute("data-thumb");
      if (src) {
        if (pvi.getAttribute("src") !== src) pvi.src = src;
        pv.style.left = Math.min(e.clientX + 28, window.innerWidth - 340) + "px";
        pv.style.top = Math.min(e.clientY - 100, window.innerHeight - 220) + "px";
      }
      pv.classList.toggle("on", !!src);
    });
    tb.addEventListener("mouseleave", function () { pv.classList.remove("on"); });
    var btns = document.querySelectorAll(".filters button");
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        var c = b.getAttribute("data-f");
        btns.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        tb.querySelectorAll("tr").forEach(function (tr) { tr.hidden = !(c === "all" || tr.getAttribute("data-cat") === c); });
      });
    });
  }

  /* ═══════════ PROJECT (STANDARD §5) ═══════════ */
  function project() {
    var p = byId(new URLSearchParams(location.search).get("id")) || P[0], i = P.indexOf(p);
    var c = p.case || {}, q = c.quality || {}, o = c.outcome || {}, ev = c.evidence || {};
    document.title = p.title + " | 유기상 포트폴리오";
    function link(u, l) { return u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + l + " ↗</a>" : val(""); }
    function sec(no, name, rows) {
      return '<section class="cs"><h2><em>' + no + "</em>" + name + "</h2><dl>" + rows.map(function (r) {
        return r.ch ? '<div class="ch">' + esc(r.ch) + "</div>" : "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>";
      }).join("") + "</dl></section>";
    }
    var chRows = [];
    (c.challenges && c.challenges.length ? c.challenges : [{}]).forEach(function (x, k) {
      chRows.push({ ch: "Challenge " + (k + 1) + (x.title ? " — " + x.title : "") });
      chRows.push(["발생 문제", val(x.problem)], ["원인 및 제약", val(x.cause)], ["검토한 대안", val(x.alternatives)], ["해결 방식", val(x.solution)], ["확인한 결과", val(x.result)], ["관련 파일/코드", val(x.files)]);
    });
    var skills = (c.skills || []).map(function (sid) {
      var s = (window.SKILLS || []).filter(function (k) { return k.id === sid; })[0];
      return s ? sid + " " + s.area + " (" + s.status + (s.level ? " · " + s.level : "") + ")" : sid;
    });
    var prev = P[(i - 1 + P.length) % P.length], next = P[(i + 1) % P.length];
    document.querySelector("[data-project]").innerHTML =
      '<div class="p-top"><p class="eyebrow red"><span class="dot"></span>' + pad(i + 1) + " · " + esc(CATS[p.cat] || "") + "</p><h2>" + esc(p.title) + '</h2><p class="ko">' + esc(p.titleKo || "") + "</p>" +
      (p.thumb ? '<div class="p-img"><img src="' + esc(p.thumb) + '" alt="' + esc(p.title) + ' 대표 화면"></div>' : '<div class="p-img none">NO IMAGE YET</div>') + "</div>" +
      '<dl class="p-meta"><div><dt>Type</dt><dd>' + val(CATS[p.cat]) + "</dd></div><div><dt>Period</dt><dd>" + val(p.period) + "</dd></div><div><dt>Team</dt><dd>" + val(p.team) +
      "</dd></div><div><dt>Status</dt><dd>" + val(p.status) + "</dd></div><div><dt>Live</dt><dd>" + link(p.url, "열기") + "</dd></div><div><dt>GitHub</dt><dd>" + link(p.repo, "저장소") +
      "</dd></div><div><dt>Video</dt><dd>" + link(p.video, "영상") + "</dd></div></dl>" +
      sec("01", "Overview", [["한 줄 설명", val(p.summary)], ["문제 / 경험 목표", val(p.problem)], ["가장 중요한 인터랙션", val(p.interaction)]]) +
      sec("02", "My Role", [["팀 규모 및 구성", val(p.team)], ["나의 담당 범위", val(p.role)], ["직접 구현한 기능", val(c.built)], ["타인이 구현·제공한 부분", val(c.others)], ["AI 도구가 작성·보조한 부분", val(p.ai)], ["근거 코드 경로/커밋", val(ev.commits)]]) +
      sec("03", "Stack", [["사용이 확인된 기술", val(p.stack)], ["기술 선택 이유", val(c.why)]]) +
      sec("04", "Interaction", [["주요 사용자 플로우", val(c.flow)], ["입력 → 상태 → 반응", val(c.io)], ["구조", val(c.structure)], ["데이터 흐름 / API", val(c.data)]]) +
      sec("05", "Challenges", chRows) +
      sec("06", "Quality", [["반응형 / 접근성", val(q.responsive)], ["측정 도구 · 환경", val(q.tools)], ["지표", val(q.metrics || c.metricsNote)], ["테스트 범위", val(q.tested)], ["알려진 한계", val(q.limits)]]) +
      sec("07", "Outcome", [["실제 결과", val(o.result)], ["배운 점", val(o.learned)], ["개선 예정", val(o.next)]]) +
      sec("08", "Evidence", [["파일 경로", val(ev.files)], ["이미지 / 영상", val(ev.media)]]) +
      sec("09", "Skills", [["확인된 역량", val(skills)]]) +
      '<nav class="p-nav" aria-label="다른 프로젝트"><a href="' + href(prev) + '"><small>PREV</small>' + esc(prev.title) + '</a><a href="' + href(next) + '" style="text-align:right"><small>NEXT</small>' + esc(next.title) + "</a></nav>";
  }

  /* ═══════════ SKILLS ═══════════ */
  function skills() {
    document.querySelector("[data-skills]").innerHTML = (window.SKILLS || []).map(function (s) {
      var pr = s.projects.map(function (id) { var p = byId(id); return p ? '<a href="' + href(p) + '">' + esc(p.title) + "</a>" : ""; }).join(", ");
      return '<tr><td class="id">' + s.id + "</td><td>" + esc(s.area) + '<br><small style="color:var(--mut)">' + esc(s.name) + "</small></td><td>" + esc(s.p) +
        '</td><td class="s-' + esc(s.status) + '">' + esc(s.status) + "</td><td>" + val(s.level) + "</td><td>" + (pr || val("")) + '</td><td style="color:var(--mut)">' + val(s.note) + "</td></tr>";
    }).join("");
  }

  if (body.classList.contains("page-home")) home();
  if (body.classList.contains("page-index")) index();
  if (body.classList.contains("page-project")) project();
  if (body.classList.contains("page-skills")) skills();
  footer();
})();

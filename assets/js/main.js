/* PORTFOLIO 2026 — CORE 테마 스크립트 (라이브러리: Lenis만 선택 사용) */
(function () {
  "use strict";
  var P = (window.PROJECTS || []).filter(function (p) { return !p.hide; });
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
  function year(p) { return String(p.period || "").slice(0, 4); }
  function chipsOf(p) {
    return [CATS[p.cat]].concat((p.stack || []).slice(0, 2)).filter(Boolean).map(function (c) { return '<span class="chip">' + esc(c) + "</span>"; }).join("") +
      '<span class="chip go" aria-hidden="true">↗</span>';
  }
  function coreCard(p, i) { // 코어 프로젝트 카드 (키 비주얼)
    var a = document.createElement("a");
    a.className = "wcard"; a.href = href(p);
    a.innerHTML = '<div class="wcard-img' + (p.kv ? " kv" : "") + '"><img src="' + esc(p.kv || p.thumb) + '" alt="' + esc(p.title) + ' 키 비주얼" loading="lazy" decoding="async"></div>' +
      '<span class="no">' + pad(i + 1) + " · " + esc(year(p)) + "</span><h3>" + esc(p.title) + '</h3><p class="ko">' + esc(p.titleKo || "") + '</p><div class="chips">' + chipsOf(p) + "</div>";
    return a;
  }
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

    /* 히어로 슬로건: 단어 순서대로 채우기 */
    document.querySelectorAll(".hero-say .w, .hero-say .tag, .hero-say .hex").forEach(function (el, j) {
      setTimeout(function () { el.classList.add("on"); }, RM ? 0 : 900 + j * 160);
    });

    /* 역량 목록 */
    var svc = document.querySelector("[data-svc]");
    if (svc) svc.innerHTML = (window.CAPS || []).map(function (s, i) {
      return '<a class="svc-row" href="skills.html#' + esc(s.id) + '"><span class="n">' + pad(i + 1) + "</span><h3>" + esc(s.ko) + "<small>" + esc(s.en) + "</small></h3><p>" + esc(s.desc) +
        '</p><span class="tools">' + s.tools.slice(0, 4).map(function (t) { return "<i>" + esc(t) + "</i>"; }).join("") + '</span><span class="arr" aria-hidden="true">→</span></a>';
    }).join("");

    /* CORE PROJECTS */
    var colL = document.querySelector(".work-col.l"), colR = document.querySelector(".work-col.r");
    (window.CORE || []).map(byId).filter(Boolean).forEach(function (p, i) { (i % 2 ? colR : colL).appendChild(coreCard(p, i)); });
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

    document.querySelectorAll("[data-phone]").forEach(function (ph) {
      ph.innerHTML = PF.phone ? '<a href="tel:' + esc(PF.phone) + '">' + esc(PF.phone) + "</a>" : val("");
    });
  }

  /* ═══════════ PROJECTS: 코어 / 전체 ═══════════ */
  function index() {
    var grid = document.querySelector("[data-core]");
    if (grid) (window.CORE || []).map(byId).filter(Boolean).forEach(function (p, i) { var c = coreCard(p, i); c.classList.add("in"); grid.appendChild(c); });
    document.querySelectorAll("[data-n-core]").forEach(function (el) { el.textContent = pad((window.CORE || []).length); });
    document.querySelectorAll("[data-n-all]").forEach(function (el) { el.textContent = pad(P.length); });

    var tb = document.querySelector("[data-rows]"), pv = document.querySelector(".preview"), pvi = pv.querySelector("img"), rows = "";
    P.forEach(function (p, i) {
      rows += '<tr class="row" data-cat="' + esc(p.cat) + '" data-href="' + href(p) + '" data-thumb="' + esc(p.thumb || p.kv || "") + '">' +
        '<td class="no">' + pad(i + 1) + '</td><td class="nm"><a href="' + href(p) + '"><b>' + esc(p.title) + "</b></a><small>" + esc(p.titleKo || p.summary || "") + "</small></td>" +
        '<td class="hide-m">' + esc(CATS[p.cat] || "") + '</td><td class="hide-m">' + esc(year(p)) + '</td><td class="hide-m">' +
        (p.stack || []).map(function (x) { return '<span class="chip">' + esc(x) + "</span>"; }).join(" ") + '</td><td class="go" aria-hidden="true">↗</td></tr>';
    });
    tb.innerHTML = rows;
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

    /* 탭: #core / #all */
    var tabs = document.querySelectorAll(".ptab"), panes = document.querySelectorAll(".ppane");
    function show(k) {
      tabs.forEach(function (t) { t.setAttribute("aria-selected", t.getAttribute("data-tab") === k ? "true" : "false"); });
      panes.forEach(function (x) { x.hidden = x.id !== "pane-" + k; });
    }
    tabs.forEach(function (t) {
      t.addEventListener("click", function () { var k = t.getAttribute("data-tab"); show(k); history.replaceState(null, "", "#" + k); });
    });
    if (tabs.length) show(location.hash === "#all" ? "all" : "core");
  }

  /* ═══════════ PROJECT (STANDARD §5) ═══════════ */
  function projectHTML(p) { // 상세 페이지 · 모달 공용
    var i = P.indexOf(p);
    var c = p.case || {}, o = c.outcome || {};
    function has(v) { return Array.isArray(v) ? v.filter(Boolean).length : !!v; }
    function sec(no, name, rows) { // 값이 있는 칸만 표시, 모두 비면 섹션 생략
      rows = rows.filter(function (r) { return r.ch || has(r[1]); });
      if (!rows.length) return "";
      return '<section class="cs"><h2><em>' + no + "</em>" + name + "</h2><dl>" + rows.map(function (r) {
        return r.ch ? '<div class="ch">' + esc(r.ch) + "</div>" : "<dt>" + r[0] + "</dt><dd>" + val(r[1]) + "</dd>";
      }).join("") + "</dl></section>";
    }
    var chRows = [];
    (c.challenges || []).filter(function (x) { return x.solution; }).forEach(function (x) {
      chRows.push({ ch: x.title });
      chRows.push(["상황", x.problem], ["원인", x.cause], ["해결", x.solution], ["결과", x.result]);
    });
    var caps = (window.CAPS || []).filter(function (k) { return k.projects.indexOf(p.id) > -1; });
    var links = [p.url && '<a href="' + esc(p.url) + '" target="_blank" rel="noopener">사이트 열기 ↗</a>', p.repo && '<a href="' + esc(p.repo) + '" target="_blank" rel="noopener">GitHub ↗</a>',
      p.video && '<a href="' + esc(p.video) + '" target="_blank" rel="noopener">영상 ↗</a>'].filter(Boolean);
    var meta = [["Type", CATS[p.cat]], ["Year", p.period], ["Team", p.team], ["Role", p.role]].filter(function (m) { return m[1]; });
    var prev = P[(i - 1 + P.length) % P.length], next = P[(i + 1) % P.length];
    var img = p.thumb ? '<div class="p-img"><img src="' + esc(p.thumb) + '" alt="' + esc(p.title) + ' 대표 화면"></div>'
      : '<div class="p-img none"><span>' + esc(p.title) + "</span><small>" + esc(CATS[p.cat] || "") + "</small></div>";
    var n = 0;
    function no() { n++; return pad(n); }
    var secs = [
      ["Overview", [["한 줄 설명", p.summary], ["목표", p.problem], ["핵심 인터랙션", p.interaction]]],
      ["My Role", [["팀 구성", p.team], ["담당", p.role], ["직접 구현", c.built], ["AI 도구 활용", p.ai]]],
      ["Stack", [["사용 기술", p.stack], ["제작 방식", c.why]]],
      ["Interaction", [["사용자 흐름", c.flow], ["입력 → 반응", c.io], ["구조", c.structure], ["데이터 · 출력", c.data]]],
      ["Process", chRows],
      ["Outcome", [["결과", o.result], ["배운 점", o.learned]]]
    ].map(function (x) {
      var rows = x[1].filter(function (r) { return r.ch || has(r[1]); });
      return rows.length ? sec(no(), x[0], rows) : "";
    }).join("");
    return '<div class="p-top"><p class="eyebrow red"><span class="dot"></span>' + pad(i + 1) + " · " + esc(CATS[p.cat] || "") + "</p><h2>" + esc(p.title) + '</h2><p class="ko">' + esc(p.titleKo || "") + "</p>" +
      (links.length ? '<p class="p-links">' + links.join("") + "</p>" : "") + img + "</div>" +
      '<dl class="p-meta">' + meta.map(function (m) { return "<div><dt>" + m[0] + "</dt><dd>" + esc(m[1]) + "</dd></div>"; }).join("") + "</dl>" + secs +
      (caps.length ? '<section class="cs"><h2><em>' + no() + "</em>Capabilities</h2><div class=\"p-caps\">" + caps.map(function (k) {
        return '<a href="skills.html#' + esc(k.id) + '">' + esc(k.ko) + "<small>" + esc(k.en) + "</small></a>";
      }).join("") + "</div></section>" : "") +
      '<nav class="p-nav" aria-label="다른 프로젝트"><a href="' + href(prev) + '"><small>PREV</small>' + esc(prev.title) + '</a><a href="' + href(next) + '" style="text-align:right"><small>NEXT</small>' + esc(next.title) + "</a></nav>";
  }
  function project() {
    var p = byId(new URLSearchParams(location.search).get("id")) || P[0];
    document.title = p.title + " | 유기상 포트폴리오";
    document.querySelector("[data-project]").innerHTML = projectHTML(p);
  }

  /* ═══════════ CAPABILITIES ═══════════ */
  function skills() {
    document.querySelector("[data-caps]").innerHTML = (window.CAPS || []).map(capHTML).join("");
  }
  function capHTML(k, n) { // 역량 페이지 · 모달 공용
      var ps = k.projects.map(byId).filter(Boolean);
      return '<section class="cap" id="' + esc(k.id) + '"><div class="cap-h"><span class="n">' + pad(n + 1) + "</span><h2>" + esc(k.ko) + "<small>" + esc(k.en) + "</small></h2></div>" +
        '<div class="cap-b"><p class="cap-d">' + esc(k.desc) + '</p><ul class="cap-p">' + k.points.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" +
        '<p class="cap-t">' + k.tools.map(function (t) { return '<span class="chip">' + esc(t) + "</span>"; }).join(" ") + "</p>" +
        '<div class="cap-w">' + ps.map(function (p) {
          return '<a href="' + href(p) + '"><img src="' + esc(p.kv || p.thumb || "") + '" alt="" loading="lazy"><span>' + esc(p.title) + "<small>" + esc(p.titleKo || "") + "</small></span></a>";
        }).join("") + "</div></div></section>";
  }

  /* A4 문서가 화면보다 넓으면 비율 그대로 축소 */
  function fitPapers(root) {
    (root || document).querySelectorAll(".paper").forEach(function (pp) {
      pp.style.zoom = "";
      var avail = pp.parentElement.clientWidth - 24, w = pp.offsetWidth;
      if (w > avail) pp.style.zoom = (avail / w).toFixed(3);
    });
  }
  if (body.classList.contains("page-doc")) {
    fitPapers();
    window.addEventListener("resize", function () { fitPapers(); });
  }

  window.UI = { projectHTML: projectHTML, capHTML: capHTML, byId: byId, lenis: lenis, fitPapers: fitPapers }; // 한 페이지 버전(single.js)에서 사용
  if (body.classList.contains("page-home")) home();
  if (body.classList.contains("page-index")) index();
  if (body.classList.contains("page-project")) project();
  if (body.classList.contains("page-skills")) skills();
  footer();
})();

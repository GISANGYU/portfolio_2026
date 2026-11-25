/* WINDUP TOWN 상세 페이지 — 지시 재생 · 게임 불러오기와 상태 패널 · 비교 슬라이더 · 갈아끼우기 체험 */
(function () {
  "use strict";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };

  /* ───────── 1. 지시 재생 ───────── */
  var LANES = {
    logic: { name: "Claude Code · 로직", c: "#e8794f", dir: "windup-town" },
    image: { name: "Codex · 이미지", c: "#7fb2ff", dir: "windup-town/assets" },
    sound: { name: "Claude Code · 소리", c: "#b48cff", dir: "windup-town/assets/audio" },
  };
  // 지시문은 실제 대화 기록 원문(오타 · 띄어쓰기만 고침). t = 작업 단계, r = 결과
  var EPS = [
    { lane: "logic", when: "11.11 09:13", title: "레퍼런스 수집 · 조건 확인",
      u: "2D 생활형 미니 RPG인 만큼 스타일별로 (각각 다른) 이미지 레퍼런스 20종류 이상 정리해서 HTML 문서로 보관해 주고, PDF에 제시한 내용대로 놓치는 거 없나 확인해 줘.",
      t: [["Read", "class11.pdf · 공통 5기능 MAP · NPC · EVENT · HOUSE · VISUAL"], ["Write", "style-reference/index.html · 스타일 27종"], ["Check", "Prompt Log · BEST/WORST · TARGET vs RESULT 산출물 누락 없음"]],
      r: "19번 1930년대 러버호스 카툰을 TARGET으로 선택 → MUST HAVE 3개, DO NOT LOSE 1개 확정" },
    { lane: "logic", when: "11.11 09:52", title: "세 창 분업 설계",
      u: "이미지별 네이밍을 Codex에게 '이렇게 이름 설정해서 저장해'라는 md 내용을 추가하고, 우리는 그게 앞으로 채워질 거라는 가정하에 임시 도형으로 게임 로직을 구성하다가 이미지가 로컬에 들어오면 바로바로 소스가 반영되게 구현한다.",
      t: [["Write", "GAME_DESIGN.md · 세계관 · 조작 · 상태"], ["Write", "ASSET_GUIDE.md · AGENTS.md · STYLE BLOCK"], ["Write", "assets/manifest.js · ID · 경로 · 크기 · prompt"], ["Write", "src/assets.js · 임시 도형 · 2초 재시도 · 자동 트림"]],
      r: "이미지 0장으로 1막 실행 · Codex는 JOB-0(기준 이미지)부터 시작" },
    { lane: "image", when: "11.12", title: "JOB 번호 한 줄",
      u: "JOB18 진행해",
      t: [["Read", "AGENTS.md → jobs/JOB-18.md"], ["Read", "ASSET_GUIDE.md · refs/style_anchor.png"], ["image_gen", "시트 a · 마젠타 배경 · 볼트 남작 5자세"], ["Bash", "python tools/slice_sheet.py JOB-18_a.png --names boss_volt_idle,…"], ["Bash", "python tools/check_assets.py"], ["Edit", "PROMPT_LOG.md · 날짜 | JOB | 파일 | 요약 | 합격/재생성"]],
      r: "12개 저장 → 게임이 2초 안에 임시 도형을 이미지로 교체" },
    { lane: "logic", when: "11.11 10:15", title: "“왜 모으는지 없다”",
      u: "퀘스트를 왜 진행해야 하는지가 없고 그냥 모아 와 하니까 시켜서 모아 온 느낌인데, 세계관 설명이 맨 처음에 있어야 할 것 같고, 태엽을 다 모아서 감을 때 사용자가 실제로 돌리는 모션이 나오면 좋겠어.",
      t: [["Edit", "GAME_DESIGN.md 12절 · 오프닝 컷신 5장 (열쇠 도난 = 보스 복선)"], ["Write", "src/story.js · 아이리스 전환 · 자막 카드"], ["Write", "src/wind.js · 원 그리기 / A·D · 1/3·2/3 딸깍 고정"], ["Write", "src/boss.js · 째깍 백작 · 점프=회피, 감기=공격"]],
      r: "1막 = 튜토리얼, 2막 = 1막에서 배운 동작으로 싸우는 보스전" },
    { lane: "sound", when: "11.11 10:27", title: "소리 담당 창",
      u: "너는 서브 작업자이다. windup-town에서 게임을 만들고 있는데 배경음악 및 효과음이 필요한 상태이다. 필요한 음악 소스들 종류를 추리고 음악 소스 생성 진행해 줘.",
      t: [["Read", "GAME_DESIGN.md · src/ · 소리가 필요한 장면 찾기"], ["Write", "tools/gen_audio.py · numpy · scipy 절차 합성"], ["Write", "assets/audio/audio_manifest.js · id · loop · vol · when"], ["Write", "assets/audio/preview.html"]],
      r: "BGM 9 · 효과음 42 · 외부 음원 없음 → 로직 창에 붙일 지시문까지 작성" },
    { lane: "logic", when: "11.12 01:24", title: "Codex 축약본 검토",
      u: "코덱스한테 게임이 너무 지루하다는 피드백을 하고 코덱스가 자체적으로 3~5막을 수정했는데 분석해 봐. 어떤 걸 수정했는지.",
      t: [["Bash", "git diff ceb7800 -- src/ · 6개 파일 +130 −39"], ["Compare", "막별 변경: 장식 놓기 · 말뚝 · 체험 · 구간 길이"], ["Flag", "소모 0 · 교체 0.15초 → 갈아끼울 이유가 없음"], ["Flag", "if (false && …) 로 꺼 둔 코드 · selftest 미반영"]],
      r: "선택: 남김 4 · 되살림 3 → 병합 후 selftest 116" },
    { lane: "logic", when: "11.12 03:00", title: "Q = 시간 정지",
      u: "Q로 토글할 때 멈추잖아. 이걸 미리 예측하고 써야 하는데 그건 말이 안 되는 것 같고, Q를 누르는 순간 주변 시간이 멈추면서 우웅~ 하는 효과음과 함께 건전지가 들어가거나 끼기기긱 태엽을 돌리면서 토글이 되어야 할 것 같아.",
      t: [["Edit", "src/road.js · swapT 0.6 · 보스 · 공격 · 장치 · 중력 정지"], ["Edit", "src/render.js · 회색 화면 + 시계 눈금 고리"], ["Edit", "jobs/AUDIO2.md · sfx_timestop · sfx_swap_wind 추가"], ["Bash", "?selftest · 공중 교체 · 보스 정지 항목 추가"]],
      r: "129/129 PASS · 공중에서도 갈아끼우기" },
    { lane: "logic", when: "11.12 03:25", title: "보스 서사 → 기술 → 배우는 이유",
      u: "보스의 서사적 스토리가 있으면서도 그걸 타파하기 위한 기술, 그 기술을 배우기 위한 서사적 장치가 필요해.",
      t: [["Edit", "GAME_DESIGN.md 22절 · 멜로디 여왕: 멈추는 게 두려워 과감기"], ["Write", "jobs/JOB-24~27.md · jobs/AUDIO3.md"], ["Write", "src/unwind.js · 반대 방향 · 속도 띠 · 너무 빠르면 팅"], ["Write", "src/act6.js · road 구간 5~7 · melody 보스"]],
      r: "6 · 7막 완료 · selftest 180/180 PASS" },
  ];

  var R = $("[data-replay]");
  if (R) {
    var body = $("[data-r=body]", R), lane = $("[data-r=lane]", R), title = $("[data-r=title]", R), list = $("[data-r=eps]", R);
    var cur = 0, timer = null, visible = false, token = 0;
    EPS.forEach(function (e, i) {
      var li = document.createElement("li"), b = document.createElement("button");
      b.type = "button"; b.style.setProperty("--c", LANES[e.lane].c);
      b.innerHTML = "<i></i><small>" + e.when + " · " + LANES[e.lane].name.split(" · ")[1] + "</small><span>" + e.title + "</span>";
      b.addEventListener("click", function () { play(i); });
      li.appendChild(b); list.appendChild(li);
    });
    var btns = list.querySelectorAll("button");
    function el(cls, html) { var d = document.createElement("div"); d.className = cls; if (html != null) d.innerHTML = html; body.appendChild(d); return d; }
    function esc(s) { return s.replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
    function wait(ms, tk) { return new Promise(function (res) { timer = setTimeout(function () { if (tk === token) res(); }, ms); }); }
    function play(i) {
      clearTimeout(timer); token++; var tk = token; cur = (i + EPS.length) % EPS.length;
      var e = EPS[cur], L = LANES[e.lane];
      btns.forEach(function (b, j) { b.setAttribute("aria-current", j === cur ? "true" : "false"); });
      R.style.setProperty("--lc", L.c); lane.textContent = L.name; title.textContent = "~/" + L.dir;
      body.innerHTML = ""; el("when", e.when + " · " + L.name);
      var u = el("u typing");
      if (reduce) {
        u.className = "u"; u.textContent = e.u;
        e.t.forEach(function (t) { el("t", "<b>" + t[0] + "</b> <span>" + esc(t[1]) + "</span>"); });
        el("r", esc(e.r)); return;
      }
      var n = 0, step = e.u.length > 90 ? 22 : 45;
      (function type() {
        if (tk !== token) return;
        if (!visible) { timer = setTimeout(type, 300); return; }
        n = Math.min(e.u.length, n + (e.u.length > 90 ? 2 : 1)); u.textContent = e.u.slice(0, n);
        if (n < e.u.length) { timer = setTimeout(type, step); return; }
        u.className = "u"; tools(0);
      })();
      function tools(k) {
        if (tk !== token) return;
        if (k >= e.t.length) { wait(450, tk).then(function () { el("r", "└ " + esc(e.r)); return wait(3600, tk); }).then(function () { next(tk); }); return; }
        var t = el("t run", "<b>" + e.t[k][0] + "</b> <span>" + esc(e.t[k][1]) + "</span>");
        wait(650 + Math.random() * 450, tk).then(function () { t.className = "t"; tools(k + 1); });
      }
    }
    function next(tk) { if (tk !== token) return; if (!visible) { timer = setTimeout(function () { next(tk); }, 400); return; } play(cur + 1); }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0.3 }).observe(R);
    } else visible = true;
    play(0);
  }

  /* ───────── 2. 게임 불러오기 + 상태 패널 ───────── */
  var GAME_URL = "https://gisangyu.github.io/windup-town/";
  var frame = $("[data-game]"), live = $(".wt-live");
  if (frame) {
    $("[data-act=load]", frame).addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = GAME_URL; f.title = "태엽 마을 게임"; f.allow = "autoplay; fullscreen"; f.setAttribute("allowfullscreen", "");
      frame.innerHTML = ""; frame.appendChild(f);
      f.addEventListener("load", function () { try { f.contentWindow.focus(); } catch (e) {} });
      watch(f);
    });
  }
  function actOf(s) {
    if (s.scene === "road" && s.road) { var z = s.road.zone; return z >= 5 ? "제7막" : z === 4 ? "제5막" : "제4막"; }
    if (s.scene === "arena") return "제2막";
    return ["", "제1막", "제2막", "제3막", "제6막", "제7막"][s.episode] || "제" + s.episode + "막";
  }
  var SCENE = { town: "마을", house: "집 안", arena: "보스 아레나", road: "횡스크롤" };
  function watch(f) {
    var q = function (k) { return $("[data-l=" + k + "]", live); }, conn = q("conn"), log = q("log"), prev = {};
    var tries = 0;
    var id = setInterval(function () {
      var s;
      try { s = f.contentWindow.WT && f.contentWindow.WT.Game && f.contentWindow.WT.Game.state; }
      catch (e) { conn.textContent = "다른 주소라 읽기 불가"; clearInterval(id); return; }
      if (!s) { if (++tries > 40) { conn.textContent = "상태 없음"; clearInterval(id); } return; }
      conn.textContent = "연결됨"; conn.classList.add("on"); live.classList.add("live");
      var r = s.scene === "road" ? s.road : null, p = r ? r.p : s.player;
      var power = p && p.power === "battery" ? "건전지" : "태엽";
      if (p && p.swapT > 0) power = "갈아끼우는 중";
      var boss = r && r.boss ? ({ toad: "두꺼비집 문지기", volt: "볼트 남작", melody: "멜로디 여왕" }[r.boss.kind] || r.boss.kind) + " R" + (r.boss.round || 1)
        : s.boss ? "째깍 백작 R" + s.boss.round : "없음";
      var v = { act: actOf(s), scene: SCENE[s.scene] || s.scene, power: power, boss: boss };
      Object.keys(v).forEach(function (k) {
        q(k).textContent = v[k];
        if (prev[k] !== undefined && prev[k] !== v[k] && v[k] !== "갈아끼우는 중") add(k, v[k]);
      });
      prev = v;
      q("wind").style.width = (r ? r.wind : s.world && s.world.musicOn ? 100 : 30) + "%";
      q("battery").style.width = (r ? r.battery : p && p.power === "battery" ? 100 : 0) + "%";
    }, 250);
    function add(k, val) {
      var li = document.createElement("li"), lab = { act: "막", scene: "장면", power: "동력", boss: "보스" }[k];
      li.innerHTML = "<code>" + lab + "</code><span>" + val + "</span>";
      log.insertBefore(li, log.firstChild); while (log.children.length > 8) log.removeChild(log.lastChild);
    }
  }

  /* ───────── 3. 비교 슬라이더 ───────── */
  var cmp = $("[data-compare]");
  if (cmp) {
    var rg = $("input", cmp);
    rg.addEventListener("input", function () { cmp.style.setProperty("--x", rg.value + "%"); });
  }

  /* ───────── 4. 갈아끼우기 체험 ───────── */
  var sw = $("[data-swap]");
  if (sw) {
    var busy = false;
    function swap() {
      if (busy) return; busy = true;
      var to = sw.dataset.mode === "wind" ? "battery" : "wind";
      sw.dataset.sfx = to === "battery" ? "우웅… 딸깍!" : "우웅… 끼기기긱!";
      sw.classList.add("freeze");
      setTimeout(function () { sw.dataset.mode = to; sw.classList.remove("freeze"); busy = false; }, 600);
    }
    $("[data-act=swap]", sw).addEventListener("click", swap);
    document.addEventListener("keydown", function (e) {
      if (e.code !== "KeyQ" || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
      var b = sw.getBoundingClientRect(); if (b.top < innerHeight && b.bottom > 0) swap();
    });
  }

  /* ───────── 5. JOB 파이프라인 (의존 그래프) ───────── */
  var dagEl = $("[data-dag]");
  if (dagEl) {
    // 실제 지시서 기준: ASSET_GUIDE 1-4절 · jobs/README.md · JOB-n.md "먼저 끝나 있어야 하는 JOB"
    var LN = [
      { name: "1 · 2막", sub: "수업 3시간 · ASSET_GUIDE 1-4", gx: 0, gy: 0, nodes: [
        ["JOB-0", "스타일 앵커", 0, [], "gate"], ["JOB-1", "보글 13", 1, ["JOB-0"]], ["JOB-2", "NPC 8", 1, ["JOB-0"]], ["JOB-4", "소품 9", 1, ["JOB-0"]], ["JOB-5", "가구·이펙트 11", 1, ["JOB-0"]], ["JOB-6", "배경 3", 1, ["JOB-0"]],
        ["JOB-3", "초상화 5", 2, ["JOB-2"]], ["JOB-8", "째깍 백작 18", 2, ["JOB-2"]], ["JOB-7", "컷신·감기 모달 7", 2, ["JOB-6"]]] },
      { name: "3~5막 (첫 이야기)", sub: "jobs/JOB-09 ~ 17", gx: 1, gy: 0, nodes: [
        ["A1", "style_anchor", 0, [], "ghost"], ["JOB-9", "라디오 씨 6", 1, ["A1"]], ["JOB-10", "소품·장식 9", 1, ["A1"]], ["JOB-12", "측량기 10", 1, ["A1"], "cut"], ["JOB-14", "횡스크롤 보글 11", 1, ["A1"]], ["JOB-15", "길 배경 6", 1, ["A1"]],
        ["JOB-11", "컷신·모달 7", 2, ["JOB-9", "JOB-10"]], ["JOB-13", "4막 컷신 5", 2, ["JOB-9", "JOB-12"], "cut"], ["JOB-16", "지형·장애물 16", 2, ["JOB-15"]],
        ["JOB-17", "컷신·HUD 7", 3, ["JOB-9", "JOB-14", "JOB-15"]]] },
      { name: "새 3~5막", sub: "jobs/JOB-18 ~ 23", gx: 0, gy: 1, nodes: [
        ["A2", "style_anchor", 0, [], "ghost"], ["JOB-18", "볼트 남작 12", 1, ["A2"]], ["JOB-19", "두꺼비집 8", 1, ["A2"]], ["JOB-20", "라디오 변신 6", 1, ["A2"]], ["JOB-21", "아레나·이펙트 12", 1, ["A2"]],
        ["JOB-22", "컷신 13", 2, ["JOB-18", "JOB-19", "JOB-20"]], ["JOB-23", "흑막 컷신 2", 2, ["JOB-18", "JOB-19"]]] },
      { name: "6~7막", sub: "jobs/JOB-24 ~ 27", gx: 1, gy: 1, nodes: [
        ["A3", "style_anchor", 0, [], "ghost"], ["JOB-24", "멜로디 여왕 10", 1, ["A3"]], ["JOB-25", "오르골 주민 9", 1, ["A3"]], ["JOB-26", "배경·소품 16", 1, ["A3"]],
        ["JOB-27", "컷신 12", 2, ["JOB-24", "JOB-25"]]] },
    ];
    var NS = "http://www.w3.org/2000/svg", NW = 138, NH = 44, PX = 156, PY = 52, LW = 650, TOP = 54;
    var rowsOf = function (l) { var c = {}; l.nodes.forEach(function (n) { c[n[2]] = (c[n[2]] || 0) + 1; }); return Math.max.apply(null, Object.keys(c).map(function (k) { return c[k]; })); };
    var rowH = [Math.max(rowsOf(LN[0]), rowsOf(LN[1])), Math.max(rowsOf(LN[2]), rowsOf(LN[3]))].map(function (r) { return TOP + r * PY + 18; });
    var svg = document.createElementNS(NS, "svg"), VW = LW * 2 + 10, VH = rowH[0] + rowH[1];
    svg.setAttribute("viewBox", "0 0 " + VW + " " + VH); svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "JOB 의존 그래프. JOB-0 스타일 앵커 승인 후 JOB-1·2·4·5·6 동시, JOB-3·8은 JOB-2 뒤, JOB-7은 JOB-6 뒤. JOB-11은 9·10 뒤, JOB-13은 9·12 뒤, JOB-16은 15 뒤, JOB-17은 9·14·15 뒤. JOB-22는 18·19·20 뒤, JOB-23은 18·19 뒤. JOB-27은 24·25 뒤.");
    var mk = function (tag, at, par) { var e = document.createElementNS(NS, tag); for (var a in at) e.setAttribute(a, at[a]); (par || svg).appendChild(e); return e; };
    var gE = mk("g", {}), gN = mk("g", {}), N = {}, E = [];
    mk("line", { x1: LW + 5, y1: 8, x2: LW + 5, y2: VH - 8, class: "dg-sep" }, gE);
    mk("line", { x1: 8, y1: rowH[0], x2: VW - 8, y2: rowH[0], class: "dg-sep" }, gE);
    LN.forEach(function (l) {
      var ox = l.gx * (LW + 10) + 12, oy = l.gy ? rowH[0] : 0, cnt = {};
      mk("text", { x: ox, y: oy + 24, class: "dg-lane2" }, gN).textContent = l.name;
      mk("text", { x: ox, y: oy + 41, class: "dg-lane" }, gN).textContent = l.sub;
      l.nodes.forEach(function (n) {
        var w = n[2], r = cnt[w] = (cnt[w] || 0) + 1, x = ox + w * PX, y = oy + TOP + (r - 1) * PY;
        var g = mk("g", { class: "dg-n lock " + (n[4] || ""), tabindex: "0" }, gN);
        mk("rect", { x: x, y: y, width: NW, height: NH, rx: 8 }, g);
        mk("text", { x: x + 10, y: y + 18, class: "id" }, g).textContent = n[4] === "ghost" ? "앵커 첨부" : n[0];
        mk("text", { x: x + 10, y: y + 35, class: "ds" }, g).textContent = n[1];
        var lk = mk("text", { x: x + NW - 20, y: y + 19, class: "lk" }, g);
        N[n[0]] = { id: n[0], d: n[1], deps: n[3], g: g, lk: lk, x: x, y: y, kind: n[4] || "", st: "lock" };
      });
    });
    Object.keys(N).forEach(function (id) {
      N[id].deps.forEach(function (d) {
        var a = N[d], b = N[id], x1 = a.x + NW, y1 = a.y + NH / 2, x2 = b.x, y2 = b.y + NH / 2, mx = (x1 + x2) / 2;
        var p = mk("path", { d: "M" + x1 + " " + y1 + " C" + mx + " " + y1 + " " + mx + " " + y2 + " " + x2 + " " + y2, class: "dg-e" }, gE);
        E.push({ a: d, b: id, p: p });
      });
    });
    function setSt(id, st) {
      var n = N[id]; n.st = st; n.g.classList.remove("lock", "run", "done"); n.g.classList.add(st);
      n.lk.textContent = st === "lock" ? "🔒" : st === "done" ? "✓" : "";
      E.forEach(function (e) { if (e.a === id) e.p.classList.toggle("done", st === "done"); });
    }
    function reset() { Object.keys(N).forEach(function (id) { setSt(id, N[id].kind === "ghost" ? "done" : "lock"); }); }
    reset();
    var tip = $("[data-tip]", dagEl), btn = $("[data-act=dag]", dagEl), playing = false;
    var name = function (ids) { return ids.map(function (i) { return N[i].kind === "ghost" ? "style_anchor" : i; }).join(" · "); };
    function info(id) {
      var n = N[id]; if (n.kind === "ghost") return "style_anchor.png · 1·2막에서 승인한 기준 이미지를 모든 JOB에 첨부";
      var need = n.deps.filter(function (d) { return N[d].kind !== "ghost"; });
      return n.id + " · " + n.d + (need.length ? " — 먼저 끝나야: " + name(need) + " (결과 이미지를 레퍼런스로 씀)" : n.kind === "gate" ? " — 승인 전에는 다른 JOB 시작 금지" : " — 바로 시작 가능") + (n.kind === "cut" ? " · 이야기를 다시 짜며 폐기" : "");
    }
    Object.keys(N).forEach(function (id) {
      var n = N[id];
      var on = function () {
        if (playing) return;
        n.g.classList.add("hi"); E.forEach(function (e) { if (e.b === id || e.a === id) { e.p.classList.add("hi"); N[e.a === id ? e.b : e.a].g.classList.add("hi"); } });
        tip.textContent = info(id);
      };
      var off = function () { Object.keys(N).forEach(function (k) { N[k].g.classList.remove("hi"); }); E.forEach(function (e) { e.p.classList.remove("hi"); }); };
      n.g.addEventListener("mouseenter", on); n.g.addEventListener("focus", on);
      n.g.addEventListener("mouseleave", off); n.g.addEventListener("blur", off);
    });
    // 재생: 막 묶음 순서대로, 선행이 모두 끝난 JOB을 한꺼번에 진행
    var NOTE = { "JOB-0": "JOB-0 스타일 앵커 생성 → 사람이 확인하고 승인. 그 전엔 전부 대기",
      "JOB-1": "승인 즉시 JOB-1 · 2 · 4 · 5 · 6 동시에. 모두 같은 앵커를 첨부",
      "JOB-3": "JOB-3 초상화 · JOB-8 백작은 JOB-2 NPC 이미지를, JOB-7은 JOB-6 배경을 레퍼런스로",
      "JOB-9": "1차: 의존 없는 5개를 Codex 창마다 동시에",
      "JOB-11": "2차: JOB-11은 9·10, JOB-13은 9·12, JOB-16은 15가 끝나야 시작",
      "JOB-17": "3차: JOB-17은 9·14·15 결과가 모두 있어야 시작",
      "JOB-18": "새 이야기 1차: JOB-18 · 19 · 20 · 21 동시에",
      "JOB-22": "JOB-22는 18·19·20, JOB-23은 18·19 결과를 레퍼런스로 써서 그 뒤에",
      "JOB-24": "6~7막 1차: JOB-24 · 25 · 26 동시에",
      "JOB-27": "JOB-27 컷신은 여왕(24)과 주민(25)이 나온 뒤에" };
    function play() {
      if (playing) return; playing = true; btn.disabled = true; reset();
      var tk = 0, li = 0;
      (function lane() {
        if (li >= LN.length) { playing = false; btn.disabled = false; btn.textContent = "↻ 다시 재생"; tip.textContent = "모든 JOB 완료 · 이미지 255개"; return; }
        var ids = LN[li].nodes.map(function (n) { return n[0]; });
        (function wave() {
          var ready = ids.filter(function (id) { return N[id].st === "lock" && N[id].deps.every(function (d) { return N[d].st === "done"; }); });
          if (!ready.length) { li++; setTimeout(lane, 500); return; }
          ready.forEach(function (id) { setSt(id, "run"); });
          var note = ready.map(function (id) { return NOTE[id]; }).filter(Boolean)[0];
          if (note) tip.textContent = note;
          setTimeout(function () { ready.forEach(function (id) { setSt(id, "done"); }); setTimeout(wave, 450); }, ready[0] === "JOB-0" ? 1600 : 1300);
        })();
      })();
    }
    btn.addEventListener("click", play);
    if ("IntersectionObserver" in window && !reduce) {
      var once = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { once.disconnect(); play(); } }, { threshold: 0.45 });
      once.observe(dagEl);
    }
    $(".wt-dagsvg", dagEl).appendChild(svg);
  }

  /* ───────── 6. 영상 · 점검 목록 ───────── */
  var vs = document.querySelectorAll("video[data-auto]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) e.target.play().catch(function () {}); else e.target.pause(); });
    }, { threshold: 0.4 });
    vs.forEach(function (v) { io.observe(v); });
  }
  var pass = $("[data-pass]");
  if (pass && !reduce) { pass.innerHTML += pass.innerHTML; pass.classList.add("run"); }
})();

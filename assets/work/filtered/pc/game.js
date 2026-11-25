/* ============================================================
   FILTERED · 기자 시점 — Game Logic (v2)
   ───────────────────────────────────────────────────────────
   데이터: window.FILTERED_DATA (data/content.js)
   기능: 시간 진행 / 카드 동적 / 결과 컷씬 / 단서 인벤토리 /
         핸드폰 메시지 (데이터 기반) / 데모 단축키
   ============================================================ */

(() => {
  'use strict';

  // ─────────────────────────────────────────────
  //  Data
  // ─────────────────────────────────────────────
  const DATA = window.FILTERED_DATA;
  if (!DATA) {
    console.error('[FILTERED] window.FILTERED_DATA not loaded. Check data/content.js');
    return;
  }

  // ─────────────────────────────────────────────
  //  Helpers
  // ─────────────────────────────────────────────
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const DAYS_KO = ['월', '화', '수', '목', '금', '토', '일'];
  const TIME_BY_DAY = ['09:42','09:42','09:42','09:42','10:18','11:24','11:24'];

  // 출근 N일차 — 평일만 카운트
  function getWorkdayCount() {
    if (state.dayOfWeek <= 5) return (state.week - 1) * 5 + state.dayOfWeek;
    return state.week * 5; // 주말 — 직전 금까지
  }
  function getDayPhrase() {
    const dayLabel = DAYS_KO[state.dayOfWeek - 1];
    if (state.dayOfWeek <= 5) return `출근 ${getWorkdayCount()}일차 · ${dayLabel}`;
    return `주말 · ${dayLabel}`;
  }

  const escapeHTML = (s) => String(s).replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[ch]);

  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const formatViews = (n) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1000) return Math.round(n / 1000) + 'k';
    return String(n);
  };
  const getEvent = (id) => DATA.events.find(e => e.id === id);

  // ─────────────────────────────────────────────
  //  State
  // ─────────────────────────────────────────────
  const state = {
    // 시간
    day: 1,           // 게임 시작부터 누적 일수
    week: 1,
    dayOfWeek: 1,     // 1=월 ~ 7=일
    timeLabel: TIME_BY_DAY[0],

    // 슬롯
    slotsRemaining: DATA.settings.actionSlotsPerDay,
    slotsTotal: DATA.settings.actionSlotsPerDay,

    // 게이지 (데모 단축키 1~5)
    conscienceTier: 'high',    // high | mid | low | lowest
    balanceTier:    'high',    // high | low
    credibilityTier:'normal',  // trusted | normal | suspicious

    // 카드·추적
    todaysCards: [],           // 오늘 보여줄 정보 카드 N개
    trackedToday: [],          // 오늘 추적 시작한 카드들 ["eventId::method"] — 슬롯 한도 내 여러 건 가능
    pendingResults: [],        // 다음날 아침 표시할 결과 큐

    // 단서 인벤토리 (사건별)
    clueInventory: {},         // { eventId: [{type, label, summary, ...}] }

    // 사진 인벤토리 (사건별) — 추적 결과로 1장씩 수집
    collectedPhotos: {},       // { eventId: [photoId, ...] }

    // 사건 진행 상태
    activeEvents: {},          // { eventId: { startDay, daysLeft, completedTracks: [methods] } }
    completedEventIds: [],     // 종료된 사건 ID

    // 게이지 수치 (발행 시 변동)
    gauges: {
      balance:     DATA.gauges.balance.initial,
      conscience:  DATA.gauges.conscience.initial,
      credibility: DATA.gauges.credibility.initial,
    },

    // 발각 큐 + 발행 기록
    exposureQueue: [],         // [{ eventId, eventTitle, publishedDay, triggerDay, fakeSlotCount, glitchOutcome }]
    publishedArticles: [],

    // 과거 보도의 망령 — 가짜 발행의 시간 차 후폭풍
    scheduledConsequences: [], // [{ eventId, eventTitle, triggerDay, severity, source, head, text }]
    firedGhostNews: [],        // [{ day, week, source, head, sum, severity, eventId }] — 이미 발화된 것 (뉴스앱에 누적)

    // 주말 시간 보너스 — 다음 월요일에 적용되는 일회성 슬롯 추가
    mondayBonusSlots: 0,
    weekendPicks: [],          // 이번 주말 선택한 활동 ids (디버그/통계용)

    // 메시지 응답으로 잡힌 주말 약속 — 토요일 컷씬 덮어쓰기
    weekendPlan: null,         // null | 'friend_meat' | …
    // 메시지 응답으로 따낸 특종 풀 — 다음 게시판에서 cross-week 사건으로 등장
    queuedScoops: [],          // crossWeek event ID 목록

    // 엔딩 관련
    endingEventBoosted: false,    // 거절 시 다음 주 확률 +0.20
    forceTriggerNextWeek: false,  // 권태 거절 등 — 다음 주 강제 트리거
    currentEndingEvent: null,     // 현재 표시 중인 엔딩 이벤트 ID
    finalEnding: null,            // { endKey: 'A', variant: 'pulitzer' }
    epilogueIndex: 0,             // 피해자 실태 슬라이드 인덱스

    // 주간 보도 (월요일 게시판에서 선택)
    weeklyCase: null,             // 이번 주 추적할 사건 ID
    weeklyCasePicked: false,      // 이번 주 게시판 결정 완료 여부
    pendingInvestigation: null,   // 상세 모달에서 보고 있는 카드 (eventId+method)

    // 폰 이벤트 (트리거 기반 메시지)
    phoneInbox: [],               // [{ eventId, day, context?, replyChosen? }]
    firedPhoneEvents: [],         // onceOnly 처리용
    phoneEventLastFiredDay: {},   // cooldownDays 처리용
    threadLastFiredDay: {},       // 스레드 단위 마지막 발화일 (가족 주 1회 제한용)
    activePhoneEvent: null,       // 현재 열어본 이벤트 ID
    chatHistory: { daughter: [], wife: [], editor: [] },  // 응답 끝낸 이벤트의 대화 누적
    // 통합 스레드 상태 — 안읽음 카운트, 미리보기, 시간 (읽기/안읽기 UI 통일용)
    threadUnread: {},             // { daughter: 2, wife: 1, friend: 1, ... }
    threadLastPreview: {},        // { daughter: '아빠 오늘 그림 그렸어요!', ... }
    threadLastTime: {},           // { daughter: '방금', ... }
    dailyPoolNextRollDay: 2,      // 데일리 풀 다음 발동 가능일 (2~3일 간격)
    pendingPhoneNotification: false,  // 새 메시지 도착 후 진동 알림 대기 (모달 닫힐 때 발화)
    tutorialShown: {},            // 1주차 첫 사이클 한 번씩만 노출되는 가이드 토스트

    isGameOver: false,
  };

  // ─────────────────────────────────────────────
  //  DOM
  // ─────────────────────────────────────────────
  const els = {
    scene:           $('.scene'),
    cardOverlay:     $('#cardOverlay'),
    phoneOverlay:    $('#phoneOverlay'),
    resultOverlay:   $('#resultOverlay'),
    diaryOverlay:    $('#diaryOverlay'),
    articleOverlay:  $('#articleOverlay'),
    weekendOverlay:  $('#weekendOverlay'),
    weekendShell:    $('.weekend-shell'),
    weekendDay:      $('[data-we-day]'),
    weekendStage:    $('[data-we-stage]'),
    weekendCaption:  $('[data-we-caption]'),
    weekendTag:      $('[data-we-tag]'),
    endingOverlay:   $('#endingOverlay'),
    endingShell:     $('.ending-shell'),
    endingKey:       $('[data-ending-key]'),
    endingProgress:  $('[data-ending-progress]'),
    endingBody:      $('[data-ending-body]'),
    endingActions:   $('[data-ending-actions]'),
    daybreakOverlay: $('#daybreakOverlay'),
    daybreakNum:     $('[data-db-num]'),
    daybreakLabel:   $('[data-db-label]'),
    daybreakWeek:    $('[data-db-week]'),

    bulletinOverlay: $('#bulletinOverlay'),
    bulletinKey:     $('[data-bulletin-key]'),
    bulletinGrid:    $('[data-bulletin-grid]'),

    fridayOverlay:   $('#fridayBriefingOverlay'),
    briefingSub:     $('[data-briefing-sub]'),
    briefingCaseTitle: $('[data-briefing-case-title]'),
    briefingCategory:$('[data-briefing-category]'),
    briefingViews:   $('[data-briefing-views]'),
    briefingClueCount: $('[data-briefing-clue-count]'),
    briefingSourceCount: $('[data-briefing-source-count]'),
    briefingTypes:   $('[data-briefing-types]'),
    briefingComment: $('[data-briefing-comment]'),

    investOverlay:   $('#investigationDetailOverlay'),
    investMethodKey: $('[data-invest-method-key]'),
    investMethodLabel:$('[data-invest-method-label]'),
    investCost:      $('[data-invest-cost]'),
    investProse:     $('[data-invest-prose]'),
    investViews:     $('[data-invest-views]'),
    investCertainty: $('[data-invest-certainty]'),
    investDist:      $('[data-invest-dist]'),

    devPanel:        $('#devPanel'),
    devBalance:      $('[data-dev-balance]'),
    devBalanceFill:  $('[data-dev-balance-fill]'),
    devBalanceTier:  $('[data-dev-balance-tier]'),
    devConscience:   $('[data-dev-conscience]'),
    devConscienceFill:$('[data-dev-conscience-fill]'),
    devConscienceTier:$('[data-dev-conscience-tier]'),
    devCredibility:  $('[data-dev-credibility]'),
    devCredibilityFill:$('[data-dev-credibility-fill]'),
    devCredibilityTier:$('[data-dev-credibility-tier]'),
    devMisc:         $('[data-dev-misc]'),
    phoneShell:      $('.phone-shell'),
    toast:           $('#toast'),
    slots:           $$('.hud-slots .dot'),
    hudDay:          $('[data-hud-day]'),
    hudTime:         $('[data-hud-time]'),
    signoffSub:      $('[data-signoff-sub]'),
    cardHost:        $('[data-card-host]'),
    endDayBtn:       $('[data-end-day]'),

    // 기사 작성
    articleDay:      $('[data-article-day]'),
    articleClues:    $('[data-article-clues]'),
    articlePhotos:   $('[data-article-photos]'),
    articleGlitch:   $('[data-article-glitch]'),
    glitchSection:   $('[data-glitch-section]'),
    eventSelect:     $('[data-event-select]'),
    articleSlots:    $$('.af-slot'),
    previewViews:    $('[data-preview-views]'),
    previewTrust:    $('[data-preview-trust]'),
    previewExposure: $('[data-preview-exposure]'),
    previewConscience:$('[data-preview-conscience]'),
    previewStatus:   $('[data-preview-status]'),
    publishBtn:      $('[data-publish]'),
    publishShortBtn: $('[data-publish-short]'),
    publishSkipBtn:  $('[data-publish-skip]'),

    phone:           $('.hot.phone'),
    monitor:         $('.hot.monitor'),
    family:          $('.hot.family'),
    mug:             $('.hot.mug'),
    diary:           $('.hot.diary'),
    papers:          $('.hot.papers'),
    memo:            $('.hot.memo'),
    mobile:          $('.mobile'),
  };

  // 기사 작성 화면 작업 상태 (모달 안에서만 유지)
  const articleDraft = {
    eventId: null,
    slots: {},   // { headline: { clue, dialStep }, body1: {...}, body2: ..., body3: ..., photo: ... }
    isOpen: false,
  };

  // ─────────────────────────────────────────────
  //  HUD render
  // ─────────────────────────────────────────────
  function renderHUD() {
    const dayLabel = DAYS_KO[state.dayOfWeek - 1];
    const weekStr = String(state.week).padStart(2, '0');

    if (els.hudDay) els.hudDay.textContent = `${getDayPhrase()} · WEEK ${weekStr}`;
    if (els.hudTime) els.hudTime.textContent = state.timeLabel;
    if (els.signoffSub) els.signoffSub.textContent = `DESK · ${dayLabel}요일 ${state.timeLabel}`;

    const used = state.slotsTotal - state.slotsRemaining;
    els.slots.forEach((dot, i) => dot.classList.toggle('used', i < used));

    if (els.endDayBtn) {
      els.endDayBtn.classList.toggle('urgent', state.slotsRemaining === 0);
      els.endDayBtn.classList.toggle('locked', state.dayOfWeek === 5);
    }

    // 금요일 → 컴퓨터 강조 / 전화기 잠금
    if (els.monitor) els.monitor.classList.toggle('friday-deadline', state.dayOfWeek === 5);
    if (els.phone)   els.phone.classList.toggle('weekend-locked', state.dayOfWeek >= 5);
  }

  // ─────────────────────────────────────────────
  //  Slot system
  // ─────────────────────────────────────────────
  function spendSlots(cost) {
    if (cost > state.slotsRemaining) {
      showToast(`⚠ 남은 슬롯이 부족합니다 (필요 ${cost}칸 · 남음 ${state.slotsRemaining}칸)`);
      return false;
    }
    state.slotsRemaining -= cost;
    renderHUD();
    return true;
  }

  // ─────────────────────────────────────────────
  //  Gauge management
  // ─────────────────────────────────────────────
  function applyGaugeDelta(delta) {
    if (delta.balance !== undefined) {
      state.gauges.balance = Math.max(0, state.gauges.balance + delta.balance);
    }
    if (delta.conscience !== undefined) {
      state.gauges.conscience = Math.max(0, Math.min(100, state.gauges.conscience + delta.conscience));
    }
    if (delta.credibility !== undefined) {
      state.gauges.credibility = Math.max(0, Math.min(100, state.gauges.credibility + delta.credibility));
    }
    recomputeTiers();
    syncIndirectExpression();

    if (!state.isGameOver) {
      if (state.gauges.balance <= 0) triggerGameOver('bankrupt');
      else if (state.gauges.credibility <= 0) triggerGameOver('disbarred');
    }
  }

  // 메시지 응답 부가 효과 — 주말 약속, 특종 추첨 등 (게이지 외)
  // friend_dinner 예: { weekendPlan: 'friend_meat', scoopRoll: 0.3 }
  function applyChoiceFlag(flag) {
    if (!flag) return;

    if (flag.weekendPlan) {
      state.weekendPlan = flag.weekendPlan;
    }

    if (typeof flag.scoopRoll === 'number' && flag.scoopRoll > 0) {
      // 게시판/큐에 이미 등록되지 않은 cross-week 사건만 후보
      const taken = new Set([
        ...(state.queuedScoops || []),
        ...(state.completedEventIds || []),
        state.weeklyCase,
      ].filter(Boolean));
      const pool = (DATA.events || []).filter(e => e.crossWeek && !taken.has(e.id));
      if (pool.length > 0 && Math.random() < flag.scoopRoll) {
        const pick = pool[Math.floor(Math.random() * pool.length)];
        state.queuedScoops = state.queuedScoops || [];
        state.queuedScoops.push(pick.id);
      }
    }
  }

  function recomputeTiers() {
    state.balanceTier = state.gauges.balance >= 600 ? 'high' : 'low';

    if (state.gauges.conscience <= 10)      state.conscienceTier = 'lowest';
    else if (state.gauges.conscience < 50)  state.conscienceTier = 'low';
    else if (state.gauges.conscience < 70)  state.conscienceTier = 'mid';
    else                                    state.conscienceTier = 'high';

    if (state.gauges.credibility >= 70)     state.credibilityTier = 'trusted';
    else if (state.gauges.credibility >= 30)state.credibilityTier = 'normal';
    else                                    state.credibilityTier = 'suspicious';
  }

  function syncIndirectExpression() {
    const con = state.gauges.conscience;
    const bal = state.gauges.balance;
    const cred = state.gauges.credibility;

    // 양심 → 가족사진 5단계
    let photo = 'upright';
    if (con < 10)       photo = 'facedown';
    else if (con < 30)  photo = 'fullyCovered';
    else if (con < 50)  photo = 'halfCovered';
    else if (con < 70)  photo = 'tilted';
    if (els.family) els.family.dataset.conscience = photo;

    // 양심 → 씬 톤
    let tone = 'stable';
    if (con < 30)      tone = 'collapsed';
    else if (con < 50) tone = 'fraying';
    if (els.scene)      els.scene.dataset.conscience = tone;
    if (els.phoneShell) els.phoneShell.dataset.conscience = tone;

    // 재력 → 책상 청구서 / 핸드폰 알림 (CSS hook)
    let balTone = 'high';
    if (bal < 100)      balTone = 'critical';
    else if (bal < 300) balTone = 'low';
    else if (bal < 600) balTone = 'mid';
    if (els.scene)      els.scene.dataset.balance = balTone;
    if (els.phoneShell) els.phoneShell.dataset.balance = balTone;

    // 신뢰도 → 카드 투명도 / 동료 회피 (CSS hook)
    let credTone = 'trusted';
    if (cred < 30)      credTone = 'suspicious';
    else if (cred < 70) credTone = 'normal';
    if (els.scene)      els.scene.dataset.credibility = credTone;

    refreshThreadPreviews();
    renderDevPanel();
  }

  // ─────────────────────────────────────────────
  //  DEV 스테이터스 패널 — 게이지 직접 표시 (개발 검증용)
  // ─────────────────────────────────────────────
  function renderDevPanel() {
    if (!els.devPanel || els.devPanel.hidden) return;
    const g = state.gauges;
    const balPct = Math.min(100, Math.round(g.balance / 1000 * 100));
    if (els.devBalance)     els.devBalance.textContent     = `₩${g.balance}`;
    if (els.devBalanceFill) els.devBalanceFill.style.width = `${balPct}%`;
    if (els.devBalanceTier) els.devBalanceTier.textContent = state.balanceTier;
    if (els.devConscience)     els.devConscience.textContent     = g.conscience;
    if (els.devConscienceFill) els.devConscienceFill.style.width = `${g.conscience}%`;
    if (els.devConscienceTier) els.devConscienceTier.textContent = state.conscienceTier;
    if (els.devCredibility)     els.devCredibility.textContent     = g.credibility;
    if (els.devCredibilityFill) els.devCredibilityFill.style.width = `${g.credibility}%`;
    if (els.devCredibilityTier) els.devCredibilityTier.textContent = state.credibilityTier;
    if (els.devMisc) {
      const photo = els.family?.dataset.conscience || '—';
      const tone  = els.scene?.dataset.conscience  || '—';
      const balT  = els.scene?.dataset.balance     || '—';
      const credT = els.scene?.dataset.credibility || '—';
      els.devMisc.innerHTML = `<span class="dm-line">photo: <em>${photo}</em></span><span class="dm-line">scene: <em>${tone}</em> / bal: <em>${balT}</em> / cred: <em>${credT}</em></span><span class="dm-line">출근 ${getWorkdayCount()}일차 · 발행 ${state.publishedArticles.length} · 큐 ${state.exposureQueue.length}</span>`;
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === '`' || e.key === '~') {
      if (!els.devPanel) return;
      els.devPanel.hidden = !els.devPanel.hidden;
      if (!els.devPanel.hidden) renderDevPanel();
      return;
    }
    if (els.devPanel && !els.devPanel.hidden) {
      if (e.key === 'ArrowUp')   { applyGaugeDelta({ conscience: +10 }); e.preventDefault(); }
      if (e.key === 'ArrowDown') { applyGaugeDelta({ conscience: -10 }); e.preventDefault(); }
      if (e.key === 'ArrowRight'){ applyGaugeDelta({ balance:    +200 }); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { applyGaugeDelta({ balance:    -200 }); e.preventDefault(); }
      if (e.key === '+' || e.key === '=') { applyGaugeDelta({ credibility: +10 }); e.preventDefault(); }
      if (e.key === '-' || e.key === '_') { applyGaugeDelta({ credibility: -10 }); e.preventDefault(); }
    }
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-dev-toggle]')) {
      if (els.devPanel) els.devPanel.hidden = true;
    }
  });

  function triggerGameOver(type) {
    state.isGameOver = true;
    if (els.scene) els.scene.style.filter = 'brightness(0.42) grayscale(0.6)';
    if (els.endDayBtn) els.endDayBtn.disabled = true;
    setTimeout(() => runGameoverEpilogue(type), 1200);
  }

  // ─────────────────────────────────────────────
  //  Toast
  // ─────────────────────────────────────────────
  let toastTimer = null;
  function showToast(html, duration = 2800) {
    if (!els.toast) return;
    els.toast.innerHTML = html;
    els.toast.hidden = false;
    requestAnimationFrame(() => els.toast.classList.add('show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      els.toast.classList.remove('show');
      setTimeout(() => { els.toast.hidden = true; }, 300);
    }, duration);
  }

  // ─────────────────────────────────────────────
  //  튜토리얼 토스트 — 키별 1회 노출 (1주차 첫 사이클 가이드)
  // ─────────────────────────────────────────────
  const TUTORIALS = {
    bulletin: '<strong>📋 게시판</strong>매주 월요일에 다룰 사건 1개를 골라요. 나머지는 다른 매체의 몫.',
    phone:    '<strong>📱 정보 카드</strong>오늘 가능한 추적 방법들. 자세히 읽고 결정해요.',
    cost:     '<strong>🕐 시계 = 코스트</strong>하루 5칸 슬롯 중 N칸을 쓴다는 의미.',
    result:   '<strong>📰 다음 날 결과</strong>추적 결과는 다음 날 아침에 도착. 단서가 같이 따라옴.',
    phoneVib: '<strong>🔔 새 메시지</strong>우측 하단 모바일이 진동해요. 클릭해서 확인.',
    briefing: '<strong>💼 금요일 데스크</strong>코멘트를 읽고 기사 작성 / 휴재 결정.',
    article:  '<strong>✏ 기사 작성</strong>단서를 슬롯에 드래그. 자극성 다이얼(1~4)로 톤 조절. 단계 높을수록 조회수↑ 양심↓.',
    weekend:  '<strong>🏞 주말</strong>8초 컷씬 후 자동으로 다음 주 월요일.',
    photo:    '<strong>📸 사진 자료</strong>추적 결과로 사진을 1장씩 수집한다. 결정적·애매·분위기 가중치 — 다이어리에서 모아 본다.',
    scoop:    '<strong>⚡ 특종 발견</strong>본문에 3종 이상 다른 출처의 단서를 섞었다. 모순된 시각을 균형있게 다룬 보도 — 조회수·신뢰도 보너스.'
  };
  function showTutorial(key, delay = 600) {
    if (state.tutorialShown[key] || !TUTORIALS[key]) return;
    state.tutorialShown[key] = true;
    setTimeout(() => showToast(TUTORIALS[key], 5500), delay);
  }

  // ─────────────────────────────────────────────
  //  Overlay open/close
  // ─────────────────────────────────────────────
  function openOverlay(overlay) {
    if (!overlay) return;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeOverlay(overlay) {
    if (!overlay) return;
    overlay.hidden = true;
    document.body.style.overflow = '';
    if (overlay === els.phoneOverlay) switchApp('home');
  }

  document.addEventListener('click', (e) => {
    const closer = e.target.closest('[data-close-overlay]');
    if (closer) {
      const overlay = closer.closest('.overlay');
      if (overlay) closeOverlay(overlay);
      return;
    }
    if (e.target.classList.contains('overlay')
        && e.target !== els.endingOverlay
        && e.target !== els.bulletinOverlay) {
      closeOverlay(e.target);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      $$('.overlay:not([hidden])').forEach(o => {
        if (o !== els.endingOverlay && o !== els.bulletinOverlay) closeOverlay(o);
      });
    }
  });

  // ─────────────────────────────────────────────
  //  Card icon (SVG by certainty)
  // ─────────────────────────────────────────────
  function getCardIcon(certainty) {
    const icons = {
      official: `<svg viewBox="0 0 60 60"><g filter="url(#wobble)"><circle cx="30" cy="30" r="22" fill="none" stroke="#0e0e0e" stroke-width="3"/><circle cx="30" cy="30" r="16" fill="none" stroke="#0e0e0e" stroke-width="1.5"/><text x="30" y="35" text-anchor="middle" font-family="Pretendard" font-size="11" font-weight="700" fill="#0e0e0e" letter-spacing="1">공식</text></g></svg>`,
      rumor:    `<svg viewBox="0 0 60 60"><g filter="url(#wobble)"><rect x="6" y="14" width="48" height="36" fill="#f4ecd8" stroke="#0e0e0e" stroke-width="2"/><line x1="14" y1="26" x2="46" y2="26" stroke="#0e0e0e" stroke-width="2"/><line x1="14" y1="34" x2="40" y2="34" stroke="#0e0e0e" stroke-width="1.5"/><line x1="14" y1="42" x2="46" y2="42" stroke="#0e0e0e" stroke-width="1.5"/></g></svg>`,
      anonymous:`<svg viewBox="0 0 60 60"><g filter="url(#wobble)"><rect x="6" y="14" width="48" height="36" fill="#f4ecd8" stroke="#0e0e0e" stroke-width="2"/><path d="M 6 14 L 30 32 L 54 14" fill="none" stroke="#0e0e0e" stroke-width="1.5"/><text x="30" y="42" text-anchor="middle" font-family="Pretendard" font-size="14" font-weight="700" fill="#0e0e0e">?</text></g></svg>`,
      leak:     `<svg viewBox="0 0 60 60"><g filter="url(#wobble)"><rect x="6" y="16" width="48" height="32" fill="#0e0e0e" stroke="#0e0e0e" stroke-width="2"/><path d="M 6 16 L 30 36 L 54 16" fill="none" stroke="#f4ecd8" stroke-width="1.5"/><rect x="22" y="28" width="16" height="14" fill="#f4ecd8"/><text x="30" y="40" text-anchor="middle" font-family="Pretendard" font-size="11" font-weight="700" fill="#0e0e0e">!</text></g></svg>`,
    };
    return icons[certainty] || icons.rumor;
  }

  // ─────────────────────────────────────────────
  //  Distribution bars
  // ─────────────────────────────────────────────
  function renderDistribution(certainty) {
    const dist = DATA.outcomeDistributions[certainty];
    const tagMap = {
      jackpot: '대박', success: '성공', minor: '소득적음', miss: '허탕', danger: '위험'
    };
    const rows = Object.entries(dist).map(([key, val]) => {
      const cls = key === 'miss' ? 'danger' : key === 'danger' ? 'warn' : '';
      return `
        <div class="dist-row ${cls}">
          <span class="dist-label">${tagMap[key] || key}</span>
          <span class="dist-bar"><span style="width:${val}%"></span></span>
          <span class="dist-pct">${val}%</span>
        </div>`;
    }).join('');
    return `<div class="dist-key">결과 분포</div>${rows}`;
  }

  // ─────────────────────────────────────────────
  //  Today's cards — generate & render
  // ─────────────────────────────────────────────
  // 사진카드는 같은 메서드를 공유할 수 있으므로 키에 photoId 포함
  function cardKey(card) {
    return card.photoId
      ? `${card.eventId}::${card.method}::${card.photoId}`
      : `${card.eventId}::${card.method}`;
  }
  function trackSignature(track) {
    return track.photoId ? `${track.method}::${track.photoId}` : track.method;
  }

  // 가중치 기반 트랙 선택 — appearWeight 가 높을수록 자주 등장
  // 5코스트 잠복근무는 weight 1, 2-3코스트는 weight 3~6 → 잠복근무는 ~5% 확률
  function pickWeightedTrack(tracks) {
    if (!tracks || tracks.length === 0) return null;
    const weights = tracks.map(t => DATA.trackingMethods[t.method]?.appearWeight || 1);
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < tracks.length; i++) {
      roll -= weights[i];
      if (roll < 0) return tracks[i];
    }
    return tracks[tracks.length - 1];
  }

  // 하루에 보이는 카드 최대치 — 첫날 12개씩 쏟아지는 걸 방지
  const MAX_CARDS_PER_DAY = 6;

  // 주간 보도 사건의 *아직 안 한 추적 방식*만 카드로 노출
  // 남은 트랙 풀에서 매일 랜덤 6개를 뽑아서 보여줌
  function generateTodaysCards() {
    const cards = [];

    const eventId = state.weeklyCase;
    if (eventId) {
      const event = getEvent(eventId);
      // 방어 — activeEvents 가 어떤 이유로든 사라져 있으면 즉시 재초기화
      if (event && !state.activeEvents[eventId]) {
        state.activeEvents[eventId] = {
          startDay: state.day,
          daysLeft: 5,
          completedTracks: [],
        };
      }
      const info = state.activeEvents[eventId];
      if (event && info) {
        const remaining = event.tracks.filter(t => !info.completedTracks.includes(trackSignature(t)));
        // 셔플 후 최대 N개로 컷 — 매일 다른 조합이 보이도록
        const shuffled = remaining.slice().sort(() => Math.random() - 0.5);
        const picked = shuffled.slice(0, MAX_CARDS_PER_DAY);
        picked.forEach(track => {
          cards.push({ eventId, eventTitle: event.title, ...track, isFollowup: true });
        });
      }
    }

    state.todaysCards = cards;
    renderCards();
  }

  function renderCards() {
    if (!els.cardHost) return;
    els.cardHost.innerHTML = '';

    if (state.todaysCards.length === 0) {
      els.cardHost.innerHTML = '<p class="cards-empty">오늘은 새 정보가 없다.</p>';
      return;
    }

    state.todaysCards.forEach((card, i) => {
      const certaintyMeta = DATA.infoCardCertaintyLabels[card.certainty];
      const method = DATA.trackingMethods[card.method];
      const key = cardKey(card);
      const alreadyTracked = state.trackedToday.includes(key);
      const overBudget = !alreadyTracked && method.slotCost > state.slotsRemaining;

      const article = document.createElement('article');
      article.className = 'card';
      if (alreadyTracked) article.classList.add('tracked');
      if (overBudget)     article.classList.add('over-budget');
      article.dataset.eventId = card.eventId;
      article.dataset.method = card.method;
      article.dataset.cost = method.slotCost;

      // 추적 시작한 카드는 "취소" 버튼으로 토글 — 같은 날 안에 되돌릴 수 있음
      const ctaLabel = alreadyTracked
        ? '추적 취소 (슬롯 복구)'
        : overBudget
          ? `슬롯 부족 (${method.slotCost}칸 필요)`
          : '추적 시작';

      // 서론 prose 미리보기 — 카드 자체 briefing → 사건+메서드 specific → fallback
      const proseFull = card.briefing
                     || DATA.investigationApproaches?.[card.eventId]?.[card.method]
                     || DATA.investigationApproachesFallback?.[card.method]
                     || '추적 방법에 대한 설명이 없다.';
      const proseSnippet = proseFull.length > 110
        ? proseFull.slice(0, 110).replace(/[.,。、—\s]+$/, '') + '…'
        : proseFull;

      const ctaText = alreadyTracked
        ? '추적 중 — 내일 결과'
        : overBudget
          ? '슬롯 부족'
          : '자세히 읽고 결정 →';

      const displayLabel = card.cardLabel || method.label;
      article.innerHTML = `
        <header class="card-head">
          <div class="card-method">
            <div class="card-method-icon">${getCardIcon(card.certainty)}</div>
            <div class="card-method-text">
              <span class="card-method-key">METHOD · ${card.method.toUpperCase()}${card.isPhotoCard ? ' · 사진' : ''}</span>
              <h3 class="card-method-label">${escapeHTML(displayLabel)}</h3>
            </div>
          </div>
          <span class="card-cost-badge ${costClass(method.slotCost)}" aria-label="코스트 ${method.slotCost}">${clockIconsHTML(method.slotCost)}</span>
        </header>
        <div class="card-event-line">
          <span class="card-cert">${certaintyMeta.tag}${card.isFollowup ? ' · 후속' : ''}</span>
          <span class="card-views">최대 ${formatViews(card.expectedViews)} 조회</span>
        </div>
        <p class="card-prose">${escapeHTML(proseSnippet)}</p>
        <button class="card-cta${alreadyTracked ? ' is-cancel' : ''}"
                ${alreadyTracked ? 'data-track-cancel' : 'data-track-start'}
                ${overBudget ? 'disabled' : ''}>
          ${alreadyTracked ? '<span class="cta-undo-icon" aria-hidden="true">↻</span>' : ''}
          <span>${ctaText}</span>
          ${alreadyTracked || overBudget ? '' : `<svg viewBox="0 0 24 12"><g filter="url(#wobble)" stroke="#0e0e0e" stroke-width="2" fill="none"><line x1="2" y1="6" x2="22" y2="6"/><polyline points="16,2 22,6 16,10"/></g></svg>`}
        </button>`;
      els.cardHost.appendChild(article);
    });
  }

  // 코스트 → HUD와 같은 5칸 pip 막대 (N칸 채워짐 = 그 카드가 먹는 슬롯)
  function clockIconsHTML(slotCost) {
    const total = 5;
    const filled = Math.max(1, Math.min(total, slotCost));
    let pips = '';
    for (let i = 0; i < total; i++) {
      pips += `<span class="cost-pip${i < filled ? ' filled' : ''}"></span>`;
    }
    return `<span class="cost-pips">${pips}</span><span class="cost-label">${filled}칸</span>`;
  }

  function costClass(cost) {
    if (cost >= 5) return 'cost-high';
    if (cost >= 4) return 'cost-mid';
    return 'cost-low';
  }

  // ─────────────────────────────────────────────
  //  Outcome roll
  // ─────────────────────────────────────────────
  function rollOutcome(certainty) {
    const dist = DATA.outcomeDistributions[certainty];
    let roll = Math.random() * 100;
    for (const [outcome, weight] of Object.entries(dist)) {
      roll -= weight;
      if (roll < 0) return outcome;
    }
    return Object.keys(dist).pop();
  }

  // ─────────────────────────────────────────────
  //  Tracking start
  // ─────────────────────────────────────────────
  function startTracking(card) {
    const cost = DATA.trackingMethods[card.method].slotCost;
    const key = cardKey(card);

    if (state.trackedToday.includes(key)) {
      showToast('이미 오늘 추적 시작한 건이다.');
      return;
    }

    if (!spendSlots(cost)) return;

    if (!state.activeEvents[card.eventId]) {
      const event = getEvent(card.eventId);
      state.activeEvents[card.eventId] = {
        startDay: state.day,
        daysLeft: event ? event.lifespanDays : 4,
        completedTracks: [],
      };
    }
    state.activeEvents[card.eventId].completedTracks.push(trackSignature(card));

    const outcome = rollOutcome(card.certainty);

    state.pendingResults.push({
      eventId: card.eventId,
      eventTitle: card.eventTitle,
      method: card.method,
      certainty: card.certainty,
      outcome,
      day: state.day,
      isPhotoCard: !!card.isPhotoCard,
      photoId: card.photoId || null,
      resultByOutcome: card.resultByOutcome || null,
      cardLabel: card.cardLabel || null,
    });

    state.trackedToday.push(key);

    const methodLabel = DATA.trackingMethods[card.method].label;
    showToast(
      `<strong>추적 시작 · ${methodLabel}</strong>${escapeHTML(card.eventTitle)}<br>슬롯 ${cost}칸 소모 — 남은 슬롯 ${state.slotsRemaining}칸. 결과는 내일 아침.`,
      3500
    );

    // 슬롯이 다 떨어졌으면 모달 닫고, 남았으면 다음 카드 선택할 수 있도록 유지
    if (state.slotsRemaining === 0) {
      closeOverlay(els.cardOverlay);
      els.phone?.classList.remove('alert');
      const badge = els.phone?.querySelector('.badge');
      if (badge) badge.style.display = 'none';
    } else {
      const badge = els.phone?.querySelector('.badge');
      if (badge) {
        const remaining = state.todaysCards.filter(c =>
          !state.trackedToday.includes(cardKey(c))
        ).length;
        if (remaining === 0) {
          els.phone?.classList.remove('alert');
          badge.style.display = 'none';
        } else {
          badge.textContent = String(remaining);
        }
      }
    }

    renderHUD();
    renderCards();
  }

  // 추적 취소 — 같은 날 안에 되돌리기 (슬롯 환불 + 결과 큐 제거)
  function cancelTracking(card) {
    const cost = DATA.trackingMethods[card.method]?.slotCost || 0;
    const key = cardKey(card);
    const sig = trackSignature(card);
    if (!state.trackedToday.includes(key)) return;

    // 슬롯 환불
    state.slotsRemaining = Math.min(state.slotsTotal, state.slotsRemaining + cost);

    // activeEvents.completedTracks 에서 제거
    if (state.activeEvents[card.eventId]) {
      state.activeEvents[card.eventId].completedTracks =
        state.activeEvents[card.eventId].completedTracks.filter(m => m !== sig);
    }

    // pendingResults 에서 *오늘* 추가된 항목만 제거 (이전 날 결과는 보존)
    state.pendingResults = state.pendingResults.filter(r =>
      !(r.eventId === card.eventId && r.method === card.method
        && (r.photoId || null) === (card.photoId || null) && r.day === state.day)
    );

    // trackedToday 에서 제거
    state.trackedToday = state.trackedToday.filter(k => k !== key);

    const methodLabel = DATA.trackingMethods[card.method]?.label || card.method;
    showToast(`<strong>↻ 추적 취소</strong>${methodLabel} — 슬롯 ${cost}칸 복구`, 2400);

    // 폰 배지 갱신 (추적 가능한 카드 다시 활성화)
    const badge = els.phone?.querySelector('.badge');
    if (badge) {
      const remaining = state.todaysCards.filter(c =>
        !state.trackedToday.includes(`${c.eventId}::${c.method}`)
      ).length;
      if (remaining > 0) {
        els.phone?.classList.add('alert');
        badge.textContent = String(remaining);
        badge.style.display = '';
      }
    }

    renderHUD();
    renderCards();
  }

  // ─────────────────────────────────────────────
  //  Photo evidence — 사진 카드 / 잠복근무에서만 획득
  // ─────────────────────────────────────────────
  // 잠복근무 사진 획득 확률: 정보성공(50%) × 사진성공(50%) = 25%
  const STAKEOUT_PHOTO_RATE = 0.5;

  function getPhotosForEvent(eventId) {
    return (window.FILTERED_DATA?.casePhotos?.[eventId]) || [];
  }

  function getCollectedPhotoIds(eventId) {
    return state.collectedPhotos[eventId] || [];
  }

  function getPhotoById(eventId, photoId) {
    return getPhotosForEvent(eventId).find(p => p.id === photoId) || null;
  }

  function recordCollectedPhoto(eventId, photoId) {
    if (!state.collectedPhotos[eventId]) state.collectedPhotos[eventId] = [];
    if (!state.collectedPhotos[eventId].includes(photoId)) {
      state.collectedPhotos[eventId].push(photoId);
    }
  }

  // 결과 → 사진 1장 (or null)
  // 잠복(stakeout): outcome 성공일 때 50% 추가 롤로 결정적 사진 획득
  // 사진카드(isPhotoCard): outcome 성공일 때 지정 photoId 획득
  // 그 외: null
  function pickPhotoForResult(result) {
    if (!result) return null;
    if (result.outcome === 'miss') return null;

    // 사진 전용 카드 — 명시적 photoId 가 있으면 그걸 획득
    if (result.isPhotoCard && result.photoId) {
      const photo = getPhotoById(result.eventId, result.photoId);
      if (!photo) return null;
      const already = getCollectedPhotoIds(result.eventId).includes(result.photoId);
      if (already) return null;
      recordCollectedPhoto(result.eventId, result.photoId);
      return photo;
    }

    // 잠복 — 정보 성공일 때 추가 롤로 결정적 사진 획득
    if (result.method === 'stakeout') {
      // 사진 획득 추가 롤 — 50% 실패 시 정보만 얻고 사진은 다음 기회로
      if (Math.random() >= STAKEOUT_PHOTO_RATE) return null;
      const photos = getPhotosForEvent(result.eventId);
      if (photos.length === 0) return null;
      const collected = getCollectedPhotoIds(result.eventId);
      const remaining = photos.filter(p => !collected.includes(p.id));
      if (remaining.length === 0) return null;
      // 잠복은 결정적 사진 우선
      const decisive = remaining.find(p => p.weight === 'decisive');
      const picked = decisive || remaining[0];
      recordCollectedPhoto(result.eventId, picked.id);
      return picked;
    }

    return null;
  }

  // 컷씬 → 단서 후보 (각 단서가 고유한 문단을 가짐 — 클릭 시 중복 안 보이도록)
  // 반환: [{ summary: '한 줄 요약', paragraph: '단서가 나온 문단 전체' }]
  function extractClueSentences(text, maxCount) {
    if (!text || maxCount <= 0) return [];

    // 메타한 결말 문구 — 단서로 부적합
    const META_RX = /^(그게 다였다|그렇게 또 하루|그날 밤은|회사로 돌아|차로 돌아|시동을 걸|핸드폰을 |카메라를 무릎|다음 주가 두려웠|손이 떨렸|그 한 줄|그 말이 한참)/;

    const sentencesOf = (para) => para
      .split(/(?<=[.!?])\s+|\n+/)
      .map(s => s.trim())
      .map(s => s.replace(/^[—\-]+\s*/, ''))
      // 단편 너무 짧은 것 (예: "결과는 허탈했다.") 제외 → 카드 미리보기에 정보가 부족함
      .filter(s => s.length >= 13 && s.length <= 110);

    // 1) 빈 줄로 문단 분리 — 새 톤은 \n\n 으로 호흡 분리
    const paragraphs = text.split(/\n\s*\n+/).map(p => p.trim()).filter(Boolean);

    const results = [];
    const usedSummaries = new Set();

    // 2) 각 문단에서 가장 의미있는 한 문장 — 메타 문구 제외 우선
    for (let p = 0; p < paragraphs.length && results.length < maxCount; p++) {
      const para = paragraphs[p];
      const sentences = sentencesOf(para);
      if (sentences.length === 0) continue;
      const best = sentences.find(s => !META_RX.test(s)) || sentences[0];
      if (best && !usedSummaries.has(best)) {
        results.push({ summary: best, paragraph: para });
        usedSummaries.add(best);
      }
    }

    // 3) 부족하면 같은 문단의 두 번째·세 번째 문장 보충 (중복 방지)
    for (let pass = 1; pass < 4 && results.length < maxCount; pass++) {
      for (let p = 0; p < paragraphs.length && results.length < maxCount; p++) {
        const para = paragraphs[p];
        const sentences = sentencesOf(para);
        if (sentences.length <= pass) continue;
        const candidate = sentences[pass];
        if (candidate && !usedSummaries.has(candidate) && !META_RX.test(candidate)) {
          results.push({ summary: candidate, paragraph: para });
          usedSummaries.add(candidate);
        }
      }
    }

    return results.slice(0, maxCount);
  }

  // 결과 → 컷씬 텍스트 (showResultCutscene 와 동일 폴백 체인)
  function getCutsceneTextFor(result) {
    const fallbackOrder = ['success', 'minor', 'miss', 'jackpot', 'danger'];
    let text = result.resultByOutcome?.[result.outcome];
    if (!text && result.resultByOutcome) {
      for (const k of fallbackOrder) {
        if (result.resultByOutcome[k]) { text = result.resultByOutcome[k]; break; }
      }
    }
    const cutscenes = DATA.trackingResultCutscenes?.[result.eventId]?.[result.method];
    if (!text) text = cutscenes?.[result.outcome];
    if (!text) {
      for (const k of fallbackOrder) {
        if (cutscenes?.[k]) { text = cutscenes[k]; break; }
      }
    }
    if (!text) {
      const generic = DATA.trackingResultFallbacks?.[result.method];
      text = generic?.[result.outcome];
      if (!text) {
        for (const k of fallbackOrder) {
          if (generic?.[k]) { text = generic[k]; break; }
        }
      }
    }
    return text || '';
  }

  // 단서의 진위(truthValue) — 0~1. 발행 후에야 영향이 드러남.
  // 출처별 베이스 신뢰도 + 결과별 보정 + 약간의 무작위
  // truthValue < 0.4 = "사실과 다름" — 본문에 쓰면 발각 확률↑·신뢰도↓·양심↓
  function computeClueTruthValue(certainty, outcome) {
    const baseTrust = ({
      official:  0.90,   // 공식 발표 — 거의 항상 진실
      rumor:     0.65,   // 소문 — 어느 정도 신뢰
      anonymous: 0.55,   // 익명 — 변동성 큼
      leak:      0.50,   // 익명 DM — 가장 변동
    })[certainty] || 0.60;

    const outcomeBoost = ({
      jackpot:  0.10,    // 대박 — 결정적이라 신뢰성 ↑
      success:  0.05,
      minor:    0.00,
      danger:  -0.20,    // 위험한 자료 — 신뢰성 의심
      miss:    -0.30,
    })[outcome] || 0;

    const noise = (Math.random() - 0.5) * 0.30;
    return Math.max(0.10, Math.min(0.98, baseTrust + outcomeBoost + noise));
  }

  // ─────────────────────────────────────────────
  //  Add clues from result
  // ─────────────────────────────────────────────
  function addCluesFromResult(result) {
    const event = getEvent(result.eventId);
    const certaintyToType = {
      official: 'royal', rumor: 'rumor',
      anonymous: 'evidence', leak: 'part'
    };
    const clueType = certaintyToType[result.certainty] || 'evidence';

    // 단서 수 — 2~3코스트 위주로 4일 진행 시 사건당 5+ 모이도록 설계
    // official(공식): success → 2 / minor → 1 (보장)
    // rumor(인터뷰):  success → 1~2 / minor → 1
    // anonymous(잠복): jackpot → 3 / success → 1~2 / miss → 0 (도박)
    // leak(DM):       jackpot → 3 / success → 1~2 / danger → 1~2 / miss → 0
    let clueCount = 0;
    const officialOrRumor = (result.certainty === 'official' || result.certainty === 'rumor');

    if (result.outcome === 'jackpot') {
      clueCount = 3;
    } else if (result.outcome === 'success') {
      if (result.certainty === 'official') clueCount = 2 + Math.floor(Math.random() * 2); // 2~3
      else clueCount = 1 + Math.floor(Math.random() * 2);                                  // 1~2
    } else if (result.outcome === 'minor') {
      clueCount = officialOrRumor ? 1 : 0;                                                 // official/rumor 는 minor 도 1개 보장
    } else if (result.outcome === 'danger') {
      clueCount = 1 + Math.floor(Math.random() * 2);                                       // 1~2 + 발각 페널티
    } else {
      clueCount = 0;                                                                        // miss
    }

    // 컷씬 → N개의 단서. 각 단서는 *고유한 문단*을 가짐 (클릭 시 중복 안 보임)
    const methodLabel = DATA.trackingMethods[result.method]?.label || result.method;
    const cutsceneText = getCutsceneTextFor(result);
    const clueData = extractClueSentences(cutsceneText, clueCount);

    const outcomeLabels = {
      jackpot: '대박', success: '성공', minor: '소득적음', danger: '위험', miss: '허탕',
    };
    const outcomeLabel = outcomeLabels[result.outcome] || result.outcome;

    const added = [];
    for (let i = 0; i < clueCount; i++) {
      const data = clueData[i];
      const summary = data?.summary || `${methodLabel} — 추가 정황 ${i + 1}`;
      const paragraph = data?.paragraph || summary;
      added.push({
        type: clueType,
        typeLabel: DATA.clueTypes[clueType]?.label || clueType,
        summary,
        paragraph,                        // 이 단서가 나온 *고유 문단* (중복 방지)
        fullText: cutsceneText,           // 당시 전체 장면 (옵션, 접힌 상태로)
        methodLabel,
        outcomeLabel,
        dayCollected: state.day,
        cardLabel: result.cardLabel || null,
        eventTitle: event?.title || result.eventTitle,
        method: result.method,
        outcome: result.outcome,
        collectedWeek: state.week,
        truthValue: computeClueTruthValue(result.certainty, result.outcome), // 0~1, 발행 시 영향
      });
    }

    if (added.length > 0) {
      if (!state.clueInventory[result.eventId]) state.clueInventory[result.eventId] = [];
      state.clueInventory[result.eventId].push(...added);
    }

    return added;
  }

  // ─────────────────────────────────────────────
  //  Result cutscene
  // ─────────────────────────────────────────────
  function showResultCutscene(result) {
    const fallbackOrder = ['success', 'minor', 'miss', 'jackpot', 'danger'];

    // 0) 카드 자체에 resultByOutcome 이 있으면 (사진 카드 등) 그걸 최우선
    let text = result.resultByOutcome?.[result.outcome];
    if (!text && result.resultByOutcome) {
      for (const k of fallbackOrder) {
        if (result.resultByOutcome[k]) { text = result.resultByOutcome[k]; break; }
      }
    }
    // 1) 사건+메서드+결과 → 가장 구체적
    const cutscenes = DATA.trackingResultCutscenes[result.eventId]?.[result.method];
    if (!text) text = cutscenes?.[result.outcome];
    // 2) 같은 (사건, 메서드) 안의 다른 결과로 폴백
    if (!text) {
      for (const k of fallbackOrder) {
        if (cutscenes?.[k]) { text = cutscenes[k]; break; }
      }
    }
    // 3) 메서드별 일반 폴백 (trackingResultFallbacks)
    if (!text) {
      const generic = DATA.trackingResultFallbacks?.[result.method];
      text = generic?.[result.outcome];
      if (!text) {
        for (const k of fallbackOrder) {
          if (generic?.[k]) { text = generic[k]; break; }
        }
      }
    }
    if (!text) text = '결과 텍스트가 비어있다.';

    const tag = ({
      jackpot: '대박', success: '성공',
      miss: '허탕', minor: '소득적음', danger: '위험'
    })[result.outcome] || result.outcome;

    const dayLabel = DAYS_KO[state.dayOfWeek - 1];
    const tagEl = $('[data-result-tag]');
    $('[data-result-key]').textContent = `RESULT · ${dayLabel} ${state.timeLabel}`;
    if (tagEl) {
      tagEl.textContent = tag;
      tagEl.dataset.resultTag = tag;
    }
    $('[data-result-title]').textContent = result.cardLabel
      ? `${result.eventTitle} — ${result.cardLabel}`
      : result.eventTitle;
    $('[data-result-body]').textContent = text;

    // 사진 카드는 텍스트 단서를 추가하지 않음 (사진이 본질)
    const cluesAdded = result.isPhotoCard ? [] : addCluesFromResult(result);
    const cluesEl = $('[data-result-clues]');
    if (cluesEl) {
      cluesEl.innerHTML = cluesAdded.length
        ? cluesAdded.map(c =>
            `<div class="result-clue-line"><span class="rcl-key">${c.typeLabel}</span><span class="rcl-val">${escapeHTML(c.summary)}</span></div>`
          ).join('')
        : '';
    }

    // 사진 자료 — 사진 카드 또는 잠복 결과로 획득 (가중치 라벨은 보이지 않음 — 판단은 플레이어 몫)
    const photo = pickPhotoForResult(result);
    if (photo) showTutorial('photo', 1200);
    const photoEl     = $('[data-result-photo]');
    const photoImg    = $('[data-result-photo-img]');
    const photoCap    = $('[data-result-photo-caption]');
    const photoFallbk = $('[data-result-photo-fallback]');
    if (photoEl) {
      if (photo) {
        photoEl.hidden = false;
        photoEl.classList.remove('is-fallback');
        if (photoImg) {
          photoImg.style.display = '';
          if (photoFallbk) photoFallbk.hidden = true;
          photoImg.alt = photo.caption || '수집된 사진 자료';
          photoImg.onerror = () => {
            photoImg.style.display = 'none';
            if (photoFallbk) photoFallbk.hidden = false;
            photoEl.classList.add('is-fallback');
          };
          photoImg.onload = () => {
            photoImg.style.display = '';
            if (photoFallbk) photoFallbk.hidden = true;
            photoEl.classList.remove('is-fallback');
          };
          photoImg.src = `images/cases/${photo.filename}`;
        }
        if (photoCap) photoCap.textContent = photo.caption || '';
      } else {
        photoEl.hidden = true;
      }
    }

    const ctaLabel = $('[data-result-cta-label]');
    if (ctaLabel) {
      ctaLabel.textContent = state.pendingResults.length > 0
        ? `다음 결과 (${state.pendingResults.length}건 남음)`
        : '오늘을 시작한다';
    }

    openOverlay(els.resultOverlay);
    showTutorial('result');
  }

  // 결과 모달 연쇄 — "다음 결과" / "오늘을 시작한다" 클릭
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-result-next]');
    if (!btn) return;
    if (state.pendingResults.length > 0) {
      showResultCutscene(state.pendingResults.shift());
    } else {
      closeOverlay(els.resultOverlay);
      if (state.isGameOver) return;
      // 월요일 + 게시판 미선택 → 게시판으로 (브리핑·게시판이 닫힐 때 알림 발화)
      if (state.dayOfWeek === 1 && !state.weeklyCasePicked) {
        showBulletinBoard();
      } else if (state.dayOfWeek === 5) {
        showFridayBriefing();
      } else {
        // 모달 다 닫힘 → 미룬 진동 알림 발화
        firePendingPhoneNotification();
      }
    }
  });

  // ─────────────────────────────────────────────
  //  End day → next day
  // ─────────────────────────────────────────────
  function endDay() {
    if (state.isGameOver) return;
    if (els.daybreakOverlay && !els.daybreakOverlay.hidden) return;  // 암전 중 중복 차단

    // 시간 진행 (즉시 — 암전 화면이 새 날짜를 보여주기 위해)
    state.day += 1;
    state.dayOfWeek += 1;
    if (state.dayOfWeek > 7) {
      state.dayOfWeek = 1;
      state.week += 1;
    }
    state.timeLabel = TIME_BY_DAY[state.dayOfWeek - 1] || '09:42';
    state.slotsRemaining = state.slotsTotal;
    state.trackedToday = [];

    // 사건 수명 -1 — 단, 이번 주 보도 사건은 *주간 보장* (월~금 유지)
    Object.entries(state.activeEvents).forEach(([id, info]) => {
      if (id === state.weeklyCase) return; // 주간 보도 사건은 게시판 선택 시 결정 — 자연 만료 안 함
      info.daysLeft -= 1;
      if (info.daysLeft <= 0) {
        delete state.activeEvents[id];
        if (!state.completedEventIds.includes(id)) {
          state.completedEventIds.push(id);
        }
      }
    });

    // 암전 → 콜백 (HUD 갱신 / 결과 모달 / 엔딩 체크 / 토스트 모두 암전 후 실행)
    showDaybreak(() => {
      if (state.isGameOver) return;

      // 월요일 — 고정비 + 엔딩 이벤트 체크 + 게시판 리셋
      if (state.dayOfWeek === 1) {
        const fixedCost = DATA.gauges.balance.weeklyFixedCost;
        applyGaugeDelta({ balance: -fixedCost });
        // 주말 휴식 보너스 — 월요일 슬롯 +N (1회용)
        if (state.mondayBonusSlots && state.mondayBonusSlots > 0) {
          state.slotsRemaining += state.mondayBonusSlots;
          setTimeout(() => {
            showToast(
              `<strong>🛏 주말 휴식 효과</strong>충분히 쉬었다. 오늘 슬롯 +${state.mondayBonusSlots}.`,
              3500
            );
          }, 1200);
          state.mondayBonusSlots = 0;
        }
        setTimeout(() => {
          showToast(
            `<strong>주간 고정비 -₩${fixedCost}</strong>사무실 임대료·아내 송금·식비. 잔고가 빠진다.`,
            3500
          );
        }, 600);
        if (state.isGameOver) return;
        if (checkEndingEvent()) return;
        // 새 주차 — 게시판 리셋
        state.weeklyCasePicked = false;
        state.weeklyCase = null;
      }

      renderHUD();
      triggerScheduledExposures();
      triggerScheduledConsequences();    // 과거 보도의 망령 — 시간 차 후폭풍
      if (state.isGameOver) return;

      // 어제(이전) 응답 안 한 폰 이벤트 자동 처리 — 침묵/안 좋은 답변으로 간주
      autoResolveStalePhoneEvents();

      // 폰 이벤트 — 매일 트리거 굴림 (조건 충족 시 inbox에 들어감)
      rollDailyPhoneEvents();

      // 카드/주말/결과 분기 — 평일 카드는 weeklyCase 기반
      if (state.dayOfWeek <= 4) {
        generateTodaysCards();
        if (state.todaysCards.length > 0) {
          els.phone?.classList.add('alert');
          const badge = els.phone?.querySelector('.badge');
          if (badge) {
            badge.textContent = String(state.todaysCards.length);
            badge.style.display = '';
          }
        }
      } else {
        state.todaysCards = [];
        if (els.cardHost) {
          els.cardHost.innerHTML = `<p class="cards-empty">${
            state.dayOfWeek === 5 ? '오늘은 금요일. 컴퓨터로 기사를 마감하세요.'
            : '주말입니다. 사무실엔 아무도 없다.'
          }</p>`;
        }
        els.phone?.classList.remove('alert');
        const badge = els.phone?.querySelector('.badge');
        if (badge) badge.style.display = 'none';
      }

      // 전날 선택 결과 → 모달 (암전 후 즉시 표시)
      if (state.pendingResults.length > 0) {
        const result = state.pendingResults.shift();
        showResultCutscene(result);
      } else if (state.dayOfWeek === 6) {
        showWeekendCutscene();
      } else if (state.dayOfWeek === 1 && !state.weeklyCasePicked) {
        // 월요일 — 결과 모달 없으면 게시판 자동 표시
        showBulletinBoard();
      } else if (state.dayOfWeek === 5) {
        // 금요일 — 결과 모달 없으면 편집 데스크 브리핑 자동 표시
        showFridayBriefing();
      } else {
        const dayLabel = DAYS_KO[state.dayOfWeek - 1];
        const todayInfo = state.dayOfWeek === 7
          ? `<strong>일요일</strong>다음 주가 다가온다.`
          : `<strong>${dayLabel}요일</strong>전화기를 눌러 추적 방법을 살펴보자.`;
        showToast(todayInfo, 2400);
        // 모달 안 뜨는 평일 — 토스트 직후 진동
        setTimeout(() => firePendingPhoneNotification(), 800);
      }
    });
  }

  // ─────────────────────────────────────────────
  //  폰 이벤트 트리거 시스템 — 매일 endDay 콜백에서 굴림
  // ─────────────────────────────────────────────
  function getPhoneStat(type) {
    switch (type) {
      case 'balance':       return state.gauges.balance;
      case 'conscience':    return state.gauges.conscience;
      case 'credibility':   return state.gauges.credibility;
      case 'week':          return state.week;
      case 'dayOfWeek':     return state.dayOfWeek;
      case 'fakeCount':     return state.publishedArticles.filter(a => (a.fakeSlotCount || 0) > 0).length;
      case 'exposedCount':  return state.publishedArticles.filter(a => a.exposed).length;
      case 'jackpotCount':  return state.pendingResults.filter(r => r.outcome === 'jackpot').length
                                 + state.publishedArticles.filter(a => (a.earnedViews || 0) >= 60000 && (a.fakeSlotCount || 0) === 0).length;
      default:              return 0;
    }
  }
  function checkPhoneTrigger(t) {
    if (!t) return false;
    const v = getPhoneStat(t.type);
    switch (t.op) {
      case 'lt':  return v <  t.value;
      case 'lte': return v <= t.value;
      case 'gt':  return v >  t.value;
      case 'gte': return v >= t.value;
      case 'eq':  return v === t.value;
      default:    return false;
    }
  }
  // 발행한 기사 중 이 이벤트에 매칭되는 기사 찾기 (subject-aware)
  function findMatchingPublishedArticle(req) {
    if (!req) return null;
    // 최근 발행 순으로 검색 (최근 3개)
    const candidates = state.publishedArticles.slice().reverse();
    for (const a of candidates) {
      const wantFake = req.matchFake;
      const isFake = (a.fakeSlotCount || 0) > 0 || a.glitchOutcome === 'fake';
      if (wantFake === true  && !isFake) continue;
      if (wantFake === false && isFake)  continue;
      const event = getEvent(a.eventId);
      if (!event) continue;
      if (req.matchVictim && !event.victimWhenFake) continue;
      if (req.matchCategory && event.category !== req.matchCategory) continue;
      return { article: a, event };
    }
    return null;
  }

  function evaluatePhoneEvent(ev) {
    const t = ev.trigger;
    if (!t) return null;
    if (t.minWeek && state.week < t.minWeek) return null;
    if (t.onceOnly && state.firedPhoneEvents.includes(ev.id)) return null;
    if (t.cooldownDays) {
      const last = state.phoneEventLastFiredDay[ev.id];
      if (last !== undefined && (state.day - last) < t.cooldownDays) return null;
    }
    if (state.phoneInbox.find(i => i.eventId === ev.id)) return null;

    // minCondCheck — "stat>=N" 같은 단순 표현
    if (t.minCondCheck) {
      const m = /^(\w+)\s*(>=|<=|>|<|==)\s*(-?\d+)$/.exec(t.minCondCheck);
      if (m) {
        const sv = getPhoneStat(m[1]);
        const cv = parseInt(m[3], 10);
        const ok = ({
          '>=': sv >= cv, '<=': sv <= cv, '>': sv > cv, '<': sv < cv, '==': sv === cv
        })[m[2]];
        if (!ok) return null;
      }
    }

    if (!checkPhoneTrigger(t)) return null;

    // subject-aware 매칭 — 실제 발행 기사 필요
    let context = {};
    if (t.requiresPublishedArticle) {
      const match = findMatchingPublishedArticle(t.requiresPublishedArticle);
      if (!match) return null;
      const catKey = match.event.category;
      const catLabel = ({
        entertainment: '연예', politics: '정치', society: '사회',
        personal: '개인', anonymous: '익명'
      })[catKey] || '';
      context = {
        caseTitle: match.event.title,
        caseId: match.event.id,
        category: catLabel,
        categoryKey: catKey,
        victim: match.event.victimWhenFake || ''
      };
      // variants 가 있으면 해당 카테고리에 맞는 변형이 있어야 발동
      if (ev.variants && !ev.variants[catKey]) return null;
    }
    return { context };
  }

  // 단순 placeholder 치환 — {caseTitle}, {category} 등
  function substituteContext(text, context) {
    if (!context || !text) return text;
    return text.replace(/\{(\w+)\}/g, (m, k) => context[k] !== undefined ? context[k] : m);
  }

  // 이벤트 + 컨텍스트 → 실제 표시할 콘텐츠 (variants 처리)
  function resolveEventContent(ev, context) {
    if (ev.variants && context?.categoryKey && ev.variants[context.categoryKey]) {
      const v = ev.variants[context.categoryKey];
      const senders = DATA.phoneEventSenders || {};
      return {
        thread: v.thread || ev.thread || 'anon',
        senderName: v.senderName || senders[ev.thread]?.name || '발신자',
        tone: v.tone || senders[ev.thread]?.tone || 'anon',
        incoming: v.incoming || ev.incoming || []
      };
    }
    const senders = DATA.phoneEventSenders || {};
    const sender = senders[ev.thread] || { name: ev.thread, tone: 'work' };
    return {
      thread: ev.thread,
      senderName: sender.name,
      tone: sender.tone,
      incoming: ev.incoming || []
    };
  }

  // 특정 스레드의 unread/preview 메타를 inbox 현황 기준으로 재계산
  function recomputeThreadMeta(thread) {
    if (!thread) return;
    const entries = state.phoneInbox.filter(i => {
      const ev = DATA.phoneEvents.find(e2 => e2.id === i.eventId);
      if (!ev) return false;
      return resolveEventContent(ev, i.context).thread === thread;
    });
    state.threadUnread[thread] = entries.length;
    if (entries.length > 0) {
      const last = entries[entries.length - 1];
      const lastEv = DATA.phoneEvents.find(e2 => e2.id === last.eventId);
      if (lastEv) {
        const lastContent = resolveEventContent(lastEv, last.context);
        state.threadLastPreview[thread] =
          substituteContext(lastContent.incoming?.[0] || '', last.context || {});
      }
    }
  }

  // inbox 푸시 + 해당 스레드의 unread/preview/time 메타 업데이트
  // unread 는 *받은 연락 건수* — 이벤트 1건당 +1 (말풍선 수가 아님)
  function pushPhoneEvent(ev, context) {
    state.phoneInbox.push({ eventId: ev.id, day: state.day, context });
    const content = resolveEventContent(ev, context);
    const thread = content.thread;
    if (thread) {
      state.threadUnread[thread] = (state.threadUnread[thread] || 0) + 1;
      const previewRaw = substituteContext(content.incoming?.[0] || '', context || {});
      state.threadLastPreview[thread] = previewRaw;
      state.threadLastTime[thread] = state.timeLabel || '방금';
      state.threadLastFiredDay[thread] = state.day;
    }
  }

  // ─── 가족 스레드 빈도 제한 ───
  // 딸·아내 연락은 일주일에 한 번꼴, 두 사람이 같은 날 연락하지 않도록 제한
  // (업무·취재 연락이 게임의 주가 되어야 함)
  const FAMILY_THREADS = new Set(['daughter', 'wife']);
  const FAMILY_SELF_COOLDOWN = 7;   // 같은 가족 스레드 다시 연락 — 7일 후
  const FAMILY_CROSS_GAP = 2;       // 다른 가족 스레드와 — 2일 이상 간격
  function isFamilyThreadAllowed(thread) {
    if (!thread || !FAMILY_THREADS.has(thread)) return true;
    const last = state.threadLastFiredDay?.[thread];
    if (last !== undefined && (state.day - last) < FAMILY_SELF_COOLDOWN) return false;
    for (const other of FAMILY_THREADS) {
      if (other === thread) continue;
      const lastOther = state.threadLastFiredDay?.[other];
      if (lastOther !== undefined && (state.day - lastOther) < FAMILY_CROSS_GAP) return false;
    }
    return true;
  }

  // 어제(또는 그 이전) 받았는데 응답 안 한 phoneInbox 항목을 자동 처리
  // — 가장 안 좋은 선택지로 처리되거나 침묵으로 흘려보낸 걸로 간주, 효과 적용
  // 핸드폰 알림이 쌓여서 같은 스레드 다음 메시지가 안 나오는 버그 방지
  function autoResolveStalePhoneEvents() {
    if (!state.phoneInbox || state.phoneInbox.length === 0) return;

    // 어제 이전의 모든 항목 — 답변 안 한 것 + 답변했지만 종료 안 누른 것 모두 정리
    const stale = state.phoneInbox.filter(entry => entry.day < state.day);
    if (stale.length === 0) return;

    let totalConscience = 0;
    let totalCredibility = 0;
    let totalBalance = 0;
    let silenceCount = 0;     // 답변 안 한 건 수 (토스트에 표시)
    const resolvedIds = [];
    const affectedThreads = new Set();

    stale.forEach(entry => {
      const ev = DATA.phoneEvents.find(e => e.id === entry.eventId);
      if (!ev) return;
      const ctx = entry.context || {};
      const content = resolveEventContent(ev, ctx);
      if (content?.thread) affectedThreads.add(content.thread);

      const alreadyReplied = entry.replyChosen !== undefined;

      if (alreadyReplied) {
        // 답변은 했지만 "대화 종료"를 안 누른 케이스 — chatHistory에 정상 누적, 페널티 없음
        const chose = ev.choices?.[entry.replyChosen];
        if (content && state.chatHistory[content.thread]) {
          const hist = state.chatHistory[content.thread];
          hist.push({ divider: `${entry.day}일차`, time: '' });
          (content.incoming || []).forEach(t =>
            hist.push({ from: 'them', text: substituteContext(t, ctx) })
          );
          if (chose) {
            hist.push({ from: 'me', text: chose.label });
            (chose.reply || []).forEach(t =>
              hist.push({ from: 'them', text: substituteContext(t, ctx) })
            );
          }
        }
      } else {
        // 답변도 안 한 케이스 — 침묵으로 처리 (가장 안 좋은 선택지 효과 적용)
        silenceCount++;
        let worstIdx = -1;
        let worstScore = Infinity;
        (ev.choices || []).forEach((c, i) => {
          const eff = c.effect || {};
          const score = (eff.conscience || 0) + (eff.credibility || 0) + (eff.balance || 0);
          if (score < worstScore) {
            worstScore = score;
            worstIdx = i;
          }
        });

        let appliedEffect = (worstIdx >= 0 && ev.choices[worstIdx]?.effect)
          ? ev.choices[worstIdx].effect
          : { conscience: -1 };
        applyGaugeDelta(appliedEffect);
        Object.entries(appliedEffect).forEach(([k, v]) => {
          if (k === 'conscience')  totalConscience  += v;
          if (k === 'credibility') totalCredibility += v;
          if (k === 'balance')     totalBalance     += v;
        });

        if (content && state.chatHistory[content.thread]) {
          const hist = state.chatHistory[content.thread];
          hist.push({ divider: `${entry.day}일차 (응답 못함)`, time: '' });
          (content.incoming || []).forEach(t =>
            hist.push({ from: 'them', text: substituteContext(t, ctx) })
          );
          hist.push({ from: 'me', text: '(응답하지 못했다)' });
        }
      }

      // 기록
      if (!state.firedPhoneEvents.includes(entry.eventId)) state.firedPhoneEvents.push(entry.eventId);
      state.phoneEventLastFiredDay[entry.eventId] = state.day;
      resolvedIds.push(entry.eventId);
    });

    // inbox 정리
    state.phoneInbox = state.phoneInbox.filter(e => !resolvedIds.includes(e.eventId));

    // 영향받은 thread 메타 재계산 — unread, preview 모두 inbox 기준 다시
    affectedThreads.forEach(t => recomputeThreadMeta(t));
    // 안전망 — 모든 thread 강제 동기화 (phantom 알림 방지)
    Object.keys(state.threadUnread || {}).forEach(t => recomputeThreadMeta(t));
    refreshPhoneBadge();
    refreshThreadStatusUI();

    // 요약 토스트 — 침묵 처리된 것만 알림 (답변했지만 닫지 않은 건 조용히 정리)
    if (silenceCount > 0) {
      const parts = [];
      if (totalConscience !== 0)  parts.push(`양심 ${totalConscience > 0 ? '+' : ''}${totalConscience}`);
      if (totalCredibility !== 0) parts.push(`신뢰도 ${totalCredibility > 0 ? '+' : ''}${totalCredibility}`);
      if (totalBalance !== 0)     parts.push(`잔고 ${totalBalance > 0 ? '+' : ''}${totalBalance}`);
      const effectText = parts.length ? parts.join(' · ') : '침묵';
      setTimeout(() => {
        showToast(
          `<strong>📵 응답 못한 연락 ${silenceCount}건</strong>침묵으로 흘려보냈다 — ${effectText}`,
          4200
        );
      }, 200);
    }
  }

  function rollDailyPhoneEvents() {
    if (!DATA.phoneEvents) return;
    let newCount = 0;

    // 같은 스레드 중복 푸시 방지 — inbox 에 남아 있는 *모든* 항목 (오늘+이전) 검사
    // (이전 항목은 autoResolveStale 직후라 보통 비어있지만, 안전을 위해 전체 검사)
    const threadsFiredToday = new Set();
    state.phoneInbox.forEach(entry => {
      const ev0 = DATA.phoneEvents.find(e => e.id === entry.eventId);
      if (!ev0) return;
      const t = resolveEventContent(ev0, entry.context).thread;
      if (t) threadsFiredToday.add(t);
    });

    // Tier 1 — 크리티컬 이벤트 (조건 충족 시 발화, 단 thread dedupe)
    const critical = DATA.phoneEvents.filter(e => !e.dailyPool);
    critical.forEach(ev => {
      const res = evaluatePhoneEvent(ev);
      if (!res) return;
      const t = resolveEventContent(ev, res.context).thread;
      if (t && threadsFiredToday.has(t)) return; // 같은 스레드 이미 오늘 받았음
      if (!isFamilyThreadAllowed(t)) return;     // 가족 스레드 주 1회 제한
      pushPhoneEvent(ev, res.context);
      if (t) threadsFiredToday.add(t);
      newCount++;
    });

    // Tier 2 — 데일리 풀 (2~3일 간격으로만 발동 — 매일 X)
    if (state.day >= (state.dailyPoolNextRollDay || 2)) {
      const dailyCandidates = [];
      DATA.phoneEvents.filter(e => e.dailyPool).forEach(ev => {
        const res = evaluatePhoneEvent(ev);
        if (!res) return;
        const t = resolveEventContent(ev, res.context).thread;
        if (t && threadsFiredToday.has(t)) return; // 이미 오늘 받은 스레드 제외
        if (!isFamilyThreadAllowed(t)) return;     // 가족 스레드 주 1회 제한
        dailyCandidates.push({ ev, context: res.context, thread: t });
      });
      for (let i = dailyCandidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [dailyCandidates[i], dailyCandidates[j]] = [dailyCandidates[j], dailyCandidates[i]];
      }
      const pickCount = Math.min(dailyCandidates.length, 1 + Math.floor(Math.random() * 2));
      const picked = [];
      for (const cand of dailyCandidates) {
        if (picked.length >= pickCount) break;
        if (cand.thread && threadsFiredToday.has(cand.thread)) continue; // 같은 풀 안에서도 dedupe
        // 가족 스레드 교차 차단 — 같은 날 다른 가족이 이미 픽됐으면 스킵
        if (cand.thread && FAMILY_THREADS.has(cand.thread)) {
          let crossHit = false;
          for (const other of FAMILY_THREADS) {
            if (other !== cand.thread && threadsFiredToday.has(other)) { crossHit = true; break; }
          }
          if (crossHit) continue;
        }
        picked.push(cand);
        if (cand.thread) threadsFiredToday.add(cand.thread);
      }
      picked.forEach(({ ev, context }) => {
        pushPhoneEvent(ev, context);
        newCount++;
      });
      // 다음 발동 = 2~3일 후 (랜덤)
      state.dailyPoolNextRollDay = state.day + 2 + Math.floor(Math.random() * 2);
    }

    refreshPhoneBadge();
    refreshThreadStatusUI();
    // 진동/사운드는 즉시 X — 결과 모달이 닫힐 때 발화 (deferred)
    if (newCount > 0) state.pendingPhoneNotification = true;
  }

  // 결과 모달/게시판/브리핑 닫힐 때 호출 — 미뤘던 알림 발화
  function firePendingPhoneNotification() {
    if (state.pendingPhoneNotification) {
      state.pendingPhoneNotification = false;
      playPhoneVibration();
    }
  }

  // 메시지 앱의 모든 thread-item 의 unread/preview/time 을 state 에 맞춰 갱신
  // (정적 daughter/wife/editor + 동적 prepended event-thread 모두)
  function refreshThreadStatusUI() {
    const list = $('.thread-list');
    if (!list) return;
    // 정적 thread items
    list.querySelectorAll('.thread-item:not(.event-thread)').forEach(li => {
      const opener = li.dataset.openApp || '';
      if (!opener.startsWith('chat-')) return;
      const who = opener.replace('chat-', '');
      const unread = state.threadUnread[who] || 0;
      li.classList.toggle('unread', unread > 0);
      // 배지
      let badge = li.querySelector('.thread-badge');
      if (unread > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'thread-badge';
          li.appendChild(badge);
        }
        badge.textContent = String(unread);
      } else if (badge) {
        badge.remove();
      }
      // 미리보기
      const preview = li.querySelector('.thread-preview');
      if (preview && state.threadLastPreview[who]) {
        preview.textContent = state.threadLastPreview[who];
      }
      // 시간
      const timeEl = li.querySelector('.thread-time');
      if (timeEl && state.threadLastTime[who]) {
        timeEl.textContent = state.threadLastTime[who];
      }
    });
    refreshHomeAppBadges();
  }

  function refreshPhoneBadge() {
    const badge = els.mobile?.querySelector('.m-badge');
    if (badge) {
      const count = state.phoneInbox.length;
      badge.textContent = String(count);
      badge.style.display = count > 0 ? '' : 'none';
    }
    refreshHomeAppBadges();
  }

  // 폰 홈 화면의 앱 타일 배지 — 실제 안 읽은 갯수 반영
  function refreshHomeAppBadges() {
    // 메시지 = 모든 thread unread 합계
    const messagesBadge = $('[data-tile-badge="messages"]');
    if (messagesBadge) {
      const total = Object.values(state.threadUnread || {}).reduce((a, n) => a + (n || 0), 0);
      if (total > 0) {
        messagesBadge.textContent = String(total);
        messagesBadge.hidden = false;
      } else {
        messagesBadge.hidden = true;
      }
    }
    // 전화 — 추후 통화 시스템 추가 시 활성화. 현재는 숨김
    const callsBadge = $('[data-tile-badge="calls"]');
    if (callsBadge) callsBadge.hidden = true;
  }

  // ─────────────────────────────────────────────
  //  오디오 매니저 — bg 루프 + 음악(주말) + SFX(카드클릭) + 진동
  // ─────────────────────────────────────────────
  const Audio = {
    el: {
      bg:       $('#audioBg'),
      weekend:  $('#audioWeekend'),
      cardClick:$('#audioCardClick'),
      bell:     $('#audioBell'),
      ending:   $('#audioEnding'),
      phoneVib: $('#phoneVibSound')
    },
    // 트랙별 baseVolume 비율 — 사용자 설정 volume 에 곱해짐
    baseVolume: {
      bg:       0.35,  // 배경음 — 작게 깔리게
      weekend:  0.70,  // 주말 음악
      ending:   0.70,  // 엔딩 음악
      cardClick:1.00,  // UI 클릭
      bell:     1.00,  // 게시판 종소리
      phoneVib: 1.00   // 진동 — 가장 또렷하게
    },
    volume: 0.5,
    muted:  false,
    bgMutedByMusic: false,

    init() {
      // localStorage 에서 복원
      const v = parseFloat(localStorage.getItem('filtered_volume'));
      const m = localStorage.getItem('filtered_muted') === 'true';
      if (!isNaN(v)) this.volume = Math.max(0, Math.min(1, v));
      this.muted = m;
      this.applyAll();
      // bg 루프 보장
      if (this.el.bg) this.el.bg.loop = true;
      // 첫 사용자 인터랙션에 bg 시작 (브라우저 autoplay 정책)
      const start = () => {
        this.startBg();
        document.removeEventListener('click', start);
        document.removeEventListener('keydown', start);
      };
      document.addEventListener('click', start, { once: true });
      document.addEventListener('keydown', start, { once: true });
    },

    _vol(key) {
      const base = this.baseVolume[key] ?? 1.0;
      return Math.min(1, this.volume * base);
    },

    applyAll() {
      Object.entries(this.el).forEach(([k, a]) => {
        if (!a) return;
        a.volume = this._vol(k);
      });
      if (this.el.bg) this.el.bg.muted = this.muted || this.bgMutedByMusic;
      ['weekend','cardClick','bell','ending','phoneVib'].forEach(k => {
        if (this.el[k]) this.el[k].muted = this.muted;
      });
    },

    startBg() {
      if (!this.el.bg) return;
      this.el.bg.volume = this._vol('bg');
      this.el.bg.muted = this.muted || this.bgMutedByMusic;
      this.el.bg.play().catch(() => {});
    },

    setVolume(v) {
      this.volume = Math.max(0, Math.min(1, v));
      localStorage.setItem('filtered_volume', String(this.volume));
      this.applyAll();
    },

    setMuted(m) {
      this.muted = !!m;
      localStorage.setItem('filtered_muted', String(this.muted));
      this.applyAll();
    },

    toggleMute() { this.setMuted(!this.muted); },

    // 일회성 효과음 (카드 클릭 등) — bg 음소거 영향 X
    playSfx(key) {
      const a = this.el[key];
      if (!a) return;
      try {
        a.currentTime = 0;
        a.volume = this._vol(key);
        a.muted = this.muted;
        const p = a.play();
        if (p && p.catch) p.catch(err => console.warn('[Audio] play blocked:', key, err?.message));
      } catch (e) {
        console.warn('[Audio] playSfx error:', key, e);
      }
    },

    // 음악 트랙 재생 — bg 음소거됨
    playMusic(key) {
      const a = this.el[key];
      if (!a) return;
      this.bgMutedByMusic = true;
      if (this.el.bg) this.el.bg.muted = true;
      try {
        a.currentTime = 0;
        a.volume = this._vol(key);
        a.muted = this.muted;
        a.loop = false;
        a.play().catch(() => {});
      } catch (_) {}
    },

    stopMusic(key) {
      const a = this.el[key];
      if (a) {
        try { a.pause(); a.currentTime = 0; } catch (_) {}
      }
      this.bgMutedByMusic = false;
      if (this.el.bg) this.el.bg.muted = this.muted;
    }
  };

  // ─────────────────────────────────────────────
  //  설정 패널 — 톱니바퀴, 음소거, 볼륨 슬라이더
  // ─────────────────────────────────────────────
  function initSettingsPanel() {
    const toggle = $('#settingsToggle');
    const body   = $('#settingsBody');
    const close  = $('#settingsClose');
    const mute   = $('#settingsMute');
    const vol    = $('#settingsVolume');
    const volVal = $('#settingsVolumeVal');

    if (!toggle || !body) return;

    // 초기 UI 동기화
    if (vol) vol.value = String(Math.round(Audio.volume * 100));
    if (volVal) volVal.textContent = String(Math.round(Audio.volume * 100));
    if (mute) mute.classList.toggle('muted', Audio.muted);

    toggle.addEventListener('click', () => {
      body.hidden = !body.hidden;
    });
    close?.addEventListener('click', () => { body.hidden = true; });

    mute?.addEventListener('click', () => {
      Audio.toggleMute();
      mute.classList.toggle('muted', Audio.muted);
    });

    vol?.addEventListener('input', () => {
      const v = Number(vol.value) / 100;
      Audio.setVolume(v);
      if (volVal) volVal.textContent = vol.value;
    });

    // 패널 외부 클릭 시 닫기
    document.addEventListener('click', (e) => {
      if (body.hidden) return;
      if (e.target.closest('#settingsPanel')) return;
      body.hidden = true;
    });
  }

  // 핸드폰 진동 + 사운드 — 새 이벤트 도착 시
  let vibrateTimer = null;
  function playPhoneVibration() {
    Audio.playSfx('phoneVib');
    if (els.mobile) {
      els.mobile.classList.remove('vibrating');
      void els.mobile.offsetWidth;
      els.mobile.classList.add('vibrating');
      if (vibrateTimer) clearTimeout(vibrateTimer);
      vibrateTimer = setTimeout(() => els.mobile?.classList.remove('vibrating'), 6000);
    }
    showTutorial('phoneVib', 1500);  // 진동 직후 토스트 (살짝 늦게)
  }
  function stopPhoneVibration() {
    els.mobile?.classList.remove('vibrating');
    if (vibrateTimer) { clearTimeout(vibrateTimer); vibrateTimer = null; }
  }

  // 메시지 앱 진입 시 호출 — 정적 thread 는 unread 메타 갱신, 비-정적 발신은 동적 thread item 추가
  // 정적: daughter/wife/editor (HTML에 항상 있음, opener=chat-X)
  // 비-정적: friend/rival/anon/fan/family_member/agency/lawyer/family_victim 등
  function renderPhoneInbox() {
    const list = $('.thread-list');
    if (!list) return;
    // 동적 항목(이전 prepend) 제거
    list.querySelectorAll('[data-open-event-thread]').forEach(el => el.remove());

    const STATIC_THREADS = new Set(['daughter', 'wife', 'editor']);

    // 비-정적 스레드별로 그룹화 — 한 발신자당 한 thread item
    const dynamicByThread = {};
    state.phoneInbox.forEach(entry => {
      const ev = DATA.phoneEvents.find(e => e.id === entry.eventId);
      if (!ev) return;
      const content = resolveEventContent(ev, entry.context);
      if (STATIC_THREADS.has(content.thread)) return; // 정적은 정적 자리 사용
      if (!dynamicByThread[content.thread]) dynamicByThread[content.thread] = { entries: [], content };
      dynamicByThread[content.thread].entries.push(entry);
    });

    const items = Object.entries(dynamicByThread).map(([thread, { entries, content }]) => {
      const unread = state.threadUnread[thread] || entries.length;
      const previewRaw = state.threadLastPreview[thread] || '';
      const preview = previewRaw.slice(0, 36);
      const time = state.threadLastTime[thread] || '방금';
      const avatar = content.senderName.charAt(0);
      const isUnread = unread > 0;
      return `
        <li class="thread-item event-thread tone-${content.tone}${isUnread ? ' unread' : ''}" data-open-event-thread="${thread}">
          <div class="thread-avatar avatar-event">${escapeHTML(avatar)}</div>
          <div class="thread-body">
            <div class="thread-top">
              <span class="thread-name">${escapeHTML(content.senderName)}</span>
              <span class="thread-time">${escapeHTML(time)}</span>
            </div>
            <div class="thread-preview">${escapeHTML(preview)}${previewRaw.length >= 36 ? '…' : ''}</div>
          </div>
          ${isUnread ? `<span class="thread-badge">${unread}</span>` : ''}
        </li>`;
    }).join('');

    if (items) list.insertAdjacentHTML('afterbegin', items);

    // 정적 thread items 의 unread/preview/time 동기화
    refreshThreadStatusUI();
  }

  // 비-정적 동적 thread 클릭 → 해당 스레드의 *가장 최근* pending 이벤트 열기
  // (프리뷰가 최신 이벤트 기준이므로 프리뷰 = 클릭해서 보이는 내용 일치)
  document.addEventListener('click', (e) => {
    const li = e.target.closest('[data-open-event-thread]');
    if (!li) return;
    const thread = li.dataset.openEventThread;
    let entry = null;
    for (let i = state.phoneInbox.length - 1; i >= 0; i--) {
      const item = state.phoneInbox[i];
      const ev = DATA.phoneEvents.find(e2 => e2.id === item.eventId);
      if (!ev) continue;
      if (resolveEventContent(ev, item.context).thread === thread) {
        entry = item;
        break;
      }
    }
    if (entry) openPhoneEvent(entry.eventId);
  });

  // 이벤트 클릭 → chat-event 화면 렌더링 (비-정적 발신자용)
  function openPhoneEvent(eventId) {
    const ev = DATA.phoneEvents.find(e => e.id === eventId);
    if (!ev) return;
    state.activePhoneEvent = eventId;

    const inbox = state.phoneInbox.find(i => i.eventId === eventId);
    const ctx = inbox?.context || {};
    const content = resolveEventContent(ev, ctx);

    // 이 스레드의 unread 처리
    state.threadUnread[content.thread] = 0;
    refreshThreadStatusUI();
    refreshPhoneBadge();

    const titleEl = $('[data-event-title]');
    const streamEl = $('[data-event-stream]');
    const choicesEl = $('[data-event-choices]');

    if (titleEl) titleEl.textContent = content.senderName;

    // 받은 메시지 + (이미 응답했으면) 사용자 응답 + 추가 reply
    const incoming = (content.incoming || []).map(t =>
      `<div class="bubble them">${escapeHTML(substituteContext(t, ctx))}</div>`
    ).join('');

    let userBubble = '';
    let replyBubbles = '';
    if (inbox?.replyChosen !== undefined) {
      const chose = ev.choices[inbox.replyChosen];
      if (chose) {
        userBubble = `<div class="bubble me">${escapeHTML(chose.label)}</div>`;
        replyBubbles = (chose.reply || []).map(t =>
          `<div class="bubble them">${escapeHTML(substituteContext(t, ctx))}</div>`
        ).join('');
      }
    }

    if (streamEl) {
      streamEl.innerHTML = incoming + userBubble + replyBubbles;
      requestAnimationFrame(() => { streamEl.scrollTop = streamEl.scrollHeight; });
    }

    // 응답 안 했으면 선택지 노출, 했으면 닫기 안내
    if (choicesEl) {
      if (inbox?.replyChosen === undefined) {
        choicesEl.innerHTML = ev.choices.map((c, i) =>
          `<button class="event-choice" data-event-choice="${i}">${escapeHTML(c.label)}</button>`
        ).join('');
        choicesEl.hidden = false;
      } else {
        choicesEl.innerHTML = '<button class="event-choice event-done" data-event-done>대화 종료</button>';
        choicesEl.hidden = false;
      }
    }

    switchApp('chat-event');
  }

  // 이벤트 클릭 위임 — thread-item, choice button, done button
  document.addEventListener('click', (e) => {
    const open = e.target.closest('[data-open-event]');
    if (open) {
      openPhoneEvent(open.dataset.openEvent);
      return;
    }
    const choice = e.target.closest('[data-event-choice]');
    if (choice) {
      const idx = Number(choice.dataset.eventChoice);
      handlePhoneEventChoice(idx);
      return;
    }
    const done = e.target.closest('[data-event-done]');
    if (done) {
      finishPhoneEvent();
      return;
    }
  });

  // 정적 채팅 자동 종료 타이머 — 4초 후 finishPhoneEvent 자동 호출
  let _staticChatAutoFinishTimer = null;

  function handlePhoneEventChoice(idx) {
    const eventId = state.activePhoneEvent;
    if (!eventId) return;
    const ev = DATA.phoneEvents.find(e => e.id === eventId);
    if (!ev) return;
    const choice = ev.choices[idx];
    if (!choice) return;

    // 효과 적용
    if (choice.effect && Object.keys(choice.effect).length > 0) {
      applyGaugeDelta(choice.effect);
    }
    if (state.isGameOver) return;

    // 부가 효과 (주말 약속, 특종 추첨 등) — 게이지 외 상태 변동
    if (choice.flag) applyChoiceFlag(choice.flag);

    // inbox 항목에 응답 기록
    const inboxEntry = state.phoneInbox.find(i => i.eventId === eventId);
    if (inboxEntry) inboxEntry.replyChosen = idx;

    // 다시 렌더 — 정적 채팅(딸/아내/편집장)에서 호출됐으면 그 채팅 안에서 그대로 진행
    // 그렇지 않으면 chat-event 패널로 (기존 동적 발신자 흐름 유지)
    const activeApp = $('.phone-app:not([hidden])');
    const activeName = activeApp?.dataset.app;
    if (activeName && activeName.startsWith('chat-') && activeName !== 'chat-event') {
      renderChat(activeName.replace('chat-', ''));
      // 정적 채팅 — 4초 후 자동 finish (사용자가 "대화 종료"를 안 눌러도 phantom 알림 안 남음)
      if (_staticChatAutoFinishTimer) clearTimeout(_staticChatAutoFinishTimer);
      _staticChatAutoFinishTimer = setTimeout(() => {
        _staticChatAutoFinishTimer = null;
        if (state.activePhoneEvent === eventId) {
          finishPhoneEvent();
        }
      }, 4000);
    } else {
      openPhoneEvent(eventId);
    }
  }

  function finishPhoneEvent() {
    // 자동 종료 타이머 정리 (사용자가 직접 누른 경우 중복 호출 방지)
    if (_staticChatAutoFinishTimer) {
      clearTimeout(_staticChatAutoFinishTimer);
      _staticChatAutoFinishTimer = null;
    }
    const eventId = state.activePhoneEvent;
    if (!eventId) return;

    const ev = DATA.phoneEvents.find(e => e.id === eventId);
    const inbox = state.phoneInbox.find(i => i.eventId === eventId);
    const ctx = inbox?.context || {};
    const content = ev ? resolveEventContent(ev, ctx) : null;

    // 기존 채팅 스레드(daughter/wife/editor)면 chatHistory 에 누적
    if (ev && content && state.chatHistory[content.thread]) {
      const hist = state.chatHistory[content.thread];
      hist.push({ divider: `${state.day}일차`, time: state.timeLabel || '' });
      (content.incoming || []).forEach(t =>
        hist.push({ from: 'them', text: substituteContext(t, ctx) })
      );
      if (inbox?.replyChosen !== undefined) {
        const chose = ev.choices[inbox.replyChosen];
        if (chose) {
          hist.push({ from: 'me', text: chose.label });
          (chose.reply || []).forEach(t =>
            hist.push({ from: 'them', text: substituteContext(t, ctx) })
          );
        }
      }
    }

    // inbox에서 제거 + fired 기록
    state.phoneInbox = state.phoneInbox.filter(i => i.eventId !== eventId);
    if (!state.firedPhoneEvents.includes(eventId)) state.firedPhoneEvents.push(eventId);
    state.phoneEventLastFiredDay[eventId] = state.day;
    state.activePhoneEvent = null;
    // 이 스레드의 남은 pending 이벤트가 있으면 그 수만큼 unread 다시 + preview 갱신
    if (content?.thread) recomputeThreadMeta(content.thread);

    refreshPhoneBadge();
    refreshThreadStatusUI();

    // chat-X 뷰에서 호출됐으면 그 chat 다시 렌더 (이벤트 누적 후)
    const activeApp = $('.phone-app:not([hidden])');
    const activeName = activeApp?.dataset.app;
    if (activeName && activeName.startsWith('chat-') && activeName !== 'chat-event') {
      const who = activeName.replace('chat-', '');
      renderChat(who);  // history 갱신된 상태로 재렌더
    } else {
      renderPhoneInbox();
      switchApp('messages');
    }
  }

  // ─────────────────────────────────────────────
  //  주차별 데이터 동적 로딩 — 필요한 chunk만 가져옴
  // ─────────────────────────────────────────────
  function ensureWeekData(week) {
    const chunkName = 'content_week' + week;
    if (window._loadedChunks?.has(chunkName)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'data/' + chunkName + '.js';
      s.onload = () => {
        console.log('[FILTERED] loaded ' + chunkName + '.js');
        resolve();
      };
      s.onerror = () => {
        console.warn('[FILTERED] failed to load ' + chunkName + '.js — using fallback');
        resolve(); // 실패해도 게임 계속 (cross-week 사건만으로 진행 가능)
      };
      document.head.appendChild(s);
    });
  }

  // ─────────────────────────────────────────────
  //  게시판 — 월요일 편집 회의 (이번 주 사건 1개 선택)
  // ─────────────────────────────────────────────
  async function showBulletinBoard() {
    if (!els.bulletinOverlay || !els.bulletinGrid) return;

    // 이번 주 사건 데이터가 로드 안 됐으면 동적 로드
    await ensureWeekData(state.week);

    // 이번 주 사건 + queuedScoops (메시지 응답으로 잡힌 cross-week 사건)
    const weekly = DATA.events.filter(e =>
      e.weekIndex === state.week && !state.completedEventIds.includes(e.id)
    );
    // 큐에 있는 특종 사건만 노출 — 랜덤 등장 폐기, 메시지 응답으로만 등장
    const queued = (state.queuedScoops || [])
      .map(id => DATA.events.find(e => e.id === id))
      .filter(e => e && !state.completedEventIds.includes(e.id));

    const posts = [...weekly, ...queued];
    if (posts.length === 0) {
      // 모든 사건 끝남 — 휴재 강제 같은 fallback (현실적으로 발생 어려움)
      els.bulletinGrid.innerHTML = '<p class="cards-empty">이번 주는 추적할 사건이 없다.</p>';
    } else {
      els.bulletinGrid.innerHTML = posts.map(ev => {
        const isCross = !!ev.crossWeek;
        const cat = ({
          entertainment: '연예', politics: '정치', society: '사회',
          personal: '개인', anonymous: '익명'
        })[ev.category] || ev.category.toUpperCase();
        const maxViews = Math.max(...ev.tracks.map(t => t.expectedViews));
        return `
          <article class="bulletin-post${isCross ? ' rare' : ''}" data-bulletin-pick="${ev.id}">
            <div class="bp-meta">
              <span class="bp-cat">${escapeHTML(cat)}${isCross ? ' · 희귀' : ''}</span>
              <span class="bp-views">최대 ${formatViews(maxViews)}</span>
            </div>
            <h3 class="bp-title">${escapeHTML(ev.title)}</h3>
            <p class="bp-lead">${escapeHTML(ev.bulletinLead || '소문이 떠돈다.')}</p>
            <span class="bp-cta">▸ 이 사건 추적</span>
          </article>`;
      }).join('');
    }

    if (els.bulletinKey) {
      els.bulletinKey.textContent = `EDITORIAL · WEEK ${String(state.week).padStart(2,'0')}`;
    }

    openOverlay(els.bulletinOverlay);
    Audio.playSfx('bell');  // 게시판 등장 종소리
    showTutorial('bulletin');
  }

  // 게시판 사건 선택 — 클릭 위임
  document.addEventListener('click', (e) => {
    const post = e.target.closest('[data-bulletin-pick]');
    if (!post) return;
    Audio.playSfx('cardClick');
    const eventId = post.dataset.bulletinPick;
    const event = getEvent(eventId);
    if (!event) return;

    // weeklyCase 등록 + activeEvents 초기화
    // daysLeft는 5로 고정 — 게시판에서 고른 사건은 이번 주(월~금) 내내 추적 가능
    state.weeklyCase = eventId;
    state.weeklyCasePicked = true;
    state.activeEvents[eventId] = {
      startDay: state.day,
      daysLeft: 5,
      completedTracks: state.activeEvents[eventId]?.completedTracks || [],
    };
    // 메시지 응답으로 잡힌 특종이었다면 큐에서 제거 (재등장 방지)
    if (state.queuedScoops?.includes(eventId)) {
      state.queuedScoops = state.queuedScoops.filter(id => id !== eventId);
    }

    closeOverlay(els.bulletinOverlay);
    generateTodaysCards();
    els.phone?.classList.add('alert');
    const badge = els.phone?.querySelector('.badge');
    if (badge) {
      badge.textContent = String(state.todaysCards.length);
      badge.style.display = '';
    }
    showToast(
      `<strong>이번 주 보도 — ${escapeHTML(event.title)}</strong>전화기를 클릭해 추적 방법을 살펴보자.`,
      4000
    );
    // 게시판 닫혔으니 미룬 진동 알림 발화
    firePendingPhoneNotification();
  });

  // ─────────────────────────────────────────────
  //  금요일 편집 데스크 — 주간 자료 정리 + 방향 결정
  // ─────────────────────────────────────────────
  function showFridayBriefing() {
    if (!els.fridayOverlay) return;

    const eventId = state.weeklyCase;
    const event = eventId ? getEvent(eventId) : null;
    const clues = eventId ? currentWeekClues(eventId) : [];

    // 출처 다양성 — 단서의 type 분포
    const typeCounts = {};
    clues.forEach(c => {
      const t = c.type || 'evidence';
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    });
    const sourceCount = Object.keys(typeCounts).length;

    // 카테고리·잠재 조회수 라벨
    const catLabel = ({
      entertainment: '연예', politics: '정치', society: '사회',
      personal: '개인', anonymous: '익명'
    })[event?.category] || '—';

    const viewsLabel = ({
      small:  '잠재 조회수: 작음',
      medium: '잠재 조회수: 보통',
      large:  '잠재 조회수: 큼',
      viral:  '잠재 조회수: 폭발 가능',
    })[event?.potentialViews] || '잠재 조회수: 미상';

    // 데스크 코멘트 — 단서 수 + 잠재 조회수 + 출처 다양성 조합
    const comment = buildDeskComment(clues.length, sourceCount, event?.potentialViews, typeCounts);

    // 채우기
    if (els.briefingSub)        els.briefingSub.textContent        = `출근 ${getWorkdayCount()}일차 · WEEK ${String(state.week).padStart(2,'0')}`;
    if (els.briefingCaseTitle)  els.briefingCaseTitle.textContent  = event?.title || '이번 주 보도 없음';
    if (els.briefingCategory)   els.briefingCategory.textContent   = catLabel;
    if (els.briefingViews)      els.briefingViews.textContent      = viewsLabel;
    if (els.briefingClueCount)  els.briefingClueCount.textContent  = `${clues.length} 개`;
    if (els.briefingSourceCount)els.briefingSourceCount.textContent= `${sourceCount} 종`;

    if (els.briefingTypes) {
      if (clues.length === 0) {
        els.briefingTypes.innerHTML = '<span class="bs-type-pill" style="opacity:0.5">단서 없음</span>';
      } else {
        const typeLabels = {
          royal: '공식', rumor: '소문', evidence: '현장', part: '내부', sigil: 'DB'
        };
        els.briefingTypes.innerHTML = Object.entries(typeCounts)
          .map(([t, n]) => `<span class="bs-type-pill">${typeLabels[t] || t} ${n}</span>`)
          .join('');
      }
    }

    if (els.briefingComment) els.briefingComment.textContent = comment;

    openOverlay(els.fridayOverlay);
    showTutorial('briefing');
  }

  function buildDeskComment(clueCount, sourceCount, potentialViews, typeCounts) {
    let head;
    if (clueCount === 0) {
      head = '이번 주는 빈손이다. 휴재가 답이다. 다음 주를 기다리자.';
    } else if (clueCount <= 2) {
      head = '자료가 턱없이 부족하다. 짧은 기사로 가거나 추정·날조로 빈 슬롯을 채워야 한다 — 그러나 그건 양심을 갉아먹는 길이다. 휴재가 안전하다.';
    } else if (clueCount <= 5) {
      head = '자료는 빈약하지만 짧은 기사는 가능하다. 자극성 다이얼을 만지면 조회수는 오르지만 발각 위험이 같이 따라온다.';
    } else if (clueCount <= 8) {
      head = '자료가 충실하다. 정직한 풀스토리도 가능. 자극을 더하면 조회수는 폭발하지만 양심 비용이 따라붙는다.';
    } else {
      head = '자료 패키지가 가득하다. 어느 방향이든 갈 수 있다. 결정은 당신이 한다.';
    }

    let viewsNote = '';
    if (clueCount > 0 && potentialViews) {
      viewsNote = '\n\n' + ({
        small:  '단, 사건 자체의 잠재 조회수는 작다. 큰 한 방을 기대하긴 어렵다.',
        medium: '잠재 조회수는 보통. 잘 쓰면 적당한 사회면 한 자리.',
        large:  '잠재 조회수가 크다. 잘 쓰면 톱뉴스도 가능.',
        viral:  '잠재 조회수: 폭발 가능. 헤드라인 한 줄이 바이럴이 될 수 있다.',
      })[potentialViews] || '';
    }

    let sourceNote = '';
    if (clueCount >= 3 && sourceCount >= 3) {
      sourceNote = '\n\n출처가 다양해 모순 가능성이 있다. 검증을 거치면 *특종* 으로 갈 수 있고, 무시하면 발각 위험이 커진다.';
    } else if (clueCount >= 3 && sourceCount === 1) {
      sourceNote = '\n\n한 출처에만 의존했다. 정정 보도 위험이 따라온다.';
    }

    let riskNote = '';
    const part = (typeCounts && typeCounts.part) || 0;
    if (part >= 3) {
      riskNote = '\n\n내부 자료(part) 비중이 높다. 정확하면 폭발하지만, 잘못 다루면 정보원이 노출된다.';
    }

    return head + viewsNote + sourceNote + riskNote;
  }

  // 금요일 브리핑 버튼 위임
  document.addEventListener('click', (e) => {
    const skip = e.target.closest('[data-briefing-skip]');
    if (skip) {
      closeOverlay(els.fridayOverlay);
      firePendingPhoneNotification();
      publishArticle({ skip: true });
      return;
    }
    const write = e.target.closest('[data-briefing-write]');
    if (write) {
      closeOverlay(els.fridayOverlay);
      firePendingPhoneNotification();
      openArticleEditor();
    }
  });

  // ─────────────────────────────────────────────
  //  조사 상세 모달 — 200자 서론 + 분포 + 결정
  // ─────────────────────────────────────────────
  function showInvestigationDetail(card) {
    if (!els.investOverlay) return;

    const method = DATA.trackingMethods[card.method] || {};
    const certaintyMeta = DATA.infoCardCertaintyLabels[card.certainty] || {};
    const approachSpecific = DATA.investigationApproaches?.[card.eventId]?.[card.method];
    const approachFallback = DATA.investigationApproachesFallback?.[card.method];
    // 카드 자체 briefing 우선
    const prose = card.briefing || approachSpecific || approachFallback || '추적 방법에 대한 자세한 설명이 없다.';

    state.pendingInvestigation = card;

    if (els.investMethodKey)   els.investMethodKey.textContent   = `METHOD · ${card.method.toUpperCase()}${card.isPhotoCard ? ' · 사진' : ''}`;
    if (els.investMethodLabel) els.investMethodLabel.textContent = card.cardLabel || method.label || card.method;
    if (els.investCost) {
      els.investCost.innerHTML = clockIconsHTML(method.slotCost || 1);
      els.investCost.setAttribute('aria-label', `코스트 ${method.slotCost || '?'}`);
    }
    if (els.investProse)       els.investProse.textContent       = prose;
    if (els.investViews)       els.investViews.textContent       = formatViews(card.expectedViews) + ' 조회';
    if (els.investCertainty)   els.investCertainty.textContent   = `${certaintyMeta.tag || card.certainty} (${certaintyMeta.stars || ''})`;

    if (els.investDist) {
      els.investDist.innerHTML = renderDistribution(card.certainty);
    }

    openOverlay(els.investOverlay);
    showTutorial('cost');
  }

  // ─────────────────────────────────────────────
  //  Daybreak — N일차 · 요일 암전 전환
  // ─────────────────────────────────────────────
  let daybreakTimer = null;
  function showDaybreak(callback) {
    const overlay = els.daybreakOverlay;
    if (!overlay) { callback?.(); return; }

    const dayLabel = DAYS_KO[state.dayOfWeek - 1];
    if (els.daybreakNum) {
      els.daybreakNum.textContent = state.dayOfWeek <= 5
        ? `출근 ${getWorkdayCount()}일차`
        : '주말';
    }
    if (els.daybreakLabel) els.daybreakLabel.textContent = `${dayLabel}요일 · ${state.timeLabel}`;
    if (els.daybreakWeek)  els.daybreakWeek.textContent  = `WEEK ${String(state.week).padStart(2,'0')}`;

    // 애니메이션 재시작
    overlay.hidden = false;
    overlay.style.animation = 'none';
    void overlay.offsetWidth;
    overlay.style.animation = '';

    if (daybreakTimer) clearTimeout(daybreakTimer);
    daybreakTimer = setTimeout(() => {
      overlay.hidden = true;
      daybreakTimer = null;
      callback?.();
    }, 1700);
  }

  // ─────────────────────────────────────────────
  //  Weekend cutscene — 메시지로 잡힌 약속이 있으면 그 컷씬 우선,
  //  아니면 양심 × 재력 4분면 (기본)
  // ─────────────────────────────────────────────
  const WEEKEND_PLAN_SCENES = {
    friend_meat: {
      title: '친구들과 고깃집',
      caption: '연기와 웃음소리가 같이 올라온다.\n잔이 한 번 부딪힌다 — 마감 얘긴 잠깐 미뤄도 됐다.',
      tag: 'FRIENDS',
      quad: 'friendMeat',
    },
  };

  function showWeekendCutscene() {
    if (!els.weekendOverlay) return;

    const conscience = state.gauges.conscience;
    const balance = state.gauges.balance;
    const TH = DATA.settings.weekendCutsceneThresholds;

    // 메시지 응답으로 약속이 잡혀 있으면 해당 컷씬으로 덮어쓰기
    const planScene = state.weekendPlan ? WEEKEND_PLAN_SCENES[state.weekendPlan] : null;

    let quad, scene;
    if (planScene) {
      quad = planScene.quad;
      scene = planScene;
    } else {
      const conscienceHigh = conscience >= TH.conscience;
      const balanceHigh    = balance    >= TH.balance * 10; // balance threshold는 30 (비율로) — 잔고 300+
      if      (conscienceHigh && balanceHigh)  quad = 'hh';
      else if (conscienceHigh && !balanceHigh) quad = 'hl';
      else if (!conscienceHigh && balanceHigh) quad = 'lh';
      else                                     quad = 'll';

      scene = ({
        hh: {
          title: '놀이동산',
          caption: '딸을 어깨에 태웠다. 풍선이 바람에 흔들린다.\n오늘은 — 평범한 토요일이었다.',
          tag: 'WARMTH'
        },
        hl: {
          title: '집에서 딸과 그림',
          caption: '좁은 거실. 햇빛만 따뜻하다.\n딸이 그림을 내민다 — "아빠 손이면 돼요."',
          tag: 'RESTRAINED'
        },
        lh: {
          title: '비싼 술집',
          caption: '양주, 비싼 안주. 누군가가 어깨를 두드린다.\n웃었지만 — 입꼬리만 움직였다.',
          tag: 'HOLLOW'
        },
        ll: {
          title: '어두운 방',
          caption: '리모콘으로 채널만 돌렸다. 채널이 빠르게 바뀐다.\n…그러다 멈춘 화면.',
          tag: 'MONOCHROME'
        }
      })[quad];
    }

    els.weekendShell.dataset.quad = quad;
    if (els.weekendDay) {
      const w = String(state.week).padStart(2, '0');
      els.weekendDay.textContent = `토 · WEEK ${w}`;
    }
    if (els.weekendCaption) els.weekendCaption.textContent = scene.caption;
    if (els.weekendTag) els.weekendTag.textContent = `${scene.title} · ${scene.tag}`;
    if (els.weekendStage) els.weekendStage.innerHTML = renderWeekendSVG(quad);
    if (quad === 'll') injectTvNews();

    // 컷씬 표시 후 약속 플래그 소진 — 다음 주는 다시 기본 4분면
    state.weekendPlan = null;

    openOverlay(els.weekendOverlay);
    Audio.playMusic('weekend');  // bg 음소거 + amusement_park 재생
    showTutorial('weekend');
    scheduleWeekendAutoJump();
  }

  // 주말 컷씬 8초간 보여주고 자동 월요일 점프 + 진행 바 애니메이션
  let weekendAutoTimer = null;
  function scheduleWeekendAutoJump() {
    const DURATION = 8000;
    if (weekendAutoTimer) clearTimeout(weekendAutoTimer);

    const fill = $('[data-we-progress-fill]');
    if (fill) {
      fill.style.transition = 'none';
      fill.style.width = '0%';
      void fill.offsetWidth;
      fill.style.transition = `width ${DURATION}ms linear`;
      fill.style.width = '100%';
    }

    weekendAutoTimer = setTimeout(() => {
      weekendAutoTimer = null;
      Audio.stopMusic('weekend');  // bg 복귀
      closeOverlay(els.weekendOverlay);
      // 토요일 컷씬 종료 → 일요일 가족 컷씬 → 월요일
      showFamilySunday(() => jumpToMonday());
    }, DURATION);
  }

  // ─────────────────────────────────────────────
  //  주말 시간 선택 — 3칸 시간을 어떻게 쓸지
  // ─────────────────────────────────────────────
  const WEEKEND_CHOICES = [
    {
      id: 'daughter', cost: 2, icon: '👧', label: '딸과 시간',
      desc: '동물원, 한강, 만화방 — 어디든 함께.',
      effect: { conscience: 5 },
      effectLabel: '양심 +5',
    },
    {
      id: 'wife', cost: 2, icon: '🏠', label: '아내와 시간',
      desc: '평일에 못한 얘기를 한다. 늦은 저녁 산책.',
      effect: { conscience: 3, credibility: 1 },
      effectLabel: '양심 +3, 신뢰도 +1',
    },
    {
      id: 'colleague', cost: 1, icon: '🍻', label: '동료 술자리',
      desc: '광화문 한 곳. 정보를 나눈다. 인맥이 생긴다.',
      effect: { credibility: 2, balance: -30 },
      effectLabel: '신뢰도 +2, 잔고 -30',
    },
    {
      id: 'overtime', cost: 1, icon: '💻', label: '사무실 출근',
      desc: '주말 근무. 잔고는 회복하지만 양심에 작은 빚.',
      effect: { balance: 20, conscience: -1 },
      effectLabel: '잔고 +20, 양심 -1',
    },
    {
      id: 'rest', cost: 1, icon: '🛏', label: '휴식',
      desc: '아무것도 안 한다. 다음 월요일 슬롯 +1.',
      special: 'extraSlot',
      effectLabel: '월요일 슬롯 +1',
    },
  ];

  let weekendSlotsRemaining = 3;
  let weekendOnCloseCb = null;

  function showWeekendChoice(onClose) {
    const overlay = $('#weekendChoiceOverlay');
    if (!overlay) { onClose && onClose(); return; }
    weekendSlotsRemaining = 3;
    state.weekendPicks = [];
    weekendOnCloseCb = onClose;
    renderWeekendChoice();
    openOverlay(overlay);
  }

  function renderWeekendChoice() {
    const remEl = $('[data-wc-remaining]');
    if (remEl) remEl.textContent = String(weekendSlotsRemaining);

    // 슬롯 표시 — 사용한 만큼 채워짐
    const slotDisplay = $('[data-wc-slots-display]');
    if (slotDisplay) {
      const used = 3 - weekendSlotsRemaining;
      slotDisplay.innerHTML = '';
      for (let i = 0; i < 3; i++) {
        const div = document.createElement('div');
        div.className = 'wc-slot ' + (i < used ? 'filled' : 'empty');
        slotDisplay.appendChild(div);
      }
    }

    // 선택지
    const choicesEl = $('[data-wc-choices]');
    if (choicesEl) {
      choicesEl.innerHTML = WEEKEND_CHOICES.map(c => {
        const tooExpensive = c.cost > weekendSlotsRemaining;
        return `
          <li class="wc-choice${tooExpensive ? ' disabled' : ''}" data-wc-choice="${c.id}">
            <div class="wc-choice-icon">${c.icon}</div>
            <div class="wc-choice-body">
              <div class="wc-choice-head">
                <span class="wc-choice-label">${escapeHTML(c.label)}</span>
                <span class="wc-choice-cost">${c.cost}칸</span>
              </div>
              <div class="wc-choice-desc">${escapeHTML(c.desc)}</div>
              <div class="wc-choice-effect">${escapeHTML(c.effectLabel)}</div>
            </div>
          </li>`;
      }).join('');
    }
  }

  document.addEventListener('click', (e) => {
    const li = e.target.closest('[data-wc-choice]');
    if (li && !li.classList.contains('disabled')) {
      const id = li.dataset.wcChoice;
      const choice = WEEKEND_CHOICES.find(c => c.id === id);
      if (!choice || choice.cost > weekendSlotsRemaining) return;

      weekendSlotsRemaining -= choice.cost;
      state.weekendPicks.push(id);

      if (choice.effect) applyGaugeDelta(choice.effect);
      if (choice.special === 'extraSlot') {
        state.mondayBonusSlots = (state.mondayBonusSlots || 0) + 1;
      }

      renderWeekendChoice();

      // 모든 슬롯 다 쓴 경우 자동 진행
      if (weekendSlotsRemaining === 0) {
        setTimeout(closeWeekendChoice, 600);
      }
      return;
    }
    const done = e.target.closest('[data-wc-done]');
    if (done) closeWeekendChoice();
  });

  function closeWeekendChoice() {
    const overlay = $('#weekendChoiceOverlay');
    if (overlay) closeOverlay(overlay);
    const cb = weekendOnCloseCb;
    weekendOnCloseCb = null;
    if (typeof cb === 'function') cb();
  }

  // ─────────────────────────────────────────────
  //  일요일 가족 컷씬 — 양심 5단계 별
  //  (주말 컷씬 종료 후 → 가족 풍경 → 월요일)
  // ─────────────────────────────────────────────
  const FAMILY_SUNDAY_SCENES = {
    excellent: {  // 양심 80+
      tier: 'excellent',
      title: '딸과 그림 그리는 오전',
      body: '딸이 옆에 앉아 그림을 그린다.\n아내가 머그잔에 커피를 내려 책상 위에 놓아주었다.\n\n"오늘 날씨 좋다. 점심 먹고 한강 갈래?"\n딸이 그림에서 고개를 들지 않은 채 끄덕였다.\n\n— 평범한 일요일이었다.',
      duration: 6500,
    },
    good: {  // 양심 60~80
      tier: 'good',
      title: '딸의 한 마디',
      body: '딸이 거실 소파에서 그림을 그리고 있었다.\n옆에 앉으니 잠깐 고개를 들었다가 다시 종이로 돌아갔다.\n\n"아빠, 다음 주에도 늦어?"\n\n그 한 마디에 답을 못 했다.\n부엌에서 아내가 설거지를 하고 있는 소리가 들렸다.',
      duration: 7500,
    },
    mid: {  // 양심 40~60
      tier: 'mid',
      title: '거실의 거리감',
      body: '딸이 거실에 혼자 앉아 폰을 보고 있었다.\n인사를 건넸지만 짧게 끄덕였을 뿐이었다.\n\n아내는 침실 문을 닫고 들어가 있었다.\n노크할까 망설이다 그만뒀다.\n\n식탁 위에 식어버린 토스트 한 장이 있었다.',
      duration: 7500,
    },
    bad: {  // 양심 20~40
      tier: 'bad',
      title: '닫힌 문',
      body: '거실에 혼자 앉아 있었다.\n부엌엔 식어버린 밥상.\n\n딸 방 문이 닫혀 있었다.\n노크했지만 답이 없었다.\n\n잠시 후 아내가 침실에서 나와 — 한 번 쳐다보지 않은 채 — 화장실로 들어갔다.',
      duration: 8000,
    },
    terrible: {  // 양심 <20
      tier: 'terrible',
      title: '빈 집',
      body: '집에 아무도 없었다.\n식탁 위에 메모 한 장이 놓여 있었다.\n\n"엄마랑 며칠 친정에 가 있을게."\n딸의 글씨였다.\n\n메모를 한참 들여다봤다.\n다음 줄은 없었다.',
      duration: 8500,
    },
  };

  function pickFamilyTier() {
    const c = state.gauges.conscience;
    if (c >= 80) return 'excellent';
    if (c >= 60) return 'good';
    if (c >= 40) return 'mid';
    if (c >= 20) return 'bad';
    return 'terrible';
  }

  let familySundayTimer = null;
  function showFamilySunday(onClose) {
    const overlay = $('#familySundayOverlay');
    if (!overlay) { onClose && onClose(); return; }

    const tier = pickFamilyTier();
    const scene = FAMILY_SUNDAY_SCENES[tier];
    if (!scene) { onClose && onClose(); return; }

    const setText = (sel, val) => { const el = $(sel); if (el) el.textContent = val || ''; };
    const shell = overlay.querySelector('.fs-shell');
    if (shell) shell.dataset.fsTier = tier;
    setText('[data-fs-key]',   `SUNDAY · 일요일 아침 · WEEK ${String(state.week).padStart(2, '0')}`);
    setText('[data-fs-title]', scene.title);
    setText('[data-fs-body]',  scene.body);

    // progress bar 채우기
    const fill = $('[data-fs-progress-fill]');
    if (fill) {
      fill.style.transition = 'none';
      fill.style.width = '0%';
      void fill.offsetWidth;
      fill.style.transition = `width ${scene.duration}ms linear`;
      fill.style.width = '100%';
    }

    if (familySundayTimer) clearTimeout(familySundayTimer);

    const close = () => {
      if (familySundayTimer) { clearTimeout(familySundayTimer); familySundayTimer = null; }
      closeOverlay(overlay);
      onClose && onClose();
    };

    familySundayTimer = setTimeout(close, scene.duration);
    overlay._fsClose = close;
    openOverlay(overlay);
  }

  // 건너뛰기 버튼
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-fs-skip]');
    if (!btn) return;
    const overlay = $('#familySundayOverlay');
    if (overlay && overlay._fsClose) overlay._fsClose();
  });

  function renderWeekendSVG(quad) {
    if (quad === 'hh') {
      // 놀이동산 — 회전목마, 풍선, 어깨 위 딸, 구름, 관람차
      return `
        <svg viewBox="0 0 600 360">
          <g filter="url(#wobble)" stroke="var(--line)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <!-- 해 -->
            <circle cx="500" cy="60" r="28" stroke-width="2"/>
            <line x1="500" y1="20" x2="500" y2="6"/>
            <line x1="540" y1="60" x2="556" y2="60"/>
            <line x1="528" y1="32" x2="540" y2="20"/>
            <line x1="472" y1="32" x2="460" y2="20"/>
            <!-- 구름 A (왼쪽) -->
            <g class="we-svg-cloud-a">
              <path d="M 80 70 Q 90 50 110 60 Q 130 50 140 70 Q 150 80 130 85 L 90 85 Q 70 80 80 70 Z" stroke-width="1.8"/>
            </g>
            <!-- 구름 B (오른쪽) -->
            <g class="we-svg-cloud-b">
              <path d="M 380 50 Q 395 30 420 42 Q 440 35 450 55 Q 460 70 435 70 L 395 70 Q 375 65 380 50 Z" stroke-width="1.8"/>
            </g>
            <!-- 멀리 있는 관람차 -->
            <g opacity="0.55">
              <circle cx="540" cy="240" r="60" stroke-width="2"/>
              <line x1="540" y1="180" x2="540" y2="300"/>
              <line x1="480" y1="240" x2="600" y2="240"/>
              <line x1="498" y1="198" x2="582" y2="282"/>
              <line x1="582" y1="198" x2="498" y2="282"/>
              <!-- 칸 -->
              <rect x="535" y="178" width="10" height="6" stroke-width="1.5"/>
              <rect x="495" y="237" width="10" height="6" stroke-width="1.5"/>
              <rect x="575" y="237" width="10" height="6" stroke-width="1.5"/>
              <rect x="535" y="296" width="10" height="6" stroke-width="1.5"/>
              <!-- 받침 -->
              <line x1="510" y1="300" x2="570" y2="300" stroke-width="2"/>
            </g>
            <!-- 회전목마 (왼쪽) -->
            <path d="M 80 220 L 80 160 L 200 160 L 200 220 Z"/>
            <line x1="60" y1="220" x2="220" y2="220"/>
            <line x1="100" y1="220" x2="100" y2="290"/>
            <line x1="180" y1="220" x2="180" y2="290"/>
            <path d="M 100 160 L 140 130 L 180 160" />
            <!-- 깃발 -->
            <line x1="140" y1="130" x2="140" y2="100"/>
            <g class="we-svg-flag">
              <path d="M 140 100 L 165 110 L 140 120" fill="var(--accent)" stroke="var(--accent)"/>
            </g>
            <!-- 사람 (아빠 + 딸 어깨) -->
            <g transform="translate(330, 150)">
              <!-- 아빠 -->
              <circle cx="0" cy="0" r="14" stroke-width="2.5"/>
              <line x1="0" y1="14" x2="0" y2="60"/>
              <line x1="-22" y1="38" x2="22" y2="38"/>
              <line x1="0" y1="60" x2="-14" y2="100"/>
              <line x1="0" y1="60" x2="14" y2="100"/>
              <!-- 딸 (어깨 위) -->
              <circle cx="0" cy="-30" r="9"/>
              <line x1="0" y1="-21" x2="0" y2="-2"/>
              <line x1="-12" y1="-12" x2="12" y2="-12"/>
              <!-- 풍선 (딸 손에) -->
              <line x1="14" y1="-10" x2="22" y2="-50"/>
              <g class="we-svg-balloon" style="transform-origin: 22px -10px;">
                <circle cx="22" cy="-58" r="10" stroke="var(--accent)" stroke-width="2.5" fill="var(--accent)"/>
                <path d="M 19 -49 L 22 -46 L 25 -49" stroke-width="1.5"/>
              </g>
            </g>
            <!-- 땅 -->
            <line x1="0" y1="290" x2="600" y2="290" stroke-width="2"/>
            <!-- 작은 풀 -->
            <path d="M 240 290 L 245 280 L 250 290" stroke-width="1.5"/>
            <path d="M 420 290 L 425 280 L 430 290" stroke-width="1.5"/>
            <path d="M 480 290 L 485 280 L 490 290" stroke-width="1.5"/>
            <!-- 흩날리는 꽃잎 (점) -->
            <circle cx="120" cy="100" r="1.5" fill="var(--accent)" opacity="0.5"/>
            <circle cx="280" cy="80" r="1.5" fill="var(--accent)" opacity="0.4"/>
            <circle cx="380" cy="120" r="1.5" fill="var(--accent)" opacity="0.5"/>
          </g>
        </svg>`;
    }

    if (quad === 'hl') {
      // 집에서 딸과 그림 — 창, 햇빛, 책상, 두 사람, 화분
      return `
        <svg viewBox="0 0 600 360">
          <g filter="url(#wobble)" stroke="var(--line)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <!-- 창문 -->
            <rect x="60" y="40" width="120" height="100" stroke-width="3"/>
            <line x1="120" y1="40" x2="120" y2="140" stroke-width="1.5"/>
            <line x1="60" y1="90" x2="180" y2="90" stroke-width="1.5"/>
            <!-- 창문 너머 작은 나무 -->
            <line x1="78" y1="120" x2="78" y2="138" stroke-width="1.5" opacity="0.5"/>
            <circle cx="78" cy="110" r="9" stroke-width="1.5" opacity="0.5"/>
            <!-- 햇빛 — pulse -->
            <g class="we-svg-sunbeam">
              <line x1="180" y1="90" x2="240" y2="160" stroke-width="1.5" stroke-dasharray="4 3"/>
              <line x1="180" y1="120" x2="260" y2="180" stroke-width="1.5" stroke-dasharray="4 3"/>
              <line x1="180" y1="105" x2="250" y2="170" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
            </g>
            <!-- 천장 등 -->
            <line x1="380" y1="0" x2="380" y2="40" stroke-width="2" opacity="0.6"/>
            <circle cx="380" cy="48" r="9" stroke-width="2" opacity="0.6"/>
            <!-- 책상 -->
            <line x1="200" y1="240" x2="500" y2="240" stroke-width="3"/>
            <line x1="220" y1="240" x2="220" y2="320"/>
            <line x1="480" y1="240" x2="480" y2="320"/>
            <!-- 도화지 -->
            <rect x="280" y="200" width="120" height="40" stroke-width="2"/>
            <!-- 그림 (해+사람) -->
            <circle cx="305" cy="220" r="6" stroke-width="1.5"/>
            <line x1="305" y1="212" x2="305" y2="208" stroke-width="1"/>
            <line x1="312" y1="220" x2="316" y2="220" stroke-width="1"/>
            <circle cx="340" cy="222" r="4" fill="var(--line)"/>
            <line x1="340" y1="226" x2="340" y2="234"/>
            <circle cx="370" cy="222" r="3" fill="var(--line)"/>
            <line x1="370" y1="225" x2="370" y2="234"/>
            <!-- 작은 하트 -->
            <path d="M 388 218 Q 392 214 396 218 Q 392 222 388 218" stroke-width="1.2" stroke="var(--accent)" fill="var(--accent)"/>
            <!-- 두 사람 (옆에 앉음) -->
            <g transform="translate(220, 130)">
              <!-- 아빠 -->
              <circle cx="0" cy="0" r="14" stroke-width="2.5"/>
              <line x1="0" y1="14" x2="0" y2="80"/>
              <line x1="-20" y1="36" x2="20" y2="36"/>
              <line x1="20" y1="36" x2="40" y2="60"/>
            </g>
            <g transform="translate(440, 160)">
              <!-- 딸 -->
              <circle cx="0" cy="0" r="10"/>
              <line x1="0" y1="10" x2="0" y2="50"/>
              <line x1="-14" y1="28" x2="14" y2="28"/>
              <line x1="-14" y1="28" x2="-30" y2="44"/>
              <!-- 머리 묶음 -->
              <line x1="-7" y1="-9" x2="-12" y2="-14" stroke-width="1.5"/>
            </g>
            <!-- 크레용 한두개 -->
            <line x1="310" y1="245" x2="335" y2="245" stroke-width="3" stroke="var(--accent)"/>
            <line x1="350" y1="248" x2="370" y2="248" stroke-width="3"/>
            <line x1="385" y1="246" x2="400" y2="246" stroke-width="3" opacity="0.6"/>
            <!-- 화분 (왼쪽 바닥) -->
            <g transform="translate(80, 280)">
              <path d="M -14 0 L -10 30 L 10 30 L 14 0 Z" stroke-width="2"/>
              <line x1="0" y1="0" x2="0" y2="-15" stroke-width="2"/>
              <path d="M 0 -15 Q -8 -22 -10 -10" stroke-width="1.5"/>
              <path d="M 0 -15 Q 8 -22 10 -10" stroke-width="1.5"/>
              <path d="M 0 -10 Q -5 -16 -3 -8" stroke-width="1.5"/>
            </g>
            <!-- 책상 다리 그림자 -->
            <line x1="220" y1="320" x2="280" y2="320" stroke-width="1.5" opacity="0.3"/>
            <line x1="480" y1="320" x2="540" y2="320" stroke-width="1.5" opacity="0.3"/>
          </g>
        </svg>`;
    }

    if (quad === 'lh') {
      // 비싼 술집 — 라운지 조명, 바, 잔, 인물, 술병, 담배 연기
      return `
        <svg viewBox="0 0 600 360">
          <g filter="url(#wobble)" stroke="var(--line)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <!-- 라운지 조명 (천장) — 깜빡임 -->
            <line x1="100" y1="0" x2="100" y2="50" stroke-width="2"/>
            <g class="we-svg-glow">
              <circle cx="100" cy="56" r="10" stroke-width="2" fill="var(--accent)" stroke="var(--accent)" opacity="0.7"/>
            </g>
            <line x1="300" y1="0" x2="300" y2="40" stroke-width="2"/>
            <circle cx="300" cy="46" r="10" stroke-width="2" opacity="0.5"/>
            <line x1="500" y1="0" x2="500" y2="50" stroke-width="2"/>
            <g class="we-svg-glow" style="animation-delay: 1.5s;">
              <circle cx="500" cy="56" r="10" stroke-width="2" fill="var(--accent)" stroke="var(--accent)" opacity="0.7"/>
            </g>

            <!-- 네온 사인 (멀리, 흐릿하게) -->
            <text x="60" y="100" font-family="Pretendard" font-size="14" letter-spacing="0.2em" fill="var(--accent)" opacity="0.45" font-weight="700">BAR</text>

            <!-- 바 -->
            <line x1="0" y1="240" x2="600" y2="240" stroke-width="3"/>
            <line x1="40" y1="240" x2="40" y2="290"/>
            <line x1="560" y1="240" x2="560" y2="290"/>
            <!-- 바 위 술병들 -->
            <g opacity="0.7">
              <rect x="80" y="200" width="14" height="40" stroke-width="2"/>
              <line x1="84" y1="200" x2="90" y2="200" stroke-width="2"/>
              <line x1="84" y1="194" x2="90" y2="194" stroke-width="2"/>
              <rect x="106" y="195" width="14" height="45" stroke-width="2"/>
              <line x1="110" y1="195" x2="116" y2="195" stroke-width="2"/>
              <line x1="110" y1="188" x2="116" y2="188" stroke-width="2"/>
              <rect x="480" y="205" width="14" height="35" stroke-width="2"/>
              <line x1="484" y1="205" x2="490" y2="205" stroke-width="2"/>
              <line x1="484" y1="200" x2="490" y2="200" stroke-width="2"/>
            </g>

            <!-- 잔 (한가운데) -->
            <path d="M 270 200 L 282 240 L 318 240 L 330 200 Z" stroke-width="2.5"/>
            <line x1="300" y1="240" x2="300" y2="280"/>
            <line x1="282" y1="280" x2="318" y2="280"/>
            <!-- 잔 안 액체 -->
            <path d="M 280 220 L 290 240 L 310 240 L 320 220" fill="var(--accent)" stroke="var(--accent)" opacity="0.5"/>

            <!-- 담배 (잔 옆) + 연기 -->
            <line x1="340" y1="234" x2="370" y2="226" stroke-width="2.5"/>
            <circle cx="370" cy="226" r="2" fill="var(--accent)" stroke="var(--accent)"/>
            <g class="we-svg-smoke">
              <path d="M 372 220 Q 376 210 372 200 Q 368 192 374 184" stroke-width="1.2" opacity="0.5"/>
            </g>
            <g class="we-svg-smoke" style="animation-delay: 2s;">
              <path d="M 376 218 Q 380 212 376 204" stroke-width="1.0" opacity="0.4"/>
            </g>

            <!-- 인물 (정면 클로즈업, 피폐한) -->
            <g transform="translate(300, 130)">
              <circle cx="0" cy="0" r="32" stroke-width="2.5"/>
              <!-- 눈 -->
              <line x1="-12" y1="-2" x2="-6" y2="-2" stroke-width="2"/>
              <line x1="6"  y1="-2" x2="12" y2="-2" stroke-width="2"/>
              <!-- 눈 밑 -->
              <line x1="-11" y1="3" x2="-7" y2="5" stroke-width="1" opacity="0.6"/>
              <line x1="7" y1="3" x2="11" y2="5" stroke-width="1" opacity="0.6"/>
              <!-- 입꼬리만 살짝 -->
              <path d="M -10 14 Q 0 12 10 14" stroke-width="1.5"/>
            </g>
            <!-- 다른 사람 그림자 (멀리) -->
            <g transform="translate(120, 150)" opacity="0.4">
              <circle cx="0" cy="0" r="14" stroke-width="2"/>
              <line x1="0" y1="14" x2="0" y2="70"/>
              <line x1="-18" y1="36" x2="18" y2="36"/>
            </g>
            <g transform="translate(480, 150)" opacity="0.4">
              <circle cx="0" cy="0" r="14" stroke-width="2"/>
              <line x1="0" y1="14" x2="0" y2="70"/>
              <line x1="-18" y1="36" x2="18" y2="36"/>
            </g>
            <!-- 미세 음악 노트 (멀리) -->
            <g opacity="0.4">
              <circle cx="540" cy="100" r="3" fill="var(--accent)" stroke="var(--accent)"/>
              <line x1="543" y1="100" x2="543" y2="86" stroke-width="1.5" stroke="var(--accent)"/>
            </g>
          </g>
        </svg>`;
    }

    if (quad === 'friendMeat') {
      // 친구들과 고깃집 — 불판, 연기, 술잔, 셋이 둘러앉음, 매달린 등
      return `
        <svg viewBox="0 0 600 360">
          <g filter="url(#wobble)" stroke="var(--line)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <!-- 매달린 등 (천장 → 식탁 위) -->
            <line x1="300" y1="0" x2="300" y2="40" stroke-width="2" opacity="0.7"/>
            <g class="we-svg-glow">
              <circle cx="300" cy="48" r="10" stroke-width="2" fill="var(--accent)" stroke="var(--accent)" opacity="0.7"/>
              <path d="M 290 56 L 310 56 L 305 64 L 295 64 Z" stroke-width="1.5" stroke="var(--accent)" opacity="0.5"/>
            </g>

            <!-- 매달린 등 옆 작은 등 (왼쪽) -->
            <line x1="120" y1="0" x2="120" y2="34" stroke-width="2" opacity="0.5"/>
            <circle cx="120" cy="40" r="7" stroke-width="2" opacity="0.6"/>

            <!-- 매달린 등 옆 작은 등 (오른쪽) -->
            <line x1="480" y1="0" x2="480" y2="34" stroke-width="2" opacity="0.5"/>
            <circle cx="480" cy="40" r="7" stroke-width="2" opacity="0.6"/>

            <!-- 가게 간판 (멀리, 흐릿) -->
            <text x="40" y="90" font-family="Pretendard" font-size="14" letter-spacing="0.18em" fill="var(--accent)" opacity="0.45" font-weight="700">BBQ</text>

            <!-- 식탁 (둥근 직사각형) -->
            <path d="M 110 250 Q 110 230 140 230 L 460 230 Q 490 230 490 250 L 490 280 Q 490 300 460 300 L 140 300 Q 110 300 110 280 Z" stroke-width="3"/>

            <!-- 불판 (식탁 중앙) -->
            <ellipse cx="300" cy="262" rx="62" ry="14" stroke-width="2.5"/>
            <ellipse cx="300" cy="258" rx="58" ry="11" stroke-width="1.5" opacity="0.6"/>
            <!-- 고기 패턴 -->
            <g opacity="0.7">
              <path d="M 270 256 Q 280 252 290 256 Q 285 262 275 262 Z" stroke-width="1.5" stroke="var(--accent)" fill="var(--accent)" opacity="0.4"/>
              <path d="M 305 254 Q 318 250 328 256 Q 320 262 308 262 Z" stroke-width="1.5" stroke="var(--accent)" fill="var(--accent)" opacity="0.5"/>
              <path d="M 285 264 Q 295 260 305 264 Q 300 270 290 270 Z" stroke-width="1.5"/>
            </g>

            <!-- 연기 (불판 위 → 천장으로) -->
            <g class="we-svg-smoke">
              <path d="M 285 245 Q 280 220 290 200 Q 296 180 286 160 Q 280 140 290 120" stroke-width="1.4" opacity="0.5"/>
            </g>
            <g class="we-svg-smoke" style="animation-delay: 0.8s;">
              <path d="M 305 245 Q 312 222 304 202 Q 300 184 310 168" stroke-width="1.2" opacity="0.4"/>
            </g>
            <g class="we-svg-smoke" style="animation-delay: 1.6s;">
              <path d="M 320 244 Q 326 226 320 208" stroke-width="1.0" opacity="0.35"/>
            </g>

            <!-- 잔 셋 (식탁 위 가장자리) -->
            <g>
              <!-- 왼쪽 잔 -->
              <rect x="170" y="240" width="14" height="22" stroke-width="2"/>
              <path d="M 172 246 L 182 246 L 182 254 L 172 254 Z" fill="var(--accent)" stroke="none" opacity="0.5"/>
              <!-- 오른쪽 잔 -->
              <rect x="416" y="240" width="14" height="22" stroke-width="2"/>
              <path d="M 418 246 L 428 246 L 428 254 L 418 254 Z" fill="var(--accent)" stroke="none" opacity="0.5"/>
              <!-- 중간(앞쪽) 잔 — 살짝 기울어진 것처럼 -->
              <rect x="294" y="288" width="12" height="18" stroke-width="2"/>
            </g>

            <!-- 반찬 그릇 (작은 원 두 개) -->
            <ellipse cx="200" cy="280" rx="18" ry="6" stroke-width="1.8" opacity="0.7"/>
            <ellipse cx="400" cy="280" rx="18" ry="6" stroke-width="1.8" opacity="0.7"/>
            <ellipse cx="240" cy="240" rx="14" ry="5" stroke-width="1.5" opacity="0.6"/>
            <ellipse cx="360" cy="240" rx="14" ry="5" stroke-width="1.5" opacity="0.6"/>

            <!-- 집게 (불판 옆) -->
            <line x1="356" y1="252" x2="392" y2="240" stroke-width="2"/>
            <line x1="356" y1="262" x2="392" y2="248" stroke-width="2"/>

            <!-- 인물 1 — 왼쪽 친구 (옆모습) -->
            <g transform="translate(140, 150)">
              <circle cx="0" cy="0" r="14" stroke-width="2.5"/>
              <line x1="0" y1="14" x2="0" y2="70"/>
              <!-- 잔 든 손 (식탁 쪽) -->
              <line x1="0" y1="36" x2="34" y2="46" stroke-width="2"/>
              <!-- 다른 손 -->
              <line x1="0" y1="36" x2="-22" y2="46" stroke-width="2"/>
              <!-- 입 -->
              <path d="M -5 5 Q 0 8 5 5" stroke-width="1.5"/>
            </g>

            <!-- 인물 2 — 가운데 (정면, 주인공) -->
            <g transform="translate(300, 150)">
              <circle cx="0" cy="0" r="15" stroke-width="2.5"/>
              <!-- 눈 -->
              <line x1="-8" y1="-2" x2="-4" y2="-2" stroke-width="1.8"/>
              <line x1="4" y1="-2" x2="8" y2="-2" stroke-width="1.8"/>
              <!-- 살짝 웃는 입 -->
              <path d="M -7 6 Q 0 10 7 6" stroke-width="1.5"/>
              <line x1="0" y1="15" x2="0" y2="68"/>
              <!-- 양 팔 (식탁으로) -->
              <line x1="0" y1="32" x2="-26" y2="44" stroke-width="2"/>
              <line x1="0" y1="32" x2="26" y2="44" stroke-width="2"/>
            </g>

            <!-- 인물 3 — 오른쪽 친구 (옆모습) -->
            <g transform="translate(460, 150)">
              <circle cx="0" cy="0" r="14" stroke-width="2.5"/>
              <line x1="0" y1="14" x2="0" y2="70"/>
              <!-- 젓가락/집게 든 손 -->
              <line x1="0" y1="36" x2="-32" y2="44" stroke-width="2"/>
              <line x1="-32" y1="44" x2="-44" y2="42" stroke-width="1.5"/>
              <line x1="-32" y1="46" x2="-44" y2="50" stroke-width="1.5"/>
              <!-- 다른 손 -->
              <line x1="0" y1="36" x2="22" y2="46" stroke-width="2"/>
              <!-- 입 -->
              <path d="M -5 5 Q 0 8 5 5" stroke-width="1.5"/>
            </g>

            <!-- 작은 음표 (분위기) -->
            <g opacity="0.4">
              <circle cx="540" cy="80" r="3" fill="var(--accent)" stroke="var(--accent)"/>
              <line x1="543" y1="80" x2="543" y2="66" stroke-width="1.5" stroke="var(--accent)"/>
              <circle cx="60" cy="110" r="2.5" fill="var(--accent)" stroke="var(--accent)"/>
              <line x1="62.5" y1="110" x2="62.5" y2="98" stroke-width="1.5" stroke="var(--accent)"/>
            </g>

            <!-- 바닥 라인 -->
            <line x1="0" y1="320" x2="600" y2="320" stroke-width="1.5" opacity="0.4"/>
          </g>
        </svg>`;
    }

    // ll — 어두운 방 + TV
    return `
      <svg viewBox="0 0 600 360">
        <g filter="url(#wobble)" stroke="var(--line)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <!-- 방 윤곽 -->
          <rect x="20" y="30" width="560" height="280" stroke-width="2"/>

          <!-- 천장 환풍구 (왼쪽 위) — 매우 느린 on/off -->
          <g class="we-svg-vent">
            <rect x="380" y="30" width="60" height="8" stroke-width="1.5" fill="var(--accent)" stroke="var(--accent)" opacity="0.5"/>
            <line x1="388" y1="38" x2="388" y2="48" stroke-width="1" stroke-dasharray="2 2" opacity="0.4"/>
            <line x1="402" y1="38" x2="402" y2="50" stroke-width="1" stroke-dasharray="2 2" opacity="0.4"/>
            <line x1="416" y1="38" x2="416" y2="48" stroke-width="1" stroke-dasharray="2 2" opacity="0.4"/>
            <line x1="430" y1="38" x2="430" y2="46" stroke-width="1" stroke-dasharray="2 2" opacity="0.3"/>
          </g>

          <!-- 창문 블라인드 (오른쪽 위) — 가느다란 빛줄기 -->
          <g opacity="0.35">
            <rect x="470" y="50" width="90" height="80" stroke-width="1.5"/>
            <line x1="470" y1="64" x2="560" y2="64" stroke-width="1"/>
            <line x1="470" y1="78" x2="560" y2="78" stroke-width="1"/>
            <line x1="470" y1="92" x2="560" y2="92" stroke-width="1"/>
            <line x1="470" y1="106" x2="560" y2="106" stroke-width="1"/>
            <line x1="470" y1="120" x2="560" y2="120" stroke-width="1"/>
          </g>

          <!-- TV (왼쪽) -->
          <rect x="60" y="100" width="180" height="130" stroke-width="3"/>
          <line x1="80" y1="120" x2="220" y2="120" stroke-width="1" opacity="0.4"/>
          <line x1="80" y1="135" x2="200" y2="135" stroke-width="1" opacity="0.4"/>
          <line x1="80" y1="150" x2="220" y2="150" stroke-width="1" opacity="0.4"/>
          <line x1="80" y1="170" x2="160" y2="170" stroke-width="1" opacity="0.4"/>
          <line x1="80" y1="200" x2="220" y2="200" stroke-width="1" opacity="0.4"/>
          <!-- TV 화면 빛 스캔라인 (글리치와 별개로 미묘하게) -->
          <line x1="60" y1="155" x2="240" y2="155" stroke-width="0.8" stroke="var(--accent)" opacity="0.25"/>
          <line x1="60" y1="183" x2="240" y2="183" stroke-width="0.8" stroke="var(--accent)" opacity="0.18"/>
          <text class="we-svg-tv-glitch" x="150" y="210" text-anchor="middle" font-family="Pretendard" font-size="8" fill="var(--accent)" letter-spacing="1.5" font-weight="700" data-tv-news>○○ 카페 폐업</text>
          <!-- TV 받침 -->
          <line x1="120" y1="230" x2="180" y2="230"/>
          <line x1="100" y1="245" x2="200" y2="245"/>
          <!-- TV 빛이 바닥에 떨어지는 그림자 -->
          <path d="M 60 245 L 240 245 L 280 290 L 30 290 Z" fill="var(--accent)" stroke="none" opacity="0.06"/>

          <!-- 소파 -->
          <path d="M 280 240 L 280 200 L 540 200 L 540 240 L 540 280 L 280 280 Z" stroke-width="2.5"/>
          <line x1="280" y1="240" x2="540" y2="240"/>
          <line x1="320" y1="200" x2="320" y2="240"/>
          <line x1="500" y1="200" x2="500" y2="240"/>
          <!-- 구겨진 담요 (소파 끝) -->
          <path d="M 500 240 Q 510 248 520 240 Q 530 248 540 240" stroke-width="1.5" opacity="0.6"/>
          <path d="M 500 250 Q 515 255 530 250" stroke-width="1.2" opacity="0.4"/>

          <!-- 사람 (소파에 누워) -->
          <g transform="translate(380, 200)">
            <ellipse cx="0" cy="0" rx="22" ry="18" stroke-width="2.5"/>
            <!-- 감은 눈 -->
            <path d="M -10 -2 Q -7 -4 -4 -2"/>
            <path d="M 4 -2 Q 7 -4 10 -2"/>
            <line x1="-6" y1="14" x2="6" y2="14" stroke-width="1.5"/>
            <!-- 몸 (옆으로) -->
            <line x1="22" y1="0" x2="120" y2="20"/>
            <!-- 팔 늘어뜨림 -->
            <line x1="0" y1="14" x2="-12" y2="36" stroke-width="2"/>
          </g>

          <!-- 빈 술병들 (바닥 — 어수선하게) -->
          <g opacity="0.55">
            <!-- 누운 병 1 -->
            <rect x="260" y="296" width="36" height="9" stroke-width="1.8" transform="rotate(-8 278 300)"/>
            <line x1="260" y1="300" x2="252" y2="300" stroke-width="1.8" transform="rotate(-8 278 300)"/>
            <!-- 누운 병 2 -->
            <rect x="320" y="298" width="32" height="8" stroke-width="1.8" transform="rotate(12 336 302)"/>
            <line x1="350" y1="302" x2="358" y2="302" stroke-width="1.8" transform="rotate(12 336 302)"/>
            <!-- 세워진 병 (소파 옆) -->
            <rect x="556" y="262" width="10" height="28" stroke-width="1.8"/>
            <line x1="558" y1="262" x2="564" y2="262" stroke-width="1.8"/>
            <line x1="558" y1="256" x2="564" y2="256" stroke-width="1.8"/>
          </g>

          <!-- 재떨이 + 쓰러진 담배 -->
          <g opacity="0.7">
            <ellipse cx="270" cy="218" rx="14" ry="4" stroke-width="1.5"/>
            <line x1="262" y1="216" x2="276" y2="212" stroke-width="1.5"/>
            <circle cx="276" cy="212" r="1.5" fill="var(--accent)" stroke="var(--accent)"/>
          </g>
          <!-- 재떨이에서 올라가는 가는 연기 -->
          <g class="we-svg-smoke" style="animation-delay: 1.2s;">
            <path d="M 276 208 Q 280 200 276 192 Q 272 184 278 176" stroke-width="1.0" opacity="0.35"/>
          </g>

          <!-- 핸드폰 (바닥, 화면이 켜진 듯한 미세한 빛) -->
          <rect x="430" y="298" width="22" height="10" stroke-width="1.5" opacity="0.7"/>
          <rect x="432" y="300" width="18" height="6" fill="var(--accent)" stroke="none" opacity="0.45"/>

          <!-- 리모콘 (바닥) -->
          <rect x="220" y="290" width="22" height="10" stroke-width="2"/>
          <circle cx="226" cy="295" r="1.5" fill="var(--line)"/>
          <circle cx="232" cy="295" r="1.5" fill="var(--line)"/>
          <circle cx="238" cy="295" r="1.5" fill="var(--line)"/>

          <!-- 미세한 먼지 입자 (TV 빛 속) -->
          <circle cx="150" cy="260" r="1" fill="var(--line)" opacity="0.3"/>
          <circle cx="200" cy="275" r="0.8" fill="var(--line)" opacity="0.25"/>
          <circle cx="100" cy="270" r="1" fill="var(--line)" opacity="0.3"/>
          <circle cx="170" cy="280" r="0.8" fill="var(--line)" opacity="0.2"/>
        </g>
      </svg>`;
  }

  // 발행한 자극 기사가 있으면 D 컷씬 TV 텍스트 변경
  function injectTvNews() {
    const tvText = els.weekendStage?.querySelector('[data-tv-news]');
    if (!tvText) return;

    // 가장 최근 자극 발행 (fakeSlotCount > 0) 의 사건 → 후폭풍 단신
    const fakeArticles = state.publishedArticles.filter(a => a.fakeSlotCount > 0);
    if (fakeArticles.length === 0) return;

    const recent = fakeArticles[fakeArticles.length - 1];
    const event = getEvent(recent.eventId);
    if (!event) return;

    const conseq = event.consequenceWhenFake || '';
    // 짧은 헤드라인만 추출 (마침표 또는 첫 문장)
    const headline = conseq.split('.')[0]?.trim() || event.title + ' 후폭풍';
    tvText.textContent = headline.length > 30 ? headline.slice(0, 28) + '…' : headline;
  }

  // ─────────────────────────────────────────────
  //  Exposure queue (발각 시간차 시스템)
  // ─────────────────────────────────────────────
  function queueExposure(info) {
    // delayDistribution: nextMon 0.30 / nextTue 0.40 / nextWed 0.20 / later 0.10
    // 발행은 금요일(dayOfWeek=5)이라 delay = 다음 주 요일까지 일수
    const roll = Math.random();
    let delay;
    if      (roll < 0.30) delay = 3; // 금→다음주월
    else if (roll < 0.70) delay = 4; // 금→다음주화
    else if (roll < 0.90) delay = 5; // 금→다음주수
    else                  delay = 7; // 그 후
    state.exposureQueue.push({
      ...info,
      publishedDay: state.day,
      triggerDay:   state.day + delay,
    });
  }

  // ─────────────────────────────────────────────
  //  독자 댓글 스트림 — 기사 발행 직후 즉시 피드백
  // ─────────────────────────────────────────────
  const COMMENT_POOLS = {
    clean: [
      '취재가 꼼꼼하네요',
      '이런 보도 더 많이 ㅎ',
      '팩트체크 깔끔합니다',
      '기자님 응원해요',
      '공정한 시각이라 좋아요',
      '객관적이라 신뢰가 가요',
      '독자 됐습니다',
      '처음으로 끝까지 읽음',
      '다른 매체랑 톤이 달라요',
      '조용히 응원합니다',
      '이게 진짜 저널리즘이지',
      '핵심을 짚었네요',
      '지엽적이지 않고 좋네요',
      '저도 이 사건 관심 많았는데',
      '취재원 보호도 신경 쓴 듯',
    ],
    mild: [
      '음… 좀 자극적인 듯',
      '내용은 좋은데 제목이 좀',
      '사실관계 한 번 더 확인 부탁',
      '관심 끄는 데는 성공이네',
      '팔로우는 일단 해둘게요',
      '어딘가 미묘하게 걸리는 부분',
      '흠… 어디까지가 사실인지',
      '취재 노력은 보이는데',
      '끝까지 읽긴 했는데 뭔가',
      '전반은 OK 후반이 좀',
      '제목 톤만 좀 낮추면 좋겠어요',
      '관점은 좋은데 조심스러움',
    ],
    moderate: [
      '출처 좀 확실히 해주세요',
      '본문은 별 거 없네',
      '헤드라인만 자극적',
      '이거 광고 받은 건가',
      '공감하기 어려움',
      '당사자 측 입장도 들어보셨나요',
      '이런 보도 좀 자제 부탁',
      '기자가 너무 멀리 갔네',
      '취지는 알겠는데 방법이…',
      '확실한 증거 없이 단정하시네',
      '댓글창부터 좀 정리해주세요',
      '팩트보다 분위기로 쓰셨네',
    ],
    fake: [
      'ㅋㅋㅋ 이거 진짜냐',
      '또 자극적인 제목',
      'click bait의 정석',
      '이런 매체 신뢰 안 함',
      '기자 누구임?',
      '구독 취소합니다',
      '당사자 측 반박 떴음',
      '법적 대응 검토 중이라네요',
      '거짓말 한 번 더?',
      '이런 보도가 사람을 죽인다',
      '당장 정정 보도 부탁',
      '○○씨 응원합니다 ㅠㅠ',
      '기자 신상도 공개해주세요',
      '이 매체 폐쇄해야',
      '안 본 눈 삽니다',
    ],
  };

  const COMMENT_AUTHORS = [
    'ㅇㅇ', 'reader_42', '익명1', '독자_K', 'jh_92', '뚜뚜', 'kim_seoul',
    '익명2', 'qwerty', '관심독자', 'park_oo', '댓글러', 'silent_reader',
    'ㅠㅠ', 'sun_42', '응원합니다', 'oo주민', '구독자', 'check_again', '___',
  ];

  function pickCommentTier(article, exposureScheduled) {
    if (exposureScheduled) return 'fake';   // 발각 예정 → 부정적 댓글 강세
    const fc = article.fakeSlotCount || 0;
    if (fc === 0) return 'clean';
    if (fc === 1) return 'mild';
    if (fc === 2) return 'moderate';
    return 'fake';
  }

  function showCommentStream(article, opts, onClose) {
    const overlay = $('#commentStreamOverlay');
    const list = $('[data-comment-list]');
    if (!overlay || !list) { onClose && onClose(); return; }

    const tier = pickCommentTier(article, opts?.exposureScheduled);
    const pool = COMMENT_POOLS[tier].slice();
    // shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const count = 5 + Math.floor(Math.random() * 3);  // 5~7
    const selected = pool.slice(0, count);

    // 헤더 메타 — 조회수·자극성 요약
    const metaEl = $('[data-comment-meta]');
    if (metaEl) {
      const tierLabel = ({ clean: '정직 보도', mild: '약한 자극', moderate: '강한 자극', fake: '날조 의혹' })[tier] || '';
      metaEl.textContent = `${formatViews(article.earnedViews || 0)} 조회 · ${tierLabel}`;
    }

    list.innerHTML = '';
    const closeBtn = $('[data-comment-close]');
    const closeLabel = $('.cs-close-label');
    if (closeBtn) closeBtn.disabled = true;
    if (closeLabel) closeLabel.textContent = '잠시 기다려…';

    selected.forEach((text, idx) => {
      setTimeout(() => {
        const li = document.createElement('li');
        li.className = 'comment-item tier-' + tier;
        const author = COMMENT_AUTHORS[Math.floor(Math.random() * COMMENT_AUTHORS.length)];
        const minsAgo = idx === 0 ? '방금' : `${idx}분 전`;
        li.innerHTML = `
          <span class="comment-author">${escapeHTML(author)}</span>
          <span class="comment-text">${escapeHTML(text)}</span>
          <span class="comment-meta">${escapeHTML(minsAgo)}</span>`;
        list.appendChild(li);
        list.scrollTop = list.scrollHeight;
      }, 600 + idx * 950);
    });

    // 모든 댓글 표시 후 닫기 버튼 활성화
    setTimeout(() => {
      if (closeBtn) closeBtn.disabled = false;
      if (closeLabel) closeLabel.textContent = '다음으로';
    }, 600 + count * 950 + 300);

    // 콜백 등록 — 닫기 클릭 시 호출
    overlay._csOnClose = onClose;
    openOverlay(overlay);
  }

  // 댓글 스트림 닫기 핸들러
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-comment-close]');
    if (!btn || btn.disabled) return;
    const overlay = $('#commentStreamOverlay');
    if (!overlay) return;
    const cb = overlay._csOnClose;
    overlay._csOnClose = null;
    closeOverlay(overlay);
    if (typeof cb === 'function') cb();
  });

  // ─────────────────────────────────────────────
  //  과거 보도의 망령 — 가짜 발행 후 시간 차 후폭풍
  // ─────────────────────────────────────────────
  // 피해자 유형별 후폭풍 escalation. 가짜 발행 → +5일 약간 / +10일 심각
  const VICTIM_ESCALATIONS = {
    v_idol: [
      { delay: 5, severity: 'low',  source: '연예 단신', head: '○○ 측 정정 요청',
        text: '소속사가 우리 매체에 대한 법적 검토를 시사. 양측 모두 부인 입장.' },
      { delay: 10, severity: 'high', source: '연예 단신', head: '○○ 활동 잠정 중단',
        text: '예정된 화보·인터뷰 줄줄이 취소. 팬덤은 분열.' },
    ],
    v_cafe_owner: [
      { delay: 5, severity: 'low',  source: '동네 단신', head: '○○ 카페 손님 급감',
        text: '지난 한 주 손님이 평소의 절반 이하. 사장은 매일 카운터를 지킨다.' },
      { delay: 10, severity: 'high', source: '신문 단신', head: '○○ 카페 폐업 공지',
        text: '사장 김모(57)씨, "한 달간 손님이 0이었다." 자택으로 돌아갔다.' },
    ],
    v_student: [
      { delay: 5, severity: 'low',  source: '교육 단신', head: '지목 학생 결석',
        text: '학교 측 "학생이 등교를 거부하고 있다"고 발표. 학부모 항의 폭주.' },
      { delay: 10, severity: 'high', source: '사회면', head: '학생 전학·자퇴 결정',
        text: '부모는 "인생이 끝났다"고 인터뷰. 자해 우려도 제기됐다.' },
    ],
    v_politician: [
      { delay: 5, severity: 'low',  source: '정치 단신', head: '의원실 법적 대응 시사',
        text: '보좌관, 우리 매체에 대한 명예훼손 소송 검토 중이라고 발표.' },
      { delay: 10, severity: 'high', source: '정치 단신', head: '의원 사퇴',
        text: '본인은 끝까지 사실무근 주장. 그러나 당내 압박으로 사퇴 결정.' },
    ],
    v_leaker: [
      { delay: 5, severity: 'low',  source: '사회 단신', head: '내부 고발자 추적',
        text: '회사 측이 발신자 신원을 추적 중. 출입처에서 사라졌다.' },
      { delay: 10, severity: 'high', source: '사회 단신', head: '제보자 행방 불명',
        text: '동료들 "그가 무서워했어요"고 전했다. 가족도 연락 두절.' },
    ],
    v_apt_resident: [
      { delay: 5, severity: 'low',  source: '경제 단신', head: '입주민 집값 하락',
        text: '단지 시세 평균 8% 떨어짐. 이미 두 가구가 매물로 내놓았다.' },
      { delay: 10, severity: 'high', source: '경제 단신', head: '경매 처분 두 가구',
        text: '대출을 갚지 못해 경매로. "하루아침에 빚더미." 한 입주민이 말했다.' },
    ],
  };
  const DEFAULT_ESCALATION = [
    { delay: 7, severity: 'low', source: '신문 단신', head: '관련 보도 후폭풍',
      text: '기사 이후 관계자들의 일상이 흔들리기 시작했다.' },
  ];

  function scheduleGhostConsequences(article) {
    if (!article || !article.fakeSlotCount || article.fakeSlotCount === 0) return;
    const event = getEvent(article.eventId);
    if (!event) return;
    const victimType = event.victimWhenFake;
    const escalations = (victimType && VICTIM_ESCALATIONS[victimType]) || DEFAULT_ESCALATION;

    escalations.forEach(esc => {
      state.scheduledConsequences.push({
        eventId: article.eventId,
        eventTitle: article.eventTitle,
        triggerDay: state.day + esc.delay,
        severity: esc.severity,
        source: esc.source,
        head: esc.head,
        text: esc.text,
      });
    });
  }

  function triggerScheduledConsequences() {
    if (!state.scheduledConsequences || state.scheduledConsequences.length === 0) return;
    const due = state.scheduledConsequences.filter(c => c.triggerDay <= state.day);
    if (due.length === 0) return;
    state.scheduledConsequences = state.scheduledConsequences.filter(c => c.triggerDay > state.day);

    due.forEach((c, i) => {
      // 뉴스 앱에 누적
      state.firedGhostNews.unshift({
        day: state.day,
        week: state.week,
        source: c.source,
        head: c.head,
        sum: c.text,
        severity: c.severity,
        eventId: c.eventId,
      });

      // severity 별 게이지 페널티 — 본인이 무너뜨린 사람의 무게가 양심에 쌓임
      if (c.severity === 'high') {
        applyGaugeDelta({ conscience: -3, credibility: -2 });
      } else {
        applyGaugeDelta({ conscience: -1 });
      }

      // 토스트 — 시차 두고 (여러 개 동시면 겹침 방지)
      setTimeout(() => {
        showToast(
          `<strong>📰 ${escapeHTML(c.source)} — ${escapeHTML(c.head)}</strong>${escapeHTML(c.text)}`,
          5500
        );
      }, 1500 + i * 1200);
    });
  }

  function triggerScheduledExposures() {
    const due = state.exposureQueue.filter(e => e.triggerDay === state.day);
    state.exposureQueue = state.exposureQueue.filter(e => e.triggerDay !== state.day);

    due.forEach(e => {
      const trustPenalty = -10 - (e.fakeSlotCount * 5);
      applyGaugeDelta({
        credibility: trustPenalty,
        balance: -200,
        conscience: -10,
      });
      const article = state.publishedArticles.find(a => a.eventId === e.eventId && a.day === e.publishedDay);
      if (article) article.exposed = true;

      setTimeout(() => {
        showToast(
          `<strong>⚠ 발각</strong>지난 주 발행한 "${escapeHTML(e.eventTitle)}" 기사가 검증되었다. 신뢰도 ${trustPenalty}, 벌금 ₩200, 양심 -10`,
          5500
        );
      }, 800);
    });
  }

  // ─────────────────────────────────────────────
  //  Diary modal — clue inventory
  // ─────────────────────────────────────────────
  function showDiary() {
    const eventsEl = $('[data-diary-events]');
    if (!eventsEl) return;

    const eventIds = Object.keys(state.clueInventory);

    if (eventIds.length === 0) {
      eventsEl.innerHTML = '<p class="diary-empty">아직 모은 단서가 없습니다.<br/><br/>월~목에 정보를 추적하세요.</p>';
    } else {
      eventsEl.innerHTML = eventIds.map(eid => {
        const event = getEvent(eid);
        const clues = state.clueInventory[eid];
        const types = [...new Set(clues.map(c => c.type))];
        const hasContradict = types.length >= 3;
        const thisWeek = clues.filter(c => (c.collectedWeek || 1) === state.week).length;
        const past = clues.length - thisWeek;

        const photoIds = getCollectedPhotoIds(eid);
        const photos = photoIds.map(pid => getPhotoById(eid, pid)).filter(Boolean);
        const photoStrip = photos.length === 0 ? '' : `
          <div class="de-photos">
            ${photos.map(p => `
                <button class="de-photo-thumb" data-photo-thumb data-event="${eid}" data-photo-id="${p.id}" title="${escapeHTML(p.caption || '')}">
                  <span class="dpt-frame">
                    <img src="images/cases/${p.filename}" alt="${escapeHTML(p.caption || '사진')}" onerror="this.style.display='none';this.nextElementSibling.hidden=false;" />
                    <span class="dpt-fallback" hidden>NO IMG</span>
                  </span>
                </button>`
            ).join('')}
          </div>`;

        const scoopHint = hasContradict
          ? `<div class="de-scoop-hint">⚡ 출처 ${types.length}종 — 본문에 섞어 쓰면 <b>특종 보너스</b> (조회수 ×1.3 / 신뢰도 +5)</div>`
          : '';
        return `
          <div class="diary-event${hasContradict ? ' has-scoop' : ''}">
            <div class="de-title">
              <span class="de-name">${escapeHTML(event?.title || eid)}</span>
              <span class="de-meta">${clues.length} 단서 · ${photos.length} 사진 · ${types.length} 출처${hasContradict ? ' · ⚡ 특종 가능' : ''}${past ? ' · 지난주 ' + past : ''}</span>
            </div>
            ${scoopHint}
            <div class="de-clues">
              ${clues.map((c, i) => {
                const isPast = (c.collectedWeek || 1) !== state.week;
                return `
                <div class="de-clue${hasContradict ? ' contradict' : ''}${isPast ? ' past-week' : ''}"
                     data-diary-clue
                     data-clue-event="${eid}"
                     data-clue-index="${i}">
                  <span class="de-clue-type">${c.type}</span>
                  <span>${escapeHTML(c.summary)}</span>
                  <span class="de-clue-week">W${c.collectedWeek || 1}</span>
                </div>`;
              }).join('')}
            </div>
            ${photoStrip}
          </div>`;
      }).join('');
    }

    // 요약
    const totalClues = Object.values(state.clueInventory).flat().length;
    const eventCount = eventIds.length;
    const totalPhotos = Object.values(state.collectedPhotos).reduce((sum, arr) => sum + arr.length, 0);
    let contradictCount = 0;
    eventIds.forEach(eid => {
      const types = [...new Set(state.clueInventory[eid].map(c => c.type))];
      if (types.length >= 3) contradictCount += 1;
    });

    const setText = (sel, val) => { const el = $(sel); if (el) el.textContent = val; };
    setText('[data-clue-count]', totalClues);
    setText('[data-event-count]', eventCount);
    setText('[data-photo-count]', totalPhotos);
    setText('[data-contradict-count]', contradictCount);

    openOverlay(els.diaryOverlay);
  }

  // ─────────────────────────────────────────────
  //  Photo lightbox — 다이어리/결과에서 썸네일 클릭 시
  // ─────────────────────────────────────────────
  function showPhotoLightbox(eventId, photoId) {
    const photo = getPhotoById(eventId, photoId);
    if (!photo) return;
    const lb = $('#photoLightbox');
    if (!lb) return;
    const img      = $('[data-lightbox-img]');
    const cap      = $('[data-lightbox-caption]');
    const fallback = $('[data-lightbox-fallback]');

    if (img) {
      img.style.display = '';
      if (fallback) fallback.hidden = true;
      img.alt = photo.caption || '사진';
      img.onerror = () => {
        img.style.display = 'none';
        if (fallback) fallback.hidden = false;
      };
      img.onload = () => {
        img.style.display = '';
        if (fallback) fallback.hidden = true;
      };
      img.src = `images/cases/${photo.filename}`;
    }
    if (cap) cap.textContent = photo.caption || '';
    openOverlay(lb);
  }

  // 썸네일 클릭 위임
  document.addEventListener('click', (e) => {
    const thumb = e.target.closest('[data-photo-thumb]');
    if (!thumb) return;
    e.preventDefault();
    const eid = thumb.dataset.event;
    const pid = thumb.dataset.photoId;
    if (eid && pid) showPhotoLightbox(eid, pid);
  });

  // ─────────────────────────────────────────────
  //  Phone — app routing & chat (data-driven)
  // ─────────────────────────────────────────────
  function switchApp(appName) {
    $$('.phone-app').forEach(app => {
      const match = app.dataset.app === appName;
      app.hidden = !match;
      app.classList.toggle('active', match);
    });

    if (appName === 'messages') {
      renderPhoneInbox();  // 메시지 앱 들어가면 inbox 자동 갱신
    }
    if (appName.startsWith('chat-') && appName !== 'chat-event') {
      const who = appName.replace('chat-', '');
      renderChat(who);
    } else if (appName === 'gallery') renderGallery();
    else if (appName === 'news') renderNews();
    else if (appName === 'archive') renderArchive();
    else if (appName === 'sns') renderSNS();
  }

  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-open-app]');
    if (opener) {
      switchApp(opener.dataset.openApp);
      return;
    }
    const back = e.target.closest('[data-back-to]');
    if (back) switchApp(back.dataset.backTo);
  });

  function quadrant() {
    const c = state.conscienceTier, b = state.balanceTier;
    if (c === 'lowest') return 'lowest';
    if (c === 'high' && b === 'high') return 'hh';
    if (c === 'high' && b === 'low')  return 'hl';
    if (c === 'low'  && b === 'high') return 'lh';
    return 'll';
  }

  // 데이터 기반 그림 첨부 SVG
  const DRAWING_SVG = `
    <svg viewBox="0 0 200 100">
      <g filter="url(#wobble)">
        <rect x="2" y="2" width="196" height="96" fill="#faf3df" stroke="#0e0e0e" stroke-width="1.5"/>
        <circle cx="40" cy="28" r="10" fill="none" stroke="#0e0e0e" stroke-width="2"/>
        <line x1="40" y1="14" x2="40" y2="8" stroke="#0e0e0e" stroke-width="1.5"/>
        <line x1="40" y1="42" x2="40" y2="48" stroke="#0e0e0e" stroke-width="1.5"/>
        <line x1="26" y1="28" x2="20" y2="28" stroke="#0e0e0e" stroke-width="1.5"/>
        <line x1="54" y1="28" x2="60" y2="28" stroke="#0e0e0e" stroke-width="1.5"/>
        <circle cx="100" cy="58" r="8" fill="none" stroke="#0e0e0e" stroke-width="2"/>
        <line x1="100" y1="66" x2="100" y2="82" stroke="#0e0e0e" stroke-width="2"/>
        <line x1="92" y1="74" x2="108" y2="74" stroke="#0e0e0e" stroke-width="2"/>
        <line x1="100" y1="82" x2="94" y2="92" stroke="#0e0e0e" stroke-width="2"/>
        <line x1="100" y1="82" x2="106" y2="92" stroke="#0e0e0e" stroke-width="2"/>
        <circle cx="130" cy="60" r="7" fill="none" stroke="#0e0e0e" stroke-width="2"/>
        <line x1="130" y1="67" x2="130" y2="80" stroke="#0e0e0e" stroke-width="2"/>
        <line x1="124" y1="74" x2="136" y2="74" stroke="#0e0e0e" stroke-width="2"/>
        <line x1="130" y1="80" x2="126" y2="90" stroke="#0e0e0e" stroke-width="2"/>
        <line x1="130" y1="80" x2="134" y2="90" stroke="#0e0e0e" stroke-width="2"/>
        <circle cx="156" cy="64" r="5" fill="none" stroke="#0e0e0e" stroke-width="2"/>
        <line x1="156" y1="69" x2="156" y2="80" stroke="#0e0e0e" stroke-width="2"/>
        <line x1="152" y1="74" x2="160" y2="74" stroke="#0e0e0e" stroke-width="2"/>
        <text x="20" y="92" font-family="cursive" font-size="9" fill="#0e0e0e">우리가족</text>
      </g>
    </svg>`;

  function renderChat(who) {
    const stream = $(`.chat-stream[data-chat="${who}"]`);
    if (!stream) return;

    let entries = [];
    const msg = DATA.phoneMessages;

    if (who === 'daughter' || who === 'wife') {
      entries = msg[who]?.[quadrant()] || [];
    } else if (who === 'editor') {
      entries = msg.editor?.[state.credibilityTier] || msg.editor?.normal || [];
    } else if (who === 'park') {
      entries = msg.park?.default || [];
    } else if (who === 'tip') {
      entries = (state.conscienceTier === 'low' || state.conscienceTier === 'lowest')
        ? (msg.tip?.threat || [])
        : (msg.tip?.default || []);
    } else if (who === 'loan') {
      const lvl = state.balanceTier === 'high'
        ? null
        : (state.conscienceTier === 'lowest' ? 'worst' : 'low');
      entries = lvl ? (msg.loan?.[lvl] || []) : [];
    }

    // chatHistory 가 있으면 그것만 보여줌 (실제 대화는 영구 보존, 정적 ambient는 게이지 변동 따라
    // 바뀌므로 "기존 대화가 사라진 것처럼" 보이는 문제 해결)
    const history = state.chatHistory?.[who] || [];

    if (entries.length === 0 && history.length === 0) {
      stream.innerHTML = `<div class="chat-empty">대화 내용이 없습니다.</div>`;
      return;
    }

    const renderBubble = (e) => {
      if (e.divider) {
        return `<div class="chat-day-divider">${escapeHTML(e.divider)}${e.time ? ' · ' + escapeHTML(e.time) : ''}</div>`;
      }
      const cls = ['bubble', e.from || 'them'];
      if (e.silent) cls.push('silenced');
      const attach = e.attach === 'drawing' ? `<span class="bubble-attach">${DRAWING_SVG}</span>` : '';
      const wifePrefix = e.wife ? '<em style="opacity:0.6">아내 — </em>' : '';
      return `<div class="${cls.join(' ')}">${wifePrefix}${escapeHTML(e.text || '')}${attach}${e.time ? `<span class="bubble-time">${escapeHTML(e.time)}</span>` : ''}</div>`;
    };

    let html = '';
    if (history.length > 0) {
      html = history.map(renderBubble).join('');
    } else {
      html = entries.map(renderBubble).join('');
    }

    // 이 스레드 앞으로 온 pending 이벤트 — chat 안에 직접 메시지 + 선택지 표시
    const pending = state.phoneInbox.find(i => {
      const ev = DATA.phoneEvents.find(e => e.id === i.eventId);
      if (!ev) return false;
      return resolveEventContent(ev, i.context).thread === who;
    });

    if (pending) {
      state.activePhoneEvent = pending.eventId;
      const ev = DATA.phoneEvents.find(e => e.id === pending.eventId);
      const content = resolveEventContent(ev, pending.context);
      html += `<div class="chat-day-divider">${state.day}일차 · 새 메시지</div>`;
      content.incoming.forEach(t => {
        html += `<div class="bubble them">${escapeHTML(substituteContext(t, pending.context))}</div>`;
      });
      if (pending.replyChosen === undefined) {
        html += '<div class="chat-choices">' +
          ev.choices.map((c, i) => `<button class="event-choice" data-event-choice="${i}">${escapeHTML(c.label)}</button>`).join('') +
          '</div>';
      } else {
        const chose = ev.choices[pending.replyChosen];
        html += `<div class="bubble me">${escapeHTML(chose.label)}</div>`;
        (chose.reply || []).forEach(t => {
          html += `<div class="bubble them">${escapeHTML(substituteContext(t, pending.context))}</div>`;
        });
        html += '<div class="chat-choices"><button class="event-choice event-done" data-event-done>대화 종료</button></div>';
      }
    } else {
      state.activePhoneEvent = null;
    }

    stream.innerHTML = html;

    // 채팅 열면 그 스레드는 읽음 처리
    state.threadUnread[who] = 0;
    refreshThreadStatusUI();
    refreshPhoneBadge();

    requestAnimationFrame(() => { stream.scrollTop = stream.scrollHeight; });
  }

  function renderGallery() {
    const grid = $('.gallery-grid');
    if (!grid) return;
    const c = state.conscienceTier;

    const sets = {
      high:   [['family',1],['family',1],['family',0],['family',0],['work',0],['family',0],['family',0],['work',0],['family',0]],
      mid:    [['work',1],['work',0],['family',0],['work',0],['work',0],['family',0],['family',0],['work',0],['family',0]],
      low:    [['work',1],['work',1],['work',0],['work',0],['unknown',0],['work',0],['work',0],['family',0],['work',0]],
      lowest: [['unknown',1],['unknown',1],['unknown',0],['work',0],['work',0],['unknown',0],['work',0],['unknown',0],['work',0]],
    };
    const photos = sets[c] || sets.mid;

    grid.innerHTML = photos.map(([kind, recent]) => {
      return `<div class="gallery-thumb${recent ? ' recent' : ''}">${thumbSVG(kind)}</div>`;
    }).join('');
  }

  function thumbSVG(kind) {
    if (kind === 'family') {
      return `<svg viewBox="0 0 100 100"><g filter="url(#wobble)" fill="none" stroke="#0e0e0e" stroke-width="2"><circle cx="40" cy="40" r="10"/><circle cx="62" cy="44" r="8"/><line x1="40" y1="50" x2="40" y2="78"/><line x1="62" y1="52" x2="62" y2="78"/><line x1="30" y1="64" x2="50" y2="64"/><line x1="54" y1="64" x2="70" y2="64"/></g></svg>`;
    }
    if (kind === 'work') {
      return `<svg viewBox="0 0 100 100"><g filter="url(#wobble)" fill="none" stroke="#0e0e0e" stroke-width="2"><rect x="14" y="20" width="72" height="56"/><line x1="22" y1="32" x2="60" y2="32" stroke-width="3"/><line x1="22" y1="42" x2="74" y2="42"/><line x1="22" y1="50" x2="68" y2="50"/><line x1="22" y1="58" x2="74" y2="58"/><line x1="22" y1="66" x2="50" y2="66"/></g></svg>`;
    }
    return `<svg viewBox="0 0 100 100"><g filter="url(#wobble)"><rect x="0" y="0" width="100" height="100" fill="#0e0e0e"/><circle cx="30" cy="60" r="12" fill="none" stroke="#f4ecd8" stroke-width="2"/><circle cx="60" cy="50" r="10" fill="none" stroke="#f4ecd8" stroke-width="2"/><circle cx="80" cy="65" r="8" fill="none" stroke="#f4ecd8" stroke-width="2"/></g></svg>`;
  }

  function renderNews() {
    const list = $('[data-news-list]');
    if (!list) return;

    // 1) 본인이 무너뜨린 사람들 — 가짜 발행 후폭풍 (firedGhostNews) 최상단 누적
    const ghostItems = (state.firedGhostNews || []).map(g => ({
      source: g.source,
      head: g.head,
      sum: g.sum,
      day: g.day,
      week: g.week,
      consequence: true,
      severity: g.severity,
    }));

    // 2) 일반 뉴스 (정적)
    const ambientItems = [
      { source: '경쟁 일보', head: '시청 회계 비리 — 감사원 착수', sum: '지난 주 보도된 시청 자료를 바탕으로…' },
      { source: '팩트체크',  head: '연예인 열애설 — 양측 모두 부인', sum: '관련 매체의 보도와 달리 양 소속사는…' },
    ];

    const items = ghostItems.concat(ambientItems);

    if (items.length === 0) {
      list.innerHTML = '<li class="news-empty">아직 표시할 뉴스가 없습니다.</li>';
      return;
    }

    list.innerHTML = items.map(it => `
      <li class="news-item${it.consequence ? ' consequence' : ''}${it.severity === 'high' ? ' severity-high' : ''}">
        <div class="news-source">${escapeHTML(it.source)}${it.day ? ` · ${it.week ? 'W' + it.week + '·' : ''}${it.day}일차` : ''}</div>
        <div class="news-headline">${escapeHTML(it.head)}</div>
        <div class="news-summary">${escapeHTML(it.sum)}</div>
      </li>`).join('');
  }

  // 신문 아카이브 — 발행한 모든 기사 회고
  function renderArchive() {
    const list = $('[data-archive-list]');
    const summaryEl = $('[data-archive-summary]');
    if (!list) return;

    const articles = (state.publishedArticles || []).slice().reverse(); // 최신순

    // 요약 통계
    if (summaryEl) {
      const total = articles.length;
      const exposed = articles.filter(a => a.exposed).length;
      const fakes = articles.filter(a => (a.fakeSlotCount || 0) > 0).length;
      const totalViews = articles.reduce((s, a) => s + (a.earnedViews || 0), 0);
      summaryEl.innerHTML = `
        <div class="ar-stat"><span class="ar-stat-num">${total}</span><span class="ar-stat-key">발행</span></div>
        <div class="ar-stat"><span class="ar-stat-num">${fakes}</span><span class="ar-stat-key">자극·날조</span></div>
        <div class="ar-stat"><span class="ar-stat-num">${exposed}</span><span class="ar-stat-key">발각</span></div>
        <div class="ar-stat"><span class="ar-stat-num">${formatViews(totalViews)}</span><span class="ar-stat-key">총 조회</span></div>`;
    }

    if (articles.length === 0) {
      list.innerHTML = '<li class="archive-empty">아직 발행한 기사가 없습니다.</li>';
      return;
    }

    list.innerHTML = articles.map(a => {
      const tier = a.exposed ? 'exposed'
        : (a.fakeSlotCount || 0) >= 3 ? 'heavy-fake'
        : (a.fakeSlotCount || 0) >= 1 ? 'mild-fake'
        : 'clean';
      const tierLabel = ({
        clean: '정직 보도', 'mild-fake': '약한 자극', 'heavy-fake': '강한 자극', exposed: '발각됨',
      })[tier];

      // 후폭풍 — 이 사건과 연결된 firedGhostNews 개수
      const ghostCount = (state.firedGhostNews || []).filter(g => g.eventId === a.eventId).length;
      const ghostNote = ghostCount > 0
        ? `<div class="ar-ghost">📰 후폭풍 ${ghostCount}건 — 뉴스 앱에서 확인</div>`
        : '';

      return `
        <li class="archive-item tier-${tier}">
          <div class="ar-head">
            <span class="ar-week">W${String(a.week || 1).padStart(2,'0')} · ${a.day || '?'}일차</span>
            <span class="ar-tag">${tierLabel}</span>
          </div>
          <h3 class="ar-title">${escapeHTML(a.eventTitle || '제목 없음')}</h3>
          <div class="ar-meta">
            <span>${formatViews(a.earnedViews || 0)} 조회</span>
            ${a.fakeSlotCount > 0 ? `<span>· 조작 ${a.fakeSlotCount}슬롯</span>` : ''}
            ${a.glitchOutcome === 'fake' ? '<span>· 글리치 날조</span>' : ''}
            ${a.exposed ? '<span class="ar-meta-warn">· 검증 실패</span>' : ''}
          </div>
          ${ghostNote}
        </li>`;
    }).join('');
  }

  function renderSNS() {
    const list = $('[data-sns-list]');
    if (!list) return;

    const sets = {
      high: [
        { user:'@reader_park', text:'잘 썼다. 이런 기자가 있어 다행', kind:'good' },
        { user:'@news_fan',    text:'시청 비리 후속 기다림',           kind:'good' },
      ],
      mid: [
        { user:'@anon_42',     text:'근데 진짜인가?',                  kind:'mid' },
        { user:'@reader_park', text:'전엔 잘 썼는데 이번엔 좀…',       kind:'mid' },
      ],
      low: [
        { user:'@anon_42',     text:'또 거짓말이지?',                  kind:'angry' },
        { user:'@critic_99',   text:'이 매체 거름. 구독 끊음.',        kind:'angry' },
        { user:'@anon_07',     text:'팩트체크 해봤더니 다 거짓말임 ㅋㅋ', kind:'angry' },
      ],
      lowest: [
        { user:'@anon_07',     text:'사람 죽인 기자',                  kind:'angry' },
        { user:'@critic_99',   text:'기자증 박탈해라',                 kind:'angry' },
        { user:'@anon_42',     text:'이름 검색하지 마세요. 보면 화남.', kind:'angry' },
      ],
    };

    const items = sets[state.conscienceTier] || sets.mid;
    list.innerHTML = items.map(it => `
      <li class="sns-item ${it.kind}">
        <div class="sns-user">${escapeHTML(it.user)}</div>
        <div class="sns-text">${escapeHTML(it.text)}</div>
      </li>`).join('');
  }

  // ─────────────────────────────────────────────
  //  Thread previews + visibility
  // ─────────────────────────────────────────────
  function refreshThreadPreviews() {
    const setText = (attr, val) => {
      const el = $(`[data-thread-preview="${attr}"]`);
      if (el) el.textContent = val;
    };

    const q = quadrant();
    setText('daughter', ({
      hh: '아빠 보고싶어요',
      hl: '아빠 책 읽어주는 거 좋아요',
      lh: '아빠 어디야? 또 늦게 와?',
      ll: '…',
      lowest: '우리 아빠가 거짓말쟁이래'
    })[q] || '');

    setText('wife', ({
      hh: '카레 어때 좋아 ㅎㅎ',
      hl: '아냐 같이 견디면 돼',
      lh: '근데 그게 답은 아니잖아',
      ll: '…',
      lowest: '딸한테 무슨 말 한 거야'
    })[q] || '');

    setText('editor', ({
      trusted: '필요한 거 있으면 바로 말해',
      normal:  '오늘 마감 신경 좀 써. 광고주 미팅 있어.',
      suspicious: '그건 다른 친구한테 줬어.'
    })[state.credibilityTier] || '');

    const loanLvl = state.balanceTier === 'high'
      ? ''
      : (state.conscienceTier === 'lowest'
          ? '[법적 조치 예고] 가압류 절차'
          : '[연체 안내] 즉시 결제');
    setText('loan', loanLvl);

    // 잔고 낮을 때만 보이는 항목
    $$('[data-show-when="balance-low"]').forEach(el => {
      el.style.display = state.balanceTier === 'low' ? '' : 'none';
    });
  }

  // ─────────────────────────────────────────────
  //  Hotspot click handlers
  // ─────────────────────────────────────────────
  els.phone?.addEventListener('click', () => {
    if (state.dayOfWeek === 5) {
      showToast('<strong>전화기 — 마감일</strong>오늘은 새 정보를 받을 시간이 없다. 컴퓨터로 기사를 작성하세요.', 3200);
      els.monitor?.classList.remove('friday-deadline');
      void els.monitor?.offsetWidth;
      els.monitor?.classList.add('friday-deadline', 'friday-pulse-once');
      setTimeout(() => els.monitor?.classList.remove('friday-pulse-once'), 1200);
      return;
    }
    if (state.dayOfWeek > 4) {
      showToast('<strong>전화기</strong>주말이다. 새 정보는 다음 주 월요일에 도착한다.', 2800);
      return;
    }
    // 월요일에 아직 사건 못 골랐으면 게시판으로 유도
    if (!state.weeklyCasePicked) {
      showBulletinBoard();
      return;
    }
    if (state.todaysCards.length === 0) generateTodaysCards();
    openOverlay(els.cardOverlay);
    refreshRecaseButton();   // 월요일 + 추적 전이면 "다시 고르기" 버튼 노출
    showTutorial('phone');
  });

  // "다시 고르기" 버튼 — 월요일이면서 추적이 한 건도 시작 안 됐을 때만 노출
  function refreshRecaseButton() {
    const btn = $('[data-recase]');
    if (!btn) return;
    const eligible = state.dayOfWeek === 1
                  && state.weeklyCasePicked
                  && state.trackedToday.length === 0;
    btn.hidden = !eligible;
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-recase]');
    if (!btn) return;
    Audio.playSfx('cardClick');
    if (state.trackedToday.length > 0) {
      showToast('이미 추적을 시작했어요. 사건 변경은 추적 취소 후 가능.', 3000);
      return;
    }
    // weeklyCase 리셋 — activeEvents 에서 제거 (completedEventIds 에 안 추가, 다시 고를 수 있게)
    if (state.weeklyCase) delete state.activeEvents[state.weeklyCase];
    state.weeklyCase = null;
    state.weeklyCasePicked = false;
    state.todaysCards = [];
    closeOverlay(els.cardOverlay);
    showBulletinBoard();
  });

  els.diary?.addEventListener('click', showDiary);

  els.monitor?.addEventListener('click', () => {
    if (state.dayOfWeek === 5) {
      openArticleEditor();
    } else {
      const days = ['월','화','수','목','금','토','일'];
      const today = days[state.dayOfWeek - 1];
      showToast(`<strong>컴퓨터</strong>오늘은 ${today}요일 — 금요일에 기사 작성 화면이 열린다`);
    }
  });

  els.family?.addEventListener('click', () => {
    const c = els.family.dataset.conscience;
    if (c === 'fullyCovered' || c === 'facedown') return;
    showToast('<strong>가족사진</strong>딸의 5살 생일. 봄.');
  });

  els.mug?.addEventListener('click', () => {
    showToast('<strong>커피</strong>한 모금. 게이지 변동 없음.');
  });

  els.papers?.addEventListener('click', () => {
    showToast('<strong>과거 기사 ARCHIVE</strong>지난 호 다시 보기');
  });

  els.memo?.addEventListener('click', () => {
    showToast('<strong>메모</strong>편집장 광고주 메모');
  });

  els.mobile?.addEventListener('click', () => {
    stopPhoneVibration();
    refreshThreadPreviews();
    openOverlay(els.phoneOverlay);
    switchApp('home');
  });

  els.endDayBtn?.addEventListener('click', () => {
    if (state.dayOfWeek === 5) {
      showToast('<strong>금요일 마감</strong>오늘은 그냥 넘어갈 수 없다. 컴퓨터로 기사를 작성하거나 짧은 기사 / 휴재 중 하나를 선택해야 한다.', 4000);
      els.monitor?.classList.remove('friday-deadline');
      void els.monitor?.offsetWidth;
      els.monitor?.classList.add('friday-deadline', 'friday-pulse-once');
      setTimeout(() => els.monitor?.classList.remove('friday-pulse-once'), 1200);
      return;
    }
    if (state.slotsRemaining === state.slotsTotal && state.trackedToday.length === 0) {
      showToast('아직 오늘 한 일이 없다. 무엇이든 하나는 해야 한다.');
      return;
    }
    endDay();
  });

  // ─────────────────────────────────────────────
  //  Article Editor — 기사 작성 모달
  // ─────────────────────────────────────────────
  function openArticleEditor() {
    // 작업 초안 초기화
    articleDraft.eventId = null;
    articleDraft.slots = {
      headline: { clue: null, dialStep: 1 },
      body1:    { clue: null, dialStep: 1 },
      body2:    { clue: null, dialStep: 1 },
      body3:    { clue: null, dialStep: 1 },
      photo:    { clue: null, dialStep: 1 },
    };
    articleDraft.isOpen = true;

    // HUD 라벨
    const dayLabel = DAYS_KO[state.dayOfWeek - 1];
    if (els.articleDay) {
      const w = String(state.week).padStart(2, '0');
      const d = String(state.dayOfWeek).padStart(2, '0');
      els.articleDay.textContent = `${dayLabel} · WEEK ${w} · ${d}`;
    }

    populateEventSelect();
    renderArticleClues();
    renderArticlePhotos();
    resetSlotUI();
    updatePreview();

    openOverlay(els.articleOverlay);
    showTutorial('article');
  }

  // 이번 주에 모은 단서만 — 기사작성 보관함은 매주 초기화 효과
  function currentWeekClues(eid) {
    const all = state.clueInventory[eid] || [];
    return all.filter(c => (c.collectedWeek || 1) === state.week);
  }

  // 사건 셀렉트 옵션 채우기 — 이번 주 단서 보유한 사건만
  function populateEventSelect() {
    if (!els.eventSelect) return;

    const candidates = Object.keys(state.clueInventory)
      .map(eid => ({ id: eid, clues: currentWeekClues(eid) }))
      .filter(c => c.clues.length > 0)
      .map(c => ({
        id: c.id,
        title: getEvent(c.id)?.title || c.id,
        clueCount: c.clues.length,
      }));

    if (candidates.length === 0) {
      els.eventSelect.innerHTML = `<option value="">— 이번 주에 모은 단서가 없습니다 (휴재 권장) —</option>`;
      els.eventSelect.disabled = true;
      articleDraft.eventId = null;
      return;
    }

    els.eventSelect.disabled = false;
    els.eventSelect.innerHTML = candidates.map((c, i) =>
      `<option value="${c.id}"${i === 0 ? ' selected' : ''}>${escapeHTML(c.title)} — 단서 ${c.clueCount}개</option>`
    ).join('');
    articleDraft.eventId = candidates[0].id;
  }

  // 단서 인벤토리 렌더 (선택된 사건 + 이번 주 단서만)
  // data-clue-index 는 state.clueInventory[eid] 의 *절대* 인덱스 — 드래그/드롭 일관성 유지
  function renderArticleClues() {
    if (!els.articleClues) return;

    const eid = articleDraft.eventId;
    const all = eid ? (state.clueInventory[eid] || []) : [];
    const visible = all
      .map((clue, absIdx) => ({ clue, absIdx }))
      .filter(({ clue }) => (clue.collectedWeek || 1) === state.week);

    if (visible.length === 0) {
      els.articleClues.innerHTML = '<p class="ac-empty">이 사건에 이번 주 모은 단서가 없습니다.</p>';
    } else {
      els.articleClues.innerHTML = visible.map(({ clue: c, absIdx }) => {
        const used = isClueUsedInDraft(eid, absIdx);
        const axis = guessClueAxis(c);
        return `
          <div class="ac-clue${used ? ' used' : ''}"
               draggable="true"
               data-clue-event="${eid}"
               data-clue-index="${absIdx}"
               data-clue-type="${c.type}"
               data-clue-axis="${axis}">
            <div class="ac-clue-meta">
              <span class="ac-clue-type">${escapeHTML(c.type)}</span>
              <span class="ac-clue-axis">${axisLabel(axis)}</span>
            </div>
            <div class="ac-clue-summary">${escapeHTML(c.summary)}</div>
          </div>`;
      }).join('');
    }

    // 글리치 카드 — 이번 주 단서 부족 시 표시
    renderGlitchCards();
  }

  // 단서 종류로 어느 슬롯에 들어갈지 추정 — 텍스트 단서는 절대 photo 슬롯에 못 들어감
  function guessClueAxis(clue) {
    // royal/rumor → headline+body 호환, evidence/part → body 만
    if (clue.type === 'royal' || clue.type === 'rumor') return 'any';
    return 'body';
  }

  function axisLabel(axis) {
    return ({ 'any': '범용', 'body': '본문', 'photo': '사진', 'headline': '헤드라인' })[axis] || axis;
  }

  // 단서 카드 클릭 → *실제 수집된 단서 문장들* + 당시 전체 상황(접힌 채)
  function showClueDetail(clue, eventId) {
    const overlay = $('#clueDetailOverlay');
    if (!overlay || !clue) return;
    const event = getEvent(eventId);

    const setText = (sel, val) => { const el = $(sel); if (el) el.textContent = val || ''; };
    setText('[data-cd-key]',     `METHOD · ${(clue.method || '').toUpperCase()}`);
    setText('[data-cd-method]',  clue.cardLabel || clue.methodLabel || clue.method || '추적');
    setText('[data-cd-event]',   event?.title || clue.eventTitle || '');
    setText('[data-cd-outcome]', clue.outcomeLabel || clue.outcome || '');
    setText('[data-cd-day]',     clue.dayCollected ? `${clue.dayCollected}일차` : '');
    setText('[data-cd-source]',  clue.typeLabel ? `· ${clue.typeLabel}` : '');
    setText('[data-cd-summary]', clue.summary || '');

    // 본문 = 이 단서가 나온 *고유한 문단* (단서마다 다름 — 중복 X)
    const body = $('[data-cd-body]');
    if (body) {
      const paragraph = clue.paragraph || clue.summary || '';
      if (!paragraph) {
        body.innerHTML = '<p class="cd-empty">단서 본문이 비어있다.</p>';
      } else {
        body.innerHTML = `<p class="cd-paragraph">${escapeHTML(paragraph)}</p>`;
      }
    }
    // 전체 상황 (분위기·회상 포함) — 접혀 있고 펼치면 보임
    setText('[data-cd-fulltext]', clue.fullText || '');

    openOverlay(overlay);
  }

  // 단서 카드 클릭 위임 — 기사 작성 좌측 + 다이어리 둘 다
  // (드래그와 충돌 안 함 — 클릭은 mousedown+mouseup 무이동 시만 발화)
  document.addEventListener('click', (e) => {
    const clueEl = e.target.closest('.ac-clue, [data-diary-clue]');
    if (!clueEl) return;
    if (clueEl.classList.contains('used')) return;       // 이미 사용된 단서는 패스
    if (clueEl.dataset.clueGlitch !== undefined) return; // 글리치 카드는 미스터리 유지
    const eventId = clueEl.dataset.clueEvent;
    const idx = parseInt(clueEl.dataset.clueIndex, 10);
    if (isNaN(idx)) return;
    const clue = state.clueInventory[eventId]?.[idx];
    if (clue) showClueDetail(clue, eventId);
  });

  // 사진 갤러리 — 현재 선택된 사건의 수집된 사진들 (드래그 가능)
  function renderArticlePhotos() {
    if (!els.articlePhotos) return;
    const eid = articleDraft.eventId;
    const photoIds = eid ? getCollectedPhotoIds(eid) : [];
    const photos = photoIds.map(pid => getPhotoById(eid, pid)).filter(Boolean);

    if (photos.length === 0) {
      els.articlePhotos.innerHTML = '<p class="ac-empty">아직 수집한 사진이 없습니다.<br/>잠복 또는 사진 카드로 수집하세요.</p>';
      return;
    }

    els.articlePhotos.innerHTML = photos.map(p => {
      const used = isPhotoUsedInDraft(eid, p.id);
      const cap = (p.caption || '').slice(0, 60);
      return `
        <div class="ac-photo${used ? ' used' : ''}"
             draggable="true"
             data-photo-event="${eid}"
             data-photo-id="${p.id}">
          <div class="ac-photo-frame">
            <img src="images/cases/${p.filename}" alt="${escapeHTML(p.caption || '사진')}"
                 onerror="this.style.display='none';this.nextElementSibling.hidden=false;" />
            <span class="ac-photo-fallback" hidden>NO IMG</span>
          </div>
          <div class="ac-photo-cap">${escapeHTML(cap)}${(p.caption || '').length > 60 ? '…' : ''}</div>
        </div>`;
    }).join('');
  }

  function isPhotoUsedInDraft(eventId, photoId) {
    const photoSlot = articleDraft.slots.photo;
    return !!(photoSlot?.clue
      && photoSlot.clue.type === 'photo'
      && photoSlot.clue.eventId === eventId
      && photoSlot.clue.photoId === photoId);
  }

  // 글리치(지지직) 카드 표시 — 단서가 적을수록 더 많이 등장 (최대 5장)
  // 단서 풀이 빈약할 때 도박 옵션을 풍성하게 — 사용자가 더 다양한 미확인 정보 중 골라
  // 자극성/리스크를 결정할 수 있게 함
  const GLITCH_VARIANTS = [
    '출처 불명의 떠도는 한 줄 — 사용 후에야 진위 확정',
    '익명 단톡방에서 흘러나온 첩보',
    '검증 못한 정보 — 자극성 다이얼이 결정한다',
    '다른 매체가 흘린 미확인 단서',
    '제보자의 추측 — 본인 판단',
    '인터넷 게시판의 한 줄',
    '메모지에 적혀 있던 출처 없는 발언',
    '들리는 소문 — 진짜일 가능성 절반',
    '편집부 책상 위에 누군가 두고 간 한 줄',
    '사석에서 흘러나온 한마디 — 출처 안 밝힘',
    '닉네임 뒤의 익명 — 본인이 봤다고 주장',
    '동료 매체 후배가 슬쩍 흘린 한 마디',
  ];

  function renderGlitchCards() {
    if (!els.articleGlitch || !els.glitchSection) return;
    const eid = articleDraft.eventId;
    const clueCount = eid ? currentWeekClues(eid).length : 0;

    // 단서가 적을수록 더 많은 글리치 카드 — 최대 5장
    // 0개 → 5장 / 1개 → 4 / 2 → 3 / 3 → 2 / 4 → 2 / 5 → 1 / 6+ → 0
    const targetCount = eid ? Math.max(0, Math.min(5, 6 - clueCount)) : 0;
    const shouldShow = targetCount > 0 && eid;

    els.glitchSection.hidden = !shouldShow;
    if (!shouldShow) { els.articleGlitch.innerHTML = ''; return; }

    // 매번 셔플해서 다른 카피가 보이도록 — 같은 화면 안에선 중복 없음
    const pool = GLITCH_VARIANTS.slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    let html = '';
    for (let i = 0; i < targetCount; i++) {
      const variant = pool[i % pool.length];
      html += `
        <div class="ac-clue ac-glitch"
             draggable="true"
             data-clue-event="${eid}"
             data-clue-glitch="${i}"
             data-clue-axis="any">
          <div class="ac-clue-meta">
            <span class="ac-clue-type">UNKNOWN</span>
            <span class="ac-clue-axis">??? 도박</span>
          </div>
          <div class="ac-clue-summary">${escapeHTML(variant)}</div>
        </div>`;
    }
    els.articleGlitch.innerHTML = html;
  }

  // 슬롯에 사용된 단서인지 체크
  function isClueUsedInDraft(eventId, clueIdx) {
    return Object.values(articleDraft.slots).some(slot =>
      slot.clue && slot.clue.eventId === eventId && slot.clue.index === clueIdx && !slot.clue.glitch
    );
  }

  // 슬롯 UI 초기화 (placeholder 표시 / 다이얼 1단계)
  function resetSlotUI() {
    els.articleSlots.forEach(slot => {
      const drop = slot.querySelector('[data-slot-drop]');
      const stage = slot.querySelector('[data-stage-label]');
      const dialBtns = $$('[data-dial-step]', slot);
      const slotKey = getSlotKey(slot);

      if (drop) {
        drop.innerHTML = `<span class="afs-placeholder">${
          slot.dataset.slotType === 'photo'
            ? '수집한 사진을 끌어다 놓으세요 (선택)'
            : slot.dataset.slotType === 'headline'
              ? '단서를 끌어다 놓으세요'
              : '— 빈칸을 채워야 발행할 수 있다 —'
        }</span>`;
      }
      slot.classList.remove('filled', 'drop-target');
      slot.dataset.currentStep = '1';

      dialBtns.forEach(b => b.classList.toggle('active', b.dataset.dialStep === '1'));
      if (stage) stage.textContent = dialBtns[0]?.textContent || '사실';
    });
  }

  function getSlotKey(slotEl) {
    const type = slotEl.dataset.slotType;
    if (type === 'body') {
      return `body${slotEl.dataset.slotIndex}`;
    }
    return type;
  }

  // 다이얼 클릭 핸들러
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-dial-step]');
    if (!btn) return;
    const slot = btn.closest('.af-slot');
    if (!slot) return;

    const step = parseInt(btn.dataset.dialStep, 10);
    const slotKey = getSlotKey(slot);

    // active 토글
    $$('[data-dial-step]', slot).forEach(b =>
      b.classList.toggle('active', b === btn)
    );
    slot.dataset.currentStep = String(step);

    // 라벨 갱신
    const stage = slot.querySelector('[data-stage-label]');
    if (stage) stage.textContent = btn.textContent;

    // articleDraft에 반영
    if (articleDraft.slots[slotKey]) {
      articleDraft.slots[slotKey].dialStep = step;
    }

    updatePreview();
  });

  // 사건 선택 변경
  els.eventSelect?.addEventListener('change', (e) => {
    articleDraft.eventId = e.target.value || null;
    // 슬롯 초기화 (다른 사건의 단서가 들어 있으면 안 됨)
    Object.keys(articleDraft.slots).forEach(k => {
      articleDraft.slots[k].clue = null;
    });
    resetSlotUI();
    renderArticleClues();
    renderArticlePhotos();
    updatePreview();
  });

  // ─────────────────────────────────────────────
  //  Article — calculate effects (preview / publish 공용)
  // ─────────────────────────────────────────────
  const SLOT_AXIS = {
    headline: 'headline', body1: 'body', body2: 'body', body3: 'body', photo: 'photo'
  };

  function calculateArticleEffects() {
    const event = articleDraft.eventId ? getEvent(articleDraft.eventId) : null;

    let viewMul = 1.0;
    let trustDelta = 0;
    let exposureAdd = 0;
    let conscienceDelta = 0;
    let fakeSlotCount = 0;
    let glitchUsed = false;
    const usedClues = [];

    Object.entries(articleDraft.slots).forEach(([key, slot]) => {
      if (!slot.clue) return;  // 빈 슬롯은 계산에서 제외

      const axis = SLOT_AXIS[key];
      const dialEffect = DATA.sensationDial[axis]?.[slot.dialStep - 1];
      if (!dialEffect) return;

      viewMul         *= dialEffect.viewMul;
      trustDelta      += dialEffect.trustDelta;
      exposureAdd     += dialEffect.exposureAdd;
      conscienceDelta += dialEffect.conscienceDelta;

      if (slot.dialStep >= 3) fakeSlotCount += 1;

      if (slot.clue.glitch !== undefined) glitchUsed = true;
      else usedClues.push(slot.clue);
    });

    // 특종(스쿱) 보너스 — 본문 슬롯에 *3종 이상 다른 출처*를 섞으면 발동
    // 출처 다양성 = 모순된 단서를 균형있게 다룬 보도. 신뢰도·조회수 모두 상승.
    const bodyClueTypes = new Set();
    let falseClueCount = 0;     // 거짓 정보(truthValue < 0.4) 사용 건수
    ['body1', 'body2', 'body3'].forEach(key => {
      const slot = articleDraft.slots[key];
      if (slot?.clue && !slot.clue.glitch) {
        if (slot.clue.type) bodyClueTypes.add(slot.clue.type);
        const tv = (typeof slot.clue.truthValue === 'number') ? slot.clue.truthValue : 1.0;
        if (tv < 0.4) falseClueCount++;
      }
    });
    const isScoop = bodyClueTypes.size >= 3;
    if (isScoop) {
      viewMul    *= 1.30;
      trustDelta += 5;
      exposureAdd -= 0.05;
    }
    // 거짓 정보 본문 사용 시 — 발각 확률 +10%/건, 신뢰도 -2/건 (발각 시)
    if (falseClueCount > 0) {
      exposureAdd += 0.10 * falseClueCount;
      trustDelta -= 2 * falseClueCount;
    }

    // 베이스 조회수 — 사건의 트랙 중 최대 expectedViews
    const baseViews = event ? Math.max(...event.tracks.map(t => t.expectedViews)) : 30000;
    const earnedViews = Math.round(baseViews * viewMul);
    const divisor = DATA.gauges.balance.earningsDivisor || 200;
    const earnedBalance = Math.round(earnedViews / divisor); // 안전 기사 = 빈곤, 자극 기사 = 흑자

    // 발각 확률
    let exposureProb = 0;
    if (fakeSlotCount > 0) {
      exposureProb = DATA.exposure.baseProb + exposureAdd;

      const heat = ({
        small: 0, medium: 0.03, large: 0.06, viral: 0.10
      })[event?.potentialViews || 'medium'] || 0;
      exposureProb += heat;

      if (state.gauges.credibility >= 70) exposureProb -= 0.05;
      if (usedClues.some(c => c.type === 'sigil')) exposureProb -= 0.03;

      exposureProb = Math.max(0.01, Math.min(0.95, exposureProb));
    }

    return {
      viewMul, earnedViews, earnedBalance,
      trustDelta, exposureAdd, conscienceDelta,
      fakeSlotCount, glitchUsed, usedClues,
      exposureProb,
      isScoop, bodyClueTypeCount: bodyClueTypes.size,
      falseClueCount,
    };
  }

  function updatePreview() {
    if (!els.previewStatus) return;

    if (!articleDraft.eventId) {
      els.previewStatus.textContent = '대상 사건이 없습니다. 휴재하거나 다음 주에 다시 도전하세요.';
      els.previewStatus.classList.remove('warn');
      if (els.publishBtn) els.publishBtn.disabled = true;
      ['previewViews','previewTrust','previewExposure','previewConscience'].forEach(k => {
        if (els[k]) els[k].textContent = '—';
      });
      return;
    }

    const requiredKeys = ['headline','body1','body2','body3'];
    const missingCount = requiredKeys.filter(k => !articleDraft.slots[k].clue).length;
    const calc = calculateArticleEffects();

    if (missingCount > 0) {
      els.previewStatus.innerHTML = `빈 슬롯 ${missingCount}개. <em>채우거나 짧은 기사로 발행</em>해야 합니다.`;
      els.previewStatus.classList.toggle('warn', missingCount >= 3);
      if (els.publishBtn) els.publishBtn.disabled = true;
    } else {
      const fakeSummary = calc.fakeSlotCount === 0
        ? '정직한 기사. 발각 위험 거의 0%.'
        : `조작 슬롯 ${calc.fakeSlotCount}개. 발각 시 신뢰도 ${(-10 - calc.fakeSlotCount * 5)} 페널티.`;
      const scoopBadge = calc.isScoop
        ? `<div class="ap-scoop-badge">⚡ 특종 보너스 — 출처 ${calc.bodyClueTypeCount}종 교차 (조회수 ×1.3, 신뢰도 +5)</div>`
        : '';
      els.previewStatus.innerHTML = scoopBadge + fakeSummary;
      els.previewStatus.classList.toggle('warn', calc.fakeSlotCount >= 3);
      els.previewStatus.classList.toggle('scoop', !!calc.isScoop);
      if (els.publishBtn) els.publishBtn.disabled = false;
      if (calc.isScoop) showTutorial('scoop', 400);
    }

    if (els.previewViews) {
      els.previewViews.textContent = `${formatViews(calc.earnedViews)} · ₩${calc.earnedBalance}`;
    }
    if (els.previewTrust) {
      els.previewTrust.textContent = (calc.trustDelta >= 0 ? '+' : '') + calc.trustDelta;
    }
    if (els.previewExposure) {
      const pct = Math.round(calc.exposureProb * 100);
      els.previewExposure.textContent = pct + '%';
      els.previewExposure.dataset.previewExposure = pct + '%';
    }
    if (els.previewConscience) {
      els.previewConscience.textContent = (calc.conscienceDelta >= 0 ? '+' : '') + calc.conscienceDelta;
    }
  }

  // ─────────────────────────────────────────────
  //  Drag & Drop — clue → slot
  // ─────────────────────────────────────────────
  let draggedClue = null;

  document.addEventListener('dragstart', (e) => {
    // 사진 카드 드래그 (사진 슬롯 전용)
    const photoEl = e.target.closest('.ac-photo');
    if (photoEl && !photoEl.classList.contains('used')) {
      draggedClue = {
        el: photoEl,
        eventId: photoEl.dataset.photoEvent,
        photoId: photoEl.dataset.photoId,
        type: 'photo',
        axis: 'photo',
      };
      photoEl.classList.add('dragging');
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', draggedClue.eventId); } catch (_) {}
      }
      return;
    }

    const clueEl = e.target.closest('.ac-clue');
    if (!clueEl || clueEl.classList.contains('used')) return;

    draggedClue = {
      el: clueEl,
      eventId: clueEl.dataset.clueEvent,
      index: clueEl.dataset.clueIndex !== undefined ? parseInt(clueEl.dataset.clueIndex, 10) : null,
      glitch: clueEl.dataset.clueGlitch !== undefined ? parseInt(clueEl.dataset.clueGlitch, 10) : null,
      type: clueEl.dataset.clueType,
      axis: clueEl.dataset.clueAxis,
    };
    clueEl.classList.add('dragging');
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', draggedClue.eventId); } catch (_) {}
    }
  });

  document.addEventListener('dragend', () => {
    $$('.ac-clue.dragging, .ac-photo.dragging').forEach(c => c.classList.remove('dragging'));
    $$('.af-slot.drop-target').forEach(s => s.classList.remove('drop-target'));
    draggedClue = null;
  });

  document.addEventListener('dragover', (e) => {
    if (!draggedClue) return;
    const slot = e.target.closest('.af-slot');
    if (!slot) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    slot.classList.add('drop-target');
  });

  document.addEventListener('dragleave', (e) => {
    const slot = e.target.closest('.af-slot');
    if (slot && !slot.contains(e.relatedTarget)) {
      slot.classList.remove('drop-target');
    }
  });

  document.addEventListener('drop', (e) => {
    if (!draggedClue) return;
    const slot = e.target.closest('.af-slot');
    if (!slot) return;
    e.preventDefault();
    fillSlot(slot, draggedClue);
    $$('.af-slot.drop-target').forEach(s => s.classList.remove('drop-target'));
    draggedClue = null;
  });

  function fillSlot(slotEl, clueData) {
    const slotKey = getSlotKey(slotEl);
    const slotType = slotEl.dataset.slotType;
    const isPhotoDrag = clueData.axis === 'photo';

    // 사진 슬롯에는 사진만 / 그 외 슬롯에는 사진 못 넣음 — 양방향 차단
    if (slotType === 'photo' && !isPhotoDrag) {
      showToast('사진 슬롯에는 수집한 사진 자료만 들어간다.');
      return;
    }
    if (slotType !== 'photo' && isPhotoDrag) {
      showToast('사진은 사진 슬롯에만 넣을 수 있다.');
      return;
    }

    // 단서 객체 구성
    let clue;
    if (isPhotoDrag) {
      const photo = getPhotoById(clueData.eventId, clueData.photoId);
      if (!photo) return;
      clue = {
        eventId: clueData.eventId,
        photoId: clueData.photoId,
        type: 'photo',
        filename: photo.filename,
        caption: photo.caption || '',
        summary: photo.caption || '사진 자료',
      };
    } else if (clueData.glitch !== null && clueData.glitch !== undefined) {
      clue = {
        eventId: clueData.eventId,
        glitch: clueData.glitch,
        type: 'glitch',
        summary: '??? — 사용 후에야 결정된다',
      };
    } else {
      const original = state.clueInventory[clueData.eventId]?.[clueData.index];
      if (!original) return;
      clue = {
        eventId: clueData.eventId,
        index:   clueData.index,
        type:    original.type,
        summary: original.summary,
      };
    }

    articleDraft.slots[slotKey].clue = clue;
    slotEl.classList.add('filled');

    const drop = slotEl.querySelector('[data-slot-drop]');
    if (drop) {
      if (clue.type === 'photo') {
        drop.innerHTML = `
          <div class="afs-photo-content">
            <img src="images/cases/${clue.filename}" alt="${escapeHTML(clue.caption || '')}"
                 onerror="this.style.display='none';this.nextElementSibling.hidden=false;" />
            <span class="afs-photo-fallback" hidden>NO IMG</span>
            <div class="afs-photo-cap">${escapeHTML((clue.caption || '').slice(0, 80))}</div>
          </div>
          <button class="afs-clear" data-clear-slot title="비우기" type="button">×</button>`;
      } else {
        drop.innerHTML = `
          <div class="afs-content">
            <span class="afs-content-meta">${escapeHTML(clue.type)}</span>
            ${escapeHTML(clue.summary)}
          </div>
          <button class="afs-clear" data-clear-slot title="비우기" type="button">×</button>`;
      }
    }

    renderArticleClues();
    renderArticlePhotos();
    updatePreview();
  }

  // 슬롯 비우기
  document.addEventListener('click', (e) => {
    const clearBtn = e.target.closest('[data-clear-slot]');
    if (!clearBtn) return;
    const slotEl = clearBtn.closest('.af-slot');
    if (!slotEl) return;
    const slotKey = getSlotKey(slotEl);

    articleDraft.slots[slotKey].clue = null;
    slotEl.classList.remove('filled');

    const drop = slotEl.querySelector('[data-slot-drop]');
    if (drop) {
      drop.innerHTML = `<span class="afs-placeholder">${
        slotEl.dataset.slotType === 'photo' ? '수집한 사진을 끌어다 놓으세요 (선택)'
          : slotEl.dataset.slotType === 'headline' ? '단서를 끌어다 놓으세요'
          : '— 빈칸을 채워야 발행할 수 있다 —'
      }</span>`;
    }

    renderArticleClues();
    renderArticlePhotos();
    updatePreview();
  });

  // ─────────────────────────────────────────────
  //  Publish — 발행 / 짧은 기사 / 휴재
  // ─────────────────────────────────────────────
  els.publishBtn?.addEventListener('click', () => publishArticle({}));
  els.publishShortBtn?.addEventListener('click', () => publishArticle({ short: true }));
  els.publishSkipBtn?.addEventListener('click', () => publishArticle({ skip: true }));

  function publishArticle({ short = false, skip = false } = {}) {
    if (skip) {
      applyGaugeDelta({ credibility: -2 });
      closeOverlay(els.articleOverlay);
      showToast('<strong>휴재</strong>이번 주 미발행. 신뢰도 -2. 다음 주 잔고 압박이 커진다.');
      proceedToNextWeek();
      return;
    }

    if (!articleDraft.eventId) {
      showToast('대상 사건이 없다. 휴재해야 한다.');
      return;
    }

    if (short) {
      const event = getEvent(articleDraft.eventId);
      const baseViews = event ? Math.max(...event.tracks.map(t => t.expectedViews)) : 10000;
      const earnedViews = Math.round(baseViews * 0.5);
      const divisor = DATA.gauges.balance.earningsDivisor || 200;
      const earnedBalance = Math.round(earnedViews / divisor);

      applyGaugeDelta({ balance: earnedBalance });

      if (!state.completedEventIds.includes(articleDraft.eventId)) {
        state.completedEventIds.push(articleDraft.eventId);
      }
      delete state.activeEvents[articleDraft.eventId];

      closeOverlay(els.articleOverlay);
      showToast(`<strong>짧은 기사 — ${formatViews(earnedViews)} 조회</strong>거짓말은 안 했다. 잔고는 빠듯하다. (₩${earnedBalance})`);
      proceedToNextWeek();
      return;
    }

    // 일반 발행
    const required = ['headline','body1','body2','body3'];
    const missing = required.filter(k => !articleDraft.slots[k].clue);
    if (missing.length > 0) {
      showToast(`⚠ 빈 슬롯 ${missing.length}개. 짧은 기사로 발행하거나 채워주세요.`);
      return;
    }

    const calc = calculateArticleEffects();
    let glitchOutcome = null;
    let extraDelta = { trustDelta: 0, conscienceDelta: 0 };

    // 글리치 카드 사후 결정 (50/50)
    if (calc.glitchUsed) {
      glitchOutcome = Math.random() < 0.5 ? 'truth' : 'fake';
      if (glitchOutcome === 'fake') {
        const f = DATA.fillEmptySlot.glitch.ifFalse;
        extraDelta.trustDelta += f.trustDelta;
        extraDelta.conscienceDelta += f.conscienceDelta;
      }
    }

    // 게이지 적용
    applyGaugeDelta({
      balance:     calc.earnedBalance,
      credibility: calc.trustDelta + extraDelta.trustDelta,
      conscience:  calc.conscienceDelta + extraDelta.conscienceDelta,
    });
    if (state.isGameOver) {
      closeOverlay(els.articleOverlay);
      return;
    }

    // 발각 큐 등록
    let exposureScheduled = false;
    let effectiveFakeCount = calc.fakeSlotCount + (glitchOutcome === 'fake' ? 1 : 0);
    let effectiveExposureProb = calc.exposureProb;
    if (glitchOutcome === 'fake') {
      effectiveExposureProb = Math.min(0.95, effectiveExposureProb + 0.20);
    }

    if (effectiveFakeCount > 0 && Math.random() < effectiveExposureProb) {
      queueExposure({
        eventId: articleDraft.eventId,
        eventTitle: getEvent(articleDraft.eventId)?.title || '',
        fakeSlotCount: effectiveFakeCount,
        glitchOutcome,
      });
      exposureScheduled = true;
    }

    // 사건 종료 + 기록
    if (!state.completedEventIds.includes(articleDraft.eventId)) {
      state.completedEventIds.push(articleDraft.eventId);
    }
    delete state.activeEvents[articleDraft.eventId];

    const publishedArticle = {
      day: state.day,
      week: state.week,
      eventId: articleDraft.eventId,
      eventTitle: getEvent(articleDraft.eventId)?.title || '',
      fakeSlotCount: effectiveFakeCount,
      earnedViews: calc.earnedViews,
      glitchOutcome,
      exposed: false,
    };
    state.publishedArticles.push(publishedArticle);

    // 과거 보도의 망령 — 가짜 발행 시 후폭풍 예약 (피해자 운명이 다음 주에 따라옴)
    scheduleGhostConsequences(publishedArticle);

    closeOverlay(els.articleOverlay);

    // 알림 — 단계별
    showToast(
      `<strong>발행 — ${formatViews(calc.earnedViews)} 조회 · ₩${calc.earnedBalance}</strong>${
        effectiveFakeCount > 0
          ? (exposureScheduled ? '발각이 예약되었다 (다음 주).' : '운 좋게 발각 안 됨.')
          : '정직한 기사. 신뢰도 ↑'
      }`,
      4500
    );

    if (calc.glitchUsed) {
      setTimeout(() => {
        showToast(
          `<strong>지지직 단서 결과</strong>${
            glitchOutcome === 'truth'
              ? '진실이었다. 다행이다.'
              : '날조였다. 양심·신뢰도 추가 페널티 + 발각 위험 ↑'
          }`,
          4500
        );
      }, 1500);
    }

    // 거짓 정보 사용 — 사후 공개 (발행 후 비로소 알게 됨)
    if (calc.falseClueCount > 0) {
      setTimeout(() => {
        showToast(
          `<strong>⚠ 사실이 아닌 자료 ${calc.falseClueCount}건 사용됨</strong>본문에 들어간 정보 중 일부가 사실과 달랐다. 발각 위험 ↑, 양심 -${2 * calc.falseClueCount}.`,
          5500
        );
        applyGaugeDelta({ conscience: -2 * calc.falseClueCount });
      }, 2400);
    }

    // 독자 댓글 스트림 → 닫기 후 다음 주로 진행
    setTimeout(() => {
      showCommentStream(publishedArticle, { exposureScheduled }, () => {
        proceedToNextWeek();
      });
    }, 1800);
  }

  function proceedToNextWeek() {
    // 금요일 → 토요일 → 일요일 → 다음 주 월요일
    // 단순화: 금요일 발행 후 다음 endDay 한 번이 토요일.
    // 사용자가 END DAY 두 번 더 눌러야 월요일.
    // 자동 점프하지 않음 — 사용자가 주말을 *경험* 하게.
    endDay();
  }

  // ─────────────────────────────────────────────
  //  Ending system — events / finale / epilogue
  // ─────────────────────────────────────────────
  function checkEndingEvent() {
    // 매주 일요일 밤 (월요일로 넘어가는 시점) 호출
    // forceTriggerNextWeek 가 켜져 있으면 무조건 매칭 점수 최고 이벤트 트리거
    if (state.forceTriggerNextWeek) {
      state.forceTriggerNextWeek = false;
      const top = pickTopEvent(calculateEventMatchScores());
      if (top) { triggerEndingEvent(top); return true; }
    }

    const probs = DATA.endingProbabilityByWeek || [];
    const idx = Math.min(state.week, probs.length - 1);
    let baseProb = probs[idx] || 0;
    if (state.endingEventBoosted) {
      baseProb = Math.min(1, baseProb + 0.20);
      state.endingEventBoosted = false;
    }
    if (baseProb <= 0) return false;
    if (Math.random() >= baseProb) return false;

    const top = pickTopEvent(calculateEventMatchScores());
    if (!top) return false;
    triggerEndingEvent(top);
    return true;
  }

  function pickTopEvent(scores) {
    const entries = Object.entries(scores)
      .filter(([, s]) => s > 0)
      .sort((a, b) => b[1] - a[1]);
    return entries[0]?.[0] || null;
  }

  function calculateEventMatchScores() {
    const articles = state.publishedArticles;
    const totalDenom = Math.max(1, articles.length);
    const fakeArticles    = articles.filter(a => (a.fakeSlotCount || 0) > 0).length;
    const honestArticles  = articles.filter(a => (a.fakeSlotCount || 0) === 0).length;
    const exposedCount    = articles.filter(a => a.exposed).length;
    const scoopCount      = articles.filter(a =>
      (a.fakeSlotCount || 0) === 0 && (a.earnedViews || 0) >= 60000
    ).length;

    const fakeRate    = fakeArticles   / totalDenom;
    const honestyRate = honestArticles / totalDenom;
    const balance     = state.gauges.balance;
    const conscience  = state.gauges.conscience;
    const week        = state.week;
    const weekFactor  = Math.min(1, week / 7);
    const idleFactor  = Math.max(0, 1 - articles.length / Math.max(1, week));

    const scores = {};
    // 왕의 자리 — 부유한 가짜뉴스 제국 분기
    scores.kings_seat = (balance / 1000) * (1 - conscience / 100) * fakeRate;
    // 마지막 한 줄 — 정직한 빈곤 분기
    scores.last_line  = (conscience / 100) * Math.max(0, 1 - balance / 1000) * honestyRate;
    // 법정에 서다 — 발각 누적
    scores.in_court   = (exposedCount / 5) * weekFactor;
    // 퓰리처 — 정직 + 특종
    scores.pulitzer   = (conscience / 100) * (scoopCount / 3) * honestyRate;
    // 거울 속의 나 — 양심 매우 낮음
    const lowFactor   = Math.pow(Math.max(0, 1 - conscience / 100), 2);
    scores.mirror     = lowFactor * (conscience <= 10 ? 1.5 : 1);
    // 권태의 끝 — 5주차 이후
    if (week >= 5) {
      scores.end_of_tedium = (week / 7) * idleFactor;
    }
    return scores;
  }

  function triggerEndingEvent(eventId) {
    const ev = DATA.endingEvents[eventId];
    if (!ev) return;
    state.currentEndingEvent = eventId;
    renderEndingEventPhase(eventId);
    openOverlay(els.endingOverlay);
  }

  function endingEventIcon(name) {
    const icons = {
      wineglass: `<svg viewBox="0 0 60 60"><g filter="url(#wobble)" fill="none" stroke="currentColor" stroke-width="2"><path d="M 18 12 L 42 12 L 38 30 Q 30 38 22 30 Z"/><line x1="30" y1="38" x2="30" y2="50"/><line x1="20" y1="52" x2="40" y2="52" stroke-width="2.5"/></g></svg>`,
      newspaper: `<svg viewBox="0 0 60 60"><g filter="url(#wobble)" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="10" width="44" height="40"/><line x1="8" y1="22" x2="52" y2="22"/><line x1="14" y1="30" x2="46" y2="30"/><line x1="14" y1="36" x2="40" y2="36"/><line x1="14" y1="42" x2="46" y2="42"/></g></svg>`,
      scales:    `<svg viewBox="0 0 60 60"><g filter="url(#wobble)" fill="none" stroke="currentColor" stroke-width="2"><line x1="30" y1="10" x2="30" y2="50"/><line x1="14" y1="14" x2="46" y2="14"/><line x1="20" y1="52" x2="40" y2="52"/><path d="M 14 14 L 8 28 L 20 28 Z"/><path d="M 46 14 L 40 28 L 52 28 Z"/></g></svg>`,
      trophy:    `<svg viewBox="0 0 60 60"><g filter="url(#wobble)" fill="none" stroke="currentColor" stroke-width="2"><path d="M 18 10 L 42 10 L 40 30 Q 30 38 20 30 Z"/><path d="M 18 14 Q 10 14 10 22 Q 10 28 18 28"/><path d="M 42 14 Q 50 14 50 22 Q 50 28 42 28"/><line x1="30" y1="38" x2="30" y2="46"/><line x1="20" y1="48" x2="40" y2="48" stroke-width="2.5"/></g></svg>`,
      mirror:    `<svg viewBox="0 0 60 60"><g filter="url(#wobble)" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="30" cy="26" rx="18" ry="22"/><line x1="30" y1="48" x2="30" y2="54"/><line x1="22" y1="54" x2="38" y2="54"/></g></svg>`,
      fog:       `<svg viewBox="0 0 60 60"><g filter="url(#wobble)" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="20" x2="40" y2="20"/><line x1="14" y1="28" x2="52" y2="28"/><line x1="6" y1="36" x2="38" y2="36"/><line x1="18" y1="44" x2="50" y2="44"/></g></svg>`,
    };
    return icons[name] || icons.fog;
  }

  function renderEndingEventPhase(eventId) {
    const ev = DATA.endingEvents[eventId];
    if (!els.endingShell) return;
    els.endingShell.dataset.phase = 'event';
    els.endingShell.removeAttribute('data-ending');
    if (els.endingKey)      els.endingKey.textContent = `EVENT · ${eventId.toUpperCase()}`;
    if (els.endingProgress) els.endingProgress.textContent = `WEEK ${state.week}`;

    if (els.endingBody) {
      els.endingBody.innerHTML = `
        <div class="ee-icon">${endingEventIcon(ev.icon)}</div>
        <h2 class="ee-title">${escapeHTML(ev.title)}</h2>
        <p class="ee-scene">${escapeHTML(ev.scene)}</p>
        <p class="ee-narration">${escapeHTML(ev.narration)}</p>
      `;
    }

    if (els.endingActions) {
      els.endingActions.innerHTML = ev.choices.map((c, i) => `
        <button class="ee-choice" data-ee-choice="${i}">
          <span class="ee-choice-key">${String.fromCharCode(65 + i)}</span>
          <span class="ee-choice-label">${escapeHTML(c.label)}</span>
        </button>
      `).join('');
    }
  }

  function handleEndingChoice(choiceIdx) {
    const eventId = state.currentEndingEvent;
    if (!eventId) return;
    const ev = DATA.endingEvents[eventId];
    const choice = ev?.choices?.[choiceIdx];
    if (!choice) return;

    if (choice.balanceDelta) {
      applyGaugeDelta({ balance: choice.balanceDelta });
    }

    const result = choice.result;

    if (result === 'continue') {
      if (choice.nextWeekProbBoost) state.endingEventBoosted = true;
      if (choice.forceTriggerNextWeek) state.forceTriggerNextWeek = true;
      state.currentEndingEvent = null;
      closeOverlay(els.endingOverlay);

      // 거절 후엔 새 월요일 흐름 — 카드 생성 + HUD 갱신 (endDay 가 일찍 return 했으므로)
      renderHUD();
      generateTodaysCards();
      els.phone?.classList.add('alert');
      const badge = els.phone?.querySelector('.badge');
      if (badge) {
        badge.textContent = String(state.todaysCards.length);
        badge.style.display = '';
      }
      showToast('<strong>거절 — 새 월요일</strong>아무 일도 없었던 것처럼 사무실로 향한다.', 3000);
      return;
    }

    const m = /^ending_([ABCD])_(.+)$/.exec(result);
    if (m) {
      triggerFinalEnding(m[1], m[2]);
    }
  }

  function triggerFinalEnding(endKey, variant) {
    state.finalEnding = { endKey, variant };
    state.isGameOver = true;
    Audio.playMusic('ending');  // 엔딩 BGM (모든 엔딩 공통, 추후 endKey 별 분기)

    const endingDef = DATA.endings[endKey] || {};
    const text = DATA.endingTexts[`${endKey}_${variant}`] || '';

    if (els.endingShell) {
      els.endingShell.dataset.phase = 'finale';
      els.endingShell.dataset.ending = endKey;
    }
    if (els.endingKey) {
      els.endingKey.textContent = `ENDING ${endKey}${endingDef.trueEnding ? ' · TRUE' : ''}`;
    }
    if (els.endingProgress) {
      els.endingProgress.textContent = `WEEK ${state.week} · ${variant.toUpperCase()}`;
    }

    if (els.endingBody) {
      els.endingBody.innerHTML = `
        <span class="ef-tag">${endingDef.trueEnding ? 'TRUE ENDING' : 'ENDING'}</span>
        <div class="ef-id">${endKey}</div>
        <div class="ef-name">${escapeHTML(endingDef.label || '')}</div>
        <div class="ef-tagline">${escapeHTML(endingDef.tagline || '')}</div>
        <div class="ef-text">${escapeHTML(text)}</div>
      `;
    }

    if (els.endingActions) {
      els.endingActions.innerHTML = `
        <button class="ee-choice" data-ee-next>
          <span class="ee-choice-key">▶</span>
          <span class="ee-choice-label">피해자 후일담 보기</span>
        </button>
      `;
    }

    if (els.endDayBtn) els.endDayBtn.disabled = true;
  }

  function getVictimsFromArticles() {
    const out = [];
    state.publishedArticles.forEach(a => {
      const isFake = (a.fakeSlotCount || 0) > 0 || a.glitchOutcome === 'fake';
      if (!isFake) return;
      const ev = getEvent(a.eventId);
      if (!ev || !ev.victimWhenFake) return;
      const v = DATA.victims[ev.victimWhenFake];
      if (!v) return;
      out.push({ ...v, key: ev.victimWhenFake, eventTitle: ev.title });
    });
    return out;
  }

  function victimSilhouetteSVG(seed) {
    const v = seed % 6;
    const head = 18 + v;
    const r = 9 + (v % 3);
    return `
      <svg viewBox="0 0 60 60">
        <g filter="url(#wobble)" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="30" cy="${head}" r="${r}"/>
          <path d="M 12 56 Q 30 ${36 + v} 48 56"/>
          <line x1="${22 - (v % 2)}" y1="50" x2="${22 - (v % 2)}" y2="58"/>
          <line x1="${38 + (v % 2)}" y1="50" x2="${38 + (v % 2)}" y2="58"/>
        </g>
      </svg>
    `;
  }

  let epilogueTimer = null;
  function runEpilogue(endKey, variant) {
    if (epilogueTimer) { clearTimeout(epilogueTimer); epilogueTimer = null; }

    const toneKey = `${endKey}_${variant}`;
    const tone = DATA.epilogue.endingTone[toneKey]
              || DATA.epilogue.endingTone[endKey]
              || { description:'', lastFrame:'', tagline:'' };
    const victims = getVictimsFromArticles();
    const perCutMs = (DATA.epilogue.perCutSec || 1.8) * 1000;

    if (els.endingShell) {
      els.endingShell.dataset.phase = 'epilogue';
      els.endingShell.dataset.ending = endKey;
    }
    if (els.endingKey)      els.endingKey.textContent = 'EPILOGUE · 후일담';
    if (els.endingProgress) els.endingProgress.textContent = `${victims.length} 명`;
    if (els.endingActions)  els.endingActions.innerHTML = '';

    state.epilogueIndex = 0;

    if (victims.length === 0) {
      renderEpilogueLast(tone);
      return;
    }

    renderEpilogueFrame(victims[0], 0, victims.length, tone);
    const tick = () => {
      state.epilogueIndex += 1;
      if (state.epilogueIndex < victims.length) {
        renderEpilogueFrame(victims[state.epilogueIndex], state.epilogueIndex, victims.length, tone);
        epilogueTimer = setTimeout(tick, perCutMs);
      } else {
        epilogueTimer = setTimeout(() => renderEpilogueLast(tone), perCutMs);
      }
    };
    epilogueTimer = setTimeout(tick, perCutMs);
  }

  function renderEpilogueFrame(victim, idx, total, tone) {
    if (!els.endingBody) return;
    els.endingBody.innerHTML = `
      <div class="ep-tag">CUT ${String(idx + 1).padStart(2,'0')} / ${String(total).padStart(2,'0')}</div>
      <h2 class="ep-title">피해자 후일담</h2>
      <div class="ep-frame fade-in">
        <div class="ep-victim-svg">${victimSilhouetteSVG(idx)}</div>
        <div class="ep-victim-name">${escapeHTML(victim.name)}</div>
        <div class="ep-victim-after">${escapeHTML(victim.after)}</div>
      </div>
      <p class="ep-narration">${escapeHTML(tone.description || '')}</p>
    `;
  }

  function renderEpilogueLast(tone) {
    if (!els.endingBody) return;
    els.endingBody.innerHTML = `
      <div class="ep-tag">FINAL FRAME</div>
      <h2 class="ep-title">${escapeHTML(tone.tagline || '')}</h2>
      <div class="ep-frame fade-in">
        <div class="ep-victim-after">${escapeHTML(tone.lastFrame || '')}</div>
      </div>
    `;
    if (els.endingActions) {
      els.endingActions.innerHTML = `
        <button class="ee-choice" data-ee-restart>
          <span class="ee-choice-key">↻</span>
          <span class="ee-choice-label">다시 시작</span>
        </button>
      `;
    }
  }

  // 게임오버 짧은 epilogue (잔고/신뢰도 0)
  function runGameoverEpilogue(type) {
    const short = DATA.epilogue.gameoverShort || {};
    const victims = getVictimsFromArticles();
    const text = (short[type] || '').replace('○명', `${victims.length}명`);

    openOverlay(els.endingOverlay);
    Audio.playMusic('ending');  // 게임오버 BGM
    if (els.endingShell) {
      els.endingShell.dataset.phase = 'epilogue';
      els.endingShell.dataset.ending = `gameover_${type}`;
    }
    if (els.endingKey)      els.endingKey.textContent = 'GAME OVER';
    if (els.endingProgress) els.endingProgress.textContent = type === 'bankrupt' ? '폐업' : '추방';
    if (els.endingActions)  els.endingActions.innerHTML = '';

    if (els.endingBody) {
      els.endingBody.innerHTML = `
        <div class="ep-tag">결말</div>
        <h2 class="ep-title">${escapeHTML(DATA.endings[`gameover_${type}`]?.label || '')}</h2>
        <div class="ep-frame fade-in">
          <div class="ep-victim-after">${escapeHTML(DATA.endingTexts[`gameover_${type}`] || '')}</div>
        </div>
        <p class="ep-narration">${escapeHTML(text)}</p>
      `;
    }

    setTimeout(() => {
      if (els.endingActions) {
        els.endingActions.innerHTML = `
          <button class="ee-choice" data-ee-restart>
            <span class="ee-choice-key">↻</span>
            <span class="ee-choice-label">다시 시작</span>
          </button>
        `;
      }
    }, (short.lengthSec || 9) * 1000);
  }

  // 엔딩 모달 클릭 — 선택지 / 다음 / 재시작 위임
  document.addEventListener('click', (e) => {
    const choiceBtn = e.target.closest('[data-ee-choice]');
    if (choiceBtn) {
      handleEndingChoice(Number(choiceBtn.dataset.eeChoice));
      return;
    }
    const nextBtn = e.target.closest('[data-ee-next]');
    if (nextBtn) {
      const fe = state.finalEnding;
      if (fe) runEpilogue(fe.endKey, fe.variant);
      return;
    }
    const restartBtn = e.target.closest('[data-ee-restart]');
    if (restartBtn) {
      window.location.reload();
    }
  });

  // 토요일 컷씬 → 일요일 + 월요일까지 한 번에 점프 (암전 사이)
  function jumpToMonday() {
    if (state.isGameOver) return;
    if (els.daybreakOverlay && !els.daybreakOverlay.hidden) return;

    // 토→일→월 (사건 수명 -2, 주차 +1)
    state.day += 2;
    state.dayOfWeek = 1;
    state.week += 1;
    state.timeLabel = TIME_BY_DAY[0];
    state.slotsRemaining = state.slotsTotal;
    state.trackedToday = [];
    Object.entries(state.activeEvents).forEach(([id, info]) => {
      if (id === state.weeklyCase) return; // 주간 보도 사건은 만료 안 함
      info.daysLeft -= 2;
      if (info.daysLeft <= 0) {
        delete state.activeEvents[id];
        if (!state.completedEventIds.includes(id)) state.completedEventIds.push(id);
      }
    });

    showDaybreak(() => {
      if (state.isGameOver) return;
      const fixedCost = DATA.gauges.balance.weeklyFixedCost;
      applyGaugeDelta({ balance: -fixedCost });
      setTimeout(() => {
        showToast(
          `<strong>주간 고정비 -₩${fixedCost}</strong>사무실 임대료·아내 송금·식비. 잔고가 빠진다.`,
          3500
        );
      }, 600);
      if (state.isGameOver) return;
      if (checkEndingEvent()) return;

      // 새 주차 — 게시판 리셋
      state.weeklyCasePicked = false;
      state.weeklyCase = null;

      renderHUD();
      triggerScheduledExposures();
      triggerScheduledConsequences();    // 과거 보도의 망령 — 시간 차 후폭풍
      if (state.isGameOver) return;

      // 폰 이벤트 — 주말 점프 후에도 굴림
      rollDailyPhoneEvents();

      // 월요일 — 게시판 자동 표시 (사건 선택)
      showBulletinBoard();
    });
  }

  // ─────────────────────────────────────────────
  //  Card click → 상세 모달 (서론 + 결정)
  // ─────────────────────────────────────────────
  document.addEventListener('click', (e) => {
    const cta = e.target.closest('[data-track-start]');
    if (!cta) return;
    const article = cta.closest('article.card');
    if (!article) return;
    Audio.playSfx('cardClick');
    const eventId = article.dataset.eventId;
    const method = article.dataset.method;
    const card = state.todaysCards.find(c => c.eventId === eventId && c.method === method);
    if (card) showInvestigationDetail(card);
  });

  // 추적 취소 버튼 — 이미 시작한 카드를 다시 클릭
  document.addEventListener('click', (e) => {
    const cta = e.target.closest('[data-track-cancel]');
    if (!cta) return;
    const article = cta.closest('article.card');
    if (!article) return;
    Audio.playSfx('cardClick');
    const eventId = article.dataset.eventId;
    const method = article.dataset.method;
    const card = state.todaysCards.find(c => c.eventId === eventId && c.method === method);
    if (card) cancelTracking(card);
  });

  // 상세 모달의 "조사 시작" 클릭 → 실제 트래킹
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-invest-confirm]');
    if (!btn) return;
    Audio.playSfx('cardClick');
    const card = state.pendingInvestigation;
    if (!card) return;
    closeOverlay(els.investOverlay);
    state.pendingInvestigation = null;
    startTracking(card);
  });

  // ─────────────────────────────────────────────
  //  Demo presets (1~5 keys)
  // ─────────────────────────────────────────────
  const PRESETS = {
    '1': { conscienceTier:'high',   balanceTier:'high', credibilityTier:'trusted',
           consciencePhoto:'upright',     sceneTone:'stable',    label:'안정 — 양심↑ 재력↑ 신뢰↑' },
    '2': { conscienceTier:'high',   balanceTier:'low',  credibilityTier:'normal',
           consciencePhoto:'tilted',      sceneTone:'stable',    label:'가난한 정직 — 양심↑ 재력↓' },
    '3': { conscienceTier:'low',    balanceTier:'high', credibilityTier:'suspicious',
           consciencePhoto:'halfCovered', sceneTone:'fraying',   label:'부유한 타락 — 양심↓ 재력↑' },
    '4': { conscienceTier:'low',    balanceTier:'low',  credibilityTier:'suspicious',
           consciencePhoto:'fullyCovered',sceneTone:'fraying',   label:'추락 — 양심↓ 재력↓' },
    '5': { conscienceTier:'lowest', balanceTier:'low',  credibilityTier:'suspicious',
           consciencePhoto:'facedown',    sceneTone:'collapsed', label:'최악 — 양심 0' },
  };

  // 데모: 0 키 — 현재 게이지/기록 기반으로 강제 엔딩 이벤트 트리거
  document.addEventListener('keydown', (e) => {
    if (e.key !== '0') return;
    const top = pickTopEvent(calculateEventMatchScores())
             || Object.keys(DATA.endingEvents)[0];
    if (top) triggerEndingEvent(top);
  });

  document.addEventListener('keydown', (e) => {
    const preset = PRESETS[e.key];
    if (!preset) return;

    state.conscienceTier  = preset.conscienceTier;
    state.balanceTier     = preset.balanceTier;
    state.credibilityTier = preset.credibilityTier;

    if (els.family) els.family.dataset.conscience = preset.consciencePhoto;
    if (els.scene)  els.scene.dataset.conscience  = preset.sceneTone;
    if (els.phoneShell) els.phoneShell.dataset.conscience = preset.sceneTone;

    refreshThreadPreviews();

    // 현재 보고 있는 채팅이면 다시 렌더
    const activeChat = $('.phone-app.chat-app:not([hidden])');
    if (activeChat) {
      const who = activeChat.dataset.app.replace('chat-', '');
      renderChat(who);
    }
    const activeApp = $('.phone-app:not([hidden])');
    if (activeApp) {
      const a = activeApp.dataset.app;
      if (a === 'gallery') renderGallery();
      if (a === 'news')    renderNews();
      if (a === 'sns')     renderSNS();
      if (a === 'archive') renderArchive();
    }

    showToast(`<strong>DEMO</strong>${preset.label}`);
  });

  // ─────────────────────────────────────────────
  //  Init
  // ─────────────────────────────────────────────
  function init() {
    Audio.init();
    initSettingsPanel();
    recomputeTiers();
    syncIndirectExpression();
    renderHUD();
    refreshThreadPreviews();
    renderDevPanel();   // TEST 패널 — 첫 화면부터 게이지 표시

    refreshPhoneBadge();   // 홈 앱 타일 배지 초기화 (시작 시 0)

    // 첫 게임 시작 — 월요일 게시판 자동 표시 (잠시 지연 후)
    if (state.dayOfWeek === 1 && !state.weeklyCasePicked) {
      setTimeout(() => showBulletinBoard(), 500);
    }

    console.log(
      '%cFILTERED · v2',
      'font: 700 16px Pretendard; color: #0e0e0e; background: #f4ecd8; padding: 4px 10px;'
    );
    console.log(
      '%c` → DEV 패널 / ↑↓ 양심±10 / ←→ 재력±200 / +- 신뢰±10 / 1~5 → 프리셋 / 0 → 엔딩 이벤트 / END DAY → 다음날',
      'color: #5a5a5a; font-style: italic; font-size: 11px;'
    );
    console.log(
      '%cstate (디버깅용):',
      'color: #5a5a5a; font-size: 10px;', state
    );
  }

  // 디버깅 — 콘솔에서 state 접근 가능
  window.FILTERED_STATE = state;

  init();
})();

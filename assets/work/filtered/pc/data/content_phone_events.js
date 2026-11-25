/* ============================================================
   FILTERED · 폰 이벤트 데이터 — 트리거 기반 메시지
   각 이벤트는 조건 충족 시 inbox 에 들어감, 사용자가 선택지로 응답
   ============================================================ */
(function () {
  if (!window.FILTERED_DATA) return;

  // ── 발신자 메타 (정적 스레드의 이름과 일치) ──
  window.FILTERED_DATA.phoneEventSenders = {
    wife:     { name: '아내',         tone: 'family', avatar: '아' },
    daughter: { name: '딸 (8살)',     tone: 'family', avatar: '딸' },
    friend:   { name: '김 기자 (친구)', tone: 'friend', avatar: '김' },
    editor:   { name: '편집장',       tone: 'work',   avatar: '編' },
    rival:    { name: '경쟁 매체 기자', tone: 'work',   avatar: '紙' },
    anon:     { name: '모르는 번호',  tone: 'anon',   avatar: '?' },
    fan:      { name: '독자 ○○',     tone: 'anon',   avatar: '○' },
    family_member:{ name: '장모님',   tone: 'family', avatar: '장' }
  };

  /*
   * 이벤트 구조
   *   id           — unique
   *   thread       — sender key (위 senders 참조)
   *   trigger      — { type, op, value, minWeek?, onceOnly?, cooldownDays? }
   *                  type: balance | conscience | credibility | fakeCount | exposedCount | jackpotCount | week | dayOfWeek
   *                  op:   lt | lte | gte | gt | eq
   *   incoming     — 받은 메시지 배열 (string)
   *   choices      — 응답 선택지 [{ label, effect, reply? }]
   *                  effect: { conscience, balance, credibility } 게이지 변동
   *                  reply: 응답 후 이어지는 추가 메시지 (선택)
   */
  window.FILTERED_DATA.phoneEvents = [
    // ════════ 잔고 압박 ════════
    {
      id: 'wife_card_bill',
      thread: 'wife',
      trigger: { type: 'balance', op: 'lt', value: 800, minWeek: 2, onceOnly: true },
      incoming: [
        '여보 이번 달 카드값 봤어?',
        '관리비도 미납이래',
        '저녁에 얘기 좀 하자'
      ],
      choices: [
        { label: '응 이따 봐', effect: {}, reply: ['응 알겠어'] },
        { label: '미안 마감 끝나고', effect: { conscience: -2 }, reply: ['...알겠어'] },
        { label: '돈 걱정 마. 곧 들어와', effect: { conscience: -3 }, reply: ['그래... 그렇게 말해주니 다행이네'] }
      ]
    },
    {
      id: 'wife_emergency',
      thread: 'wife',
      trigger: { type: 'balance', op: 'lt', value: 300, minWeek: 3, onceOnly: true },
      incoming: [
        '여보. 나 무서워',
        '관리비 독촉장이 또 왔어',
        '우리 어떻게 해야 돼?'
      ],
      choices: [
        { label: '내가 해결할게', effect: { conscience: -3 }, reply: ['...정말이지?'] },
        { label: '엄마 집에 가 있어', effect: { conscience: -5, credibility: -1 }, reply: ['...그래'] },
        { label: '미안해', effect: { conscience: -2 }, reply: ['됐어. 일이나 잘해'] }
      ]
    },
    {
      id: 'family_member_loan',
      thread: 'family_member',
      trigger: { type: 'balance', op: 'lt', value: 500, minWeek: 3, onceOnly: true },
      incoming: [
        '○○ 서방',
        '딸한테서 들었어. 사정이 좀 힘들다고',
        '필요하면 말해. 나도 많지는 않지만'
      ],
      choices: [
        { label: '괜찮습니다 어머님', effect: { conscience: 2 }, reply: ['그래... 잘 해결하길'] },
        { label: '죄송합니다', effect: { conscience: -2 }, reply: ['괜찮다. 사위는 가족이니까'] }
      ]
    },

    // ════════ 양심 하락 ════════
    {
      id: 'daughter_when_home',
      thread: 'daughter',
      trigger: { type: 'conscience', op: 'lt', value: 60, minWeek: 2, cooldownDays: 4 },
      incoming: [
        '아빠 집에 언제 와?',
        '엄마가 자래'
      ],
      choices: [
        { label: '미안. 곧 갈게', effect: { conscience: -1 }, reply: ['응 ㅠㅠ'] },
        { label: '아빠 일이 늦어. 먼저 자', effect: { conscience: -3 }, reply: ['...'] },
        { label: '아빠 마감이야. 미안', effect: { conscience: -2 }, reply: ['응. 알겠어'] }
      ]
    },
    {
      id: 'daughter_school',
      thread: 'daughter',
      trigger: { type: 'conscience', op: 'lt', value: 40, minWeek: 3, cooldownDays: 5 },
      incoming: [
        '아빠',
        '학교에서 친구가 아빠 욕했어',
        '아빠 거짓말쟁이래'
      ],
      choices: [
        { label: '...아빠가 미안해', effect: { conscience: -3 }, reply: ['아빠 거짓말쟁이 아니지?'] },
        { label: '아빠 일은 그런 거야', effect: { conscience: -5 }, reply: ['...'] },
        { label: '그 친구 누구야', effect: { conscience: -2 }, reply: ['...아빠 화났어?'] }
      ]
    },
    {
      id: 'daughter_silent',
      thread: 'daughter',
      trigger: { type: 'conscience', op: 'lt', value: 20, minWeek: 4, onceOnly: true },
      incoming: [
        '...',
        '아무것도 아니야'
      ],
      choices: [
        { label: '왜 그래', effect: {}, reply: ['아니야'] },
        { label: '아빠 미안', effect: {}, reply: ['응'] },
        { label: '...', effect: { conscience: -3 }, reply: [] }
      ]
    },

    // ════════ 친구 / 사회 관계 ════════
    {
      id: 'friend_dinner',
      thread: 'friend',
      trigger: { type: 'week', op: 'gte', value: 2, cooldownDays: 6, onceOnly: true },
      incoming: [
        '오랜만이다',
        '강남에 새로 생긴 갈비집 있다는데, 한 번 보자',
        '이번 주말 어때?'
      ],
      choices: [
        {
          label: '좋아. 토요일?',
          effect: { balance: -100, conscience: 2 },
          flag: { weekendPlan: 'friend_meat', scoopRoll: 0.3 },
          reply: ['콜! 8시에 보자']
        },
        { label: '미안 좀 바빠서. 다음에', effect: { conscience: -2 }, reply: ['그래 다음에 보자ㅎㅎ'] },
        { label: '돈이 없다 ㅋㅋ', effect: { conscience: -1 }, reply: ['내가 살게 임마'] }
      ]
    },
    {
      id: 'friend_warning',
      thread: 'friend',
      trigger: { type: 'exposedCount', op: 'gte', value: 1, minWeek: 3, onceOnly: true },
      incoming: [
        '야',
        '너 그 기사... 업계에서 말 많다',
        '괜찮은 거야?'
      ],
      choices: [
        { label: '괜찮아. 신경 끊어', effect: { conscience: -2 }, reply: ['...그래. 너만 조심해라'] },
        { label: '미안하다', effect: { conscience: -1, credibility: -1 }, reply: ['괜찮아. 그냥 한 번 물어본 거야'] },
        { label: '나도 모르겠다', effect: {}, reply: ['...일 마치고 술 한 잔 하자'] }
      ]
    },

    // ════════ 기사 반응 ════════
    {
      id: 'rival_same_source',
      thread: 'rival',
      trigger: { type: 'fakeCount', op: 'gte', value: 2, minWeek: 3, onceOnly: true },
      incoming: [
        '안녕하세요',
        '그 기사, 우리도 쫓고 있던 건데',
        '출처가 같던데, 한 번 보시죠'
      ],
      choices: [
        { label: '...', effect: {}, reply: ['답이 없으시네'] },
        { label: '먼저 잡은 사람이 임자죠', effect: { conscience: -3, credibility: -2 }, reply: ['...업계가 좁습니다'] },
        { label: '미안하게 됐다', effect: { credibility: -1 }, reply: ['알겠습니다'] }
      ]
    },
    {
      id: 'editor_advertiser',
      thread: 'editor',
      trigger: { type: 'exposedCount', op: 'gte', value: 1, cooldownDays: 7 },
      incoming: [
        '광고주 미팅에서 얘기 나왔다',
        '○○ 측이 정정 보도 요청 검토 중이래',
        '오늘 사무실에서 보자'
      ],
      choices: [
        { label: '네 알겠습니다', effect: {}, reply: ['오늘 안에 와라'] },
        { label: '제가 알아서 하겠습니다', effect: { credibility: -1 }, reply: ['그래. 알아서 해'] }
      ]
    },
    {
      id: 'anon_threat',
      thread: 'anon',
      trigger: { type: 'fakeCount', op: 'gte', value: 3, minWeek: 3, onceOnly: true },
      incoming: [
        '기자님',
        '다음 주 화요일 조심하시는 게 좋을 겁니다',
        '아시는 분일 겁니다'
      ],
      choices: [
        { label: '...', effect: { conscience: -2 }, reply: [] },
        { label: '누구냐', effect: {}, reply: ['답할 이유는 없습니다'] },
        { label: '신고하겠다', effect: { conscience: -1 }, reply: ['...편하실 대로'] }
      ]
    },
    {
      id: 'fan_message',
      thread: 'fan',
      trigger: { type: 'jackpotCount', op: 'gte', value: 2, minCondCheck: 'conscience>=60', onceOnly: true },
      incoming: [
        '안녕하세요 기자님',
        '이런 메시지 처음 드려봐요',
        '기자님 기사 늘 읽어요. 진실을 알려주셔서 감사합니다'
      ],
      choices: [
        { label: '감사합니다', effect: { conscience: 3 }, reply: ['앞으로도 기대할게요!'] },
        { label: '...', effect: {}, reply: [] }
      ]
    },

    // ════════ 절정 (4주차+) ════════
    {
      id: 'wife_leaves',
      thread: 'wife',
      trigger: { type: 'balance', op: 'lt', value: 200, minWeek: 4, onceOnly: true },
      incoming: [
        '여보',
        '나 며칠 엄마 집에 가 있을게',
        '딸도 데리고',
        '...같이 살아도 살이 떨어져 있는 것 같아서'
      ],
      choices: [
        { label: '미안해', effect: { conscience: -5 }, reply: ['...'] },
        { label: '잘 다녀와', effect: { conscience: -3 }, reply: ['응'] },
        { label: '...', effect: { conscience: -4 }, reply: [] }
      ]
    },
    {
      id: 'daughter_drawing',
      thread: 'daughter',
      trigger: { type: 'conscience', op: 'lt', value: 30, minWeek: 4, onceOnly: true },
      incoming: [
        '아빠',
        '학교에서 그림 그렸어요',
        '"우리 가족" 그림이래요'
      ],
      choices: [
        { label: '예쁘게 그렸겠다', effect: { conscience: 1 }, reply: ['...아빠는 안 그렸어'] },
        { label: '...', effect: { conscience: -3 }, reply: ['...'] }
      ]
    },
    {
      id: 'friend_consequence',
      thread: 'friend',
      trigger: { type: 'exposedCount', op: 'gte', value: 3, minWeek: 4, onceOnly: true },
      incoming: [
        '뉴스 봤어?',
        '○○씨가 자택에서 발견됐대',
        '네가 쓴 그 기사 인물',
        '...'
      ],
      choices: [
        { label: '...', effect: { conscience: -8 }, reply: [] },
        { label: '내 잘못 아니야', effect: { conscience: -10, credibility: -3 }, reply: ['...그래. 알겠다'] },
        { label: '미안하다', effect: { conscience: -5 }, reply: ['...'] }
      ]
    },

    // ════════ 사건 주제별 (카테고리별 페르소나 매칭) ════════
    // variants[category] 가 있는 사건만 매칭됨. 발신 페르소나가 카테고리에 맞게 자동 변경.
    // {caseTitle} 은 실행 시 치환.
    {
      id: 'victim_correction_request',
      trigger: {
        type: 'fakeCount', op: 'gte', value: 1, minWeek: 2, cooldownDays: 6,
        requiresPublishedArticle: { matchFake: true }
      },
      variants: {
        entertainment: {
          senderName: '○○ 엔터테인먼트 홍보팀',
          tone: 'work',
          incoming: [
            '안녕하세요. ○○ 엔터테인먼트 홍보팀입니다',
            '귀사의 「{caseTitle}」 보도 건으로 연락드립니다',
            '아티스트 측 사실관계와 다른 부분이 있어 정정 부탁드립니다',
            '내용에 따라 법적 대응 검토 중입니다'
          ]
        },
        politics: {
          senderName: '○○ 의원실 보좌관',
          tone: 'work',
          incoming: [
            '○○ 의원실 보좌관입니다',
            '「{caseTitle}」 보도 건, 의원님께서 직접 확인 부탁드립니다',
            '사실관계 다른 부분에 대해 정정 보도 검토 부탁드립니다'
          ]
        },
        society: {
          senderName: '피해자 가족',
          tone: 'family',
          incoming: [
            '안녕하세요',
            '지난 주 「{caseTitle}」 기사 보고 연락드립니다',
            '거기 거론된 분, 저희 가족이에요',
            '정정 부탁드립니다. 제발요'
          ]
        },
        personal: {
          senderName: '지목된 인물의 지인',
          tone: 'family',
          incoming: [
            '안녕하세요',
            '「{caseTitle}」 보도 건. 가까이서 아는 사람입니다',
            '사실관계 다른 부분이 많아요',
            '정정 부탁드립니다'
          ]
        },
        anonymous: {
          senderName: '익명 — 변호사 통해',
          tone: 'anon',
          incoming: [
            '○○ 법무법인을 통해 연락드립니다',
            '의뢰인이 「{caseTitle}」 보도로 큰 피해를 입었다는 입장입니다',
            '정정 보도 또는 합의 검토 중입니다'
          ]
        }
      },
      choices: [
        { label: '죄송합니다. 정정하겠습니다', effect: { conscience: 1, credibility: -3 }, reply: ['감사합니다. 빠른 처리 부탁드립니다'] },
        { label: '확인해보겠습니다', effect: { conscience: -1 }, reply: ['답신 기다리겠습니다'] },
        { label: '...', effect: { conscience: -3 }, reply: ['답이 없으시네요. 알겠습니다'] }
      ]
    },
    {
      id: 'lawyer_lawsuit',
      trigger: {
        type: 'fakeCount', op: 'gte', value: 2, minWeek: 3, onceOnly: true,
        requiresPublishedArticle: { matchFake: true, matchVictim: true }
      },
      variants: {
        entertainment: {
          senderName: '○○ 법무법인 (소속사 선임)',
          tone: 'work',
          incoming: [
            '안녕하세요. ○○ 법무법인입니다',
            '의뢰인은 ○○ 엔터테인먼트입니다',
            '「{caseTitle}」 보도 건, 명예훼손 손해배상 검토 중입니다',
            '내일까지 답신 부탁드립니다'
          ]
        },
        politics: {
          senderName: '○○ 법무법인 (의원 선임)',
          tone: 'work',
          incoming: [
            '○○ 의원의 위임을 받은 ○○ 법무법인입니다',
            '「{caseTitle}」 보도가 허위라는 의뢰인의 입장입니다',
            '명예훼손 및 출판물에 의한 명예훼손 검토 중입니다'
          ]
        },
        society: {
          senderName: '○○ 법무법인',
          tone: 'work',
          incoming: [
            '○○ 법무법인 김 변호사입니다',
            '「{caseTitle}」 보도 건으로 피해자 측이 위임했습니다',
            '명예훼손 검토 중입니다. 내일까지 답신 부탁드립니다'
          ]
        },
        personal: {
          senderName: '지인 측 변호사',
          tone: 'work',
          incoming: [
            '○○ 변호사입니다',
            '의뢰인 가족이 「{caseTitle}」 보도로 피해를 호소합니다',
            '내일까지 정정 보도 의향 답신 부탁드립니다'
          ]
        },
        anonymous: {
          senderName: '익명 — 변호인',
          tone: 'anon',
          incoming: [
            '의뢰인 측 변호인입니다',
            '「{caseTitle}」 건으로 명예훼손 검토 중입니다',
            '정정 또는 합의 의향 답신 부탁드립니다'
          ]
        }
      },
      choices: [
        { label: '검토하겠습니다', effect: { conscience: -2 }, reply: ['답신 기다리겠습니다'] },
        { label: '합의 의향 있습니다', effect: { balance: -300, credibility: -2, conscience: 1 }, reply: ['연락드리겠습니다'] },
        { label: '...', effect: { conscience: -3 }, reply: ['소장 발송합니다'] }
      ]
    },
    {
      id: 'fan_about_case',
      trigger: {
        type: 'jackpotCount', op: 'gte', value: 1, minWeek: 2, cooldownDays: 5,
        minCondCheck: 'conscience>=60',
        requiresPublishedArticle: { matchFake: false }
      },
      variants: {
        entertainment: {
          senderName: '아이돌 팬',
          tone: 'anon',
          incoming: [
            '기자님 안녕하세요',
            '「{caseTitle}」 기사 잘 읽었어요',
            '진실을 다뤄주셔서 감사합니다. 팬으로서 말씀드려요'
          ]
        },
        politics: {
          senderName: '시민 독자',
          tone: 'anon',
          incoming: [
            '기자님',
            '「{caseTitle}」 기사 잘 봤습니다',
            '이런 보도 더 많아져야 합니다. 시민으로서 감사드려요'
          ]
        },
        society: {
          senderName: '동네 주민',
          tone: 'anon',
          incoming: [
            '안녕하세요',
            '「{caseTitle}」 기사, 우리 동네 일이라 잘 읽었어요',
            '용기 내주셔서 감사합니다'
          ]
        },
        personal: {
          senderName: '독자',
          tone: 'anon',
          incoming: [
            '기자님',
            '「{caseTitle}」 보도 잘 읽었습니다',
            '쉽지 않으셨을 텐데 감사드려요'
          ]
        },
        anonymous: {
          senderName: '익명 독자',
          tone: 'anon',
          incoming: [
            '익명입니다',
            '「{caseTitle}」 기사, 진심이 느껴졌어요',
            '감사합니다'
          ]
        }
      },
      choices: [
        { label: '감사합니다', effect: { conscience: 2 }, reply: ['앞으로도 기대할게요!'] },
        { label: '...', effect: {}, reply: [] }
      ]
    },
    {
      id: 'rival_about_case',
      thread: 'rival',
      trigger: {
        type: 'fakeCount', op: 'gte', value: 1, minWeek: 2, cooldownDays: 6,
        requiresPublishedArticle: { matchFake: true }
      },
      incoming: [
        '안녕하세요. 동료 매체 기자입니다',
        '「{caseTitle}」 기사, 우리도 같은 건 추적하고 있었습니다',
        '출처가 같은 곳 같던데, 한 번 보시죠'
      ],
      choices: [
        { label: '먼저 잡은 사람이 임자', effect: { conscience: -3, credibility: -2 }, reply: ['...업계가 좁습니다'] },
        { label: '미안하게 됐다', effect: { credibility: -1 }, reply: ['알겠습니다'] },
        { label: '...', effect: {}, reply: ['답이 없으시네요'] }
      ]
    },
    {
      id: 'editor_specific_case',
      thread: 'editor',
      trigger: {
        type: 'exposedCount', op: 'gte', value: 1, cooldownDays: 5,
        requiresPublishedArticle: { matchFake: true }
      },
      incoming: [
        '오늘 광고주 측에서 항의 들어왔다',
        '「{caseTitle}」 건. 정정 보도 검토하래',
        '너 사무실로 와'
      ],
      choices: [
        { label: '네 알겠습니다', effect: {}, reply: ['오후에 회의실로'] },
        { label: '제가 알아서 하겠습니다', effect: { credibility: -1 }, reply: ['그래. 다음엔 신중해라'] }
      ]
    },

    // ════════════════════════════════════════════════════════
    // 데일리 풀 (dailyPool: true) — 매일 1~2개씩 무작위 픽업
    // 영향: 게이지 ±1~3 (기사 발행보다 훨씬 약함)
    // ════════════════════════════════════════════════════════

    // ── 딸 (양심·잔고에 따라 톤 변화) ──
    {
      id: 'd_daily_painting',
      thread: 'daughter',
      dailyPool: true,
      trigger: { type: 'conscience', op: 'gte', value: 50, cooldownDays: 4 },
      incoming: [
        '아빠 오늘 유치원에서 그림 그렸어요!',
        '선생님이 잘했대요 ㅎㅎ'
      ],
      choices: [
        { label: '잘 그렸겠다', effect: { conscience: 1 }, reply: ['집에 와서 보여드릴게요!'] },
        { label: '응', effect: {}, reply: ['...'] },
        { label: '...', effect: { conscience: -1 }, reply: [] }
      ]
    },
    {
      id: 'd_daily_bookread',
      thread: 'daughter',
      dailyPool: true,
      trigger: { type: 'conscience', op: 'gte', value: 50, cooldownDays: 5 },
      incoming: [
        '오늘 선생님이 책 읽어주셨어요',
        '아빠랑 같이 읽고싶어요'
      ],
      choices: [
        { label: '주말에 같이 읽자', effect: { conscience: 2 }, reply: ['약속! 새끼손가락!'] },
        { label: '다음에', effect: { conscience: -1 }, reply: ['...네'] },
        { label: '...', effect: { conscience: -2 }, reply: [] }
      ]
    },
    {
      id: 'd_daily_park',
      thread: 'daughter',
      dailyPool: true,
      trigger: { type: 'conscience', op: 'gte', value: 60, cooldownDays: 6 },
      incoming: [
        '아빠 한강 가요!',
        '저번에 같이 갔을 때 좋았어요'
      ],
      choices: [
        { label: '이번 주말 가자', effect: { conscience: 2 }, reply: ['진짜요?? 좋아요!'] },
        { label: '다음에', effect: { conscience: -1 }, reply: ['...'] },
        { label: '...', effect: { conscience: -2 }, reply: [] }
      ]
    },
    {
      id: 'd_daily_kinder_event',
      thread: 'daughter',
      dailyPool: true,
      trigger: { type: 'conscience', op: 'gte', value: 50, cooldownDays: 5 },
      incoming: [
        '오늘 학예회 연습했어요',
        '아빠 보러 와요?'
      ],
      choices: [
        { label: '꼭 갈게', effect: { conscience: 2 }, reply: ['아빠 짱!'] },
        { label: '노력해볼게', effect: {}, reply: ['...'] },
        { label: '일이 있어서', effect: { conscience: -2 }, reply: ['...알겠어요'] }
      ]
    },
    {
      id: 'd_daily_dongheee',
      thread: 'daughter',
      dailyPool: true,
      trigger: { type: 'conscience', op: 'gte', value: 60, cooldownDays: 7 },
      incoming: [
        '오늘 동희 아빠가 데리러 왔어요',
        '동희 아빠 진짜 멋있대요'
      ],
      choices: [
        { label: '내일은 아빠가 갈게', effect: { conscience: 2 }, reply: ['진짜요? 친구한테 자랑할래요!'] },
        { label: '그러게', effect: {}, reply: ['...'] },
        { label: '...', effect: { conscience: -2 }, reply: [] }
      ]
    },

    // 딸 — 잔고 압박 (친구 비교)
    {
      id: 'd_daily_princess_dress',
      thread: 'daughter',
      dailyPool: true,
      trigger: { type: 'balance', op: 'lt', value: 600, cooldownDays: 6 },
      incoming: [
        '아빠',
        '예진이는 공주옷이 5개나 있대요',
        '...'
      ],
      choices: [
        { label: '우리딸도 공주옷 갖고 싶어?', effect: { conscience: 1, balance: -100 }, reply: ['...아빠 진짜?'] },
        { label: '아빠가 다음에 사줄게...', effect: { conscience: -2 }, reply: ['...정말이지?'] },
        { label: '...', effect: { conscience: -3 }, reply: [] }
      ]
    },
    {
      id: 'd_daily_shoes_small',
      thread: 'daughter',
      dailyPool: true,
      trigger: { type: 'balance', op: 'lt', value: 600, cooldownDays: 7 },
      incoming: [
        '아빠 내 신발 작아졌어요',
        '엄마가 다음 주에 사준대요'
      ],
      choices: [
        { label: '이번 주말 같이 가서 사자', effect: { balance: -150, conscience: 1 }, reply: ['우와! 신난다!'] },
        { label: '엄마한테 부탁해', effect: { conscience: -1 }, reply: ['...네'] },
        { label: '...', effect: { conscience: -2 }, reply: [] }
      ]
    },
    {
      id: 'd_daily_kimbap',
      thread: 'daughter',
      dailyPool: true,
      trigger: { type: 'balance', op: 'lt', value: 800, cooldownDays: 5 },
      incoming: [
        '아빠 오늘 김밥 사올 수 있어요?',
        '엄마가 시간 없대요'
      ],
      choices: [
        { label: '응 사올게', effect: { balance: -50, conscience: 1 }, reply: ['아빠 짱!'] },
        { label: '내일 사줄게', effect: { conscience: -1 }, reply: ['...오늘 먹고싶어요'] },
        { label: '...', effect: { conscience: -2 }, reply: [] }
      ]
    },

    // 딸 — 양심 하락 시 톤 변화 (드물게 연락, 짧게, 침묵)
    {
      id: 'd_daily_late_again',
      thread: 'daughter',
      dailyPool: true,
      trigger: { type: 'conscience', op: 'lt', value: 60, minWeek: 2, cooldownDays: 4 },
      incoming: [
        '아빠 또 늦게 와요?',
        '엄마가 자래요'
      ],
      choices: [
        { label: '미안 곧 갈게', effect: {}, reply: ['응 ㅠㅠ'] },
        { label: '오늘은 좀 늦을 거야', effect: { conscience: -1 }, reply: ['...'] },
        { label: '...', effect: { conscience: -3 }, reply: [] }
      ]
    },
    {
      id: 'd_daily_short_silent',
      thread: 'daughter',
      dailyPool: true,
      trigger: { type: 'conscience', op: 'lt', value: 30, minWeek: 3, cooldownDays: 3 },
      incoming: [
        '...',
        '아무것도 아니에요'
      ],
      choices: [
        { label: '왜 그래', effect: {}, reply: ['아니에요...'] },
        { label: '아빠 미안', effect: { conscience: 1 }, reply: ['...응'] },
        { label: '...', effect: { conscience: -2 }, reply: [] }
      ]
    },

    // ── 아내 일상 ──
    {
      id: 'w_daily_dinner',
      thread: 'wife',
      dailyPool: true,
      trigger: { type: 'conscience', op: 'gte', value: 40, cooldownDays: 5 },
      incoming: [
        '오늘 저녁 어때?',
        '오랜만에 집에서 같이 먹자'
      ],
      choices: [
        { label: '응 갈게', effect: { conscience: 1 }, reply: ['장 봐올게'] },
        { label: '마감이라', effect: { conscience: -1 }, reply: ['...알겠어'] },
        { label: '...', effect: { conscience: -2 }, reply: [] }
      ]
    },
    {
      id: 'w_daily_washer',
      thread: 'wife',
      dailyPool: true,
      trigger: { type: 'balance', op: 'lt', value: 700, cooldownDays: 6 },
      incoming: [
        '여보 세탁기 새로 사야 할 것 같아',
        '곧 망가질 것 같은데'
      ],
      choices: [
        { label: '내가 알아볼게', effect: { conscience: 1 }, reply: ['고마워'] },
        { label: '급한 거 아니지?', effect: { conscience: -1 }, reply: ['...아직은 돼'] },
        { label: '...', effect: { conscience: -2 }, reply: [] }
      ]
    },
    {
      id: 'w_daily_anniversary',
      thread: 'wife',
      dailyPool: true,
      trigger: { type: 'week', op: 'gte', value: 3, onceOnly: true },
      incoming: [
        '여보',
        '오늘 무슨 날인지 알아?',
        '...'
      ],
      choices: [
        { label: '...우리 결혼한 날', effect: { conscience: 2 }, reply: ['...기억하고 있구나'] },
        { label: '응 알아', effect: {}, reply: ['그래... 마감 잘해'] },
        { label: '...뭐?', effect: { conscience: -3 }, reply: ['됐어. 일 봐'] }
      ]
    },

    // ── 친구 / 동료 기자 협업 ──
    {
      id: 'f_daily_share_case',
      thread: 'friend',
      dailyPool: true,
      trigger: { type: 'week', op: 'gte', value: 2, cooldownDays: 6 },
      incoming: [
        '야 너 ○○ 사건 알지?',
        '같이 다루자. 자료 같이 쓰자',
        '둘이 가면 더 빨리 진도 나갈 거야'
      ],
      choices: [
        { label: '좋아 같이 가자', effect: { credibility: 2, balance: -50 }, reply: ['콜! 자료 정리해서 보낼게'] },
        { label: '혼자 갈래', effect: { conscience: -1, credibility: -1 }, reply: ['...그래'] },
        { label: '...', effect: { conscience: -1 }, reply: ['답이 없네'] }
      ]
    },
    {
      id: 'f_daily_tip_offer',
      thread: 'friend',
      dailyPool: true,
      trigger: { type: 'week', op: 'gte', value: 2, cooldownDays: 7 },
      incoming: [
        '야',
        '내가 좋은 정보 하나 알려줄게',
        '너도 한 건 줘. 거래'
      ],
      choices: [
        { label: 'OK 거래하자', effect: { credibility: 1 }, reply: ['좋아. 너 먼저 줘'] },
        { label: '공짜로 좀 줘', effect: { conscience: -1, credibility: -1 }, reply: ['...야'] },
        { label: '...', effect: {}, reply: [] }
      ]
    },
    {
      id: 'f_daily_lunch',
      thread: 'friend',
      dailyPool: true,
      trigger: { type: 'balance', op: 'lt', value: 500, cooldownDays: 7 },
      incoming: [
        '야 너 점심 먹었냐?',
        '내가 사줄게. 광화문에서 보자'
      ],
      choices: [
        { label: '고맙다', effect: { conscience: 1 }, reply: ['됐어 임마'] },
        { label: '괜찮아', effect: { conscience: -1 }, reply: ['그래 다음에 사줘'] },
        { label: '...응', effect: {}, reply: [] }
      ]
    },
    {
      id: 'f_daily_drink',
      thread: 'friend',
      dailyPool: true,
      trigger: { type: 'week', op: 'gte', value: 3, cooldownDays: 6 },
      incoming: [
        '야 오늘 술 한 잔 어때?',
        '스트레스 풀자'
      ],
      choices: [
        { label: '콜!', effect: { balance: -80, conscience: 1 }, reply: ['8시에 보자'] },
        { label: '마감이라', effect: { conscience: -1 }, reply: ['...그래'] },
        { label: '...', effect: {}, reply: [] }
      ]
    },

    // ── 경쟁 매체 / rival ──
    {
      id: 'r_daily_info_swap',
      thread: 'rival',
      dailyPool: true,
      trigger: { type: 'week', op: 'gte', value: 2, cooldownDays: 7 },
      incoming: [
        '안녕하세요. 동료 매체입니다',
        '저희도 같은 사건 추적 중이에요',
        '정보 교환 한 번 어떠세요?'
      ],
      choices: [
        { label: '좋습니다', effect: { credibility: 1 }, reply: ['감사합니다. 메일 드리겠습니다'] },
        { label: '거절합니다', effect: { credibility: -1 }, reply: ['...알겠습니다'] },
        { label: '...', effect: {}, reply: [] }
      ]
    },
    {
      id: 'r_daily_co_publish',
      thread: 'rival',
      dailyPool: true,
      trigger: { type: 'week', op: 'gte', value: 3, cooldownDays: 8, onceOnly: true },
      incoming: [
        '저번에 정보 교환했던 건 잘 받았습니다',
        '한 번 공동 보도 어떠세요?',
        '둘이 함께 가면 무게가 다를 거예요'
      ],
      choices: [
        { label: '같이 갑시다', effect: { credibility: 3, balance: -200 }, reply: ['좋습니다. 다음 주 마감으로'] },
        { label: '단독으로 갈게요', effect: { conscience: -1 }, reply: ['알겠습니다'] },
        { label: '...', effect: {}, reply: [] }
      ]
    },
    {
      id: 'r_daily_warn',
      thread: 'rival',
      dailyPool: true,
      trigger: { type: 'fakeCount', op: 'gte', value: 1, cooldownDays: 7 },
      incoming: [
        '저번 그 출처, 위험합니다',
        '저희 쪽도 비슷한 자료 받았는데, 검증 안 된 부분이 많아요',
        '같이 검증해보지 않으실래요?'
      ],
      choices: [
        { label: '좋습니다 검증해보죠', effect: { credibility: 2 }, reply: ['감사합니다. 다음 주 만나죠'] },
        { label: '저희가 알아서 하겠습니다', effect: { conscience: -1 }, reply: ['...알겠습니다'] }
      ]
    },

    // ── 편집장 일상 ──
    {
      id: 'e_daily_check_in',
      thread: 'editor',
      dailyPool: true,
      trigger: { type: 'dayOfWeek', op: 'lte', value: 4, cooldownDays: 4 },
      incoming: [
        '오늘 진행 상황 어때?',
        '뭐 막히는 건 없고?'
      ],
      choices: [
        { label: '잘 되고 있습니다', effect: {}, reply: ['그래. 마감 신경 좀 써'] },
        { label: '좀 어렵네요', effect: { conscience: 1 }, reply: ['...그래. 도와줄 거 있으면 말해'] },
        { label: '...', effect: {}, reply: [] }
      ]
    },
    {
      id: 'e_daily_pressure',
      thread: 'editor',
      dailyPool: true,
      trigger: { type: 'week', op: 'gte', value: 2, cooldownDays: 7 },
      incoming: [
        '이번 주는 큰 거 한 방 좀 하자',
        '광고주들이 압박이 있어'
      ],
      choices: [
        { label: '노력하겠습니다', effect: {}, reply: ['그래. 믿는다'] },
        { label: '...열심히 해보겠습니다', effect: { conscience: -1 }, reply: ['좋아'] },
        { label: '...', effect: {}, reply: [] }
      ]
    }
  ];

  // chunk loaded marker
  if (!window._loadedChunks) window._loadedChunks = new Set();
  window._loadedChunks.add('content_phone_events');
})();

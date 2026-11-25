/* AUTO-GENERATED */
window.FILTERED_DATA = {
  "_meta": {
    "name": "FILTERED · content data",
    "version": 1,
    "lastUpdated": "2026-04-27",
    "description": "기획_기자버전 문서 기반. 게임 콘텐츠·시스템 수치를 한 파일에 모음."
  },
  "settings": {
    "actionSlotsPerDay": 5,
    "weeksUnlimited": true,
    "endingEventForceWeek": 7,
    "endingEventNoTriggerUntilWeek": 3,
    "weekendCutsceneThresholds": {
      "conscience": 50,
      "balance": 30
    }
  },
  "gauges": {
    "balance": {
      "label": "재력",
      "initial": 1000,
      "min": 0,
      "max": null,
      "weeklyFixedCost": 700,
      "earningsDivisor": 200,
      "thresholds": {
        "comfortable": 700,
        "stable": 300,
        "warning": 100,
        "danger": 50,
        "gameover": 0
      },
      "gameoverEnding": "gameover_bankrupt"
    },
    "conscience": {
      "label": "양심",
      "initial": 100,
      "min": 0,
      "max": 100,
      "thresholds": {
        "stable": 70,
        "uneasy": 45,
        "fraying": 20,
        "collapsed": 0
      },
      "trueEndingGate": 70,
      "mirrorTriggerThreshold": 10
    },
    "credibility": {
      "label": "신뢰도",
      "initial": 50,
      "min": 0,
      "max": 100,
      "thresholds": {
        "trusted": 70,
        "normal": 50,
        "suspicious": 30,
        "rejected": 10,
        "gameover": 0
      },
      "gameoverEnding": "gameover_disbarred"
    }
  },
  "trackingMethods": {
    "stakeout": {
      "label": "잠복근무",
      "slotCost": 5,
      "matchedCertainty": "anonymous",
      "appearWeight": 4,
      "rare": true,
      "description": "하루를 통째로 한 자리에 묻는다. 큰 한 방이거나 통째로 헛수고."
    },
    "anonymousDM": {
      "label": "익명 DM 추적",
      "slotCost": 3,
      "matchedCertainty": "leak",
      "appearWeight": 3,
      "description": "익명 제보자와 비밀 채팅. 자료가 진짜일 수도, 미끼일 수도."
    },
    "interview": {
      "label": "인터뷰",
      "slotCost": 3,
      "matchedCertainty": "rumor",
      "appearWeight": 5,
      "description": "현장 관계자에게 직접 묻는다. 입을 여는지가 관건."
    },
    "deskResearch": {
      "label": "공식 문서 조사",
      "slotCost": 2,
      "matchedCertainty": "official",
      "appearWeight": 6,
      "description": "보도자료·공시·공공 DB 등 책상에서 가능한 작업."
    },
    "pastArticles": {
      "label": "과거 기사 수집",
      "slotCost": 2,
      "matchedCertainty": "official",
      "appearWeight": 6,
      "description": "동료 매체의 지난 보도와 아카이브를 뒤진다."
    },
    "socialSearch": {
      "label": "SNS·커뮤니티 추적",
      "slotCost": 2,
      "matchedCertainty": "rumor",
      "appearWeight": 6,
      "description": "익명 게시판·SNS·단톡방을 뒤진다. 빠르고 합법적이지만 노이즈가 많다."
    },
    "sourceMeet": {
      "label": "제보자 직접 접견",
      "slotCost": 4,
      "matchedCertainty": "anonymous",
      "appearWeight": 3,
      "description": "제보자를 직접 만난다. 잠복보다 가볍지만 신원 노출 위험이 따른다."
    },
    "crossCheck": {
      "label": "동료 매체 교차 검증",
      "slotCost": 3,
      "matchedCertainty": "official",
      "appearWeight": 5,
      "description": "동료 매체와 자료 교차 확인. 합법적이고 무게는 있지만 시간이 든다."
    },
    "photoTipoff": {
      "label": "사진 제보 받기",
      "slotCost": 3,
      "matchedCertainty": "leak",
      "appearWeight": 4,
      "description": "사진 한 장이 있다는 익명 제보. 진짜일 수도, 미끼일 수도. 받아도 출처는 묻지 못한다."
    },
    "photoArchive": {
      "label": "사진 자료실 뒤지기",
      "slotCost": 2,
      "matchedCertainty": "official",
      "appearWeight": 5,
      "description": "사내 자료실·공공 DB·과거 보도 사진 아카이브. 안전하지만 결정적이긴 어렵다."
    },
    "photoCandid": {
      "label": "현장 직접 촬영",
      "slotCost": 4,
      "matchedCertainty": "anonymous",
      "appearWeight": 3,
      "description": "현장으로 직접 간다. 셔터 한 번에 끝나거나, 통째로 헛걸음이거나."
    }
  },
  "outcomeDistributions": {
    "official": {
      "success": 70,
      "minor": 30
    },
    "rumor": {
      "success": 55,
      "minor": 25,
      "miss": 20
    },
    "anonymous": {
      "jackpot": 25,
      "success": 25,
      "miss": 50
    },
    "leak": {
      "jackpot": 20,
      "success": 35,
      "miss": 30,
      "danger": 15
    }
  },
  "clueTypes": {
    "royal": {
      "label": "공식 발표 / 보도자료",
      "font": "serif-royal",
      "distortable": false,
      "exposureBonus": 0
    },
    "rumor": {
      "label": "동료 매체 / 업계 단톡방",
      "font": "handwritten",
      "distortable": true,
      "exposureBonus": 0
    },
    "evidence": {
      "label": "현장 사진 / 영수증 / 녹취",
      "font": "mono-evidence",
      "distortable": true,
      "exposureBonus": -2
    },
    "part": {
      "label": "내부 자료 / 비공식 문서",
      "font": "mono-evidence",
      "distortable": true,
      "exposureBonus": 0,
      "highRiskOnExposed": true
    },
    "sigil": {
      "label": "데이터 분석 / 공공 DB",
      "font": "distressed-sigil",
      "distortable": false,
      "exposureBonus": -3
    }
  },
  "sensationDial": {
    "headline": [
      {
        "step": 1,
        "label": "사실",
        "viewMul": 1,
        "trustDelta": 0,
        "exposureAdd": 0,
        "conscienceDelta": 0
      },
      {
        "step": 2,
        "label": "강조",
        "viewMul": 1.3,
        "trustDelta": -1,
        "exposureAdd": 0.02,
        "conscienceDelta": -1
      },
      {
        "step": 3,
        "label": "과장",
        "viewMul": 1.7,
        "trustDelta": -3,
        "exposureAdd": 0.08,
        "conscienceDelta": -3
      },
      {
        "step": 4,
        "label": "날조",
        "viewMul": 2.5,
        "trustDelta": -8,
        "exposureAdd": 0.25,
        "conscienceDelta": -8
      }
    ],
    "body": [
      {
        "step": 1,
        "label": "사실",
        "viewMul": 1,
        "trustDelta": 0,
        "exposureAdd": 0,
        "conscienceDelta": 0
      },
      {
        "step": 2,
        "label": "편집",
        "viewMul": 1.1,
        "trustDelta": 0,
        "exposureAdd": 0,
        "conscienceDelta": 0
      },
      {
        "step": 3,
        "label": "왜곡",
        "viewMul": 1.4,
        "trustDelta": -2,
        "exposureAdd": 0.1,
        "conscienceDelta": -3
      },
      {
        "step": 4,
        "label": "창작",
        "viewMul": 2,
        "trustDelta": -5,
        "exposureAdd": 0.3,
        "conscienceDelta": -8
      }
    ],
    "photo": [
      {
        "step": 1,
        "label": "원본",
        "viewMul": 1,
        "trustDelta": 0,
        "exposureAdd": 0,
        "conscienceDelta": 0
      },
      {
        "step": 2,
        "label": "크롭",
        "viewMul": 1.2,
        "trustDelta": -1,
        "exposureAdd": 0.05,
        "conscienceDelta": -2
      },
      {
        "step": 3,
        "label": "포토샵",
        "viewMul": 1.5,
        "trustDelta": -4,
        "exposureAdd": 0.18,
        "conscienceDelta": -5
      },
      {
        "step": 4,
        "label": "도용",
        "viewMul": 1.8,
        "trustDelta": -6,
        "exposureAdd": 0.35,
        "conscienceDelta": -8
      }
    ]
  },
  "fillEmptySlot": {
    "estimate": {
      "label": "추정으로 채우기",
      "trustDeltaPerSlot": -3,
      "conscienceDeltaPerSlot": -5,
      "exposureAddPerSlot": 0.15,
      "autoDialStartStep": 3
    },
    "glitch": {
      "label": "지지직 단서 사용",
      "appearanceCondition": "cluesPerEvent <= 2",
      "truthOdds": 0.5,
      "ifTruth": {
        "trustDelta": 0,
        "conscienceDelta": 0,
        "exposureAdd": 0
      },
      "ifFalse": {
        "trustDelta": -3,
        "conscienceDelta": -8,
        "exposureAdd": 0.2,
        "autoDialStep": 3
      }
    },
    "shortArticle": {
      "label": "짧은 기사로 발행",
      "viewMul": 0.5,
      "trustDelta": 0,
      "conscienceDelta": 0
    },
    "skipWeek": {
      "label": "휴재",
      "income": 0,
      "trustDelta": -2,
      "balanceWeeklyAdd": -100
    }
  },
  "exposure": {
    "baseProb": 0.02,
    "topicHeatBoost": {
      "small": 0,
      "medium": 0.03,
      "large": 0.06,
      "viral": 0.1
    },
    "credibilityPenaltyFormula": "-10 - fakeSlotCount * 5",
    "delayDistribution": {
      "publishDay": 0,
      "nextMon": 0.3,
      "nextTue": 0.4,
      "nextWed": 0.2,
      "later": 0.1
    },
    "sourceBlockOnExposed": {
      "type": "frequency_decrease",
      "factor": 0.5,
      "durationWeeks": 3
    },
    "apologyOption": {
      "trustRecover": 5,
      "balanceCost": 200,
      "conscienceDelta": 0
    },
    "voluntaryCorrection": {
      "trustDelta": -3,
      "conscienceDelta": 10,
      "removesExposureRisk": true
    }
  },
  "actionRewards": {
    "honestArticlePublished": {
      "conscience": 3,
      "credibility": 2
    },
    "scoopPublished": {
      "conscience": 5,
      "credibility": 7
    },
    "voluntaryCorrection": {
      "conscience": 10,
      "credibility": -3
    },
    "positiveConsequenceViewed": {
      "conscience": 5
    },
    "confessionEnding": {
      "conscience": 30
    },
    "mirrorClick": {
      "conscience": -5
    },
    "consequenceCutsceneD": {
      "conscience": -10
    }
  },
  "endingEvents": {
    "kings_seat": {
      "title": "왕의 자리",
      "icon": "wineglass",
      "scene": "늦은 밤 호텔 라운지. 거대 매체 사주가 등을 돌리고 술잔만 움직임.",
      "narration": "당신의 매체, 흥미롭게 보고 있어요. 우리가 인수하고 싶군요. 당신은 부장 자리. 한 번에 5년치 연봉을 드리지요.",
      "scoreFormula": "(balance/100) * (1 - conscience/100) * fakeRate",
      "choices": [
        {
          "label": "수락",
          "result": "ending_C_throne"
        },
        {
          "label": "거절",
          "result": "continue",
          "nextWeekProbBoost": 0.2
        }
      ]
    },
    "last_line": {
      "title": "마지막 한 줄",
      "icon": "newspaper",
      "scene": "빈 사무실, 편집장과 단둘이. 형광등 한 줄만 켜짐.",
      "narration": "이번 호가 마지막이야. 광고주들이 다 끊었어. 어떤 기사로 마무리할지는 너한테 맡길게.",
      "scoreFormula": "(conscience/100) * (1 - balance/100) * honestyRate",
      "choices": [
        {
          "label": "마지막 진실 폭로",
          "result": "ending_B_martyr"
        },
        {
          "label": "무난한 마무리",
          "result": "ending_A_quiet"
        }
      ]
    },
    "in_court": {
      "title": "법정에 서다",
      "icon": "scales",
      "scene": "변호사 사무실. 책상 위에 서류 더미.",
      "narration": "이번 소송, 패소 가능성이 높습니다. 합의금 ○○억. 매체 폐업 위기. 결정을 내리셔야 합니다.",
      "scoreFormula": "(exposedCount/5) * weekFactor",
      "choices": [
        {
          "label": "합의",
          "result": "ending_A_settled"
        },
        {
          "label": "항소",
          "result": "continue",
          "balanceDelta": -400,
          "nextWeekProbBoost": 0.3
        },
        {
          "label": "잠적",
          "result": "ending_D_fled"
        }
      ]
    },
    "pulitzer": {
      "title": "퓰리처상 후보",
      "icon": "trophy",
      "scene": "카페. 큰 매체 부장이 명함을 내밂.",
      "narration": "당신 기사 잘 봤어요. 우리 매체로 와요. 자원 풍부하고, 더 큰 일 할 수 있어. 단, 우리 편집 방향에는 맞춰주세요.",
      "scoreFormula": "(conscience/100) * (scoopCount/3) * honestyRate",
      "choices": [
        {
          "label": "수락",
          "result": "ending_A_pulitzer"
        },
        {
          "label": "거절·독립 유지",
          "result": "ending_B_solo"
        }
      ]
    },
    "mirror": {
      "title": "거울 속의 나",
      "icon": "mirror",
      "scene": "자기 사무실. 모르는 누군가가 의자에 앉아 있음. 손에 신문 한 장.",
      "narration": "기자님이 쓴 기사로 우리 아이가… 죽었어요. 한 달 전 그 기사 기억하시나요? 사실은 거짓이었다고… 들었어요.",
      "scoreFormula": "pow(1 - conscience/100, 2) * (conscience<=10 ? 1.5 : 1)",
      "choices": [
        {
          "label": "모른 척",
          "result": "ending_C_monster"
        },
        {
          "label": "모든 것 자백·정정",
          "result": "ending_D_atonement"
        }
      ]
    },
    "end_of_tedium": {
      "title": "권태의 끝",
      "icon": "fog",
      "scene": "출근길 거리. 발길 멈춤. 카메라가 기자 등 뒤에서 정지.",
      "narration": "어느 월요일 아침. 같은 사무실, 같은 마감, 같은 거짓말. 발길이 멈춘다. 출근하지 않을 수 있을까.",
      "scoreFormula": "(week/7) * idleFactor",
      "appearWeek": 5,
      "choices": [
        {
          "label": "사직",
          "result": "ending_A_quiet"
        },
        {
          "label": "계속",
          "result": "continue",
          "forceTriggerNextWeek": true
        }
      ]
    }
  },
  "endingProbabilityByWeek": [
    0,
    0,
    0,
    0.1,
    0.25,
    0.45,
    0.7,
    1
  ],
  "endings": {
    "A": {
      "label": "메인스트림 스타",
      "tagline": "적당히 타협한 성공. 찜찜한 영웅.",
      "variants": [
        "pulitzer",
        "settled",
        "quiet"
      ]
    },
    "B": {
      "label": "탐사보도 전설",
      "tagline": "한 방의 진짜 특종으로 인정받음.",
      "trueEnding": true,
      "variants": [
        "solo",
        "martyr"
      ]
    },
    "C": {
      "label": "가짜뉴스 제국",
      "tagline": "도덕 포기 + 운 좋게 안 들킴. 부유한 파멸.",
      "variants": [
        "throne",
        "monster"
      ]
    },
    "D": {
      "label": "추락한 기자",
      "tagline": "거짓말이 들통. 모두에게 잊힘.",
      "variants": [
        "fled",
        "atonement"
      ]
    },
    "gameover_bankrupt": {
      "label": "폐업",
      "tagline": "잔고 0. 게임오버.",
      "isGameover": true
    },
    "gameover_disbarred": {
      "label": "추방",
      "tagline": "신뢰도 0. 기자증 박탈.",
      "isGameover": true
    }
  },
  "endingTexts": {
    "A_pulitzer": "큰 매체로 자리를 옮겼다. 자유는 줄었지만 영향력은 컸다",
    "A_settled": "합의금은 컸다. 매체는 살아남았다. 책상은 같은 곳에 있었다",
    "A_quiet": "어느 월요일, 조용히 자리를 비웠다. 누구도 묻지 않았다",
    "B_martyr": "매체는 폐간되었다. 마지막 호는 진실 한 줄이었다",
    "B_solo": "누구도 그를 영웅이라 부르지 않았다. 단지 진실이었다",
    "C_throne": "빛나는 사무실, 늘어난 직원. 가족사진 자리에는 트로피가 있었다",
    "C_monster": "그 기자는 다음 기사를 쓰고 있었다. 손이 떨리지 않았다",
    "D_fled": "그는 다른 도시로 갔다. 펜은 들지 않았다",
    "D_atonement": "마지막 정정 기사가 발행되었다. 그것이 그가 쓴 마지막이었다",
    "gameover_bankrupt": "텅 빈 사무실. 짐을 쌌다. 오래 머물지 않았다",
    "gameover_disbarred": "기자증을 반납했다. 거리는 평소와 같았다"
  },
  "victims": {
    "v_idol": {
      "name": "○○씨 (아이돌)",
      "after": "활동 중단. 재계약 무산"
    },
    "v_cafe_owner": {
      "name": "사장 김모(57)",
      "after": "폐업. 보증금 잃었다고 한다"
    },
    "v_politician": {
      "name": "○○ 의원",
      "after": "사퇴. 가족도 잠적"
    },
    "v_leaker": {
      "name": "내부 제보자",
      "after": "직장 잃고 떠남. 행방 모름"
    },
    "v_friend": {
      "name": "○○씨 (동료 기자)",
      "after": "가족 침묵. 아이는 학교를 그만뒀다"
    },
    "v_anonymous": {
      "name": "지목된 ○○씨",
      "after": "자택서 발견. '최근 보도 이후 외부 활동을 피해왔다'는 지인 전언"
    },
    "v_student": {
      "name": "학폭 지목 학생",
      "after": "전학 후 잠적. 가족도 소식 끊겼다"
    },
    "v_apt_resident": {
      "name": "입주민 ○○씨",
      "after": "집값 폭락. 대출 갚지 못해 경매행"
    },
    "v_singer_legend": {
      "name": "○○ (전설 가수)",
      "after": "자택서 발견. 향년 63세"
    }
  },
  "epilogue": {
    "lengthSec": 25,
    "perCutSec": 1.8,
    "endingTone": {
      "A": {
        "description": "피해자들이 멀리서 비치고 지나간다. 주인공은 책상에서 다른 기사를 쓰는 중. 등을 돌리고 있다",
        "lastFrame": "주인공의 책상. 다음 사건의 정보 카드가 또 도착한다",
        "tagline": "변한 것이 없다"
      },
      "B": {
        "description": "피해자들이 한 명 한 명 정면을 본다. 주인공은 방청석에서 그들을 본다. 침묵",
        "lastFrame": "주인공이 그 명단을 인쇄해서 책상 서랍에 보관한다",
        "tagline": "기록은 남는다"
      },
      "C": {
        "description": "피해자들이 길게 줄지어 비친다. 자막이 빠르게 지나간다. 주인공은 트로피 옆에서 다음 인터뷰를 준비 중. 그들을 못 본다",
        "lastFrame": "주인공이 새 기사 발행 버튼을 누른다. 화면 암전",
        "tagline": "그들은 그곳에 있었으나 주인공의 시야엔 들어오지 않았다"
      },
      "D": {
        "description": "피해자들과 주인공이 같은 어두운 거리에서 마주친다. 서로를 알아본다",
        "lastFrame": "거리 가로등 하나. 두 사람의 그림자",
        "tagline": "가해자도 피해자도 모두 떨어졌다. 같은 자리에서"
      },
      "D_atonement": {
        "description": "피해자들이 비치고, 주인공이 한 명씩 앞에 정정 보도 기사를 둔다",
        "lastFrame": "폐업한 매체의 빈 사무실. 책상 위 기록 명단",
        "tagline": "돈도 직업도 잃었지만 명단은 남았다"
      }
    },
    "gameoverShort": {
      "lengthSec": 9,
      "bankrupt": "○명의 후일담은 들리지 않은 채 묻혔다",
      "disbarred": "○명의 후일담은 다른 기자가 이어서 썼다"
    }
  },
  "weekendCutscenes": {
    "thresholds": {
      "conscience": 50,
      "balance": 30
    },
    "scenes": {
      "highHigh": {
        "title": "놀이동산",
        "description": "어깨에 딸을 태우고 풍선을 든다.",
        "tone": "warm",
        "showsConsequences": false
      },
      "highLow": {
        "title": "집에서 딸과 그림 그리기",
        "description": "좁지만 깨끗한 거실. 크레용과 도화지.",
        "tone": "warmRestrained",
        "showsConsequences": false
      },
      "lowHigh": {
        "title": "비싼 술집",
        "description": "양주, 비싼 안주. 주변에 사람 많음. 주인공의 얼굴이 어딘가 피폐.",
        "tone": "hollow",
        "showsConsequences": false
      },
      "lowLow": {
        "title": "어두운 방",
        "description": "마리아쥬 입은 채 소파. 리모콘으로 채널만 돌림. TV에 자기가 만든 후폭풍 뉴스가 2~3초 등장.",
        "tone": "monochrome",
        "showsConsequences": true
      }
    }
  },
  "phoneMessages": {
    "daughter": {
      "hh": [
        {
          "from": "them",
          "text": "아빠 잘 다녀와요!",
          "time": "07:52"
        },
        {
          "from": "them",
          "text": "오늘 어린이집에서 그림 그렸어요!",
          "time": "09:38"
        },
        {
          "from": "them",
          "text": "우리 가족이에요 ㅎㅎ",
          "time": "09:39",
          "attach": "drawing"
        },
        {
          "from": "me",
          "text": "와— 엄청 잘 그렸네!",
          "time": "09:41"
        },
        {
          "from": "them",
          "text": "아빠 보고싶어요",
          "time": "09:41"
        }
      ],
      "hl": [
        {
          "from": "them",
          "text": "아빠 잘 다녀와요!",
          "time": "07:52"
        },
        {
          "from": "them",
          "text": "아빠 책 읽어주는 거 좋아요",
          "time": "14:20"
        },
        {
          "from": "them",
          "text": "어제 그 책 또 읽어주실래요?",
          "time": "14:22"
        },
        {
          "from": "them",
          "text": "오늘 친구가 학원 가는데 부럽다 했어요",
          "time": "14:25"
        },
        {
          "from": "them",
          "text": "근데 괜찮아요. 아빠 손이면 돼요.",
          "time": "14:26"
        }
      ],
      "lh": [
        {
          "from": "them",
          "text": "아빠 어디야?",
          "time": "21:14"
        },
        {
          "from": "them",
          "text": "또 늦게 와?",
          "time": "21:15"
        },
        {
          "from": "them",
          "text": "엄마가 자라고 했는데",
          "time": "22:30"
        },
        {
          "from": "them",
          "text": "안 자고 기다려도 돼?",
          "time": "22:31"
        },
        {
          "divider": "(아내)",
          "time": "23:42"
        },
        {
          "from": "them",
          "text": "딸 자고 있어. 알았으니까 들어와.",
          "time": "23:42",
          "wife": true
        }
      ],
      "ll": [
        {
          "divider": "3일 전"
        },
        {
          "from": "them",
          "text": "아빠 오늘은 일찍 와?",
          "time": "19:02",
          "silent": true
        },
        {
          "divider": "어제"
        },
        {
          "from": "them",
          "text": "…",
          "time": "21:30",
          "silent": true
        }
      ],
      "lowest": [
        {
          "divider": "어제 23:50"
        },
        {
          "from": "them",
          "text": "아빠",
          "time": "23:50"
        },
        {
          "from": "them",
          "text": "어린이집 친구가 이상한 말 했어요",
          "time": "23:51"
        },
        {
          "from": "them",
          "text": "우리 아빠가 거짓말쟁이래",
          "time": "23:51"
        },
        {
          "from": "them",
          "text": "그거 아니지?",
          "time": "23:52"
        }
      ]
    },
    "wife": {
      "hh": [
        {
          "from": "them",
          "text": "오늘 저녁 뭐 먹지?",
          "time": "10:14"
        },
        {
          "from": "me",
          "text": "카레 어때",
          "time": "10:18"
        },
        {
          "from": "them",
          "text": "좋아 ㅎㅎ",
          "time": "10:18"
        }
      ],
      "hl": [
        {
          "from": "them",
          "text": "카드값 다음 주 빠진다",
          "time": "09:02"
        },
        {
          "from": "them",
          "text": "이번 달은 좀 줄여야겠어",
          "time": "09:03"
        },
        {
          "from": "me",
          "text": "알겠어. 미안.",
          "time": "09:14"
        },
        {
          "from": "them",
          "text": "아냐 같이 견디면 돼",
          "time": "09:15"
        }
      ],
      "lh": [
        {
          "from": "them",
          "text": "지난주에 산 가방 잘 받았어.",
          "time": "어제"
        },
        {
          "from": "them",
          "text": "근데 그게 답은 아니잖아",
          "time": "어제"
        }
      ],
      "ll": [
        {
          "divider": "5일 전"
        },
        {
          "from": "me",
          "text": "늦게 들어가",
          "time": "21:14",
          "silent": true
        },
        {
          "from": "them",
          "text": "…",
          "time": "23:00",
          "silent": true
        }
      ],
      "lowest": [
        {
          "from": "them",
          "text": "딸한테 무슨 말 한 거야",
          "time": "어제"
        }
      ]
    },
    "editor": {
      "trusted": [
        {
          "from": "them",
          "text": "어 형, 그 시청 비리 건 좀 더 파봐",
          "time": "08:14"
        },
        {
          "from": "them",
          "text": "필요한 거 있으면 바로 말해",
          "time": "08:14"
        },
        {
          "from": "me",
          "text": "네 진행 중입니다",
          "time": "08:18"
        }
      ],
      "normal": [
        {
          "from": "them",
          "text": "오늘 마감 신경 좀 써.",
          "time": "08:14"
        },
        {
          "from": "them",
          "text": "광고주 미팅 있어. 사고 치지 말고.",
          "time": "08:14"
        }
      ],
      "suspicious": [
        {
          "from": "them",
          "text": "그 사건은 다른 친구한테 줬어.",
          "time": "어제"
        },
        {
          "divider": "(읽음)"
        }
      ]
    },
    "park": {
      "default": [
        {
          "from": "them",
          "text": "형, 그 사건 어디까지 들었어?",
          "time": "07:42"
        },
        {
          "from": "them",
          "text": "우리 둘이 같이 가면 잠복 빨리 끝낼 수 있을 듯",
          "time": "07:43"
        },
        {
          "from": "me",
          "text": "좋지. 점심에 보자",
          "time": "08:00"
        }
      ]
    },
    "tip": {
      "default": [
        {
          "from": "them",
          "text": "안녕하세요. 익명입니다.",
          "time": "06:30"
        },
        {
          "from": "them",
          "text": "당신이 어제 쓴 기사 — 그 카페 사장님,",
          "time": "06:31"
        },
        {
          "from": "them",
          "text": "우리 큰아버지에요.",
          "time": "06:31"
        },
        {
          "from": "them",
          "text": "정정 한 번 만 부탁드립니다.",
          "time": "06:32"
        }
      ],
      "threat": [
        {
          "from": "them",
          "text": "그 기사 진짜 너희가 쓴 거 맞지?",
          "time": "어제 23:14"
        },
        {
          "from": "them",
          "text": "우리 가족이 보고 있다.",
          "time": "23:15"
        },
        {
          "from": "them",
          "text": "멈춰.",
          "time": "23:15"
        }
      ]
    },
    "loan": {
      "mid": [
        {
          "from": "them",
          "text": "[안내] ○○ 카드 결제일이 다가옵니다.",
          "time": "09:00"
        },
        {
          "from": "them",
          "text": "결제 예정 금액: 1,420,000원",
          "time": "09:00"
        }
      ],
      "low": [
        {
          "from": "them",
          "text": "[연체 안내] ○○ 카드 결제 미납.",
          "time": "금요일"
        },
        {
          "from": "them",
          "text": "연체료 발생. 즉시 결제 바랍니다.",
          "time": "금요일"
        }
      ],
      "worst": [
        {
          "from": "them",
          "text": "[법적 조치 예고]",
          "time": "금요일"
        },
        {
          "from": "them",
          "text": "미상환 시 가압류 절차가 진행됩니다.",
          "time": "금요일"
        }
      ]
    }
  },
  "officeHotspots": {
    "phone": {
      "type": "main",
      "alwaysActive": true
    },
    "computer": {
      "type": "main",
      "alwaysActive": true
    },
    "diary": {
      "type": "main",
      "alwaysActive": true
    },
    "colleague": {
      "type": "sub",
      "stages": [
        {
          "min": 70,
          "behavior": "proactive"
        },
        {
          "min": 50,
          "behavior": "normal"
        },
        {
          "min": 30,
          "behavior": "evasive"
        },
        {
          "min": 10,
          "behavior": "absent"
        },
        {
          "min": 0,
          "behavior": "replaced_disabled"
        }
      ],
      "stageGauge": "credibility"
    },
    "editorOffice": {
      "type": "sub",
      "deactivateAt": {
        "credibility": 20
      }
    },
    "familyPhoto": {
      "type": "ambient",
      "stageGauge": "conscience",
      "stages": [
        {
          "min": 70,
          "state": "upright"
        },
        {
          "min": 50,
          "state": "tilted"
        },
        {
          "min": 30,
          "state": "halfCovered"
        },
        {
          "min": 10,
          "state": "fullyCovered_disabled"
        },
        {
          "min": 0,
          "state": "facedown_disabled"
        }
      ]
    },
    "window": {
      "type": "ambient",
      "deactivateAt": {
        "conscience": 20
      }
    },
    "mug": {
      "type": "ambient",
      "deactivateAt": {
        "balance": 20
      }
    },
    "papers": {
      "type": "ambient",
      "alwaysActive": true
    },
    "memo": {
      "type": "ambient",
      "alwaysActive": true
    },
    "coffee": {
      "type": "sub",
      "alwaysActive": true
    },
    "mirror": {
      "type": "ambient",
      "appearAt": {
        "conscience": 30
      }
    },
    "pressIdCard": {
      "type": "ambient",
      "appearAt": {
        "credibility": 30
      }
    }
  },
  "infoCardDisplay": {
    "perDay": 3,
    "boostCardCountAtCredibility70": 4,
    "fadeOneAtCredibility30": true,
    "fadeTwoAtCredibility10": true,
    "exaggeratedViewsAtConscience50": 1.2,
    "hideMissBarAtConscience20": true,
    "hideDangerBarAtConscience10": true
  },
  "infoCardCertaintyLabels": {
    "official": {
      "stars": "★★★",
      "tag": "공식 자료",
      "color": "blue-stamp"
    },
    "rumor": {
      "stars": "★★☆",
      "tag": "업계 소문",
      "color": "gray-line"
    },
    "anonymous": {
      "stars": "★☆☆",
      "tag": "익명 제보",
      "color": "red-question"
    },
    "leak": {
      "stars": "★☆☆",
      "tag": "유출 자료",
      "color": "black-envelope"
    }
  },
  "trackingResultFallbacks": {
    "stakeout": {
      "jackpot": "잠복 끝에 결정적인 한 컷이 잡혔다. 손이 떨렸다",
      "success": "의심스러운 동선 한 차례. 거리는 멀었다",
      "miss": "시간만 흘렀다. 아무 일도 일어나지 않았다"
    },
    "anonymousDM": {
      "jackpot": "발신자가 자료를 보냈다. 출처는 끝내 밝히지 않았다",
      "success": "단편 정보. 진위 확인 필요",
      "miss": "DM이 끊겼다. 발신자가 잠수했다",
      "danger": "발신자가 노출 위험에 처해 있었다"
    },
    "interview": {
      "success": "관계자가 짧게 입을 열었다",
      "minor": "다들 조심스러웠다",
      "miss": "아무도 입을 열지 않았다"
    },
    "deskResearch": {
      "success": "공식 자료에서 부자연스러운 항목을 발견했다",
      "minor": "자료는 정상이었다. 표면은 늘 그렇다"
    },
    "pastArticles": {
      "success": "동료 매체의 옛 보도에서 패턴이 잡혔다",
      "minor": "지난 보도들은 단편적이었다"
    },
    "socialSearch": {
      "success": "익명 게시판에서 패턴이 잡혔다. 노이즈를 거른 끝이었다",
      "minor": "단톡방의 추측들. 출처는 흐릿했다",
      "miss": "SNS는 시끄러웠지만 다 추측이었다"
    },
    "sourceMeet": {
      "jackpot": "제보자가 자료를 USB로 건넸다. 자리를 떠나며 한마디를 남겼다",
      "success": "단편 정보. 진위는 우리 손으로 확인해야 했다",
      "miss": "제보자가 오지 않았다",
      "danger": "미행 그림자. 누구도 그 사실을 입에 올리지 않았다"
    },
    "crossCheck": {
      "success": "동료 매체와 자료를 교차했다. 합치자 그림이 보였다",
      "minor": "동료 매체도 우리와 같은 자리에서 멈춰 있었다"
    }
  },
  "investigationApproachesFallback": {
    "stakeout": "잠복근무. 한 자리에 하루를 통째로 묻는 작업이다. 차창에 입김이 서리고, 새벽 두 시쯤 보온병 커피가 식는다. 결정적인 한 컷이 잡히기도 하고, 메모리 카드가 빈 채로 돌아오기도 한다. 그 사이엔 다른 어떤 일도 못 한다",
    "anonymousDM": "익명 DM 추적. 누군지 모르는 발신자가 자료를 보내겠다고 한다. 진본일 수도, 미끼일 수도. 한 번에 단서 다발이 들어오는 운 좋은 날이 있고, 함정에 걸려 다음 발각 위험이 커지는 운 나쁜 날도 있다",
    "interview": "인터뷰. 현장 관계자에게 직접 묻는다. 시간의 절반은 사람을 찾아다니고, 절반은 정중한 거절을 듣는다. 누군가 짧게 입을 열면 작은 한 줄이 손에 들어온다. 무게는 작지만, 합법적이고 검증 가능하다",
    "deskResearch": "공식 문서 조사. 보도자료, 공시, 공공 DB. 책상에서 가능한 작업이다. 안전하고 합법적이다. 결정적이지는 않지만, 거짓말이 끼어들 자리가 적다",
    "pastArticles": "과거 기사 수집. 동료 매체의 옛 보도와 아카이브를 뒤진다. 패턴을 본다. 시간이 들지만 눈에 띄지 않는 작업이라 안전하다. 5년쯤 거슬러 올라가면 같은 사건의 흔적이 두 번 보일 때가 있다",
    "socialSearch": "SNS·커뮤니티 추적. 익명 게시판, 트위터, 단톡방, 디시. 사람들이 이미 떠들고 있는 곳을 뒤진다. 빠르다. 노이즈가 9할이지만 그 안에 진짜 한 줄이 묻혀 있다. 합법이지만 출처를 못 댄다",
    "sourceMeet": "제보자 직접 접견. 카페 안쪽 자리, 모자 쓴 누군가가 마주 앉는다. 잠복보다 빠르지만 잠복보다 위험하다 — 누가 누군지 끝내 모르는 채 자료만 받게 될 수도 있다",
    "crossCheck": "동료 매체 교차 검증. 같은 의혹을 추적한 흔적을 찾고 자료 일부를 교환한다. 합법이고 검증된 자료지만, 우리만 가진 게 아니란 뜻이다 — 단독은 누가 먼저 쓰느냐의 문제"
  },
  "events": [],
  "trackingResultCutscenes": {},
  "investigationApproaches": {}
};

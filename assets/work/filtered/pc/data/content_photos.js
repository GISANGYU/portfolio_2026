/* ============================================================
   FILTERED · 사건별 사진 자료 (Photo Evidence)
   ────────────────────────────────────────────────────────────
   ▶ 네이밍 규칙
       파일 위치: images/cases/
       파일명:    <eventId_short>_<NN>_<keyword>\.png
       예시:      images/cases/school_bullying_01_alley.webp
                 images/cases/school_bullying_02_money.webp

   ▶ weight (가중치 분류 — 추후 본문 매칭 시스템용)
       decisive:    결정적 증거 — 본문 태그와 매칭 시 신뢰도 +3
       ambiguous:   애매한 정황 — 본문 태그와 매칭 시 신뢰도 +1
       atmospheric: 분위기 컷  — 매칭 보너스 0 (그러나 시각적 효과)

   ▶ 매칭 로직 (추후 구현)
       기사 본문에 사용된 단서들의 tags 와 사진의 tags 가
       일정 비율 이상 겹치면 신뢰도 가산. 안 겹치면 영향 0
       (감점은 없음 — 그저 무관한 사진일 뿐)

   ▶ 모든 프롬프트 공통 무드 (PROMPT_HEADER)
       - 흑백 펜 잉크 스케치, 손그림 톤, 약간의 떨림
       - 한국 추리소설 삽화 분위기
       - 신문 사진 그레인 + 깊은 그림자 대비
       - 색 없음, 모노크롬
       - 기자 1인칭 POV, 살짝 흔들린 결정적 순간
   ============================================================ */
(function () {
  if (!window.FILTERED_DATA) return;

  const PROMPT_HEADER =
    'Black and white pencil ink sketch with rough hand-drawn quality and slight tremor in the lines, ' +
    'as if quickly captured under journalistic deadline pressure. ' +
    'Korean detective novel illustration style. Journalistic candid documentary mood. ' +
    'Slight grain texture like newspaper photo. Deep shadow contrast. Monochrome only, no color. ' +
    'Composition feels caught in the moment from a journalist\'s first-person POV. ' +
    'Slight motion blur on edges, atmospheric noir mood. Aspect ratio 4:3.';

  window.FILTERED_DATA.PHOTO_PROMPT_HEADER = PROMPT_HEADER;

  // 헬퍼 — 프롬프트 합성
  const P = (scene) => PROMPT_HEADER + ' SCENE: ' + scene;

  window.FILTERED_DATA.casePhotos = {

    // ════════ Week 1 ════════
    ev_idol_dating: [
      {
        id: 'ph_idol_dating_01',
        filename: 'idol_dating_01_exit.webp',
        caption: '호텔 비상구에서 두 사람이 함께 나오는 옆모습. 모자 쓴 한 사람이 앞장서고, 다른 한 사람이 한 발 뒤에서 따라온다',
        tags: ['호텔', '두사람', '비상구', '심야', '동선'],
        weight: 'decisive',
        promptForGPT: P(
          'Two figures emerging from a hotel emergency exit at midnight, side profile view. ' +
          'One wears a baseball cap pulled low and a long coat, walking ahead. ' +
          'The other follows one step behind, hood up, hand near face. ' +
          'Streetlight casts long shadows on the wet pavement. ' +
          'Camera position: 30 meters away, hidden inside a parked car looking out through tinted window. ' +
          'Slightly out of focus on the figures, sharp on the streetlight halo. ' +
          'Wet asphalt reflections, mist in the air.'
        )
      },
      {
        id: 'ph_idol_dating_02',
        filename: 'idol_dating_02_lobby.webp',
        caption: '호텔 로비 엘리베이터 앞에서 두 사람이 같은 시각 다른 방향에 서 있는 모습',
        tags: ['호텔', '로비', '엘리베이터', '두사람'],
        weight: 'ambiguous',
        promptForGPT: P(
          'Hotel lobby interior, marble floor reflection. ' +
          'Two figures stand near the elevator bay — one waiting, one walking past with phone in hand. ' +
          'They do not appear to acknowledge each other but the timing feels deliberate. ' +
          'A receptionist in the background looks down at her desk, deliberately avoiding the scene. ' +
          'View from a side hallway, partially obscured by a potted plant.'
        )
      },
      {
        id: 'ph_idol_dating_03',
        filename: 'idol_dating_03_suv.webp',
        caption: '검정 SUV 두 대가 지하 주차장 입구로 5분 간격으로 들어가는 뒷모습',
        tags: ['차량', 'SUV', '주차장', '심야'],
        weight: 'atmospheric',
        promptForGPT: P(
          'Two black SUVs entering an underground parking garage, taillights glowing. ' +
          'Photographed from behind at street level, slightly low angle. ' +
          'The first car is halfway in, the second one approaches the ramp. ' +
          'Yellow ceiling lights flicker. Concrete texture and shadow. ' +
          'No people visible — just vehicles and architecture. ' +
          'Slight rain on the lens.'
        )
      }
    ],

    ev_city_corruption: [
      {
        id: 'ph_city_corruption_01',
        filename: 'city_corruption_01_ledger.webp',
        caption: '시청 자료실 책상 위 회계 장부 사본. 같은 날짜 두 줄, 두 번째 줄 이름이 긁혀 있다',
        tags: ['장부', '문서', '결재라인', '긁힌자국'],
        weight: 'decisive',
        promptForGPT: P(
          'Close-up of a Korean municipal accounting ledger photocopy on a desk. ' +
          'Two rows with the same date side by side, the second row\'s name field violently scratched out with a sharp object — ' +
          'ink residue still visible in the gouge marks. ' +
          'Coffee ring stain on the corner of the page. ' +
          'Light from a desk lamp falls at a 45 degree angle, casting deep shadow into the scratch. ' +
          'Pen and a pair of glasses partially in frame.'
        )
      },
      {
        id: 'ph_city_corruption_02',
        filename: 'city_corruption_02_meeting.webp',
        caption: '시청 본관 정문 앞에서 회계과장이 양복 입은 누군가와 짧게 대화하는 모습 (멀리서)',
        tags: ['시청', '회계과장', '대화', '외부인'],
        weight: 'ambiguous',
        promptForGPT: P(
          'Korean government building (city hall) front steps, mid-day. ' +
          'A middle-aged woman in conservative business attire (the accounting chief) stands talking briefly to a man in an expensive suit. ' +
          'They appear to be exchanging quick words and the man hands her something small — possibly a USB or business card. ' +
          'Photographed from across the plaza with a long lens, slight bokeh. ' +
          'Tourists and bureaucrats walk by indifferent. ' +
          'Korean flag visible on the building behind them.'
        )
      }
    ],

    ev_cafe_hygiene: [
      {
        id: 'ph_cafe_hygiene_01',
        filename: 'cafe_hygiene_01_dishes.webp',
        caption: '카페 주방 싱크대 옆 누런 자국이 선명한 식기들 클로즈업',
        tags: ['주방', '식기', '위생', '오염'],
        weight: 'decisive',
        promptForGPT: P(
          'Close-up of unwashed cafe dishes piled in a back-kitchen sink. ' +
          'Yellow-brown stains visible on the rims of cups, dried coffee residue on saucers. ' +
          'A fly hovers near the top of the pile. ' +
          'Background is dark and slightly grimy — kitchen tile floor with grout that has gone black. ' +
          'Photographed from a low angle as if the photographer was crouched behind a counter, ' +
          'a partial shadow of a person\'s back visible at the edge of frame.'
        )
      },
      {
        id: 'ph_cafe_hygiene_02',
        filename: 'cafe_hygiene_02_trash.webp',
        caption: '카페 뒷문 옆 음식물 쓰레기와 식자재 박스가 같은 자리에 놓인 모습',
        tags: ['뒷문', '쓰레기', '식자재', '관리'],
        weight: 'ambiguous',
        promptForGPT: P(
          'Cafe back alley behind the building. A black plastic trash bag leaks dark liquid onto the concrete. ' +
          'Right next to it, a cardboard box of fresh food ingredients sits unopened — flour, sugar bags. ' +
          'The two are touching. ' +
          'Steam rises from a kitchen vent above. Late afternoon light, deep shadows under the eaves. ' +
          'A stray cat sniffs at the trash bag corner.'
        )
      },
      {
        id: 'ph_cafe_hygiene_03',
        filename: 'cafe_hygiene_03_storefront.webp',
        caption: '카페 외관 전경. 손님들이 줄을 서 있는 평범한 오후',
        tags: ['카페', '외관', '손님', '평범한일상'],
        weight: 'atmospheric',
        promptForGPT: P(
          'Korean neighborhood cafe storefront, mid-afternoon. ' +
          'A line of three or four customers waits outside on the sidewalk. ' +
          'The signage is hand-painted, casual, welcoming. The interior glows warmly through the window. ' +
          'A delivery scooter is parked at the curb. ' +
          'No hint of anything wrong — this is the public face. ' +
          'Photographed from across the street, mundane angle.'
        )
      }
    ],

    ev_school_bullying: [
      {
        id: 'ph_school_bullying_01',
        filename: 'school_bullying_01_alley.webp',
        caption: '학교 뒷골목, 네 명이 한 학생을 둘러싸고 있다. 흙바닥에 굴러간 가방, 한쪽엔 핏자국',
        tags: ['뒷골목', '폭행', '둘러쌈', '가방', '핏자국'],
        weight: 'decisive',
        promptForGPT: P(
          'School back alley between two concrete walls, late afternoon, harsh shadows. ' +
          'Four middle school students in uniforms forming a tight circle around a fifth student who is partially crouched. ' +
          'A school backpack lies overturned on the dirt ground, contents spilled out. ' +
          'A small dark stain on the gravel — could be blood, could be ink. ' +
          'Cigarette smoke drifts from one of the standing figures. ' +
          'Photographed from far away, partially obscured by a chain-link fence — viewer feels like they should not be seeing this.'
        )
      },
      {
        id: 'ph_school_bullying_02',
        filename: 'school_bullying_02_money.webp',
        caption: '교실 뒤편에서 한 학생이 다른 학생에게 만 원짜리 지폐를 건네는 손 (얼굴 안 보임)',
        tags: ['교실', '돈', '셔틀', '강요', '손'],
        weight: 'ambiguous',
        promptForGPT: P(
          'Close-up of two pairs of student hands at the back of an empty classroom. ' +
          'One pair holds out a Korean 10,000 won bill (uncomfortably crumpled). ' +
          'The other pair receives it, hesitating. Sleeves visible — both school uniform jackets. ' +
          'No faces in frame. ' +
          'A school desk corner with a textbook visible at the edge. ' +
          'Window light from the side, low contrast. ' +
          'Could be lunch money, could be extortion — context absent.'
        )
      },
      {
        id: 'ph_school_bullying_03',
        filename: 'school_bullying_03_classroom.webp',
        caption: '비어 있는 교실 책상 위에 부서진 안경. 의자 한 개가 옆으로 쓰러져 있다',
        tags: ['교실', '안경', '의자', '흔적'],
        weight: 'atmospheric',
        promptForGPT: P(
          'Empty middle school classroom after hours. ' +
          'A pair of broken eyeglasses lies on a single desk in the middle of the room — one lens cracked, frame bent. ' +
          'A chair beside the desk has tipped over to its side. ' +
          'The chalkboard at the front shows a half-erased math equation. ' +
          'Late afternoon sun streams through the window from the right, casting long shadows of desk legs across the floor. ' +
          'No people. The room remembers something.'
        )
      }
    ],

    // ════════ Week 2 ════════
    ev_politician_clip: [
      {
        id: 'ph_politician_clip_01',
        filename: 'politician_clip_01_offstage.webp',
        caption: '회의장 사석에서 의원이 어깨 너머로 측근에게 무엇을 말하는 옆얼굴',
        tags: ['회의장', '사석발언', '측근', '옆얼굴'],
        weight: 'decisive',
        promptForGPT: P(
          'Korean politician (suited man, 60s) backstage at a public event. ' +
          'He leans toward a younger aide, hand near his mouth, speaking in a low voice. ' +
          'His expression unguarded — different from the public face. ' +
          'The aide nods, eyes down. ' +
          'Behind them, a curtain partially open showing the brightly lit stage. ' +
          'Shot from very low and far away — likely a journalist who slipped past security.'
        )
      },
      {
        id: 'ph_politician_clip_02',
        filename: 'politician_clip_02_podium.webp',
        caption: '의원이 행사장 마이크 앞에 선 정면 모습 (편집된 발언과 다른 맥락의 장면)',
        tags: ['행사', '마이크', '발언'],
        weight: 'ambiguous',
        promptForGPT: P(
          'A Korean politician at an outdoor public event, standing at a podium with a microphone. ' +
          'His face is mid-sentence — mouth open, hand gesturing emphatically. ' +
          'Banners and flags behind him. A small crowd visible. ' +
          'The expression could be passion or anger; context determines everything. ' +
          'Standard journalist mid-shot.'
        )
      }
    ],

    ev_corp_embezzle: [
      {
        id: 'ph_corp_embezzle_01',
        filename: 'corp_embezzle_01_envelope.webp',
        caption: '대기업 본사 지하 주차장에서 두 남자가 봉투를 주고받는 손 (얼굴 잘림)',
        tags: ['주차장', '봉투', '거래', '뇌물'],
        weight: 'decisive',
        promptForGPT: P(
          'Underground corporate parking garage, dim fluorescent lighting. ' +
          'Two pairs of suited hands meet between two parked black sedans. ' +
          'One hand passes a thick manila envelope to the other. ' +
          'No faces visible — frame cuts at chest level. ' +
          'Watches on both wrists are luxurious. ' +
          'The corporate logo on a nearby pillar partially visible. ' +
          'Photographed from a low angle behind a column.'
        )
      },
      {
        id: 'ph_corp_embezzle_02',
        filename: 'corp_embezzle_02_executive.webp',
        caption: '대기업 임원의 차량 옆에 선 뒷모습. 뒤에서 또 다른 양복 입은 사람이 다가온다',
        tags: ['임원', '차량', '뒷모습', '동선'],
        weight: 'ambiguous',
        promptForGPT: P(
          'Outside a Korean corporate building entrance. ' +
          'A man in an expensive suit stands beside a black executive sedan, his back to the camera. ' +
          'In the background, another suited figure approaches from the lobby door. ' +
          'They are about to meet — the moment before. ' +
          'Could be a normal business meeting or something else. ' +
          'Long lens, slight motion blur on the approaching figure.'
        )
      },
      {
        id: 'ph_corp_embezzle_03',
        filename: 'corp_embezzle_03_signage.webp',
        caption: '회계법인 사무실 입구 간판. 평범한 비즈니스 빌딩 외관',
        tags: ['회계법인', '간판', '사무실'],
        weight: 'atmospheric',
        promptForGPT: P(
          'Entrance to a Korean accounting firm office in a commercial building. ' +
          'A simple gold-on-black sign reads the firm name (Korean characters). ' +
          'A glass door with the firm logo. The lobby beyond is empty and tidy. ' +
          'A single security guard sits at a desk. ' +
          'Mid-day, ordinary-looking — but this firm appears in three of our previous corruption stories. ' +
          'Mundane composition.'
        )
      }
    ],

    ev_idol_drug: [
      {
        id: 'ph_idol_drug_01',
        filename: 'idol_drug_01_handoff.webp',
        caption: '호텔 지하 새벽, 모자를 깊게 눌러쓴 남자가 누군가에게 비닐봉지를 건네받는 손',
        tags: ['심야', '비닐봉지', '거래', '호텔'],
        weight: 'decisive',
        promptForGPT: P(
          'Underground area near a luxury hotel, 2:17 AM (timestamp visible on a security camera in corner). ' +
          'A man in a dark cap pulled low receives a small clear plastic bag from another figure whose face is just outside frame. ' +
          'The contents of the bag are tiny white-yellow tablets. ' +
          'A streetlight illuminates the moment — both shadows long and thin. ' +
          'Hands trembling slightly. ' +
          'Photographed from far away with extreme zoom.'
        )
      },
      {
        id: 'ph_idol_drug_02',
        filename: 'idol_drug_02_carexit.webp',
        caption: '클럽 입구 앞 그의 차량이 멀리 떠나는 뒷모습. 운전석엔 그 외 다른 사람',
        tags: ['클럽', '차량', '심야', '제3자'],
        weight: 'ambiguous',
        promptForGPT: P(
          'Outside a Korean upscale nightclub at 3 AM. ' +
          'A black luxury sedan is pulling away from the entrance. ' +
          'The driver is silhouetted but clearly NOT the celebrity (different shoulder shape, different hairstyle). ' +
          'A bouncer at the door looks down at his phone. ' +
          'Neon signs reflected in puddles. ' +
          'Photographed from across the street.'
        )
      }
    ],

    ev_apt_collapse: [
      {
        id: 'ph_apt_collapse_01',
        filename: 'apt_collapse_01_crack.webp',
        caption: '아파트 천장 균열 클로즈업. 하얀 페인트가 갈라져 떨어진 자리, 안쪽 콘크리트 보임',
        tags: ['균열', '천장', '부실시공', '콘크리트'],
        weight: 'decisive',
        promptForGPT: P(
          'Close-up of a serious crack in a residential apartment ceiling. ' +
          'White paint has flaked away revealing raw gray concrete underneath. ' +
          'The crack runs at an alarming angle, branching like a tree root. ' +
          'A small piece of plaster has fallen onto the wooden floor below — visible at the edge of frame. ' +
          'Side lighting from a window emphasizes the depth of the gap. ' +
          'Suggests the apartment is occupied but the residents have stopped looking up.'
        )
      },
      {
        id: 'ph_apt_collapse_02',
        filename: 'apt_collapse_02_complex.webp',
        caption: '신축 아파트 단지 외관 전경. 평범한 한국 아파트',
        tags: ['아파트', '외관', '단지'],
        weight: 'atmospheric',
        promptForGPT: P(
          'Exterior view of a newly built Korean apartment complex (multiple high-rise buildings). ' +
          'Overcast sky. The buildings look identical and flawless from the outside. ' +
          'A welcome banner hanging on one balcony. ' +
          'Children playing in the playground. ' +
          'The mundane public face — buildings reveal nothing of what is happening inside the walls. ' +
          'Wide angle, distant.'
        )
      }
    ],

    // ════════ Week 3 ════════
    ev_celeb_divorce: [
      {
        id: 'ph_celeb_divorce_01',
        filename: 'celeb_divorce_01_packing.webp',
        caption: '톱배우 자택 앞, 한쪽이 큰 가방 두 개를 들고 차 트렁크에 싣는 모습',
        tags: ['짐', '자택', '이별', '차량'],
        weight: 'decisive',
        promptForGPT: P(
          'Outside a luxury Korean home at dusk. ' +
          'A figure (woman, well-dressed) loads two large suitcases into the open trunk of a sedan. ' +
          'Her body language is heavy — the door of the house behind her is closed. ' +
          'A curtain in the upstairs window has been pulled aside slightly — someone is watching her leave. ' +
          'Long shadows. ' +
          'Photographed from a parked car across the street.'
        )
      },
      {
        id: 'ph_celeb_divorce_02',
        filename: 'celeb_divorce_02_card.webp',
        caption: '자택 앞 바닥에 떨어진 변호사 명함. 빗물에 젖어 일부 글씨가 번졌다',
        tags: ['변호사', '명함', '바닥', '비'],
        weight: 'ambiguous',
        promptForGPT: P(
          'Close-up of a wet business card lying face-up on a stone driveway. ' +
          'The card reads "Law Firm" in Korean (legible) followed by smudged ink where rain has bled the letters. ' +
          'A few drops of water still on the card. ' +
          'Behind the card, a slipper-shaped impression in the dust as if someone stepped past quickly. ' +
          'Late evening, slight dampness in the air.'
        )
      }
    ],

    ev_politician_realestate: [
      {
        id: 'ph_politician_realestate_01',
        filename: 'politician_realestate_01_deed.webp',
        caption: '등기부 등본 사본의 부분 클로즈업. 가족 명의 거래 시점이 의원 정책 발의 직후',
        tags: ['등기부', '거래', '가족명의', '시점'],
        weight: 'decisive',
        promptForGPT: P(
          'Close-up of a Korean property registration document (등기부등본) photocopy. ' +
          'Three transaction rows highlighted with yellow pen. ' +
          'The names are different but the addresses cluster together. ' +
          'A handwritten note in margin: "발의 3일 후" (three days after the bill). ' +
          'Coffee stain on the corner. ' +
          'Document slightly crumpled at the edges as if read many times.'
        )
      },
      {
        id: 'ph_politician_realestate_02',
        filename: 'politician_realestate_02_realtor.webp',
        caption: '동네 부동산 중개소 입구 앞에 가족으로 보이는 일행이 들어가는 모습',
        tags: ['부동산', '중개소', '가족', '동선'],
        weight: 'ambiguous',
        promptForGPT: P(
          'Korean neighborhood real estate office (부동산), small storefront. ' +
          'A family group of three (older couple and adult child) is just stepping inside, partially obscured by the door frame. ' +
          'Listings posted in the window: prices in Korean won, photos of apartments. ' +
          'The street outside is quiet, mid-day. ' +
          'Photographed from a parked car across the road. Long lens.'
        )
      }
    ],

    ev_academy_scam: [
      {
        id: 'ph_academy_scam_01',
        filename: 'academy_scam_01_receipt.webp',
        caption: '학원 비공식 결제 영수증 클로즈업. 손글씨로 적힌 금액과 강사 이름',
        tags: ['영수증', '비공식', '결제', '강사'],
        weight: 'decisive',
        promptForGPT: P(
          'Close-up of a handwritten receipt — informal, no official letterhead. ' +
          'The amount field shows a large number written in Korean Won. ' +
          'The signature/name field has a handwritten name and cell number scrawled in ballpoint pen. ' +
          'No business stamp, no card payment record. ' +
          'On the corner, an "Academy" logo from a different document peeking through. ' +
          'Lit by harsh overhead light.'
        )
      },
      {
        id: 'ph_academy_scam_02',
        filename: 'academy_scam_02_meeting.webp',
        caption: '학원 강사가 학부모와 카페에서 마주 앉아 무엇을 건네는 모습 (멀리서)',
        tags: ['학원', '강사', '학부모', '카페'],
        weight: 'ambiguous',
        promptForGPT: P(
          'Inside a Korean cafe near an academy district. ' +
          'A teacher (40s, slightly worn) sits across from a parent (40s, anxious). ' +
          'Between them on the table: a folder being passed. The parent has just produced something from her bag. ' +
          'Could be a study material handoff, could be a payment. ' +
          'Photographed from a distant table — partial obstruction by a column.'
        )
      }
    ],

    ev_singer_lipsync: [
      {
        id: 'ph_singer_lipsync_01',
        filename: 'singer_lipsync_01_engineer.webp',
        caption: '무대 옆 장비실에서 음향 엔지니어가 휴대폰으로 무대 음성을 녹음하는 모습',
        tags: ['장비실', '음향', '녹음', '엔지니어'],
        weight: 'decisive',
        promptForGPT: P(
          'Side-stage equipment room at a Korean concert venue. ' +
          'A sound engineer in a black t-shirt sits at a mixing console, but in his free hand he holds a smartphone, ' +
          'recording the audio output through the monitor speaker. ' +
          'His face is half-hidden by the headset. ' +
          'Stage lights bleed in through the curtain at the edge. ' +
          'A red REC indicator visible on the phone screen.'
        )
      },
      {
        id: 'ph_singer_lipsync_02',
        filename: 'singer_lipsync_02_venue.webp',
        caption: '콘서트장 외관 야간. 평범한 입구 풍경',
        tags: ['콘서트장', '외관', '야간'],
        weight: 'atmospheric',
        promptForGPT: P(
          'Korean concert venue exterior at night, between sets. ' +
          'Glass entrance doors closed. Two ushers stand inside the lobby. ' +
          'A poster advertising the singer\'s tour visible. ' +
          'Empty plaza outside, a few fans waiting at a barrier. ' +
          'Long banner with the artist name in Korean. ' +
          'Wide shot, mundane.'
        )
      }
    ],

    // ════════ Week 4 ════════
    ev_mayor_words: [
      {
        id: 'ph_mayor_words_01',
        filename: 'mayor_words_01_offstage.webp',
        caption: '선대본 회의장 뒤편, 시장 후보가 측근들과 사석에서 대화하는 옆얼굴',
        tags: ['선대본', '사석', '측근', '발언'],
        weight: 'decisive',
        promptForGPT: P(
          'Behind-the-scenes at a Korean political campaign headquarters. ' +
          'A mayoral candidate (mid-50s, suit) leans over a table with two senior staff members. ' +
          'His mouth open mid-sentence, eyes hard. The staff exchange a glance. ' +
          'Through a doorway, the brightly lit press room is visible — different reality, different face. ' +
          'Photographed from low angle, partially hidden behind a coat rack.'
        )
      },
      {
        id: 'ph_mayor_words_02',
        filename: 'mayor_words_02_office.webp',
        caption: '선거 사무소 외관, 낮 시간. 평범한 캠페인 현수막',
        tags: ['선거사무소', '외관', '캠페인'],
        weight: 'atmospheric',
        promptForGPT: P(
          'Mayoral campaign office in Seoul. Daytime. ' +
          'Banner with the candidate\'s smiling face above the entrance. ' +
          'Two volunteers hand out flyers to passersby on the sidewalk. ' +
          'A small TV crew packing up across the street after a daily appearance. ' +
          'Mundane political season scene.'
        )
      }
    ],

    ev_singer_drug: [
      {
        id: 'ph_singer_drug_01',
        filename: 'singer_drug_01_ambulance.webp',
        caption: '○○씨 자택 앞 새벽 응급차 도착. 들것에 누군가 실려 나오는 흐릿한 실루엣',
        tags: ['자택', '응급차', '심야', '들것'],
        weight: 'decisive',
        promptForGPT: P(
          'Outside the front gate of a private Korean residence at 3 AM. ' +
          'An ambulance is parked, red and white emergency lights bleeding through the air. ' +
          'A stretcher is being pushed out the front door — the person on it is partially covered by a sheet, ' +
          'only an arm visible hanging over the side. ' +
          'Two paramedics moving fast. ' +
          'A neighbor in pajamas stands in their doorway across the street, watching. ' +
          'Photographed from far away, hand-held, slight camera shake.'
        )
      },
      {
        id: 'ph_singer_drug_02',
        filename: 'singer_drug_02_house.webp',
        caption: '○○씨 자택 외관, 새벽. 1층 불 하나만 켜져 있다',
        tags: ['자택', '심야', '조명'],
        weight: 'atmospheric',
        promptForGPT: P(
          'Private Korean residence at 4 AM, hours before dawn. ' +
          'Two-story house behind a tall wall. ' +
          'One window on the ground floor glows yellow — the only light. ' +
          'The rest of the house in deep shadow. ' +
          'A single car in the driveway. ' +
          'No movement. The kind of stillness that suggests something has already happened.'
        )
      }
    ],

    ev_restaurant_abuse: [
      {
        id: 'ph_restaurant_abuse_01',
        filename: 'restaurant_abuse_01_throw.webp',
        caption: '식당 주방 안, 사장이 직원에게 무엇을 던지는 동작 순간',
        tags: ['주방', '갑질', '폭력', '직원'],
        weight: 'decisive',
        promptForGPT: P(
          'Interior of a small Korean restaurant kitchen. ' +
          'The boss (60s, apron) mid-throw — his arm extended, a metal ladle in motion through the air toward an employee crouched defensively. ' +
          'The employee\'s face turned away, shoulders raised. ' +
          'Steam from a pot rising between them. ' +
          'A piece of food has fallen to the floor. ' +
          'Captured through a half-open service window.'
        )
      },
      {
        id: 'ph_restaurant_abuse_02',
        filename: 'restaurant_abuse_02_storefront.webp',
        caption: '식당 외관 영업 시간. 평범한 동네 풍경',
        tags: ['식당', '외관', '동네'],
        weight: 'atmospheric',
        promptForGPT: P(
          'Korean neighborhood restaurant during lunch hour. ' +
          'Steam rising from the door. A few customers sitting inside, visible through the window. ' +
          'A delivery scooter parked at the curb. ' +
          'Modest signage in Korean. Plastic stools outside. ' +
          'The public face — warm, ordinary. Wide angle, midday light.'
        )
      }
    ],

    ev_internet_scam: [
      {
        id: 'ph_internet_scam_01',
        filename: 'internet_scam_01_account.webp',
        caption: '운영자 계좌 입금 내역 캡처. 같은 계좌로 들어온 수십 명의 입금',
        tags: ['계좌', '입금', '사기', '내역'],
        weight: 'decisive',
        promptForGPT: P(
          'Screenshot-style sketch of a Korean bank account transaction history page. ' +
          'A dense column of small deposits, each from different names, all into the same account. ' +
          'Yellow highlight on a series of identical-amount transfers spread across one week. ' +
          'A red circle drawn around the account holder name. ' +
          'Background: faintly visible computer monitor frame and a desk corner.'
        )
      },
      {
        id: 'ph_internet_scam_02',
        filename: 'internet_scam_02_office.webp',
        caption: '평범한 오피스텔 입구. 운영자가 사용하던 곳으로 추정',
        tags: ['오피스텔', '입구', '사무실'],
        weight: 'atmospheric',
        promptForGPT: P(
          'Korean small officetel building entrance, evening. ' +
          'A glass lobby door with a bank of mailboxes visible. ' +
          'A single overhead light. No people. ' +
          'Trash bags piled at the curb. ' +
          'A faint impression that someone left in a hurry — the door slightly ajar.'
        )
      }
    ],

    // ════════ Cross-week ════════
    ev_friend_scandal: [
      {
        id: 'ph_friend_scandal_01',
        filename: 'friend_scandal_01_argument.webp',
        caption: '동료의 자택 앞, 새벽에 누군가와 다투는 모습. 그림자만 보임',
        tags: ['자택', '심야', '다툼', '실루엣'],
        weight: 'decisive',
        promptForGPT: P(
          'Outside a Korean apartment front door at 2 AM. ' +
          'Two figures on the front porch, both standing, body language tense. ' +
          'One has hands raised — palms out, defensive. ' +
          'The other is leaning forward, finger pointing. ' +
          'Their faces are in deep shadow under the porch light. ' +
          'A bicycle parked beside them. ' +
          'Photographed from across the parking lot — slight motion blur from hand-held camera.'
        )
      },
      {
        id: 'ph_friend_scandal_02',
        filename: 'friend_scandal_02_mailbox.webp',
        caption: '자택 우편함 옆 평범한 풍경. 신문이 쌓여 있다',
        tags: ['우편함', '자택', '신문'],
        weight: 'atmospheric',
        promptForGPT: P(
          'A residential mailbox by the front door of a Korean home. ' +
          'Three days\' worth of newspapers piled — uncollected. ' +
          'A single folded letter sticks out at the top of the stack. ' +
          'Worn doormat below. The kind of detail that suggests someone has been distracted. ' +
          'Side morning light.'
        )
      }
    ],

    ev_anonymous_dm: [
      {
        id: 'ph_anonymous_dm_01',
        filename: 'anonymous_dm_01_handoff.webp',
        caption: '카페 안쪽 자리, 모자 쓴 사람이 USB를 책상 위에 올리는 손',
        tags: ['카페', '익명', 'USB', '거래'],
        weight: 'decisive',
        promptForGPT: P(
          'Quiet inner corner of a Korean cafe, table for two. ' +
          'A hand wearing a long sleeve places a USB drive on the table\'s edge. ' +
          'Across the table, the receiver\'s coffee cup is half-empty. ' +
          'No faces — just hands, the table, the USB. ' +
          'Window light from one side. ' +
          'A folded piece of paper next to the USB.'
        )
      },
      {
        id: 'ph_anonymous_dm_02',
        filename: 'anonymous_dm_02_emptyseat.webp',
        caption: '카페 안쪽 빈 자리. 컵 하나만 남아 있다',
        tags: ['카페', '빈자리', '실패'],
        weight: 'atmospheric',
        promptForGPT: P(
          'Empty cafe corner table. ' +
          'Two chairs, but only one coffee cup — half-empty, lipstick on the rim. ' +
          'The other side of the table is clean, untouched. ' +
          'Late afternoon light through gauzy curtains. ' +
          'The kind of scene that says someone waited and the other never came.'
        )
      }
    ],

    ev_blogger_review: [
      {
        id: 'ph_blogger_review_01',
        filename: 'blogger_review_01_contract.webp',
        caption: '협찬 계약서 사본 클로즈업. 광고주명·금액·미공개 표시',
        tags: ['계약서', '협찬', '광고주', '미공개'],
        weight: 'decisive',
        promptForGPT: P(
          'Close-up of a Korean sponsorship contract photocopy. ' +
          'Two relevant fields highlighted in yellow: the sponsor brand name and the payment amount. ' +
          'A "Non-disclosure clause" section circled in red ink. ' +
          'A signature line at the bottom — the influencer\'s name written in cursive. ' +
          'Coffee ring stain in the upper corner.'
        )
      },
      {
        id: 'ph_blogger_review_02',
        filename: 'blogger_review_02_streetcafe.webp',
        caption: '인플루언서가 카페에서 폰을 보는 일상 모습',
        tags: ['인플루언서', '카페', '일상'],
        weight: 'ambiguous',
        promptForGPT: P(
          'A young Korean influencer (early 30s, fashionable) sits at a streetside cafe table, scrolling on her phone. ' +
          'Multiple shopping bags from luxury brands beside her. ' +
          'A laptop open showing email — content not visible from this angle. ' +
          'She doesn\'t look up. Mid-afternoon, ordinary. ' +
          'Photographed from across the street.'
        )
      }
    ],

    ev_traffic_cam: [
      {
        id: 'ph_traffic_cam_01',
        filename: 'traffic_cam_01_plate.webp',
        caption: '블랙박스 영상 한 컷, 차량 번호판 클로즈업',
        tags: ['블랙박스', '번호판', '차량', '식별'],
        weight: 'decisive',
        promptForGPT: P(
          'Dashcam still frame, slightly grainy. ' +
          'A luxury black SUV in profile, license plate clearly readable in the lower third. ' +
          'Timestamp in the corner of the frame. ' +
          'Surrounding road empty. The vehicle is moving — slight motion streak on wheels. ' +
          'Sketched in the rough monochrome style of newsprint.'
        )
      },
      {
        id: 'ph_traffic_cam_02',
        filename: 'traffic_cam_02_road.webp',
        caption: '도로 위 평범한 차량 행렬. 야간',
        tags: ['도로', '차량', '야간'],
        weight: 'atmospheric',
        promptForGPT: P(
          'Korean urban road at night, multiple cars in two lanes. ' +
          'Headlights and taillights creating streaks. ' +
          'No specific license plates legible — just the flow of traffic. ' +
          'Wide angle, suspended-camera POV. ' +
          'Wet road surface.'
        )
      }
    ],

    ev_youtuber_finance: [
      {
        id: 'ph_youtuber_finance_01',
        filename: 'youtuber_finance_01_ledger.webp',
        caption: '회계 자료 송금 흐름도 부분. 같은 계좌가 반복 등장',
        tags: ['회계', '송금', '흐름도'],
        weight: 'decisive',
        promptForGPT: P(
          'Hand-drawn flowchart of money movement on a notebook page. ' +
          'Multiple arrows pointing from "Channel Revenue" to a personal account, then circular flow back through several intermediate accounts. ' +
          'One node circled in red — a key transfer point. ' +
          'Notes scribbled in margin. ' +
          'Reading like a journalist\'s working sketch.'
        )
      },
      {
        id: 'ph_youtuber_finance_02',
        filename: 'youtuber_finance_02_office.webp',
        caption: '유튜버 사무실 외관. 평범한 빌딩 1층 입구',
        tags: ['사무실', '외관', '유튜버'],
        weight: 'atmospheric',
        promptForGPT: P(
          'Front entrance of a small Korean office unit on the ground floor of a commercial building. ' +
          'A simple sign with the YouTube channel name. ' +
          'Through the glass, a couple of editing desks visible — one in use, the other empty. ' +
          'A delivery package sitting outside the door. ' +
          'Mundane mid-day scene.'
        )
      }
    ]
  };

  // chunk loaded marker
  if (!window._loadedChunks) window._loadedChunks = new Set();
  window._loadedChunks.add('content_photos');
})();

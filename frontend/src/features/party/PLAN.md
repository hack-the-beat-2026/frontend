# Front A — Party / Host 구현 계획

작성 기준: `frontend_agent.md` §4, `contractRules.md` 전체, `presentation/제출전_교체항목.md`.
경합 시 우선순위는 **contractRules > frontend_agent > 이 문서**.

---

## 0. 현재 상태 (2026-08-29 갱신)

| 항목 | 상태 |
|---|---|
| `main` | Vite 셋업 + 공용 계약 레이어 + mock 백엔드까지 병합됨 |
| `src/shared/` | types · api · mock · store · hooks · config **완료** |
| `src/routes/` | Root Router. 각 Feature의 `RouteObject[]`를 spread만 한다 |
| `src/features/party/` | 6개 화면 구현 완료 (아래 3장) |
| 백엔드 저장소 | `architecture.md` + 도메인 엔티티 + Flyway 스키마 올라옴. **API 구현은 아직** |
| 검증 | `npm run smoke` — mock 게임 흐름 33개 검사 통과 |

**`architecture.md`가 SSOT다.** 이 문서와 `contractRules.md`가 다르면 architecture.md를 따른다.

## 1. 확정 기술 스택

기존 스택(React 19 / TS 6 / Vite 8 / Tailwind 4 / oxlint)은 그대로 두고, 아래만 추가한다.
`contractRules.md`가 이미 특정 라이브러리를 전제하고 있어 대부분 선택의 여지가 없다.

| 용도 | 확정 | 근거 |
|---|---|---|
| 라우팅 | `react-router` v8 | Rule 3 — feature별 하위 라우터. `RouteObject[]` 배열로 export |
| 서버 상태 | `@tanstack/react-query` v5 | contractRules §39가 `queryClient.invalidateQueries`를 명시 |
| 전역 상태 | `zustand` v5 | contractRules §8 명시. roomCode/gameId/token/role **만** |
| HTTP | 자체 `fetch` 래퍼 (신규 의존성 0) | Authorization 주입 + `ApiError` 정규화만 필요. axios 불필요 |
| QR 렌더 | `qrcode.react` | `qrToken` → URL 인코딩용. **토큰 생성 아님** (§18 준수) |
| 실시간 | `@stomp/stompjs` | Spring STOMP (`/ws`, `/topic/rooms/{roomId}`). **Phase 4에서 투입** |
| 인쇄 | 순수 CSS `@media print` | §27 — 자체 프린터 드라이버 금지 |

### 도입하지 않는 것 (Rule 12: 불필요한 라이브러리 금지)

`axios`, `MSW`, `react-hook-form`, `zod`, `framer-motion`, shadcn/MUI 등 UI 킷, `date-fns`.
폼은 5개 필드뿐이고, 타이머는 `startedAt + duration` 산술로 충분하다.

```bash
npm i react-router @tanstack/react-query zustand qrcode.react
npm i @stomp/stompjs          # Phase 4에서
# React 19 peer 충돌 시: npm i qrcode.react --legacy-peer-deps
```

---

## 2. A0 — 부트스트랩 ✅ 완료 (`main`에 병합됨)

`src/shared/`가 없으면 A/B/C 누구도 시작할 수 없어 Front A가 먼저 만들었다.
`feat/frontend-shared` → `main` 병합 완료. **B/C는 `main` 위로 rebase한 뒤 시작하면 된다.**
(main과 앱 코드가 서로 다른 root였어서 `--allow-unrelated-histories`로 합쳤다.)

```text
src/shared/
├─ types/            # §40이 지정한 파일명 그대로
│  ├─ room.ts          Room, CreateRoomRequest/Response, JoinRoomRequest/Response
│  ├─ participant.ts   ParticipantType, GameRole, ParticipantStatus, Participant
│  ├─ game.ts          GameStatus, Game (designStartedAt / DurationSeconds 등 타이머 필드 포함)
│  ├─ character.ts     CharacterStatus, Character, CharacterSubmitRequest, CharacterFoundResponse
│  ├─ api.ts           ApiError, ApiErrorCode (§32의 16개 코드 union)
│  ├─ websocket.ts     RoomEventType, RoomEvent
│  └─ index.ts
├─ api/
│  ├─ client.ts        baseUrl '/api/v1', Authorization 주입, ApiError 정규화, 409 식별
│  ├─ queryKeys.ts     room / game / participants / characters
│  ├─ roomApi.ts       createRoom, joinRoom, getRoom, getParticipants           ← A가 채움
│  ├─ gameApi.ts       getGame, startGame, startHiding, startSeeking, finishGame ← A가 채움
│  ├─ printApi.ts      getPrintSheet                                            ← A가 채움
│  ├─ characterApi.ts  (시그니처만 — B가 채움)
│  └─ scanApi.ts       (시그니처만 — C가 채움)
├─ store/sessionStore.ts   zustand + sessionStorage: hostToken, participantToken,
│                          roomCode, roomId, gameId, participantId, role
├─ hooks/useCountdown.ts   startedAt + duration → 남은 초 (UX 전용, §13)
├─ components/             비워 둔다. 2개 이상 feature가 실제로 쓸 때만 승격
└─ config/env.ts           VITE_API_BASE_URL, VITE_WS_URL, VITE_API_MODE=mock|live
```

**Mock 스위치**: `client.ts`가 `VITE_API_MODE === 'mock'`이면 `shared/api/mock/`으로 분기한다.
저장소를 둘로 나눈 것이 핵심이다.

- **세션(토큰)은 sessionStorage** — 탭마다 다른 사람이 된다
- **mock DB는 localStorage** — 모든 탭이 같은 서버를 본다

덕분에 한 브라우저에서 HOST 탭 / HIDER 탭 / SEEKER 탭을 동시에 열어 전체 흐름을 완주할 수 있다.
백엔드가 늦어질 경우의 Plan B 역할도 겸한다. `npm run smoke`로 게임 흐름 33개 검사를 돌린다.

**Root Router**: Rule 3은 "각 Agent는 root router를 수정하지 않는다"이지, 아무도 만들지 말라는
뜻이 아니다. A0에서 `src/routes/AppRouter.tsx`를 **생성만** 하고 B/C 라우트는 lazy import 자리만
비워 둔다. 이후 A는 이 파일을 건드리지 않는다. `src/App.tsx`의 Vite 템플릿도 이때 제거한다.

---

## 3. 화면별 작업

라우트는 `routes/partyPaths.ts`(= contractRules §34) 기준이다.
`frontend_agent.md` §4의 `/room/:roomId/...` 표기는 폐기됐다.

### A1. Landing `/`

- 「방 만들기」 / 「참여하기」 두 개의 큰 버튼
- 6자리 방 코드 입력 → `/join/:roomCode` 이동
- **QR 입장은 카메라 스캔을 구현하지 않는다.** `joinUrl` 링크 진입만 지원한다.
  (카메라 스캐너는 Front C 소유이고, 심사 안내문도 "참가 링크를 새 탭에서 열어"라 불필요)
- 완료 조건: 로그인 없이 첫 화면에서 방 만들기까지 도달

### A2. Create Room `/host/create`

- 폼 = `CreateRoomRequest`: `name`, `designDurationSeconds`, `hideDurationSeconds`,
  `seekDurationSeconds`, `seekerCount`
- **기본값을 미리 채우고 프리셋 버튼(빠른 데모 / 표준 / 긴 판)을 둔다** — 심사자가 입력에
  시간을 쓰지 않게 하는 것이 목적
- `POST /api/v1/rooms` → `hostToken`을 sessionStore에 저장 → `/host/room/:roomCode`
- `roomCode`는 백엔드가 생성한 6자리를 그대로 쓴다 (§9)

### A3. Join `/join/:roomCode`

**계약 구멍 처리**: §34 라우트 트리에 *PLAYER 로비*가 없다.
→ **이 라우트가 「참가 폼」과 「참가 후 대기」를 모두 담당**한다. 참가 후 게임이 시작되면
(`GameStatus !== 'WAITING'`) `/game/:gameId/role`로 넘긴다. **이 결정을 B/C에 반드시 공지한다.**

- 닉네임 입력 → `POST /api/v1/rooms/{roomCode}/participants` → `participantToken` 저장
- 에러 문구 분기: `ROOM_NOT_FOUND` / `ROOM_FULL` / `DUPLICATE_NICKNAME`
- 대기 화면: 참가자 목록, 인원 수, "HOST가 시작하면 자동으로 넘어갑니다" 안내

### A4. Host Lobby `/host/room/:roomCode`

- 방 코드 초대형 표시 + 복사 버튼
- `joinUrl` 복사 버튼 **(심사 안내 1단계가 직접 요구)**
- `joinQrUrl`을 `<img>`로 표시 (백엔드 생성물이므로 렌더만)
- 참가자 목록 — `refetchInterval: 2000` 폴링으로 시작, Phase 4에 WS로 교체
- 「게임 시작」 → `POST /api/v1/rooms/{roomId}/games/start` → `gameId` 저장 → `/host/game/:gameId`
- 시작 버튼은 HOST 화면에만 노출하되 **성공을 가정하지 않는다** (§11). `ACCESS_DENIED` 처리 필수

### A5. Host Dashboard `/host/game/:gameId`

- `GameStatus` 스텝퍼: `ROLE_ASSIGNED → DESIGNING → PRINTING → HIDING → SEEKING → FINISHED`
  — **백엔드 값 그대로.** LOBBY / READY / GAME_OVER 같은 이름을 만들지 않는다 (§2)
- 현재 단계 남은 시간 (`useCountdown`, UX 전용). 만료돼도 클라이언트가 단계를 넘기지 않는다 (§13)
- 참가자별 상태 테이블 + HIDER 제출 진행률 `n / m`
- 단계 진행 버튼 — 현재 status에서만 활성화:
  - `POST /api/v1/games/{gameId}/hiding/start`
  - `POST /api/v1/games/{gameId}/seeking/start` **(심사 안내 3단계가 직접 요구)**
  - `POST /api/v1/games/{gameId}/finish`
- 각 요청 성공 후 **최신 game state를 재조회**한 뒤 UI 갱신 (§12, §39)
- **409 Conflict는 장애가 아니라 정상 흐름** (§33) — game 재조회 후 알맞은 화면으로 이동
- `PRINTING` 이상에서 인쇄 화면 링크 활성

### A6. Print `/host/games/:gameId/print` — **Front A의 핵심 산출물**

별도 절(4장)에서 상세히 다룬다.

### A7. Host Result `/host/result/:gameId` — 조건부, 최하 우선순위

§34에는 있으나 `partyPaths.ts`에는 없고, Front C의 `/game/:gameId/result`와 중복된다.
→ **시간이 없으면 대시보드에서 `/game/:gameId/result`로 링크만 걸고 구현하지 않는다.**
구현한다면 "승패 + 발견된 HIDER 목록"만 담은 얇은 화면으로 제한한다.

---

## 4. 인쇄 화면 상세 설계

가장 위험하고 가장 차별적인 부분이다. 실패하면 제품의 핵심 주장("캐릭터와 QR의 1:1 인쇄")이
무너진다. `제출전_교체항목.md`도 이 항목을 사실 확인 대상으로 못박고 있다.

### 4.1 절대 규칙 (§24 / §25 / §26)

```ts
// 배열은 단 한 번만 만들고, 앞면과 뒷면이 같은 배열을 쓴다.
const printSlots = [...characters].sort((a, b) => a.characterId - b.characterId)
renderFront(printSlots)
renderBack(printSlots)
```

앞면과 뒷면에서 각각 정렬하는 코드는 절대 쓰지 않는다. 절취 영역(박스 크기와 위치)은
앞뒤가 픽셀 단위로 동일해야 하고, QR은 절취선 안쪽 6mm 여백을 확보한다.

### 4.2 두 가지 인쇄 모드

`제출전_교체항목.md`가 "일반 A4 출력과 전용 키트 출력 **모두**"를 검증 대상으로 요구하므로
레이아웃을 두 가지로 만든다. 이는 계약 위반이 아니라 프론트 소유 영역(레이아웃)의 확장이지만,
§27이 duplex를 "공식 권장"으로 적고 있으므로 **팀에 공지 후 진행**한다.

**모드 1 — 접지형 단면 (권장 기본값)**

한 슬롯이 `[캐릭터 패널 | QR 패널]`로 좌우 배치되고, 가운데를 **인쇄면이 바깥으로 오게**
접으면 캐릭터가 앞, QR이 뒤가 된다. **단면 인쇄 한 장이면 끝나므로 프린터 설정 실패
리스크가 0이다.** 기획안의 "접지형 전용 출력지" 키트와도 직결된다.

- 초기 치수: 완성 카드 46 × 78 mm, 펼침 92 × 78 mm → **2열 × 3행 = 6장 / A4**
- 절취선은 슬롯 바깥 테두리에만. 가운데 접선은 **다른 점선 스타일 + "접는 선" 라벨**
- QR 최소 28mm 확보

**모드 2 — 양면(duplex) 2장**

§27의 공식 권장 방식. 앞면 시트 / 뒷면 시트 2페이지.

- 초기 치수: 카드 60 × 90 mm → **3열 × 2행 = 6장 / A4** (§24 예시와 동일 배치)
- ⚠️ **장변 넘김(long edge) 양면 인쇄에서는 뒷면이 좌우로 뒤집힌다.** 논리적 페어링을
  유지한 채 각 행의 **렌더 순서만 역순**으로 뒤집어야 QR이 올바른 캐릭터 뒤에 온다.

  ```text
  앞면 행:   A     B     C
  뒷면 행:  QR-C  QR-B  QR-A     ← 물리적으로 접히면 A-B-C 뒤에 정확히 놓인다
  ```

  `printSlots` 배열 자체는 건드리지 않고 행 단위 `.reverse()`만 한다 → §25 위반 아님.
  코드에 이유를 주석으로 남긴다.
- **안전장치**: 「뒷면 좌우 반전」 토글 + 각 슬롯에 슬롯 번호 인쇄. 현장에서 잘못 나오면
  토글 한 번으로 교정한다. 프린터 기종별 차이를 흡수하는 유일한 현실적 방법이다.

### 4.3 공통

- `@page { size: A4 portrait; margin: 10mm }`, 슬롯 초과 시 `break-after: page`
- `@media print`로 네비와 버튼 전부 숨김 (§28)
- 화면에만 보이는 인쇄 옵션 안내 배너: **A4 세로 / 배율 100% / (모드 2일 때) 양면 · 장변 넘김**
- **각 슬롯에 `qrToken` 평문 + 복사 버튼** ← 심사 안내 3단계의 "인쇄 화면의 토큰을 입력"이
  이것 없이는 불가능하다. **필수 항목.**
- 인쇄 완료 처리(CharacterStatus `PRINTED`)는 백엔드 엔드포인트 확인 필요 (8장 목록 5번)

### 4.4 반드시 실물 검증

치수와 반전 여부는 브라우저 미리보기로 확정할 수 없다. **두 모드 모두 실제 A4로 한 번씩
출력해서 접거나 잘라 본다.** 이 검증 전에는 "1:1 대응이 동작한다"고 말하지 않는다.

---

## 5. 공통 에러 / 상태 처리

- `ApiError.code` 기준으로 분기한다. HTTP status만 보고 처리하지 않는다 (§31)
- Front A가 처리해야 할 코드: `ROOM_NOT_FOUND`, `ROOM_FULL`, `DUPLICATE_NICKNAME`,
  `INVALID_TOKEN`, `ACCESS_DENIED`, `GAME_NOT_FOUND`, `GAME_INVALID_STATE`, `PRINT_NOT_READY`
- 409 → game / room 재조회 → 알맞은 화면으로 이동
- 토큰 없음 또는 `INVALID_TOKEN` → 세션 클리어 후 랜딩
- **API 성공 응답 이전에 성공 UI를 그리지 않는다** (§38). Optimistic update 금지

---

## 6. 실시간 (Phase 4)

- `shared/hooks/useRoomEvents.ts` — STOMP 구독 `/topic/rooms/{roomId}`.
  **shared 신규 파일이므로 B/C와 사전 합의 후 추가.**
- 이벤트 수신 → 해당 쿼리 `invalidateQueries`만 한다. **이벤트 payload로 상태를 재구성하지
  않는다** (§39)
- Front A가 쓰는 이벤트: `PARTICIPANT_JOINED` / `PARTICIPANT_LEFT`, `GAME_STARTED`,
  `DESIGN_SUBMITTED`, `DESIGN_PHASE_ENDED`, `HIDING_STARTED`, `SEEKING_STARTED`,
  `CHARACTER_FOUND`, `GAME_FINISHED`
- 개인 역할은 `/topic`이 아니라 `/user/queue/game`으로 받는다. HOST 화면에서도 다른 참가자의
  HIDER / SEEKER 라벨을 함부로 노출하지 않는다 (§30) — 아래 8장 확인 항목 7번 참고
- **폴백**: WS가 안 되면 `refetchInterval: 2000`. 데모는 폴링만으로도 완주 가능해야 한다

---

## 7. 작업 순서

| 순서 | 내용 | 게이트 |
|---|---|---|
| **P0-a** | A0 부트스트랩 (shared 골격 + 의존성 + root router + 템플릿 제거) | main 병합 후 B/C 시작 가능 |
| **P0-b** | 배포 파이프라인 1회 구성 (9장 참고) | HTTPS 공개 URL 확보 |
| **P0-c** | A1 → A2 → A3 → A4 → A5 단계 버튼 | **방 생성 → 참가 → 시작 → 단계 전환 완주** |
| **P1** | A6 인쇄 (모드 1 → 모드 2) + 실물 출력 검증 | qrToken 평문 노출 포함 |
| **P2** | 5장 에러 처리 전면 적용, 심사 대응 마감 | |
| **P3** | 실시간 STOMP 교체 | |
| **P4** | A7 Host Result | 시간 남으면 |

`contractRules.md` §36의 Phase 1(스켈레톤 우선) 원칙을 따른다 — **이미지 에디터보다 전체
흐름이 먼저 돌아야 한다.**

---

## 8. 백엔드 확인 항목 — `architecture.md`로 해결된 것

| # | 항목 | 결과 |
|---|---|---|
| 1 | 참가자 목록 | ✅ `GET /api/v1/rooms/{roomId}/participants` — **HOST 전용** |
| 2 | 게임 조회 | ✅ `GET /api/v1/games/{gameId}` |
| 3 | 인쇄용 캐릭터 목록 | ✅ `GET /api/v1/games/{gameId}/print-sheet` — `qrToken` 포함, HOST 전용 |
| 4 | QR 이미지 제공 여부 | ✅ **주지 않는다.** §21 규칙 24 — "QR Image는 영속화하지 않고 qrToken으로 필요 시 생성"<br>→ 인쇄 페이지가 `qrcode.react`로 직접 렌더한다 |
| 6 | 숨기기 완료 보고 | ✅ `POST /api/v1/games/{gameId}/characters/{characterId}/hidden` — HIDER 본인만 |
| 9 | 이미지 업로드 | ✅ `POST /api/v1/games/{gameId}/characters/upload-url` 또는 Multipart (Front B 영역) |

### 아직 남은 것

| # | 항목 | 왜 막혀 있나 |
|---|---|---|
| 5 | `CharacterStatus`를 `PRINTED`로 넘기는 API | DB에 `printed_at` 컬럼과 `PRINT_NOT_READY` 에러코드는 있는데 엔드포인트가 없다.<br>현재 인쇄 화면은 상태를 바꾸지 않고 인쇄만 한다 |
| 7 | HOST 응답의 참가자 `role` 포함 여부 | 참가자 목록이 HOST 전용이니 포함될 가능성이 높지만 명시가 없다.<br>대시보드는 **역할을 기본으로 숨기고** 토글로만 보여준다 (§14 민감 정보 원칙) |
| 8 | `joinUrl` origin | 백엔드가 만든다. **프론트 배포 도메인을 백엔드 설정에 넣어야 한다.**<br>localhost가 박히면 폰 QR 스캔이 전부 실패한다 |
| 10 | WebSocket이 SockJS인가 | `spring-boot-starter-websocket`만 있고 SockJS 언급이 없다.<br>순수 STOMP over WebSocket으로 가정하고 Phase 4에서 확인한다 |
| 11 | `GET /rooms/{roomCode}` 응답 형태 | architecture.md에 요청만 있고 응답 예시가 없다.<br>현재 `currentGameId`와 `participants`가 온다고 가정한다 — PLAYER 대기 화면이 이걸로 동작한다 |

### architecture.md가 바로잡아 준 것 (내 초기 가정이 틀렸던 부분)

- **DESIGNING → PRINTING은 시간 만료가 아니라 「모든 HIDER 제출 완료」가 조건이다.**
  제한시간이 끝나면 *프론트가* 현재 캔버스를 자동 제출한다 (§15, §21 규칙 25).
- **HIDING → SEEKING은 자동 전환되지 않는다.** 숨기기 시간 종료 + 모든 HIDER 준비 완료 +
  HOST의 명시적 요청을 **모두** 만족해야 한다 (§21 규칙 26).
- **`CharacterStatus.EDITING`은 존재하지 않는다.** 백엔드 enum은 `SUBMITTED`부터 시작한다.

## 9. 배포 (P0으로 당겨야 하는 이유)

- 제출 폼에 `{{DEMO_URL}}`이 **필수**이고, 로그인 없이 핵심 플로우가 열려야 한다
- **QR 스캔과 카메라 권한은 HTTPS에서만 동작한다.** localhost 개발만으로는 B/C의 핵심 기능을
  아예 테스트할 수 없다 → 배포는 마지막이 아니라 **초반 작업**이다
- 프론트: Vercel / Cloudflare Pages 중 하나 (SPA fallback 설정 필요 — `/c/:qrToken` 직접 진입)
- 백엔드: HTTPS + CORS에 프론트 origin 허용
- Front A(저장소 admin)가 배포를 맡는 것이 자연스럽다

---

## 10. 팀 합의가 필요한 3가지

1. **`src/shared/`를 Front A가 선점 생성**하고 `feat/frontend-shared` → main 병합 후 B/C가
   rebase한다. (대안: 통합 담당자를 먼저 정한다)
2. **`/join/:roomCode`가 PLAYER 로비를 겸한다.** §34에 PLAYER 대기 라우트가 없기 때문.
3. **인쇄에 접지형 단면 모드를 추가**하고 이를 기본값으로 둔다. §27의 duplex는 옵션으로 유지.

---

## 11. 리스크

| 리스크 | 대응 |
|---|---|
| 백엔드가 제때 안 나옴 | localStorage 기반 mock을 다중 탭 동기화까지 만들어 **데모 완주 경로 확보** |
| 양면 인쇄 좌우 반전 오류 | 접지형 단면을 기본값으로. 반전 토글 + 슬롯 번호로 현장 교정 |
| 배포 지연으로 QR / 카메라 미검증 | 배포를 P0-b로 앞당김 |
| shared 타입 충돌 | A0을 짧게 끊고 main에 먼저 병합. 이후 shared 변경은 3인 합의 |
| contractRules 위반 리팩터링 유혹 | Rule 1~7 준수. 다른 feature 폴더는 읽기만 |

---

## 12. Front A 완료 기준 (frontend_agent.md §10)

- [ ] 방 생성 → Lobby까지 백엔드 없이 독립 실행
- [ ] Host Dashboard 독립 실행
- [ ] Mock 참가자 데이터로 단계 전환 확인
- [ ] Mock Hider Design으로 Print Preview 생성
- [ ] Hider / Seeker feature 없이 전 화면 테스트 가능
- [ ] 인쇄물 실물 출력 검증 (접지형 / 양면 각 1회)
- [ ] 인쇄 화면에 `qrToken` 평문 + 복사 버튼 노출

---

## 13. 진행 상황 (2026-08-29)

### 완료

- **A0 부트스트랩** — shared 계약 레이어 + Root Router + mock 백엔드, `main` 병합
- **A1 Landing** `/` — 방 만들기 / 6자리 코드 입장
- **A2 Create** `/host/create` — 프리셋 3종, 찾는 사람 수, 기본값 채워 둠
- **A3 Join** `/join/:roomCode` — 참가 폼 + 참가 후 대기 겸용, 에러 코드별 문구
- **A4 Lobby** `/host/room/:roomCode` — 코드·QR·링크 복사, 참가자 폴링, 게임 시작
- **A5 Dashboard** `/host/game/:gameId` — 스텝퍼·타이머·제출/발견 현황·단계 전환·역할 토글
- **A6 Print** `/host/games/:gameId/print` — 접지형/양면 2모드, 반전 토글, qrToken 평문+복사
- `npm run smoke` — mock 게임 흐름 33개 검사 (권한·상태·중복·승패·인쇄 페어링)

### 다음

1. **실물 출력 검증** — 접지형·양면 각 1회. 이게 끝나야 "1:1 대응 동작"이라고 말할 수 있다
2. **배포** — `{{DEMO_URL}}` 필수. QR/카메라는 HTTPS에서만 되므로 B/C보다 먼저 필요하다
3. **백엔드 연동** — API가 뜨면 `VITE_API_MODE=live`로 전환하고 위 §8의 남은 항목 확인
4. **실시간** — STOMP로 폴링 교체 (Phase 4)
5. **A7 Host Result** — 시간 남으면

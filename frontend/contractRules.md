# Frontend-Backend Contract Rules

> 이 문서는 Frontend 개발자가 Backend Architecture Specification을 준수하기 위해 반드시 따라야 하는 구현 규칙을 정의한다.
>
> 모든 Frontend Agent는 기능 구현 전에 이 문서를 반드시 확인한다.
>
> **Frontend는 Backend의 Game State, Role, Status, QR, 권한 규칙을 임의로 재정의하지 않는다.**

---

# 1. 가장 중요한 원칙

## Backend가 Source of Truth다

Frontend는 화면을 표시하고 사용자 입력을 전달하는 역할을 담당한다.

다음 정보는 반드시 Backend 응답을 기준으로 판단한다.

- 현재 Game Status
- Room Status
- Participant Role
- Participant Status
- Character Status
- Winner
- Game Phase
- Timer 종료 여부
- Character 발견 여부
- QR 유효성
- 권한 여부

Frontend가 자체적으로 위 상태를 확정해서는 안 된다.

### 금지

```ts
if (remainingTime <= 0) {
  game.status = "PRINTING";
}
```

또는

```ts
if (allHidersSubmitted) {
  moveToPrinting();
}
```

처럼 Client에서 Game Phase를 확정하지 않는다.

### 허용

```ts
const game = await getGame(gameId);

if (game.status === "PRINTING") {
  navigate(`/host/print/${gameId}`);
}
```

Backend가 내려준 상태를 기준으로 화면만 변경한다.

---

# 2. Backend Game Status를 그대로 사용한다

Frontend에서 임의의 Phase 이름을 추가하거나 변경하지 않는다.

공식 Game Status:

```ts
export type GameStatus =
  | "WAITING"
  | "ROLE_ASSIGNED"
  | "DESIGNING"
  | "PRINTING"
  | "HIDING"
  | "SEEKING"
  | "FINISHED";
```

Frontend에서 다음과 같이 다른 이름을 만들어 사용하면 안 된다.

```text
LOBBY
READY
DESIGN_DONE
PRINT_READY
HIDE_READY
GAME_OVER
```

필요한 UI 상태가 있다면 GameStatus와 별개의 Local UI State로 관리한다.

예:

```ts
type EditorUiState =
  | "CAMERA"
  | "SELECT_TEMPLATE"
  | "EDITING"
  | "PREVIEW";
```

이 값은 Backend GameStatus와 혼동해서는 안 된다.

---

# 3. Role 값은 Backend 값을 그대로 사용한다

## Participant Type

```ts
export type ParticipantType =
  | "HOST"
  | "PLAYER";
```

## Game Role

```ts
export type GameRole =
  | "NONE"
  | "HIDER"
  | "SEEKER";
```

Frontend Agent가 임의로 아래와 같은 값을 추가하면 안 된다.

```text
ADMIN
OWNER
HIDE
SEEK
USER
GUEST
```

역할 배정은 Backend에서 수행한다.

Frontend는 사용자의 역할을 직접 랜덤 배정하지 않는다.

---

# 4. Participant Status를 임의 변경하지 않는다

공식 Participant Status:

```ts
export type ParticipantStatus =
  | "WAITING"
  | "ACTIVE"
  | "ELIMINATED"
  | "SURVIVED"
  | "LEFT";
```

다음과 같은 동작은 금지한다.

```ts
participant.status = "ELIMINATED";
```

QR 발견 이후 HIDER 탈락 여부는 Backend가 처리한다.

Frontend는 Backend 응답을 받은 뒤 결과를 표시한다.

---

# 5. Character Status를 그대로 사용한다

공식 Character Status:

```ts
export type CharacterStatus =
  | "EDITING"
  | "SUBMITTED"
  | "PRINTED"
  | "HIDDEN"
  | "FOUND"
  | "SURVIVED";
```

Frontend는 Character 상태를 임의로 다음 단계로 변경하지 않는다.

예:

```text
SUBMITTED → PRINTED
PRINTED → HIDDEN
HIDDEN → FOUND
```

상태 변경이 필요한 경우 반드시 Backend API를 호출하고 성공 응답 이후 UI를 업데이트한다.

---

# 6. HOST / PLAYER Token 처리

회원가입 시스템은 사용하지 않는다.

## HOST

방 생성 성공 시 Backend에서 `hostToken`을 반환한다.

Frontend는 이를 LocalStorage에 저장한다.

```ts
localStorage.setItem("hostToken", hostToken);
```

HOST API 요청 시:

```http
Authorization: Bearer {hostToken}
```

형태로 전달한다.

---

## PLAYER

방 참가 성공 시 Backend에서 `participantToken`을 반환한다.

Frontend는 이를 LocalStorage에 저장한다.

```ts
localStorage.setItem(
  "participantToken",
  participantToken
);
```

PLAYER API 요청 시:

```http
Authorization: Bearer {participantToken}
```

형태로 전달한다.

---

## 절대 금지

Frontend에서 Token을 직접 생성하지 않는다.

```ts
const participantToken = crypto.randomUUID();
```

금지.

Frontend에서 Host / Player 권한을 Token 없이 임의로 처리하지 않는다.

---

# 7. HTTP API Base URL

모든 REST API는 다음 Base URL을 기준으로 한다.

```text
/api/v1
```

Frontend Agent가 자기 Feature에서 임의 Endpoint를 만들어 사용하지 않는다.

예:

```text
/api/room
/api/game
/api/player
```

같은 별도 규칙을 만들지 않는다.

---

# 8. React Component에서 직접 fetch 금지

Component 내부에 Backend Endpoint를 직접 작성하지 않는다.

## 금지

```tsx
fetch(`/api/v1/games/${gameId}`);
```

## 권장

```ts
getGame(gameId);
```

API 요청은 반드시 공통 API Layer를 사용한다.

예:

```text
src/shared/api/

roomApi.ts
gameApi.ts
characterApi.ts
scanApi.ts
printApi.ts
```

Backend Endpoint가 변경될 경우 공통 API Layer만 수정할 수 있도록 유지한다.

---

# 9. Room 관련 Backend Contract

## 방 생성

```http
POST /api/v1/rooms
```

Request:

```ts
type CreateRoomRequest = {
  name: string;
  designDurationSeconds: number;
  hideDurationSeconds: number;
  seekDurationSeconds: number;
  seekerCount: number;
};
```

Response 기준:

```ts
type CreateRoomResponse = {
  roomId: number;
  roomCode: string;
  hostToken: string;
  joinUrl: string;
  joinQrUrl: string;
};
```

`roomCode`는 Frontend에서 생성하지 않는다.

Backend가 생성한 6자리 코드를 그대로 사용한다.

---

# 10. 방 참가 Contract

```http
POST /api/v1/rooms/{roomCode}/participants
```

Request:

```ts
type JoinRoomRequest = {
  nickname: string;
};
```

Response:

```ts
type JoinRoomResponse = {
  participantId: number;
  participantToken: string;
  roomId: number;
};
```

Frontend가 `participantId` 또는 Token을 직접 생성하지 않는다.

---

# 11. 게임 시작은 HOST만 수행한다

```http
POST /api/v1/rooms/{roomId}/games/start
```

Frontend에서는 HOST 화면에만 시작 버튼을 노출한다.

그러나 UI에서 버튼을 숨기는 것은 보안을 의미하지 않는다.

Backend가 최종 권한 검증을 수행한다.

Frontend는:

```text
"HOST니까 당연히 성공한다"
```

고 가정하지 않는다.

API Error가 발생할 수 있음을 항상 고려한다.

---

# 12. Game Phase 변경은 HOST Action + Backend 처리

Frontend가 직접 Status를 변경하지 않는다.

## 숨기기 시작

```http
POST /api/v1/games/{gameId}/hiding/start
```

## 탐색 시작

```http
POST /api/v1/games/{gameId}/seeking/start
```

## 게임 종료

```http
POST /api/v1/games/{gameId}/finish
```

각 요청 성공 후 Backend가 반환한 최신 Game State를 다시 가져와 UI를 갱신한다.

---

# 13. Timer 규칙

Frontend Countdown은 UX용이다.

실제 시간 판정은 Backend가 담당한다.

Backend는 다음 정보를 기준으로 시간을 관리한다.

```text
designStartedAt
designDurationSeconds

hideStartedAt
hideDurationSeconds

seekStartedAt
seekDurationSeconds
```

Frontend는:

```ts
remaining =
  startedAt +
  duration -
  currentTime;
```

방식으로 남은 시간을 표시할 수 있다.

그러나 다음 로직은 금지한다.

```ts
if (remaining <= 0) {
  submitAutomatically();
  setStatus("PRINTING");
}
```

시간 만료 여부의 최종 판정은 Backend 응답을 따른다.

---

# 14. HIDER Editor는 Frontend 책임이다

다음 기능은 Frontend에서 구현한다.

- Camera
- Background Photo 표시
- Character Template 표시
- Character 이동
- 확대 / 축소
- 회전
- Brush
- Eraser
- Eyedropper
- Undo
- Canvas Rendering
- Transparent PNG Export
- Preview Image 생성

Backend는 이미지 편집을 수행하지 않는다.

---

# 15. Character 제출 시 필요한 파일

Frontend에서 최종적으로 다음 3개의 결과물을 생성해야 한다.

```text
original.jpg
character.png
preview.jpg
```

## original.jpg

사용자가 촬영한 원본 장소 사진.

---

## character.png

투명 배경의 최종 사람 캐릭터.

중요:

```text
Background = Transparent
```

이어야 한다.

---

## preview.jpg

원본 장소 사진 위에 Character를 실제 위치대로 합성한 최종 Preview.

QR Scan 성공 이후 이 이미지가 사용자에게 보여질 수 있다.

---

# 16. Character Position 값

Character 제출 시 다음 값이 필요하다.

```ts
type CharacterTransform = {
  positionX: number;
  positionY: number;
  scale: number;
  rotation: number;
};
```

positionX / positionY는 가능하면 Canvas Pixel이 아니라 비율 값으로 관리한다.

예:

```ts
positionX = 0.42;
positionY = 0.58;
```

이를 통해 서로 다른 화면 크기에서도 위치를 재현할 수 있도록 한다.

---

# 17. Character 제출 Contract

```http
POST /api/v1/games/{gameId}/characters
```

Request 구조:

```ts
type CharacterSubmitRequest = {
  templateType: string;

  originalPhotoUrl: string;
  characterImageUrl: string;
  previewImageUrl: string;

  positionX: number;
  positionY: number;

  scale: number;
  rotation: number;
};
```

HIDER는 한 Game에서 Character 하나만 제출 가능하다.

따라서 Frontend에서도 제출 이후 다시 제출하는 UX를 기본적으로 제공하지 않는다.

Backend에서 중복 제출을 거절할 수 있다.

---

# 18. QR은 Frontend가 생성하지 않는다

## 매우 중요

QR Token은 Backend가 Character 제출 시 자동 생성한다.

Frontend는 절대:

- qrToken 생성
- qrToken 수정
- Character에 qrToken 지정
- 임의 QR ID 생성

을 하지 않는다.

금지:

```ts
const qrToken = crypto.randomUUID();
```

QR과 Character의 관계는:

```text
1 Character
=
1 qrToken
=
1 QR Code
```

를 반드시 유지한다.

---

# 19. QR 안에 개인정보를 넣지 않는다

QR에 다음 데이터를 직접 넣지 않는다.

```text
participantId
characterId
nickname
gameId
user information
```

QR에는 Backend가 제공한 `qrToken`만 사용한다.

예:

```text
https://service.example.com/c/{qrToken}
```

---

# 20. QR Route 규칙

Frontend Route:

```text
/c/:qrToken
```

QR을 스캔하면 해당 Route로 접근할 수 있다.

그러나 이 Route에 들어왔다고 바로 발견 처리하면 안 된다.

## 금지

```ts
useEffect(() => {
  markCharacterFound(qrToken);
}, []);
```

먼저 현재 Participant / Game 상태를 Backend에서 검증한 이후 발견 API를 호출해야 한다.

---

# 21. QR 발견 처리

```http
POST /api/v1/games/{gameId}/characters/{qrToken}/found
```

Frontend는 QR Token을 Backend에 전달한다.

Backend가 다음을 검증한다.

- 현재 사용자가 SEEKER인지
- 현재 Game 상태가 SEEKING인지
- qrToken이 유효한지
- 해당 Game Character인지
- 이미 FOUND 상태인지

Frontend는 이를 직접 판단해서 성공 처리하지 않는다.

---

# 22. QR Scan 성공 Response

성공 응답 예:

```ts
type CharacterFoundResponse = {
  characterId: number;
  hiderNickname: string;
  originalPhotoUrl: string;
  previewImageUrl: string;
  survivalSeconds: number;
};
```

Frontend는 이 Response를 이용하여 발견 결과 화면을 구성한다.

예:

```text
Hider Nickname
Original Photo
Hidden Preview
Survival Time
```

---

# 23. QR 중복 Scan 처리

여러 SEEKER가 동일 QR을 동시에 스캔할 수 있다.

Frontend는 Scan 성공 여부를 Client에서 먼저 결정하지 않는다.

예:

```ts
if (!localFoundCharacters.includes(qrToken)) {
  success();
}
```

같은 방식만으로 처리하면 안 된다.

Backend 응답을 최종 결과로 사용한다.

이미 발견된 QR이라면 Backend가 Error를 반환할 수 있다.

Frontend는 이에 맞는 UI를 표시한다.

---

# 24. Print Sheet에서 가장 중요한 규칙

## Character와 QR Pairing 절대 변경 금지

하나의 실제 출력물은 다음 관계를 가진다.

```text
Character
↓
qrToken
↓
QR Code
```

Front Sheet와 Back Sheet는 반드시 동일한 Character 순서를 사용한다.

예:

```text
Front

A B C
D E F
```

라면:

```text
Back

QR-A QR-B QR-C
QR-D QR-E QR-F
```

관계를 유지해야 한다.

---

# 25. Print Array를 각각 정렬하지 않는다

## 절대 금지

```ts
const frontCharacters =
  characters.sort(sortByName);

const backCharacters =
  characters.sort(sortByDate);
```

이렇게 Front / Back에서 각각 정렬하면 Pairing이 깨질 수 있다.

## 반드시

한 번 생성한 고정 배열을 사용한다.

예:

```ts
const printSlots = [...characters]
  .sort((a, b) => a.characterId - b.characterId);
```

그리고:

```ts
renderFront(printSlots);
renderBack(printSlots);
```

동일한 배열을 Front / Back 모두에서 사용한다.

---

# 26. Front / Back Cutting Area 동일 유지

앞면의 Character Cutting Area와 뒷면 QR Cutting Area는 정확히 동일해야 한다.

QR은 절단 이후에도 출력물 내부에 완전히 포함되어야 한다.

Print CSS를 수정할 경우 Front / Back Layout을 반드시 함께 확인한다.

---

# 27. 공식 Print 방식

MVP 기본 권장 방식:

```text
Paper: A4 Portrait
Duplex: Enabled
Scale: Actual Size / 100%
Flip: Long Edge
```

브라우저에서 Printer Option을 강제로 변경할 수 없으므로 HOST에게 위 옵션을 안내한다.

Frontend는 자체 Printer Driver를 구현하지 않는다.

---

# 28. Print Route

공식 Host Print Route:

```text
/host/games/{gameId}/print
```

인쇄 화면에서는:

```css
@media print
```

를 사용하여 일반 UI를 숨기고 Print Layout만 출력한다.

---

# 29. WebSocket Contract

Backend WebSocket Endpoint:

```text
/ws
```

Room Topic:

```text
/topic/rooms/{roomId}
```

지원 Event:

```ts
type RoomEventType =
  | "PARTICIPANT_JOINED"
  | "PARTICIPANT_LEFT"
  | "GAME_STARTED"
  | "ROLE_ASSIGNED"
  | "DESIGN_SUBMITTED"
  | "DESIGN_PHASE_ENDED"
  | "HIDING_STARTED"
  | "HIDER_READY"
  | "SEEKING_STARTED"
  | "CHARACTER_FOUND"
  | "GAME_FINISHED";
```

Frontend Agent가 별도의 Event 이름을 임의로 만들지 않는다.

---

# 30. Role 정보 Broadcast 주의

민감한 Role 정보는 전체 Room Topic으로 공개되지 않는다.

개인 역할은:

```text
/user/queue/game
```

와 같은 개인 Queue를 통해 받을 수 있다.

Frontend에서 전체 Participant에게 다른 사람의 HIDER / SEEKER 역할을 노출하면 안 된다.

각 PLAYER는 자신의 역할만 확인할 수 있어야 한다.

---

# 31. Error Response 공통 Format

Backend Error는 다음 구조를 사용한다.

```ts
type ApiError = {
  code: string;
  message: string;
  timestamp: string;
};
```

Frontend에서는 HTTP Status만 보고 처리하지 않는다.

가능하면 `code`를 기준으로 UX를 구성한다.

---

# 32. 반드시 처리해야 하는 Error Code

```text
ROOM_NOT_FOUND
ROOM_FULL
DUPLICATE_NICKNAME
INVALID_TOKEN
ACCESS_DENIED

GAME_NOT_FOUND
GAME_INVALID_STATE
INVALID_GAME_ROLE

CHARACTER_NOT_FOUND
CHARACTER_ALREADY_SUBMITTED
CHARACTER_ALREADY_FOUND

DESIGN_TIME_EXPIRED
SEEK_TIME_EXPIRED

INVALID_QR_TOKEN
DUPLICATE_QR_TOKEN

PRINT_NOT_READY
```

각 Feature는 자신과 관련된 Error를 적절히 처리해야 한다.

---

# 33. 409 Conflict를 정상적인 게임 흐름으로 고려

Backend는 잘못된 Game State에서 요청하면 `409 Conflict`를 반환할 수 있다.

예:

```text
SEEKING 상태에서 Character 수정
DESIGNING 상태에서 QR Scan
WAITING 상태에서 Print 요청
```

Frontend는 이를 서버 장애로 취급하지 않는다.

게임 상태가 변경되었을 가능성이 있으므로 최신 Game 데이터를 다시 조회하고 적절한 화면으로 이동한다.

---

# 34. Frontend 공식 Route 구조

가능하면 Backend Architecture에서 정의한 다음 Route 구조를 유지한다.

```text
/

├── host
│   ├── create
│   ├── room/:roomCode
│   ├── game/:gameId
│   ├── print/:gameId
│   └── result/:gameId
│
├── join/:roomCode
│
├── c/:qrToken
│
└── game/:gameId
    ├── role
    ├── hider/design
    ├── hider/wait
    ├── hider/hide
    ├── seeker/wait
    ├── seeker/scan
    ├── found/:characterId
    └── result
```

Agent가 자기 편의를 위해 전체 Route 체계를 임의 변경하지 않는다.

---

# 35. MVP 범위를 넘어가지 않는다

Frontend Agent는 다음 기능을 임의로 추가하지 않는다.

```text
AI 기능
아이템
특수 능력
팀전
채팅
친구
랭킹 시스템
소셜 로그인
결제
추가 게임 모드
자동 이미지 생성
Native App 전용 기능
자체 Printer Driver
```

현재 목표는 새로운 기능 추가가 아니라 핵심 End-to-End Flow 완주다.

---

# 36. Frontend 구현 우선순위

## Phase 1 — Game Skeleton

```text
방 생성
→ 참가
→ 게임 시작
→ 역할 표시
→ Phase 전환
→ 게임 종료
```

이미지 Editor보다 먼저 전체 흐름이 동작해야 한다.

---

## Phase 2 — Character Design

```text
Camera
→ Template
→ Canvas
→ PNG Export
→ Image Upload
→ Character Submit
```

---

## Phase 3 — QR / Print

```text
Character
→ Backend qrToken
→ QR
→ Front Sheet
→ Back Sheet
→ Pairing
→ Cutting Guide
→ Scanner
→ Found
```

---

## Phase 4 — Realtime

```text
Participant Join
Phase Change
Design Submitted
Character Found
Game Finished
```

---

## Phase 5 — Polish

```text
Timer UX
Error Handling
Mobile UI
Print CSS
WebView Camera Permission
Game Result
```

---

# 37. Frontend Agent 절대 금지 사항

모든 Frontend Agent는 아래 사항을 반드시 지킨다.

## 절대 하지 않는다

1. Backend Game Status 이름 변경
2. Backend Role 이름 변경
3. Backend Character Status 이름 변경
4. Frontend에서 Game Phase 직접 변경
5. Frontend에서 Role 랜덤 배정
6. Frontend에서 승패 직접 확정
7. Frontend에서 Character FOUND 직접 확정
8. Frontend에서 HIDER 탈락 직접 확정
9. Frontend에서 qrToken 생성
10. Frontend에서 QR과 Character 관계 재정의
11. QR에 nickname / participantId / characterId 직접 삽입
12. Client Timer만 보고 게임 종료 확정
13. Server 응답 전에 성공 화면 표시
14. Front / Back Print 배열을 별개로 정렬
15. Character / QR Pairing 변경
16. API Component 직접 호출 남발
17. Backend와 다른 Endpoint 임의 생성
18. Backend Error Code 무시
19. Backend State와 별도의 Global Game State 생성
20. MVP 외 기능 임의 추가

---

# 38. API 성공 전 UI 상태 확정 금지

예를 들어 QR을 스캔한 순간:

```text
QR 인식
↓
로딩
↓
Backend Found API
↓
성공
↓
FOUND UI
```

순서를 유지한다.

잘못된 흐름:

```text
QR 인식
↓
FOUND 애니메이션
↓
Backend API
↓
실패
```

Optimistic Update가 게임의 핵심 상태를 잘못 보여주지 않도록 주의한다.

---

# 39. Backend State Refresh 원칙

다음 Event 이후에는 최신 서버 상태를 다시 동기화한다.

```text
Game Start
Hiding Start
Seeking Start
Character Submit
Hider Ready
QR Found
Game Finish
```

WebSocket Event를 받더라도 Event 자체만으로 전체 State를 재구성하지 않는다.

필요하면 관련 Query를 invalidate하고 Backend 데이터를 다시 조회한다.

예:

```ts
queryClient.invalidateQueries({
  queryKey: ["game", gameId],
});
```

---

# 40. Frontend Shared Type 원칙

Backend Domain과 연결되는 Type은 각 Feature 내부에서 다시 선언하지 않는다.

다음 위치에 공통 관리한다.

```text
src/shared/types/

room.ts
participant.ts
game.ts
character.ts
api.ts
websocket.ts
```

예:

```ts
import type {
  GameStatus,
  GameRole,
  CharacterStatus,
} from "@/shared/types";
```

각 Agent가 자기 Feature에서 별도 Enum을 만들지 않는다.

---

# 41. Backend 계약 변경 시 원칙

Backend API가 변경되었을 경우 Agent가 자기 Feature만 몰래 수정하지 않는다.

변경 대상이 다음과 같다면 반드시 Shared Contract를 먼저 업데이트한다.

```text
Endpoint
Request
Response
Enum
Error Code
WebSocket Event
Game Status
Character Status
QR 구조
Token 구조
```

그 후 각 Feature를 수정한다.

---

# 42. 최종 핵심 규칙

Frontend는 아래 구조를 항상 유지한다.

```text
사용자 Action
    ↓
Frontend UI
    ↓
Backend API
    ↓
Backend Validation
    ↓
Backend State Change
    ↓
Response / WebSocket
    ↓
Frontend UI Update
```

절대로:

```text
사용자 Action
    ↓
Frontend가 State 확정
    ↓
나중에 Backend 통보
```

방식으로 구현하지 않는다.

---

# 43. MVP 핵심 End-to-End Flow

Frontend 구현의 최우선 목표는 아래 흐름을 실제 환경에서 완주하는 것이다.

```text
HOST 방 생성
→ PLAYER 참가
→ HOST 게임 시작
→ 역할 배정
→ HIDER 촬영
→ Character 디자인
→ Character 제출
→ Backend qrToken 생성
→ HOST Print
→ Character / QR 양면 인쇄
→ HIDER 실제 배치
→ HOST Seek 시작
→ SEEKER 발견
→ QR Scan
→ Backend 검증
→ HIDER 탈락
→ Preview 공개
→ 모든 HIDER 발견 또는 시간 종료
→ 최종 결과
```

새로운 기능을 추가하는 것보다 이 흐름이 끊기지 않게 만드는 것이 우선이다.

---

# 44. 구현 전 Agent 체크리스트

코드 작성 전 확인:

- [ ] Backend 공식 Type을 사용하고 있는가?
- [ ] Backend 공식 Route를 사용하고 있는가?
- [ ] Backend 공식 API Endpoint를 사용하고 있는가?
- [ ] 직접 Game Phase를 변경하고 있지 않은가?
- [ ] Role을 Client에서 판단하고 있지 않은가?
- [ ] QR Token을 Client에서 만들고 있지 않은가?
- [ ] Timer를 UX 용도로만 사용하고 있는가?
- [ ] API 성공 전에 Game State를 확정하고 있지 않은가?
- [ ] Character / QR Print Pairing이 유지되는가?
- [ ] Backend Error를 처리하고 있는가?
- [ ] MVP 범위 밖 기능을 추가하고 있지 않은가?

하나라도 만족하지 않는 경우 구현 방식을 다시 확인한다.

---

# FINAL RULE

> **Frontend는 게임의 상태를 보여주는 주체이지, 게임의 상태를 결정하는 주체가 아니다.**

Backend가 Game State와 Business Rule의 최종 Source of Truth이며, Frontend는 Backend Contract를 그대로 준수한다.

특히 아래 5가지는 어떤 경우에도 변경하지 않는다.

```text
1. Game State는 Backend가 결정한다.
2. Role과 권한은 Backend가 결정한다.
3. QR Token은 Backend가 생성한다.
4. Timer의 실제 판정은 Backend가 한다.
5. Character ↔ QR Print Pairing은 절대 깨뜨리지 않는다.
```
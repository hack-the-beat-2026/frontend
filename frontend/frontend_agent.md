# Frontend Agent Collaboration Guide

## 1. 목적

본 문서는 프론트엔드 3명이 AI Agent 기반으로 병렬 개발할 때 서로의 작업이 충돌하지 않도록 역할, 책임 범위, 협업 규칙을 정의한다.

이 문서의 핵심 목표는 다음과 같다.

- 3명이 최대한 독립적으로 개발한다.
- 서로의 기능 영역을 침범하지 않는다.
- 공통 영역은 최소화한다.
- 마지막 통합 단계에서 코드 충돌을 줄인다.
- 각 Agent가 임의 리팩터링이나 구조 변경을 하지 못하도록 한다.

> **가장 중요한 원칙:** 각 Agent는 자신의 담당 Feature 내부만 수정한다. 다른 Agent의 Feature는 읽을 수는 있지만 수정하지 않는다.

---

# 2. 프론트엔드 전체 기능 범위

프론트엔드는 아래 기능을 구현한다.

## 공통

- 방 생성 / 방 참여 UI
- 방 코드 입력 및 QR 기반 입장 UI
- 참가자 대기 화면
- 역할 확인 화면
- 게임 진행 상태 표시
- 타이머 UI
- 모바일 웹뷰 대응
- 카메라 권한 및 촬영 UI
- QR 스캔 UI
- 게임 결과 UI

## Hider

- 숨길 장소 촬영
- 포즈 선택
- 흰색 2D 사람 모형 선택
- 촬영한 사진 위 사람 모형 배치
- Drag / Scale / Rotate
- 사진에서 색상 추출
- 스포이드 기능
- 사람 모형 색칠
- 완성 결과 미리보기
- 디자인 제출 UI
- 제출 후 대기 화면

## Host

- 참가자 목록 확인
- 게임 시작
- 제한 시간 설정 UI
- Hider 제출 현황 확인
- 제출된 디자인 확인
- 출력용 화면 / Print Preview
- 출력 진행 상태 확인
- 게임 단계 진행 UI

## Seeker

- 게임 시작 대기
- 찾기 타이머
- 발견 현황 표시
- QR 스캔
- QR 인식 결과 UI
- Hider가 숨긴 원본 사진 확인
- 해당 Hider의 생존 시간 표시
- 최종 승패 및 결과 화면

---

# 3. 프로젝트 Feature 분리

프론트엔드 기능은 아래 3개 Feature로 완전히 분리한다.

```text
src/
├─ features/
│  ├─ party/        # Front A
│  ├─ hider/        # Front B
│  └─ seeker/       # Front C
│
├─ shared/
│  ├─ api/
│  ├─ types/
│  ├─ components/
│  ├─ hooks/
│  └─ utils/
│
└─ routes/
```

각 Agent는 자신의 Feature 폴더 내부를 소유한다.

---

# 4. Front A — Party / Host

## 담당 폴더

```text
src/features/party/
```

## 담당 화면

```text
/
/create
/join
/room/:roomId/lobby
/room/:roomId/host
/room/:roomId/print
```

## 담당 기능

### Landing / Entry

- 방 만들기 버튼
- 방 참여 버튼
- 방 코드 입력 UI
- QR 입장 UI 진입

### Create Room

- 방 생성 폼
- 숨기기 제한 시간 설정 UI
- 찾기 제한 시간 설정 UI
- 생성 완료 화면
- 초대용 방 코드 표시
- 초대용 QR 표시

### Lobby

- 현재 참가자 목록 표시
- 참가 인원 표시
- Host 여부 표시
- 게임 시작 버튼
- 대기 상태 UI

### Host Dashboard

- 전체 게임 Phase 표시
- 참가자별 상태 표시
- Hider 제작 진행 여부 표시
- Hider 제출 완료 여부 표시
- 출력 가능 여부 표시
- 출력 완료 여부 표시
- Hider 숨기기 완료 현황 표시
- 게임 단계 진행 버튼 UI

### Print

- 제출된 Hider 디자인 목록
- 개별 디자인 미리보기
- Print Preview
- 출력용 A4 레이아웃
- 절취선 UI
- 앞면 디자인 영역
- 뒷면 QR 영역
- 개별 출력 / 전체 출력 버튼

## Front A가 절대 수정하면 안 되는 영역

```text
src/features/hider/
src/features/seeker/
```

Front A는 Hider Editor나 QR Scanner 내부 구현을 수정하지 않는다.

---

# 5. Front B — Hider / Camouflage Editor

## 담당 폴더

```text
src/features/hider/
```

## 담당 화면

```text
/room/:roomId/hider
/room/:roomId/hider/camera
/room/:roomId/hider/editor
/room/:roomId/hider/submit
/room/:roomId/hider/waiting
```

## 담당 기능

### Hider Role

- Hider 역할 안내
- 숨기기 제한 시간 표시
- 촬영 시작 버튼

### Camera

- 카메라 권한 요청
- 후면 카메라 우선 사용
- 사진 촬영
- 촬영 결과 미리보기
- 다시 찍기
- 사진 사용

### Pose Select

- 여러 개의 2D 사람 모형 표시
- 흰색 기본 실루엣
- 포즈 선택
- 포즈 변경

### Camouflage Editor

- 촬영한 사진을 배경으로 표시
- 사람 모형 Overlay
- Drag
- Scale
- Rotate
- 위치 변경
- 포즈 변경
- 삭제 / 초기화

### Eyedropper

- 사진 특정 위치의 색상 선택
- 선택한 색상 표시
- 선택 색상을 사람 모형에 적용

### Coloring

최소 MVP 기준으로 아래 중 한 방식으로 구현한다.

- 전체 실루엣 색칠
- 또는 상체 / 하체
- 또는 Head / Body / Arms / Legs

색칠 세부 수준은 Front B 내부 구현에서 일관되게 유지한다.

### Editor Control

- Undo
- Reset
- 완성 미리보기

### Submit

- 최종 디자인 미리보기
- 최종 캐릭터 이미지 생성
- 제출 버튼
- 제출 완료 상태 표시

### Waiting

- 제출 완료 안내
- Host가 출력하기 전 대기 상태
- 이후 게임 단계 전환 대기 UI

## Front B가 절대 수정하면 안 되는 영역

```text
src/features/party/
src/features/seeker/
```

특히 아래 기능을 Front B가 임의로 구현하거나 수정하지 않는다.

- 방 생성
- Lobby
- Host Dashboard
- Print Layout
- QR Scanner
- Result 화면

---

# 6. Front C — Seeker / QR / Result

## 담당 폴더

```text
src/features/seeker/
```

## 담당 화면

```text
/room/:roomId/seeker
/room/:roomId/seeker/scan
/room/:roomId/found/:hiderId
/room/:roomId/result
```

## 담당 기능

### Seeker Ready

- Seeker 역할 안내
- Hider 준비 완료 전 대기 화면
- 게임 시작 대기

### Seek Game

- 찾기 제한 시간 표시
- 남은 시간 표시
- 현재 발견 개수 표시
- 전체 Hider 수 표시
- QR 스캔 버튼

### QR Scanner

- 카메라 권한 요청
- QR 스캔 화면
- QR 인식 성공 상태
- 중복 QR 안내 UI
- 잘못된 QR 안내 UI
- 스캔 실패 안내 UI

### Found Result

- 발견 성공 연출
- Hider 닉네임 표시
- Hider가 원래 촬영했던 장소 사진 표시
- 해당 사진 위에서 어디에 숨기려고 했는지 표시
- Hider 생존 시간 표시
- 다음 탐색으로 돌아가기

### Final Result

- Hider / Seeker 승패 표시
- 발견된 Hider 목록
- 살아남은 Hider 목록
- 생존 시간 순위
- 가장 오래 살아남은 Hider 강조
- 발견 기록 표시

## Front C가 절대 수정하면 안 되는 영역

```text
src/features/party/
src/features/hider/
```

특히 Hider Editor 내부 Canvas 구현을 수정하지 않는다.

---

# 7. 절대 침범 금지 규칙

이 항목은 반드시 지킨다.

## Rule 1. 담당 Feature 외부 수정 금지

각 Agent는 자신의 Feature 폴더만 수정한다.

```text
Front A → src/features/party/
Front B → src/features/hider/
Front C → src/features/seeker/
```

다른 Feature의 코드를 읽는 것은 가능하지만 수정은 금지한다.

---

## Rule 2. 다른 Agent 코드 리팩터링 금지

AI Agent가 아래 작업을 임의로 하면 안 된다.

- 다른 Feature의 파일명 변경
- 다른 Feature의 컴포넌트 이동
- 다른 Feature의 폴더 구조 변경
- 다른 Feature의 변수명 정리
- 다른 Feature의 코드를 더 좋아 보인다는 이유로 리팩터링
- 다른 Feature의 UI를 통일한다는 이유로 직접 수정

> **작동하는 다른 Agent의 코드는 건드리지 않는다.**

---

## Rule 3. Root Router 수정 금지

각 Agent는 Root Router를 직접 수정하지 않는다.

각 Feature는 자신의 하위 Router만 관리한다.

```text
PartyRoutes.tsx
HiderRoutes.tsx
SeekerRoutes.tsx
```

최종 Root Router 연결은 통합 담당자가 수행한다.

---

## Rule 4. shared 임의 변경 금지

다음 폴더는 공용 영역이다.

```text
src/shared/
```

Agent는 공용 파일을 자신의 판단으로 대규모 수정하지 않는다.

특히 아래 행위 금지:

- 기존 공통 Type 이름 변경
- 기존 공통 Type 필드 삭제
- API 함수 이름 변경
- 공통 컴포넌트 구조 변경
- 공통 Hook 동작 변경

공통 영역 변경이 꼭 필요한 경우 최소 범위로만 수정한다.

---

## Rule 5. 공통 Type 중복 생성 금지

Feature 내부에 아래와 같은 공통 Domain Type을 다시 만들지 않는다.

- Room
- Player
- PlayerRole
- GamePhase
- GameState
- HiderDesign
- FoundResult
- GameResult

항상 `src/shared/types/`에 정의된 Type을 사용한다.

---

## Rule 6. API 직접 호출 금지

React Component에서 직접 `fetch` 또는 `axios`를 호출하지 않는다.

금지 예시:

```ts
fetch("http://localhost:8000/rooms/123")
```

반드시 공용 API Layer를 거친다.

```text
src/shared/api/
```

---

## Rule 7. 다른 Agent를 위한 임시 코드 작성 금지

예를 들어 Front B가 자신의 개발을 편하게 하려고 Party 화면을 임시 구현하고 그대로 Commit하지 않는다.

필요한 경우 Feature 내부에 개발용 Mock Page를 만들고 자신의 Feature 안에서만 사용한다.

---

# 8. 공통 개발 규칙

## Component 규칙

Feature 전용 Component는 해당 Feature 내부에 둔다.

```text
src/features/hider/components/
```

여러 Feature에서 실제로 사용되는 Component만 `shared/components`로 올린다.

처음부터 모든 Component를 공용으로 만들지 않는다.

---

## Hook 규칙

Feature 전용 Hook은 Feature 내부에 둔다.

```text
src/features/seeker/hooks/
```

정말 공통인 Hook만 `shared/hooks`를 사용한다.

---

## Utils 규칙

특정 Feature에서만 쓰는 Utility는 해당 Feature 내부에 둔다.

공통 Utility로 승격시키기 위해 다른 Agent 코드를 수정하지 않는다.

---

## 상태 관리 규칙

Zustand에는 최소한의 전역 상태만 둔다.

예:

```text
roomId
userId
role
```

각 Feature의 UI 상태는 해당 Feature 내부에서 관리한다.

예:

```text
현재 선택한 pose
현재 선택 색상
editor zoom
scanner open 상태
```

이런 데이터는 글로벌 Store에 넣지 않는다.

---

# 9. AI Agent가 반드시 지켜야 할 행동 규칙

프로젝트에서 사용하는 모든 AI Agent는 아래 규칙을 따른다.

```text
1. 자신의 담당 Feature 폴더 외부 코드를 수정하지 않는다.

2. 다른 Agent의 코드를 리팩터링하지 않는다.

3. 다른 Agent의 파일을 이동하거나 이름을 변경하지 않는다.

4. Root Router를 수정하지 않는다.

5. 기존 shared Type을 임의로 변경하지 않는다.

6. Feature 내부에서 공통 Domain Type을 새로 만들지 않는다.

7. React Component에서 fetch/axios를 직접 호출하지 않는다.

8. API 호출은 shared/api를 사용한다.

9. Feature 전용 컴포넌트는 자신의 Feature 내부에 둔다.

10. Feature 전용 Hook과 Utility 역시 자신의 Feature 내부에 둔다.

11. 다른 Agent의 UI를 수정하지 않는다.

12. 필요하지 않은 라이브러리를 추가하지 않는다.

13. 기존 프로젝트 구조를 임의로 재설계하지 않는다.

14. 요청받지 않은 리팩터링을 하지 않는다.

15. 요청받지 않은 디자인 시스템 변경을 하지 않는다.

16. 작동 중인 다른 기능을 수정하지 않는다.

17. 공용 파일 수정은 반드시 최소 범위로 제한한다.

18. 자신의 Feature를 독립적으로 실행하고 테스트할 수 있도록 만든다.

19. 다른 Feature가 완성되지 않아도 자신의 Feature 개발이 가능하도록 Mock 데이터를 사용한다.

20. 최종 통합을 위해 외부 의존성을 최소화한다.
```

---

# 10. 각 Agent의 완료 기준

## Front A 완료 기준

- 방 생성부터 Lobby까지 독립 실행 가능
- Host Dashboard 독립 실행 가능
- Mock 참가자 데이터로 상태 확인 가능
- Mock Hider Design으로 Print Preview 가능
- Hider / Seeker Feature가 없어도 화면 테스트 가능

---

## Front B 완료 기준

- 카메라 또는 Mock 이미지 입력 가능
- 포즈 선택 가능
- 사진 위 실루엣 배치 가능
- Drag / Scale / Rotate 가능
- 스포이드 색상 추출 가능
- 색 적용 가능
- 완성 결과 생성 가능
- Mock Submit까지 독립 실행 가능
- Party / Seeker Feature 없이 테스트 가능

---

## Front C 완료 기준

- Mock GameState로 Seek Game 화면 실행 가능
- 타이머 표시 가능
- QR Scanner 또는 Mock Scan 동작 가능
- 성공 / 중복 / 잘못된 QR 상태 UI 확인 가능
- Mock Hider 데이터로 Found Result 표시 가능
- Mock 결과 데이터로 Final Result 표시 가능
- Party / Hider Feature 없이 테스트 가능

---

# 11. 최종 통합 시 원칙

최종 통합 단계에서는 각 Feature 내부 코드를 최대한 수정하지 않는다.

통합 작업은 주로 아래 영역에서만 진행한다.

```text
src/routes/
src/shared/api/
src/shared/types/
환경변수
```

Feature 내부 수정이 필요한 경우에도 최소한으로 제한한다.

통합 단계에서 구조를 다시 뜯어고치지 않는다.

---

# 12. 최우선 원칙 요약

반드시 아래 7개는 지킨다.

1. **각자 자신의 Feature만 수정한다.**
2. **다른 Agent 코드는 절대 리팩터링하지 않는다.**
3. **Root Router는 건드리지 않는다.**
4. **공통 Type을 Feature 내부에 중복 생성하지 않는다.**
5. **shared 영역은 임의로 대규모 변경하지 않는다.**
6. **각 Feature는 다른 Feature 없이도 Mock 데이터로 독립 실행 가능해야 한다.**
7. **최종 통합 시 Feature 코드를 뜯어고치지 않아도 되도록 개발한다.**

> AI Agent는 “전체 프로젝트를 더 좋게 만들기”보다 **자신에게 할당된 Feature를 완성하는 것**을 우선한다.

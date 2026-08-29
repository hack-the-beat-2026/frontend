# 카멜레온 Frontend

React 19 + TypeScript 6 + Vite 8 + Tailwind 4. 3명이 Feature별로 병렬 개발한다.

## 먼저 읽을 것

1. **[contractRules.md](contractRules.md)** — 백엔드 계약 준수 규칙. 코드 쓰기 전에 반드시 확인
2. **[frontend_agent.md](frontend_agent.md)** — 역할 분리와 침범 금지 규칙
3. `../../hackthebeat_backend/architecture.md` — 도메인·API·인쇄의 최종 근거(SSOT)

문서가 서로 다르면 **architecture.md > contractRules.md > frontend_agent.md** 순으로 따른다.
확인된 불일치 목록은 허브의 `CLAUDE.md`에 정리돼 있다.

## 명령어

```bash
npm run dev      # mock 모드로 바로 뜬다 (백엔드 불필요)
npm run build    # tsc -b && vite build
npm run lint     # oxlint
```

`.env.example`를 `.env`로 복사해서 쓴다. 기본값은 `VITE_API_MODE=mock`.
실제 백엔드에 붙이려면 `VITE_API_MODE=live`로 바꾸고 `docker compose up -d postgres`,
`./gradlew bootRun`을 백엔드 저장소에서 실행한다. dev 서버가 `/api`와 `/ws`를 8080으로 프록시한다.

## 구조

```text
src/
├─ features/
│  ├─ party/     Front A — 랜딩 · 방 생성 · 참가 · 로비 · 호스트 대시보드 · 인쇄
│  ├─ hider/     Front B — 촬영 · 포즈 · 스포이드 · 캔버스 편집 · 제출
│  └─ seeker/    Front C — 탐색 대기 · QR 스캔 · 발견 결과 · 최종 결과
├─ shared/
│  ├─ types/     백엔드 도메인 타입. Feature에서 다시 선언하지 않는다
│  ├─ api/       모든 HTTP 호출. 컴포넌트에서 fetch를 직접 부르지 않는다
│  │  └─ mock/   백엔드 대역 (VITE_API_MODE=mock). Feature에서 직접 import 금지
│  ├─ store/     zustand 세션 (토큰·roomId·gameId·role만)
│  ├─ hooks/     useCountdown 등 공용 훅
│  └─ config/    환경변수
└─ routes/       Root Router. 통합 담당자만 수정한다
```

## 라우트 등록 방법

Root Router(`src/routes/AppRouter.tsx`)를 **수정하지 않는다.**
각 Feature는 자기 `routes/<feature>Routes.tsx`의 `RouteObject[]`에만 추가하면
Root Router가 알아서 spread한다. 그래야 3명이 동시에 작업해도 충돌하지 않는다.

## 지켜야 할 것

- 게임 상태·역할·권한·타이머 판정·QR 토큰은 **전부 백엔드가 결정한다.** 프론트는 표시만 한다
- API 성공 응답 전에 성공 UI를 그리지 않는다 (핵심 상태에 optimistic update 금지)
- 409는 장애가 아니라 게임 상태가 바뀌었다는 신호다. 최신 상태를 다시 조회하고 화면을 옮긴다
- 인쇄 시트의 **앞면 Character와 뒷면 QR 페어링은 절대 깨뜨리지 않는다.**
  앞/뒤가 같은 배열을 쓰고, 각각 정렬하지 않는다
- 다른 Feature 폴더는 읽기만 하고 수정하지 않는다. 요청받지 않은 리팩터링을 하지 않는다

## 백엔드 없이 개발하기

`VITE_API_MODE=mock`이면 `shared/api/mock`이 백엔드 역할을 한다.
게임 상태 전이, 권한 검증, 에러 코드, qrToken 발급까지 architecture.md대로 흉내 낸다.

- 세션(토큰)은 **sessionStorage** — 탭마다 다른 사람이 된다
- mock DB는 **localStorage** — 모든 탭이 같은 서버를 본다

덕분에 한 브라우저에서 HOST 탭 / HIDER 탭 / SEEKER 탭을 동시에 열어 전체 흐름을 완주할 수 있다.

`mockDevTools`(= `shared/api/mock`)로 더미 참가자와 캐릭터를 넣을 수 있다.
다른 Feature가 아직 없어도 자기 화면을 확인하기 위한 도구이며, mock 모드에서만 의미가 있다.

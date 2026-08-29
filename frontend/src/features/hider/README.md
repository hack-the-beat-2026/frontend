# Front B — Hider / Camouflage Editor

This directory is owned by Front B. Keep the camera, silhouette editor and
character submission inside this feature so it can be developed without touching
the Party or Seeker features.

## Scope

- Hider role briefing
- Place photography (rear camera, with a file-picker fallback)
- Pose / silhouette selection
- Drag, scale and rotate the character over the photo
- Eyedropper colour sampling from the photo
- Freehand camouflage painting with colours sampled from the place photo
- Undo / Reset / preview
- Export of the three submission files and character submit
- Post-submit waiting and the hiding-phase screen

## Directory layout

```text
hider/
├─ assets/templates/  # 2D silhouette templates (SVG path data)
├─ components/        # Hider-only UI components
├─ dev/               # Standalone dev harness (see below)
├─ hooks/             # Hider-only hooks
├─ mocks/             # Mock data for independent development
├─ pages/             # Route-level Hider pages
├─ routes/            # Hider route paths
├─ state/             # Editor reducer + undo history
├─ utils/             # Hider-only utilities
├─ types.ts           # Feature-local UI types only
└─ index.ts           # Public feature exports
```

## Running it standalone

```bash
npm run dev
# then open http://localhost:5173/src/features/hider/dev/
```

The harness renders every screen with mock data, so nothing here depends on
Front A or Front C. It also stubs `fetch` at the network boundary
(`mocks/mockBackend.ts`) rather than replacing `shared/api`, so the real client —
base URL, Bearer header, `ApiError` parsing and error-code mapping — runs for
real. Use the scenario dropdown to exercise `CHARACTER_ALREADY_SUBMITTED`,
`DESIGN_TIME_EXPIRED` and a 409 `GAME_INVALID_STATE`.

The harness lives inside this feature on purpose: wiring it into the root
`index.html` / `main.tsx` would touch files the other agents also own.

## Route contract

Paths in `routes/hiderPaths.ts` follow `contractRules.md` §34, which takes
precedence where the collaboration guide and the backend contract differ — the
same call Front A made in `features/party/routes/partyPaths.ts`.

```text
/game/:gameId/hider/design
/game/:gameId/hider/wait
/game/:gameId/hider/hide
```

`/game/:gameId/role` is **not** owned here. It is shared with the seeker, so the
integration owner routes it and renders the exported `HiderRolePanel` when the
backend reports `role === 'HIDER'`.

No router is installed (matching Front A), so this feature exports path
constants and page components. `HiderRoutes.tsx` is for the integration owner to
add once a router lands.

## Coordinate contract — `contractRules.md` §16

The seeker's "here is where they hid" screen re-composites the character from
these numbers, so getting them wrong breaks another team's feature.

| Field | Meaning |
|---|---|
| `positionX` / `positionY` | Ratio of the background photo (`0..1`), **centre** of the character. Never canvas pixels |
| `scale` | Character height ÷ photo height |
| `rotation` | Degrees, clockwise |

`utils/geometry.ts` is the only place this is resolved. `CamouflageStage` passes
the displayed rect and `exportImages` passes the photo's natural size, so the
on-screen edit and the submitted `preview.jpg` cannot drift apart. The stage is
rendered at the photo's exact aspect ratio, which is what keeps the conversion a
plain division with no letterbox maths.

## Submission files — `contractRules.md` §15

| File | Notes |
|---|---|
| `original.jpg` | The captured place photo |
| `character.png` | **Transparent background.** Deliberately bakes in *no* transform — position, scale and rotation travel as separate fields, so baking them would apply the placement twice |
| `preview.jpg` | The photo with the character composited at its real position |

## Boundaries

- Do not modify `src/features/party/` or `src/features/seeker/`.
- Do not connect routes in the root router; the integration owner does that.
- Do not duplicate backend domain types here. Import from `src/shared/types/`.
- Do not call `fetch` or `axios` from components. Use `src/shared/api/`.
- Backend state, roles, timers, permissions and QR validity remain the source of
  truth. In particular:
  - The timer is display-only (§13). Reaching zero never auto-submits and never
    changes a status — it only shows "waiting for the server".
  - The success screen is reached only after the backend responds (§38).
  - There is no re-submit path: one character per game (§17).
  - This feature never generates, stores or reads a `qrToken` (§18).
- Feature-local UI state (`EditorUiState`, selected pose, active colour, editor
  transform) stays in this feature. It is not a `GameStatus` and it does not
  belong in a global store.

## Open questions for the backend

1. **Image upload endpoint is undefined.** §17 requires three URLs but no upload
   route exists in the contract. `shared/api/uploadApi.ts` currently returns a
   local object URL — replace only that function's body when the real endpoint
   is decided.
2. **"Hider ready" has no REST endpoint.** Only the `HIDER_READY` websocket
   event is specified (§29), so `HiderHidePage` takes an `onReady` callback
   rather than inventing a route.

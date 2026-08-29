# Shared Contracts

This directory holds the backend contract surface that every feature imports.
It was created by **Front B** because `contractRules.md` §8 and §40 require
domain types and API calls to live here, and no feature may redeclare them
(§37 rule 19, `frontend_agent.md` Rule 5/6).

> **Integration owner has the final say.** Everything here is transcribed
> directly from `contractRules.md` — nothing was invented. If Front A or Front C
> added the same files on their branch, the contents should be identical or
> near-identical, so conflicts resolve by keeping either side.

## Provenance

| File | Source in `contractRules.md` |
|---|---|
| `types/game.ts` | §2 — `GameStatus` |
| `types/participant.ts` | §3 — `ParticipantType`, `GameRole`; §4 — `ParticipantStatus` |
| `types/character.ts` | §5 — `CharacterStatus`; §16 — `CharacterTransform`; §17 — `CharacterSubmitRequest`; §22 — `CharacterFoundResponse` |
| `types/api.ts` | §31 — `ApiError`; §32 — the error codes that must be handled |
| `api/client.ts` | §7 — base URL `/api/v1`; §6 — Bearer token handling; §31 — error parsing |
| `api/characterApi.ts` | Backend `POST /api/v1/games/{gameId}/characters` multipart contract |
| `api/backendApi.ts` | Room, Game, Character, Scan and Result REST endpoints |

## Backend image submission

The backend accepts the three image `Blob`s and JSON metadata together as one
`multipart/form-data` request. `api/characterApi.ts` creates the `metadata`,
`originalPhoto`, `characterImage` and `previewImage` parts, so no temporary
upload URLs are generated in the browser.

## Rules for anyone editing this directory

- Do not rename or remove existing types or fields (`frontend_agent.md` Rule 4).
- Do not add feature-specific types here; keep them inside the owning feature.
- Components must never call `fetch` directly — go through `shared/api` (§8).
- The client only stores tokens returned by the backend and sends them as Bearer
  tokens. It never creates tokens (§6).
- Imports use relative paths: there is no `@/` alias configured, and adding one
  would mean editing `tsconfig.app.json` and `vite.config.ts`, which are shared
  root files.

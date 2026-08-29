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
| `api/characterApi.ts` | §17 — `POST /api/v1/games/{gameId}/characters` |
| `api/uploadApi.ts` | ⚠️ **not specified — open contract** |

## Open contract: image upload

`contractRules.md` §17 requires three **URLs** in the character submit payload:

```text
originalPhotoUrl
characterImageUrl
previewImageUrl
```

The frontend produces three `Blob`s (§15), but **no upload endpoint is defined
anywhere in the contract**. `api/uploadApi.ts` therefore ships a local adapter
that returns `URL.createObjectURL(blob)`.

**To wire up the real backend, replace only the body of `uploadImage`.** Its
signature is the seam every caller is written against, so no feature code needs
to change.

## Rules for anyone editing this directory

- Do not rename or remove existing types or fields (`frontend_agent.md` Rule 4).
- Do not add feature-specific types here; keep them inside the owning feature.
- Components must never call `fetch` directly — go through `shared/api` (§8).
- The client only **reads** tokens from `localStorage`. Never mint one (§6).
- Imports use relative paths: there is no `@/` alias configured, and adding one
  would mean editing `tsconfig.app.json` and `vite.config.ts`, which are shared
  root files.

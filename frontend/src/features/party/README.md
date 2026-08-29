# Front A — Party / Host

This directory is owned by Front A. Keep Party and Host implementation inside
this feature so it can be developed without changing the Hider or Seeker
features.

## Scope

- Landing and room entry
- Room creation
- Host lobby
- Host dashboard and game phase controls
- Character print preview and print status

## Directory layout

```text
party/
├─ components/  # Party-only UI components
├─ hooks/       # Party-only hooks
├─ mocks/       # Mock data for independent development
├─ pages/       # Route-level Party/Host pages
├─ routes/      # Party route paths and PartyRoutes
├─ utils/       # Party-only utilities
└─ index.ts     # Public feature exports
```

## Boundaries

- Do not modify `src/features/hider/` or `src/features/seeker/`.
- Do not connect routes in the root router; the integration owner will do that.
- Do not duplicate backend domain types in this feature. Import them from
  `src/shared/types/` after the shared contracts are added.
- Do not call `fetch` or `axios` from components. Use `src/shared/api/`.
- Backend state, roles, timers, permissions, and QR validity remain the source
  of truth.

## Route contract

The route paths in `routes/partyPaths.ts` follow `contractRules.md`, which takes
precedence where the collaboration guide and backend contract differ.

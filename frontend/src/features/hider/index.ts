export { hiderRoutePaths, toHiderRoute } from './routes/hiderPaths'
export type { HiderRouteName, HiderRouteParams } from './routes/hiderPaths'

export { HiderDesignPage } from './pages/HiderDesignPage'
export type { HiderDesignPageProps } from './pages/HiderDesignPage'
export { HiderWaitPage } from './pages/HiderWaitPage'
export { HiderHidePage } from './pages/HiderHidePage'

/**
 * `/game/:gameId/role` is shared with the seeker feature, so this is exported as
 * a component for the integration owner to render, not as a route.
 */
export { HiderRolePanel } from './components/HiderRolePanel'

export { characterTemplates, defaultTemplate, findTemplate } from './assets/templates'
export type { CharacterTemplate } from './assets/templates'

export type {
  CapturedPhoto,
  CharacterExportBundle,
  EditorUiState,
  PartColors,
  PartId,
  SubmitPhase,
} from './types'

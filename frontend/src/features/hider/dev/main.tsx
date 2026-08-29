import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { installMockBackend } from '../mocks/mockBackend'
import { HiderDevApp } from './HiderDevApp'
import './dev.css'

/**
 * Standalone entry point for the hider feature.
 *
 *   npm run dev  →  http://localhost:5173/src/features/hider/dev/
 *
 * Lives inside the feature folder on purpose: wiring a harness into the root
 * `index.html` / `main.tsx` would touch files Front A and Front C also own.
 */
installMockBackend()

createRoot(document.getElementById('hider-dev-root')!).render(
  <StrictMode>
    <HiderDevApp />
  </StrictMode>,
)

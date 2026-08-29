import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import type { CharacterSubmitRequest, CharacterTransform } from '../../../shared/types'
import { submitCharacter, uploadImage } from '../../../shared/api'
import { findTemplate } from '../assets/templates'
import { CameraCapture } from '../components/CameraCapture'
import { CamouflageStage } from '../components/CamouflageStage'
import { EditorToolbar } from '../components/EditorToolbar'
import { HiderTimer } from '../components/HiderTimer'
import { PalettePanel } from '../components/PalettePanel'
import { SubmitPreview } from '../components/SubmitPreview'
import { TemplatePicker } from '../components/TemplatePicker'
import { useEyedropper } from '../hooks/useEyedropper'
import { usePhaseCountdown } from '../hooks/usePhaseCountdown'
import {
  createInitialEditorState,
  editorReducer,
} from '../state/editorReducer'
import type {
  CapturedPhoto,
  CharacterExportBundle,
  EditorUiState,
  PartId,
  SubmitPhase,
} from '../types'
import { defaultTemplate } from '../assets/templates'
import { toHiderError } from '../utils/errorMessages'
import type { HiderErrorInfo } from '../utils/errorMessages'
import { exportCharacterBundle } from '../utils/exportImages'
import { releaseCapturedPhoto } from '../utils/photo'

const MAX_SAMPLED_COLORS = 8

const STEP_TITLES: Record<EditorUiState, string> = {
  CAMERA: '숨길 장소 촬영',
  SELECT_TEMPLATE: '포즈 선택',
  EDITING: '위장 색칠',
  PREVIEW: '완성 확인',
}

export type HiderDesignPageProps = {
  gameId: number | string
  designStartedAt: string | null
  designDurationSeconds: number
  /** Called after the backend confirms the submission. */
  onSubmitted: (result: { previewBlob: Blob }) => void
  /** Re-fetch game state after a 409 / state-moved-on error (§33). */
  onRefreshGame: () => void
  loadMockPhoto?: () => Promise<CapturedPhoto>
  showFileInspector?: boolean
}

/**
 * The hider design flow.
 *
 * Screen transitions run on a local `EditorUiState`, which contractRules.md §2
 * explicitly permits as long as it stays distinct from the backend GameStatus —
 * that is also why this feature needs no router.
 */
export function HiderDesignPage({
  gameId,
  designStartedAt,
  designDurationSeconds,
  onSubmitted,
  onRefreshGame,
  loadMockPhoto,
  showFileInspector = false,
}: HiderDesignPageProps) {
  const [uiState, setUiState] = useState<EditorUiState>('CAMERA')
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null)
  const [editor, dispatch] = useReducer(
    editorReducer,
    defaultTemplate.id,
    createInitialEditorState,
  )
  const [selectedPart, setSelectedPart] = useState<PartId>('body')
  const [sampledColors, setSampledColors] = useState<string[]>([])
  const [activeColor, setActiveColor] = useState<string | null>(null)
  const [eyedropperActive, setEyedropperActive] = useState(false)
  const [bundle, setBundle] = useState<CharacterExportBundle | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [submitPhase, setSubmitPhase] = useState<SubmitPhase>('IDLE')
  const [error, setError] = useState<HiderErrorInfo | null>(null)

  const photoRef = useRef<CapturedPhoto | null>(null)
  const previewUrlRef = useRef<string | null>(null)

  const timer = usePhaseCountdown(designStartedAt, designDurationSeconds)
  const eyedropper = useEyedropper(photo)
  const template = findTemplate(editor.present.templateId)

  // Mirror the latest blobs into refs so the unmount cleanup can reach them
  // without re-running (and revoking a live URL) on every change.
  useEffect(() => {
    photoRef.current = photo
  }, [photo])

  useEffect(() => {
    previewUrlRef.current = previewUrl
  }, [previewUrl])

  useEffect(
    () => () => {
      releaseCapturedPhoto(photoRef.current)

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    },
    [],
  )

  const handlePhotoConfirmed = (next: CapturedPhoto) => {
    releaseCapturedPhoto(photo)
    setPhoto(next)
    setSampledColors([])
    setActiveColor(null)
    setUiState('SELECT_TEMPLATE')
  }

  const handleSampleColor = useCallback((hex: string) => {
    setActiveColor(hex)
    setSampledColors((current) =>
      [hex, ...current.filter((color) => color !== hex)].slice(
        0,
        MAX_SAMPLED_COLORS,
      ),
    )
  }, [])

  const handleTransformChange = useCallback((transform: CharacterTransform) => {
    dispatch({ type: 'SET_TRANSFORM', transform })
  }, [])

  const handleBeginGesture = useCallback(() => {
    dispatch({ type: 'BEGIN_GESTURE' })
  }, [])

  const goToPreview = async () => {
    if (!photo) {
      return
    }

    setError(null)
    setSubmitPhase('EXPORTING')
    setUiState('PREVIEW')

    try {
      const exported = await exportCharacterBundle(
        photo,
        template,
        editor.present.partColors,
        editor.present.transform,
      )

      // Create the URL outside the updater so a StrictMode double-invoke
      // cannot leak one; revoking the same URL twice is a no-op.
      const nextPreviewUrl = URL.createObjectURL(exported.preview)

      setBundle(exported)
      setPreviewUrl((current) => {
        if (current && current !== nextPreviewUrl) {
          URL.revokeObjectURL(current)
        }

        return nextPreviewUrl
      })
      setSubmitPhase('IDLE')
    } catch (exportError) {
      setBundle(null)
      setSubmitPhase('IDLE')
      setError(toHiderError(exportError))
    }
  }

  /**
   * Submit order is fixed by contractRules.md §38: upload, then submit, then —
   * and only then — show success. Nothing is optimistic.
   */
  const handleSubmit = async () => {
    if (!bundle) {
      return
    }

    setError(null)
    setSubmitPhase('UPLOADING')

    try {
      const [originalPhotoUrl, characterImageUrl, previewImageUrl] =
        await Promise.all([
          uploadImage({
            kind: 'original',
            blob: bundle.original,
            fileName: 'original.jpg',
          }),
          uploadImage({
            kind: 'character',
            blob: bundle.character,
            fileName: 'character.png',
          }),
          uploadImage({
            kind: 'preview',
            blob: bundle.preview,
            fileName: 'preview.jpg',
          }),
        ])

      const payload: CharacterSubmitRequest = {
        templateType: template.id,
        originalPhotoUrl,
        characterImageUrl,
        previewImageUrl,
        positionX: editor.present.transform.positionX,
        positionY: editor.present.transform.positionY,
        scale: editor.present.transform.scale,
        rotation: editor.present.transform.rotation,
      }

      setSubmitPhase('SUBMITTING')
      await submitCharacter(gameId, payload)

      setSubmitPhase('DONE')
      onSubmitted({ previewBlob: bundle.preview })
    } catch (submitError) {
      setSubmitPhase('IDLE')
      setError(toHiderError(submitError))
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
      <header className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h1 className="text-lg font-semibold text-neutral-800">
            {STEP_TITLES[uiState]}
          </h1>
          <span className="text-xs text-neutral-400">숨는 사람</span>
        </div>
        <HiderTimer label={timer.label} expired={timer.expired} />
      </header>

      {uiState === 'CAMERA' ? (
        <CameraCapture
          onPhotoConfirmed={handlePhotoConfirmed}
          onUseMockPhoto={loadMockPhoto}
        />
      ) : null}

      {uiState === 'SELECT_TEMPLATE' && photo ? (
        <div className="flex flex-col gap-4">
          <CamouflageStage
            photo={photo}
            template={template}
            partColors={editor.present.partColors}
            transform={editor.present.transform}
            selectedPart={null}
            eyedropperActive={false}
            onBeginGesture={handleBeginGesture}
            onTransformChange={handleTransformChange}
            onSampleColor={handleSampleColor}
            sampleColorAt={eyedropper.sample}
          />
          <TemplatePicker
            selectedId={editor.present.templateId}
            partColors={editor.present.partColors}
            onSelect={(templateId) => dispatch({ type: 'SET_TEMPLATE', templateId })}
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setUiState('CAMERA')}
              className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 font-medium text-neutral-700"
            >
              다시 촬영
            </button>
            <button
              type="button"
              onClick={() => setUiState('EDITING')}
              className="flex-[1.4] rounded-xl bg-neutral-900 px-4 py-3 font-medium text-white"
            >
              이 포즈로 색칠
            </button>
          </div>
        </div>
      ) : null}

      {uiState === 'EDITING' && photo ? (
        <div className="flex flex-col gap-4">
          <CamouflageStage
            photo={photo}
            template={template}
            partColors={editor.present.partColors}
            transform={editor.present.transform}
            selectedPart={selectedPart}
            eyedropperActive={eyedropperActive}
            onBeginGesture={handleBeginGesture}
            onTransformChange={handleTransformChange}
            onSampleColor={handleSampleColor}
            sampleColorAt={eyedropper.sample}
          />

          <PalettePanel
            partColors={editor.present.partColors}
            selectedPart={selectedPart}
            sampledColors={sampledColors}
            activeColor={activeColor}
            eyedropperActive={eyedropperActive}
            eyedropperReady={eyedropper.ready}
            onSelectPart={setSelectedPart}
            onPickColor={setActiveColor}
            onApplyToPart={() => {
              if (activeColor) {
                dispatch({
                  type: 'SET_PART_COLOR',
                  partId: selectedPart,
                  color: activeColor,
                })
              }
            }}
            onApplyToAll={() => {
              if (activeColor) {
                dispatch({ type: 'SET_ALL_PART_COLORS', color: activeColor })
              }
            }}
            onToggleEyedropper={() => setEyedropperActive((current) => !current)}
          />

          <TemplatePicker
            selectedId={editor.present.templateId}
            partColors={editor.present.partColors}
            onSelect={(templateId) => dispatch({ type: 'SET_TEMPLATE', templateId })}
          />

          <EditorToolbar
            transform={editor.present.transform}
            canUndo={editor.past.length > 0}
            onUndo={() => dispatch({ type: 'UNDO' })}
            onReset={() => dispatch({ type: 'RESET' })}
            onBeginGesture={handleBeginGesture}
            onTransformChange={handleTransformChange}
            onPreview={() => void goToPreview()}
          />
        </div>
      ) : null}

      {uiState === 'PREVIEW' ? (
        <SubmitPreview
          previewUrl={previewUrl}
          bundle={bundle}
          submitPhase={submitPhase}
          error={error}
          showFileInspector={showFileInspector}
          onBack={() => setUiState('EDITING')}
          onSubmit={() => void handleSubmit()}
          onRefreshGame={onRefreshGame}
        />
      ) : null}
    </div>
  )
}

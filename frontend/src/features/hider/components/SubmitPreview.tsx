import type { CharacterExportBundle, SubmitPhase } from '../types'
import type { HiderErrorInfo } from '../utils/errorMessages'

const PHASE_LABELS: Record<SubmitPhase, string> = {
  IDLE: '제출하기',
  EXPORTING: '이미지 만드는 중…',
  UPLOADING: '업로드 중…',
  SUBMITTING: '제출 중…',
  DONE: '제출 완료',
}

type SubmitPreviewProps = {
  previewUrl: string | null
  bundle: CharacterExportBundle | null
  submitPhase: SubmitPhase
  error: HiderErrorInfo | null
  /** Dev-only download links used to eyeball the exported files. */
  showFileInspector?: boolean
  onBack: () => void
  onSubmit: () => void
  onRefreshGame: () => void
}

/**
 * Final review before submitting.
 *
 * contractRules.md §38: the success screen is only reached after the backend
 * responds. Nothing here is optimistic, and there is no re-submit path because
 * a hider gets exactly one character per game (§17).
 */
export function SubmitPreview({
  previewUrl,
  bundle,
  submitPhase,
  error,
  showFileInspector = false,
  onBack,
  onSubmit,
  onRefreshGame,
}: SubmitPreviewProps) {
  const busy = submitPhase !== 'IDLE' && submitPhase !== 'DONE'

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-2xl bg-black">
        {previewUrl ? (
          <img src={previewUrl} alt="완성된 위장 미리보기" className="w-full" />
        ) : (
          <div className="flex aspect-[3/4] items-center justify-center text-sm text-white/60">
            미리보기를 만드는 중…
          </div>
        )}
      </div>

      <p className="text-sm text-neutral-500">
        이 사진 그대로 인쇄됩니다. 배경에 잘 묻어 있는지 확인해 주세요.
      </p>

      {showFileInspector && bundle ? (
        <div className="flex flex-wrap gap-2 rounded-xl border border-dashed border-neutral-300 p-3 text-xs">
          <span className="w-full font-medium text-neutral-500">
            개발용 — 제출 파일 확인
          </span>
          {(
            [
              ['original.jpg', bundle.original],
              ['character.png', bundle.character],
              ['preview.jpg', bundle.preview],
            ] as const
          ).map(([name, blob]) => (
            <a
              key={name}
              href={URL.createObjectURL(blob)}
              download={name}
              className="rounded-lg border border-neutral-300 px-2 py-1 text-neutral-600"
            >
              {name} ({Math.round(blob.size / 1024)}KB)
            </a>
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl bg-red-50 px-3 py-3 text-sm text-red-700">
          <p>{error.message}</p>
          {error.needsRefresh ? (
            <button
              type="button"
              onClick={onRefreshGame}
              className="mt-2 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium"
            >
              최신 게임 상태 불러오기
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 font-medium text-neutral-700 disabled:opacity-40"
        >
          더 다듬기
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={busy || !bundle}
          className="flex-[1.4] rounded-xl bg-neutral-900 px-4 py-3 font-medium text-white disabled:opacity-40"
        >
          {PHASE_LABELS[submitPhase]}
        </button>
      </div>
    </div>
  )
}

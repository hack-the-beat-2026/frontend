import { HiderTimer } from '../components/HiderTimer'

type HiderHidePageProps = {
  timerLabel: string
  timerExpired: boolean
  ready: boolean
  /**
   * Marks this hider as ready.
   *
   * ⚠️ No REST endpoint for this is defined in contractRules.md — only the
   * `HIDER_READY` websocket event (§29). The caller supplies the action so this
   * feature does not invent an endpoint (§37 rule 17).
   */
  onReady: () => void
}

/** Hiding phase: the hider places the printed card in the photographed spot. */
export function HiderHidePage({
  timerLabel,
  timerExpired,
  ready,
  onReady,
}: HiderHidePageProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 p-4">
      <h1 className="text-lg font-semibold text-neutral-800">카드 숨기기</h1>

      <HiderTimer label={timerLabel} expired={timerExpired} title="숨기기 남은 시간" />

      <ol className="flex flex-col gap-2 text-sm text-neutral-600">
        <li>1. 주최자에게 받은 종이를 절취선대로 자릅니다.</li>
        <li>2. 반으로 접어 뒷면에 QR이 오게 만듭니다.</li>
        <li>3. QR이 보이지 않도록, 촬영했던 그 자리에 붙이거나 끼웁니다.</li>
      </ol>

      <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800">
        QR이 겉으로 보이면 찾는 사람이 만지지 않고도 스캔할 수 있어요. 반드시 가려지는
        면에 오게 해 주세요.
      </p>

      <button
        type="button"
        onClick={onReady}
        disabled={ready}
        className="rounded-xl bg-neutral-900 px-4 py-3 font-medium text-white disabled:opacity-40"
      >
        {ready ? '숨기기 완료됨' : '숨기기 완료'}
      </button>
    </div>
  )
}

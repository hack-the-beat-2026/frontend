import { useEffect, useState } from 'react'
import { usePhaseCountdown } from '../hooks/usePhaseCountdown'
import { mockGame } from '../mocks/mockGame'
import { createMockPhoto } from '../mocks/mockPhoto'
import type { MockScenario } from '../mocks/mockBackend'
import { getMockScenario, setMockScenario } from '../mocks/mockBackend'
import { HiderRolePanel } from '../components/HiderRolePanel'
import { HiderDesignPage } from '../pages/HiderDesignPage'
import { HiderHidePage } from '../pages/HiderHidePage'
import { HiderWaitPage } from '../pages/HiderWaitPage'

type DevStep = 'ROLE' | 'DESIGN' | 'WAIT' | 'HIDE'

const SCENARIOS: MockScenario[] = [
  'SUCCESS',
  'CHARACTER_ALREADY_SUBMITTED',
  'DESIGN_TIME_EXPIRED',
  'GAME_INVALID_STATE',
]

/** Expired start time, for checking that a dead timer changes nothing (§13). */
const EXPIRED_STARTED_AT = new Date(Date.now() - 3_600_000).toISOString()

export function HiderDevApp() {
  const [step, setStep] = useState<DevStep>('ROLE')
  const [scenario, setScenario] = useState<MockScenario>(getMockScenario())
  const [expireTimer, setExpireTimer] = useState(false)
  const [startedAt] = useState(() => mockGame.designStartedAt())
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [hidden, setHidden] = useState(false)

  const designStartedAt = expireTimer ? EXPIRED_STARTED_AT : startedAt
  const timer = usePhaseCountdown(designStartedAt, mockGame.designDurationSeconds)
  const hideTimer = usePhaseCountdown(designStartedAt, mockGame.hideDurationSeconds)

  useEffect(() => {
    setMockScenario(scenario)
  }, [scenario])

  useEffect(
    () => () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    },
    [previewUrl],
  )

  return (
    <div className="min-h-dvh">
      <div className="mx-auto flex w-full max-w-md flex-col gap-2 border-b border-neutral-300 bg-white p-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-500">STEP</span>
          {(['ROLE', 'DESIGN', 'WAIT', 'HIDE'] as DevStep[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStep(value)}
              className={`rounded px-2 py-1 ${
                step === value ? 'bg-neutral-900 text-white' : 'bg-neutral-200'
              }`}
            >
              {value}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2">
          <span className="font-semibold text-neutral-500">SUBMIT</span>
          <select
            value={scenario}
            onChange={(event) => setScenario(event.target.value as MockScenario)}
            className="flex-1 rounded border border-neutral-300 px-2 py-1"
          >
            {SCENARIOS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={expireTimer}
            onChange={(event) => setExpireTimer(event.target.checked)}
          />
          <span className="text-neutral-500">
            타이머 만료 상태 (자동 제출이 일어나지 않아야 정상)
          </span>
        </label>
      </div>

      {step === 'ROLE' ? (
        <div className="mx-auto w-full max-w-md p-4">
          <HiderRolePanel
            nickname={mockGame.nickname}
            timerLabel={timer.label}
            timerExpired={timer.expired}
            onStart={() => setStep('DESIGN')}
          />
        </div>
      ) : null}

      {step === 'DESIGN' ? (
        <HiderDesignPage
          gameId={mockGame.gameId}
          designStartedAt={designStartedAt}
          designDurationSeconds={mockGame.designDurationSeconds}
          loadMockPhoto={createMockPhoto}
          showFileInspector
          onSubmitted={({ previewBlob }) => {
            setPreviewUrl(URL.createObjectURL(previewBlob))
            setStep('WAIT')
          }}
          onRefreshGame={() => window.alert('실제 앱에서는 최신 게임 상태를 다시 조회합니다.')}
        />
      ) : null}

      {step === 'WAIT' ? (
        <HiderWaitPage gameStatus="PRINTING" previewUrl={previewUrl} />
      ) : null}

      {step === 'HIDE' ? (
        <HiderHidePage
          timerLabel={hideTimer.label}
          timerExpired={hideTimer.expired}
          ready={hidden}
          onReady={() => setHidden(true)}
        />
      ) : null}
    </div>
  )
}

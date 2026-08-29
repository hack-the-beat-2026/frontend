import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { CreateRoomRequest } from '@/shared/types'
import { Button, Card, ErrorBanner, Field, PageShell } from '../components/ui'
import { useCreateRoom } from '../hooks/usePartyMutations'
import { errorMessage } from '../utils/errorMessage'
import { toPartyRoute } from '../routes/partyPaths'

type Preset = {
  key: string
  label: string
  hint: string
  durations: Pick<
    CreateRoomRequest,
    'designDurationSeconds' | 'hideDurationSeconds' | 'seekDurationSeconds'
  >
}

/**
 * 기본값을 미리 채워 둔다.
 * 심사자가 폼 입력에 시간을 쓰지 않고 바로 다음 단계로 갈 수 있어야 한다
 * (presentation/제출전_교체항목.md의 3단계 안내).
 */
const PRESETS: Preset[] = [
  {
    key: 'demo',
    label: '빠른 체험',
    hint: '위장 3분 · 숨기기 2분 · 탐색 5분',
    durations: {
      designDurationSeconds: 180,
      hideDurationSeconds: 120,
      seekDurationSeconds: 300,
    },
  },
  {
    key: 'standard',
    label: '표준',
    hint: '위장 10분 · 숨기기 5분 · 탐색 20분',
    durations: {
      designDurationSeconds: 600,
      hideDurationSeconds: 300,
      seekDurationSeconds: 1200,
    },
  },
  {
    key: 'long',
    label: '긴 판',
    hint: '위장 15분 · 숨기기 10분 · 탐색 30분',
    durations: {
      designDurationSeconds: 900,
      hideDurationSeconds: 600,
      seekDurationSeconds: 1800,
    },
  },
]

export function CreateRoomPage() {
  const navigate = useNavigate()
  const createRoom = useCreateRoom()

  const [name, setName] = useState('우리 파티')
  const [presetKey, setPresetKey] = useState('standard')
  const [seekerCount, setSeekerCount] = useState(2)

  const preset = PRESETS.find((item) => item.key === presetKey) ?? PRESETS[1]

  const submit = () => {
    createRoom.mutate({
      name: name.trim() || '우리 파티',
      seekerCount,
      ...preset.durations,
    })
  }

  return (
    <PageShell
      title="방 만들기"
      subtitle="방장만 설정하면 됩니다. 참가자는 이름만 입력해요."
      footer={
        <Button
          size="lg"
          onClick={submit}
          disabled={createRoom.isPending}
        >
          {createRoom.isPending ? '만드는 중…' : '방 만들기'}
        </Button>
      }
    >
      <Card className="flex flex-col gap-4">
        <Field
          label="방 이름"
          value={name}
          maxLength={100}
          onChange={(event) => setName(event.target.value)}
        />

        <div>
          <p className="mb-1.5 text-sm font-medium text-neutral-700">
            진행 시간
          </p>
          <div className="flex flex-col gap-2">
            {PRESETS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setPresetKey(item.key)}
                className={`flex items-center justify-between rounded-xl px-4 py-3 text-left ring-1 transition ${
                  presetKey === item.key
                    ? 'bg-emerald-50 ring-2 ring-emerald-500'
                    : 'bg-neutral-50 ring-neutral-200'
                }`}
              >
                <span className="text-sm font-semibold text-neutral-900">
                  {item.label}
                </span>
                <span className="text-xs text-neutral-500">{item.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-neutral-700">
            찾는 사람 수
          </p>
          <div className="flex gap-2">
            {[1, 2, 3].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setSeekerCount(count)}
                className={`h-11 flex-1 rounded-xl text-sm font-semibold ring-1 transition ${
                  seekerCount === count
                    ? 'bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500'
                    : 'bg-neutral-50 text-neutral-700 ring-neutral-200'
                }`}
              >
                {count}명
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            나머지 참가자는 모두 숨는 사람이 됩니다. 역할은 서버가 무작위로
            정해요.
          </p>
        </div>

        <ErrorBanner
          message={createRoom.error ? errorMessage(createRoom.error) : null}
        />
      </Card>

      <button
        type="button"
        onClick={() => navigate(toPartyRoute('landing'))}
        className="text-sm text-neutral-500 underline underline-offset-4"
      >
        처음으로
      </button>
    </PageShell>
  )
}

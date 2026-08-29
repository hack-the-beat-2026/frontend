import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button, Card, ErrorBanner, PageShell } from '../components/ui'
import { toPartyRoute } from '../routes/partyPaths'

const CODE_PATTERN = /^[A-Z0-9]{6}$/

export function LandingPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const enter = () => {
    const normalized = code.trim().toUpperCase()
    if (!CODE_PATTERN.test(normalized)) {
      setError('방 코드는 영문·숫자 6자리예요.')
      return
    }
    setError(null)
    navigate(toPartyRoute('joinRoom', { roomCode: normalized }))
  }

  return (
    <PageShell>
      <div className="flex flex-1 flex-col justify-center gap-8 py-10">
        <header className="text-center">
          <p className="text-sm font-semibold tracking-widest text-emerald-600">
            CHAMELEON
          </p>
          <h1 className="mt-2 text-4xl leading-tight font-extrabold text-neutral-900">
            카멜레온
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">
            지금 있는 이 공간이 게임판이 됩니다.
            <br />
            찍고, 색을 뽑아 위장하고, 진짜로 숨기세요.
          </p>
        </header>

        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            onClick={() => navigate(toPartyRoute('createRoom'))}
          >
            방 만들기
          </Button>

          <Card className="flex flex-col gap-3">
            <p className="text-sm font-medium text-neutral-700">
              초대받았다면 방 코드를 입력하세요
            </p>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') enter()
                }}
                placeholder="ABC123"
                inputMode="text"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                maxLength={6}
                aria-label="방 코드"
                className="h-12 w-full rounded-xl bg-neutral-50 px-4 text-center text-lg font-bold tracking-[0.3em] ring-1 ring-neutral-200 outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Button
                variant="secondary"
                className="w-auto px-6"
                onClick={enter}
              >
                입장
              </Button>
            </div>
            <ErrorBanner message={error} />
            <p className="text-xs text-neutral-500">
              방장이 보여주는 QR을 찍어도 바로 들어올 수 있어요.
            </p>
          </Card>
        </div>
      </div>
    </PageShell>
  )
}

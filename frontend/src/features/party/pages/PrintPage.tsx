import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { useSessionStore } from '@/shared/store/sessionStore'
import { DevPanel } from '../components/DevPanel'
import { PrintSheet } from '../components/PrintSheet'
import { Button, CopyButton, ErrorBanner } from '../components/ui'
import { usePrintSheet } from '../hooks/usePartyQueries'
import { buildPrintSlots, type PrintMode } from '../utils/printLayout'
import { errorMessage } from '../utils/errorMessage'
import { toPartyRoute } from '../routes/partyPaths'

const MODE_LABEL: Record<PrintMode, string> = {
  fold: '접어서 쓰기 (단면 1장)',
  duplex: '양면 인쇄 (2장)',
}

export function PrintPage() {
  const { gameId: gameIdParam } = useParams()
  const gameId = Number(gameIdParam)
  const hostToken = useSessionStore((s) => s.hostToken)

  const [mode, setMode] = useState<PrintMode>('fold')
  const [mirrorBack, setMirrorBack] = useState(true)

  const sheet = usePrintSheet(Number.isFinite(gameId) ? gameId : undefined)

  // characterId 기준으로 한 번만 정렬한다. 앞면과 뒷면이 이 배열을 공유한다.
  const slots = useMemo(
    () => buildPrintSlots(sheet.data?.characters ?? []),
    [sheet.data],
  )

  if (!hostToken) return <Navigate to={toPartyRoute('landing')} replace />

  return (
    <div className="min-h-dvh bg-neutral-100 print:bg-white">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-5 print:hidden">
        <header>
          <Link
            to={toPartyRoute('dashboard', { gameId })}
            className="text-sm text-neutral-500 underline underline-offset-4"
          >
            ← 게임 진행으로
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-neutral-900">카드 인쇄</h1>
          <p className="mt-1 text-sm text-neutral-500">
            앞면은 위장 캐릭터, 뒷면은 그 캐릭터 전용 QR입니다. 짝이 절대 바뀌지
            않게 같은 순서로 생성됩니다.
          </p>
        </header>

        <section className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
          <h2 className="text-sm font-semibold text-neutral-900">인쇄 방식</h2>
          <div className="mt-3 flex flex-col gap-2">
            {(Object.keys(MODE_LABEL) as PrintMode[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`rounded-xl px-4 py-3 text-left text-sm font-semibold ring-1 transition ${
                  mode === value
                    ? 'bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500'
                    : 'bg-neutral-50 text-neutral-700 ring-neutral-200'
                }`}
              >
                {MODE_LABEL[value]}
                <span className="mt-0.5 block text-xs font-normal text-neutral-500">
                  {value === 'fold'
                    ? '한 장을 반으로 접으면 앞뒤가 됩니다. 프린터 양면 설정이 필요 없어 가장 안전해요.'
                    : '공식 권장 방식. 프린터에서 양면 · 장변 넘김을 직접 선택해야 합니다.'}
                </span>
              </button>
            ))}
          </div>

          {mode === 'duplex' ? (
            <label className="mt-3 flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3">
              <input
                type="checkbox"
                checked={mirrorBack}
                onChange={(event) => setMirrorBack(event.target.checked)}
                className="mt-0.5 size-4 accent-amber-600"
              />
              <span className="text-xs leading-relaxed text-amber-900">
                <b>뒷면 좌우 반전</b> — 장변 넘김 양면 인쇄는 뒷장이 좌우로
                뒤집힙니다. 켜 두는 것이 기본이고, 시험 출력에서 QR이 다른
                캐릭터 뒤에 붙으면 이 스위치를 끄세요. 카드에 찍힌 번호로
                대조하면 됩니다.
              </span>
            </label>
          ) : null}

          <div className="mt-4 rounded-xl bg-neutral-50 px-4 py-3 text-xs leading-relaxed text-neutral-600">
            <b>인쇄 설정</b> · A4 세로 · 배율 100%(실제 크기)
            {mode === 'duplex' ? ' · 양면 · 장변 넘김' : ' · 단면'}
            <br />
            브라우저가 프린터 옵션을 대신 바꿔줄 수 없어요. 인쇄 창에서 직접
            선택해 주세요.
          </div>

          <div className="mt-4">
            <Button size="lg" onClick={() => window.print()}>
              인쇄하기 ({slots.length}장)
            </Button>
          </div>

          <ErrorBanner
            message={sheet.error ? errorMessage(sheet.error) : null}
          />
        </section>

        {slots.length > 0 ? (
          <section className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
            <h2 className="text-sm font-semibold text-neutral-900">
              QR 토큰 (프린터가 없을 때)
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              찾는 사람 화면의 직접 입력란에 이 값을 넣으면 스캔과 똑같이
              처리됩니다.
            </p>
            <ul className="mt-3 divide-y divide-neutral-100">
              {slots.map((slot) =>
                slot.character ? (
                  <li
                    key={slot.slotNumber}
                    className="flex items-center gap-3 py-2"
                  >
                    <span className="w-6 shrink-0 text-sm font-bold text-neutral-400">
                      {slot.slotNumber}
                    </span>
                    <span className="w-20 shrink-0 truncate text-sm font-medium text-neutral-800">
                      {slot.character.hiderNickname}
                    </span>
                    <code className="min-w-0 flex-1 truncate text-xs text-neutral-500">
                      {slot.character.qrToken}
                    </code>
                    <CopyButton value={slot.character.qrToken} />
                  </li>
                ) : null,
              )}
            </ul>
          </section>
        ) : (
          <p className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-neutral-400 ring-1 ring-neutral-200">
            {sheet.isLoading
              ? '불러오는 중…'
              : '아직 제출된 캐릭터가 없어요.'}
          </p>
        )}

        <DevPanel gameId={gameId} />
      </div>

      <div className="flex justify-center overflow-x-auto p-5 print:block print:overflow-visible print:p-0">
        <PrintSheet slots={slots} mode={mode} mirrorBack={mirrorBack} />
      </div>
    </div>
  )
}

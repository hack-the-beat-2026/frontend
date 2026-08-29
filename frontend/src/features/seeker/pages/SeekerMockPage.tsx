import { useState } from 'react'
import SeekerFinalResultPage, {
  type FinalHiderResult,
  type FinalSeekerResult,
} from './SeekerFinalResultPage'
import SeekerReadyPage from './SeekerReadyPage'
import SeekerScanResultPage, {
  type FoundCharacterResult,
  type ScanOutcome,
} from './SeekerScanResultPage'
import './SeekerMockPage.css'

export type SeekerMockScreen =
  | 'wait'
  | 'mock-scan'
  | 'success'
  | 'duplicate'
  | 'invalid'
  | 'result'

const mockPhoto =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 660"%3E%3Crect width="600" height="660" fill="%232c3854"/%3E%3Cpath d="M0 480 170 270l120 120 80-100 230 260H0Z" fill="%234d6d6f"/%3E%3Ccircle cx="440" cy="180" r="90" fill="%23d2ac75"/%3E%3C/svg%3E'

const mockFoundCharacter: FoundCharacterResult = {
  characterId: 101,
  hiderNickname: '지수',
  originalPhotoUrl: mockPhoto,
  previewImageUrl: mockPhoto,
  survivalSeconds: 427,
}

const mockHiders: readonly FinalHiderResult[] = [
  {
    characterId: 101,
    nickname: '지수',
    status: 'FOUND',
    survivalSeconds: 427,
  },
  {
    characterId: 102,
    nickname: '민준',
    status: 'SURVIVED',
    survivalSeconds: 900,
    isMvp: true,
  },
  {
    characterId: 103,
    nickname: '서연',
    status: 'FOUND',
    survivalSeconds: 251,
  },
]

const mockSeekers: readonly FinalSeekerResult[] = [
  { participantId: 201, nickname: '현우', foundCount: 2 },
  { participantId: 202, nickname: '유나', foundCount: 1 },
]

const mockScreenLabels: Record<SeekerMockScreen, string> = {
  wait: '대기',
  'mock-scan': '스캔',
  success: '성공',
  duplicate: '중복',
  invalid: '무효',
  result: '최종 결과',
}

type MockScanOutcome = Exclude<ScanOutcome, 'error'>

function MockScanner({ onDetected }: { onDetected: (outcome: MockScanOutcome) => void }) {
  return (
    <main className="seeker-mock-scanner">
      <p className="seeker-mock-scanner__eyebrow">MOCK QR SCANNER</p>
      <h1>스캔 결과를 선택하세요</h1>
      <p>실제 카메라 대신 Backend 응답 상태를 시뮬레이션합니다.</p>
      <div className="seeker-mock-scanner__frame" aria-hidden="true">
        <span />
      </div>
      <div className="seeker-mock-scanner__buttons">
        <button type="button" onClick={() => onDetected('success')}>
          성공 응답
        </button>
        <button type="button" onClick={() => onDetected('duplicate')}>
          중복 응답
        </button>
        <button type="button" onClick={() => onDetected('invalid')}>
          무효 응답
        </button>
      </div>
    </main>
  )
}

export default function SeekerMockPage({
  initialScreen = 'wait',
}: {
  initialScreen?: SeekerMockScreen
}) {
  const [screen, setScreen] = useState<SeekerMockScreen>(initialScreen)

  const renderScreen = () => {
    if (screen === 'wait') {
      return (
        <SeekerReadyPage
          gameStatus="WAITING"
          roomName="토요일 파티"
          nickname="현우"
          onOpenScanner={() => setScreen('mock-scan')}
        />
      )
    }

    if (screen === 'mock-scan') {
      return <MockScanner onDetected={(outcome) => setScreen(outcome)} />
    }

    if (screen === 'result') {
      return <SeekerFinalResultPage winnerLabel="숨는 사람 팀 승리" hiders={mockHiders} seekers={mockSeekers} />
    }

    return (
      <SeekerScanResultPage
        outcome={screen}
        foundCharacter={screen === 'success' ? mockFoundCharacter : undefined}
        errorCode={screen === 'duplicate' ? 'CHARACTER_ALREADY_FOUND' : 'INVALID_QR_TOKEN'}
        onRetry={() => setScreen('mock-scan')}
        onContinue={() => setScreen('mock-scan')}
      />
    )
  }

  return (
    <div className="seeker-mock-page">
      <nav className="seeker-mock-page__toolbar" aria-label="Seeker Mock 화면 선택">
        {Object.entries(mockScreenLabels).map(([value, label]) => (
          <button
            className={screen === value ? 'is-active' : ''}
            key={value}
            type="button"
            onClick={() => setScreen(value as SeekerMockScreen)}
          >
            {label}
          </button>
        ))}
      </nav>
      {renderScreen()}
    </div>
  )
}

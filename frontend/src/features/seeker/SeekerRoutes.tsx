import SeekerFinalResultPage, {
  type FinalHiderResult,
  type FinalSeekerResult,
} from './pages/SeekerFinalResultPage'
import SeekerReadyPage from './pages/SeekerReadyPage'
import SeekerScanPage from './pages/SeekerScanPage'
import SeekerScanResultPage, {
  type FoundCharacterResult,
  type ScanOutcome,
} from './pages/SeekerScanResultPage'

export type SeekerRoute = 'wait' | 'scan' | 'found' | 'result'

export type SeekerRoutesProps = {
  route: SeekerRoute
  gameStatus: string
  roomName?: string
  nickname?: string
  remainingSeconds?: number
  onOpenScanner?: () => void
  onScanToken?: (qrToken: string) => Promise<void> | void
  onCloseScanner?: () => void
  scanOutcome?: ScanOutcome
  foundCharacter?: FoundCharacterResult
  errorCode?: string
  onRetryScan?: () => void
  onContinueSearching?: () => void
  winnerLabel?: string
  hiders?: readonly FinalHiderResult[]
  seekers?: readonly FinalSeekerResult[]
  onExit?: () => void
}

export default function SeekerRoutes({
  route,
  gameStatus,
  roomName,
  nickname,
  remainingSeconds,
  onOpenScanner,
  onScanToken,
  onCloseScanner,
  scanOutcome,
  foundCharacter,
  errorCode,
  onRetryScan,
  onContinueSearching,
  winnerLabel,
  hiders,
  seekers,
  onExit,
}: SeekerRoutesProps) {
  if (route === 'wait') {
    return (
      <SeekerReadyPage
        gameStatus={gameStatus}
        roomName={roomName}
        nickname={nickname}
        remainingSeconds={remainingSeconds}
        onOpenScanner={onOpenScanner}
      />
    )
  }

  if (route === 'scan' && onScanToken) {
    return (
      <SeekerScanPage
        gameStatus={gameStatus}
        onScanToken={onScanToken}
        onClose={onCloseScanner}
      />
    )
  }

  if (route === 'found') {
    return (
      <SeekerScanResultPage
        outcome={scanOutcome ?? 'error'}
        foundCharacter={foundCharacter}
        errorCode={errorCode}
        onRetry={onRetryScan}
        onContinue={onContinueSearching}
      />
    )
  }

  if (route === 'result') {
    return (
      <SeekerFinalResultPage
        winnerLabel={winnerLabel ?? ''}
        hiders={hiders ?? []}
        seekers={seekers ?? []}
        onExit={onExit}
      />
    )
  }

  return (
    <SeekerReadyPage
      gameStatus={gameStatus}
      roomName={roomName}
      nickname={nickname}
      remainingSeconds={remainingSeconds}
      onOpenScanner={onOpenScanner}
    />
  )
}

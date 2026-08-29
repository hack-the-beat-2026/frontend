import type { Participant } from '@/shared/types'

const STATUS_LABEL: Record<Participant['status'], string> = {
  WAITING: '대기 중',
  ACTIVE: '참여 중',
  ELIMINATED: '발각됨',
  SURVIVED: '생존',
  LEFT: '나감',
}

const ROLE_LABEL: Record<Participant['role'], string> = {
  NONE: '',
  HIDER: '숨는 사람',
  SEEKER: '찾는 사람',
}

/**
 * 역할 표시는 기본으로 꺼 둔다.
 *
 * architecture.md §14 / contractRules.md §30 — 역할은 개인에게만 전달되는 정보다.
 * HOST 화면이라도 옆에서 SEEKER가 넘겨볼 수 있으므로, 진행에 필요한 순간에만
 * showRoles로 펼쳐 본다.
 */
export function ParticipantList({
  participants,
  showRoles = false,
  emptyMessage = '아직 아무도 안 들어왔어요.',
}: {
  participants: Participant[]
  showRoles?: boolean
  emptyMessage?: string
}) {
  if (participants.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-neutral-400">{emptyMessage}</p>
    )
  }

  return (
    <ul className="divide-y divide-neutral-100">
      {participants.map((participant) => (
        <li
          key={participant.participantId}
          className="flex items-center justify-between gap-3 py-3"
        >
          <span className="truncate font-medium text-neutral-900">
            {participant.nickname}
          </span>
          <span className="flex shrink-0 items-center gap-2">
            {showRoles && participant.role !== 'NONE' ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  participant.role === 'SEEKER'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {ROLE_LABEL[participant.role]}
              </span>
            ) : null}
            <span className="text-xs text-neutral-400">
              {STATUS_LABEL[participant.status]}
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}

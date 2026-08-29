import type { PrintCharacter } from '@/shared/types'

/**
 * 인쇄 레이아웃 계산.
 *
 * 핵심 규칙 (architecture.md §17.2, §18 / contractRules.md §24-26):
 * 슬롯 배열은 **한 번만** 만들고 앞면과 뒷면이 같은 배열을 쓴다.
 * 앞/뒤를 각각 정렬하면 Character와 QR의 페어링이 깨져 엉뚱한 HIDER가 탈락한다.
 */

export type PrintMode = 'fold' | 'duplex'

export type PrintLayoutSpec = {
  columns: number
  rows: number
  /** 완성된 카드 크기(mm). fold 모드에서는 접은 뒤 크기다. */
  cardWidthMm: number
  cardHeightMm: number
  qrSizeMm: number
}

export const PRINT_LAYOUTS: Record<PrintMode, PrintLayoutSpec> = {
  /**
   * 접지형 단면. 슬롯 하나가 [캐릭터 | QR]로 좌우 배치되고,
   * 인쇄면이 바깥으로 오게 가운데를 접으면 앞면 캐릭터 / 뒷면 QR이 된다.
   * 단면 한 장이면 끝나므로 프린터 양면 설정 실패 리스크가 없다.
   */
  fold: { columns: 2, rows: 3, cardWidthMm: 46, cardHeightMm: 78, qrSizeMm: 28 },

  /** architecture.md §17.3의 공식 권장 방식. A4 세로 · 양면 · 장변 넘김. */
  duplex: {
    columns: 3,
    rows: 2,
    cardWidthMm: 60,
    cardHeightMm: 90,
    qrSizeMm: 32,
  },
}

export type PrintSlot = {
  /** 1부터 시작하는 전체 통짜 번호. 출력물에 찍어 현장에서 대조한다. */
  slotNumber: number
  character: PrintCharacter | null
}

export type PrintPage = {
  pageNumber: number
  /** rows × columns 격자. 빈 칸은 character가 null이다. */
  grid: PrintSlot[][]
}

/**
 * characterId 오름차순으로 **한 번만** 정렬해 고정 슬롯을 만든다.
 * 이 배열이 앞면과 뒷면 모두의 유일한 기준이다.
 */
export function buildPrintSlots(characters: PrintCharacter[]): PrintSlot[] {
  return [...characters]
    .sort((a, b) => a.characterId - b.characterId)
    .map((character, index) => ({ slotNumber: index + 1, character }))
}

export function paginate(slots: PrintSlot[], spec: PrintLayoutSpec): PrintPage[] {
  const perPage = spec.columns * spec.rows
  const pageCount = Math.max(1, Math.ceil(slots.length / perPage))
  const pages: PrintPage[] = []

  for (let page = 0; page < pageCount; page += 1) {
    const grid: PrintSlot[][] = []
    for (let row = 0; row < spec.rows; row += 1) {
      const cells: PrintSlot[] = []
      for (let column = 0; column < spec.columns; column += 1) {
        const index = page * perPage + row * spec.columns + column
        cells.push(
          slots[index] ?? { slotNumber: index + 1, character: null },
        )
      }
      grid.push(cells)
    }
    pages.push({ pageNumber: page + 1, grid })
  }

  return pages
}

/**
 * 양면(duplex) 인쇄에서 뒷면 격자를 만든다.
 *
 * ⚠️ 장변 넘김으로 양면 인쇄하면 종이가 좌우로 뒤집힌다.
 * 앞면과 같은 순서로 뒷면을 그리면 QR이 엉뚱한 캐릭터 뒤에 붙는다.
 *
 *   앞면 행:   A     B     C
 *   뒷면 행:  QR-C  QR-B  QR-A   ← 접혔을 때 A·B·C 뒤에 정확히 놓인다
 *
 * 슬롯 배열 자체는 건드리지 않고 **행 안의 렌더 순서만** 뒤집는다.
 * 정렬을 다시 하는 것이 아니므로 페어링은 그대로 유지된다.
 *
 * 프린터 기종에 따라 결과가 다를 수 있어 화면에서 토글할 수 있게 해 뒀다.
 * 실제 종이로 한 번 출력해 확인한 뒤 값을 고정한다.
 */
export function backGrid(grid: PrintSlot[][], mirrored: boolean): PrintSlot[][] {
  if (!mirrored) return grid
  return grid.map((row) => [...row].reverse())
}

/** QR에 담을 값. qrToken만 넣고 개인정보는 넣지 않는다 (architecture.md §13.1). */
export function qrPayload(qrToken: string): string {
  const origin =
    typeof location === 'undefined' ? 'https://example.com' : location.origin
  return `${origin}/c/${qrToken}`
}

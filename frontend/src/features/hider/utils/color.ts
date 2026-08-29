/** Convert an RGB triplet sampled from the photo into a `#rrggbb` string. */
export function rgbToHex(r: number, g: number, b: number) {
  const toPair = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')

  return `#${toPair(r)}${toPair(g)}${toPair(b)}`
}

/** Pick a legible label colour for a swatch of the given background. */
export function readableTextColor(hex: string) {
  const value = hex.replace('#', '')

  if (value.length !== 6) {
    return '#111827'
  }

  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.6 ? '#111827' : '#f9fafb'
}

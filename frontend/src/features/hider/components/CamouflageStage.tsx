import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { CharacterTransform } from '../../../shared/types'
import type { CharacterTemplate } from '../assets/templates'
import type { CapturedPhoto, PartColors, PartId } from '../types'
import type { Size } from '../utils/geometry'
import {
  angleBetween,
  distanceBetween,
  stagePointToPhotoPixel,
} from '../utils/geometry'
import { CharacterLayer } from './CharacterLayer'

type Point = { x: number; y: number }

type GestureBaseline = {
  transform: CharacterTransform
  centroid: Point
  distance: number
  angle: number
}

type CamouflageStageProps = {
  photo: CapturedPhoto
  template: CharacterTemplate
  partColors: PartColors
  transform: CharacterTransform
  selectedPart: PartId | null
  eyedropperActive: boolean
  onBeginGesture: () => void
  onTransformChange: (transform: CharacterTransform) => void
  onSampleColor: (hex: string) => void
  sampleColorAt: (x: number, y: number) => string | null
}

function centroidOf(points: Point[]): Point {
  const sum = points.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 },
  )

  return { x: sum.x / points.length, y: sum.y / points.length }
}

/**
 * The photo + character surface.
 *
 * The stage is rendered at the photo's exact aspect ratio, so the displayed
 * rect is a uniform scale of the photo. That keeps the ratio coordinates of
 * contractRules.md §16 a straight division — no letterbox maths anywhere.
 *
 * One pointer drags. Two pointers pinch to scale and twist to rotate. Explicit
 * sliders live in `EditorToolbar` as well, because pinch gestures are unreliable
 * inside some webviews.
 */
export function CamouflageStage({
  photo,
  template,
  partColors,
  transform,
  selectedPart,
  eyedropperActive,
  onBeginGesture,
  onTransformChange,
  onSampleColor,
  sampleColorAt,
}: CamouflageStageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pointersRef = useRef(new Map<number, Point>())
  const baselineRef = useRef<GestureBaseline | null>(null)
  const [surface, setSurface] = useState<Size>({ width: 0, height: 0 })

  useEffect(() => {
    const element = containerRef.current

    if (!element) {
      return
    }

    const observer = new ResizeObserver(([entry]) => {
      setSurface({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  const localPoint = useCallback((event: { clientX: number; clientY: number }) => {
    const rect = containerRef.current?.getBoundingClientRect()

    if (!rect) {
      return { x: 0, y: 0 }
    }

    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }, [])

  /** Re-anchor the gesture whenever the number of active pointers changes. */
  const rebaseline = useCallback(() => {
    const points = [...pointersRef.current.values()]

    if (points.length === 0) {
      baselineRef.current = null
      return
    }

    baselineRef.current = {
      transform,
      centroid: centroidOf(points),
      distance: points.length >= 2 ? distanceBetween(points[0], points[1]) : 0,
      angle: points.length >= 2 ? angleBetween(points[0], points[1]) : 0,
    }
  }, [transform])

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (eyedropperActive) {
      const pixel = stagePointToPhotoPixel(localPoint(event), surface, photo)
      const hex = sampleColorAt(pixel.x, pixel.y)

      if (hex) {
        onSampleColor(hex)
      }

      return
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    pointersRef.current.set(event.pointerId, localPoint(event))

    if (pointersRef.current.size === 1) {
      onBeginGesture()
    }

    rebaseline()
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) {
      return
    }

    pointersRef.current.set(event.pointerId, localPoint(event))

    const baseline = baselineRef.current
    const points = [...pointersRef.current.values()]

    if (!baseline || surface.width === 0 || surface.height === 0) {
      return
    }

    const centroid = centroidOf(points)
    const next: CharacterTransform = {
      ...baseline.transform,
      positionX:
        baseline.transform.positionX +
        (centroid.x - baseline.centroid.x) / surface.width,
      positionY:
        baseline.transform.positionY +
        (centroid.y - baseline.centroid.y) / surface.height,
    }

    if (points.length >= 2 && baseline.distance > 0) {
      next.scale =
        baseline.transform.scale * (distanceBetween(points[0], points[1]) / baseline.distance)
      next.rotation =
        baseline.transform.rotation + (angleBetween(points[0], points[1]) - baseline.angle)
    }

    onTransformChange(next)
  }

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId)
    rebaseline()
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      className={`relative w-full touch-none overflow-hidden rounded-2xl bg-black select-none ${
        eyedropperActive ? 'cursor-crosshair' : 'cursor-grab'
      }`}
      style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
    >
      <img
        src={photo.objectUrl}
        alt="촬영한 장소"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      <CharacterLayer
        template={template}
        partColors={partColors}
        transform={transform}
        surface={surface}
        highlightPart={eyedropperActive ? null : selectedPart}
      />
      {eyedropperActive ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/60 px-3 py-2 text-center text-xs text-white">
          배경을 탭하면 그 지점의 색을 뽑아 옵니다
        </div>
      ) : null}
    </div>
  )
}

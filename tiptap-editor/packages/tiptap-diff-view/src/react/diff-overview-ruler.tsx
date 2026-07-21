import type { RefObject } from 'react'
import type { DiffMarker } from '../diff-model'
import { useLatestCallback, useResizeObserver } from 'hooks'
import { memo, useEffect, useRef } from 'react'

/** 类似 VSCode overview ruler 的变更导航轨道 */
export const DiffOverviewRuler = memo<DiffOverviewRulerProps>((props) => {
  const {
    markers,
    totalRows,
    scrollerRef,
    contentRef,
    addMarkerColor,
    deleteMarkerColor,
    labels,
  } = props
  const viewportRef = useRef<HTMLButtonElement>(null)
  const dragRef = useRef<ViewportDragState | null>(null)

  const syncViewport = useLatestCallback(() => {
    const scroller = scrollerRef.current
    const viewport = viewportRef.current
    if (!scroller || !viewport)
      return

    const scrollable = Math.max(scroller.scrollHeight - scroller.clientHeight, 1)
    const height = Math.max(8, scroller.clientHeight / scroller.scrollHeight * 100)
    const top = scroller.scrollTop / scrollable * (100 - height)

    viewport.style.height = `${height}%`
    viewport.style.top = `${top}%`
  })

  useResizeObserver([scrollerRef, contentRef], syncViewport)

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller)
      return

    syncViewport()
    scroller.addEventListener('scroll', syncViewport, { passive: true })

    return () => scroller.removeEventListener('scroll', syncViewport)
  }, [scrollerRef, syncViewport])

  const jumpToRow = useLatestCallback((rowKey: string) => {
    const scroller = scrollerRef.current
    const target = document.getElementById(`markdown-diff-${rowKey}`)
    if (!scroller || !target)
      return

    scroller.scrollTo({
      top: Math.max(0, target.offsetTop - scroller.clientHeight / 3),
      behavior: 'smooth',
    })
  })

  const jumpFromTrack = useLatestCallback((clientY: number, track: HTMLButtonElement) => {
    const scroller = scrollerRef.current
    if (!scroller)
      return

    const trackRect = track.getBoundingClientRect()
    const progress = Math.min(1, Math.max(0, (clientY - trackRect.top) / trackRect.height))
    const maxScrollTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight)

    scroller.scrollTo({ top: progress * maxScrollTop, behavior: 'smooth' })
  })

  const startViewportDrag = useLatestCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const scroller = scrollerRef.current
    if (!scroller)
      return

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      startClientY: event.clientY,
      startScrollTop: scroller.scrollTop,
    }
  })

  const moveViewport = useLatestCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const scroller = scrollerRef.current
    const viewport = viewportRef.current
    const drag = dragRef.current
    if (!scroller || !viewport || !drag || drag.pointerId !== event.pointerId)
      return

    const track = viewport.parentElement
    if (!track)
      return

    const maxViewportTop = Math.max(1, track.clientHeight - viewport.offsetHeight)
    const maxScrollTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight)
    const pointerDelta = event.clientY - drag.startClientY

    scroller.scrollTop = Math.min(
      maxScrollTop,
      Math.max(0, drag.startScrollTop + pointerDelta / maxViewportTop * maxScrollTop),
    )
  })

  const stopViewportDrag = useLatestCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId)
      return

    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
  })

  return (
    <aside
      aria-label={ labels.overview }
      className="absolute inset-y-0 right-0 z-10 w-3 overflow-hidden border-0 bg-background2 shadow-[-4px_0_12px_rgb(0_0_0/0.06)]"
    >
      <button
        type="button"
        aria-label={ labels.jumpByPosition }
        className="absolute inset-0 z-0 w-full cursor-pointer border-0 bg-transparent"
        onClick={ event => jumpFromTrack(event.clientY, event.currentTarget) }
      />
      <button
        ref={ viewportRef }
        type="button"
        aria-label={ labels.dragOverview }
        className="absolute inset-x-0 z-30 min-h-2 cursor-grab touch-none rounded-sm border-0 bg-text3/30 shadow-md transition-colors hover:bg-text3/40 active:cursor-grabbing active:bg-text3/50"
        onPointerDown={ startViewportDrag }
        onPointerMove={ moveViewport }
        onPointerUp={ stopViewportDrag }
        onPointerCancel={ stopViewportDrag }
      />
      { markers.map(marker => (
        <button
          key={ marker.key }
          type="button"
          aria-label={ marker.type === 'insert'
            ? labels.jumpToAddedLine(marker.lineNumber)
            : labels.jumpToDeletedLine(marker.lineNumber) }
          className="absolute inset-x-px z-20 min-h-1 -translate-y-1/2 cursor-pointer rounded-[1px] border-0 transition-[filter] duration-[120ms] hover:brightness-[1.18]"
          style={ {
            top: `${Math.min(99, marker.rowIndex / Math.max(totalRows, 1) * 100)}%`,
            backgroundColor: marker.type === 'insert'
              ? addMarkerColor
              : deleteMarkerColor,
          } }
          onClick={ () => jumpToRow(marker.rowKey) }
        />
      )) }
    </aside>
  )
})

DiffOverviewRuler.displayName = 'DiffOverviewRuler'

export type DiffOverviewRulerProps = {
  markers: DiffMarker[]
  totalRows: number
  scrollerRef: RefObject<HTMLDivElement | null>
  contentRef: RefObject<HTMLDivElement | null>
  addMarkerColor: string
  deleteMarkerColor: string
  labels: DiffOverviewRulerLabels
}

/** Diff 快速导航的无障碍文案 */
export type DiffOverviewRulerLabels = {
  overview: string
  jumpByPosition: string
  dragOverview: string
  jumpToAddedLine: (line: number) => string
  jumpToDeletedLine: (line: number) => string
}

type ViewportDragState = {
  pointerId: number
  startClientY: number
  startScrollTop: number
}

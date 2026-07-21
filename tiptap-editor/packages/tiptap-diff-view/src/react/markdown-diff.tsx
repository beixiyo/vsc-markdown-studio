import type { CSSProperties } from 'react'
import type { DiffLine, DiffRow } from '../diff-model'
import { useResizeObserver, useTheme } from 'hooks'
import { useT } from 'i18n/react'
import { memo, useMemo, useRef, useState } from 'react'
import { createDiffMarkers, createDiffRows } from '../diff-model'
import { DiffOverviewRuler } from './diff-overview-ruler'

/** 可配置、可编辑的 Markdown 文本 Diff 视图 */
export const MarkdownDiff = memo<MarkdownDiffProps>((props) => {
  const {
    before,
    after,
    onBeforeChange,
    onAfterChange,
    beforeLabel,
    afterLabel,
    showSources = true,
    className = '',
    colors = DEFAULT_DIFF_COLORS,
    splitViewMinWidth = 960,
  } = props
  const t = useT('tiptapDiffView')

  const [preferredView, setPreferredView] = useState<DiffView>('split')
  const [isBelowSplitThreshold, setIsBelowSplitThreshold] = useState(false)
  const [theme] = useTheme() as unknown as ['light' | 'dark', unknown]

  const rootRef = useRef<HTMLElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const diffContentRef = useRef<HTMLDivElement>(null)

  const view = isBelowSplitThreshold
    ? 'unified'
    : preferredView
  const palette = useMemo(
    () => resolvePalette(colors, theme),
    [colors, theme],
  )

  const colorStyle = useMemo<DiffColorStyle>(() => ({
    '--diff-add-line': palette.addLine,
    '--diff-add-text': palette.addText,
    '--diff-delete-line': palette.deleteLine,
    '--diff-delete-text': palette.deleteText,
  }), [palette])

  const rows = useMemo(() => createDiffRows(before, after), [after, before])
  const markers = useMemo(() => createDiffMarkers(rows), [rows])
  const changedBlockCount = useMemo(
    () => rows.filter(row => row.oldLine?.type === 'delete' || row.newLine?.type === 'insert').length,
    [rows],
  )

  useResizeObserver([rootRef], (entry: ResizeObserverEntry) => {
    setIsBelowSplitThreshold(entry.contentRect.width < splitViewMinWidth)
  })

  return (
    <main
      ref={ rootRef }
      className={ `flex h-full min-h-0 flex-col bg-background2 ${className}` }
      style={ colorStyle }
    >
      { showSources && (
        <section className="grid h-60 shrink-0 grid-cols-2 gap-px border-b border-border bg-border">
          <SourceEditor label={ beforeLabel ?? t('before') } value={ before } onChange={ onBeforeChange } />
          <SourceEditor label={ afterLabel ?? t('after') } value={ after } onChange={ onAfterChange } />
        </section>
      ) }

      <section className="flex min-h-0 flex-1 flex-col bg-background">
        <header className="flex min-h-13 shrink-0 items-center justify-between border-b border-border px-4">
          <div className="flex items-baseline gap-2.5">
            <strong className="text-sm text-text">{ t('result') }</strong>
            <span className="text-xs text-text3/50">
              { t('changedLines', { count: changedBlockCount }) }
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={ isBelowSplitThreshold }
              className={ getViewButtonClass(view === 'split') }
              onClick={ () => setPreferredView('split') }
            >
              { t('splitView') }
            </button>
            <button
              type="button"
              className={ getViewButtonClass(view === 'unified') }
              onClick={ () => setPreferredView('unified') }
            >
              { t('unifiedView') }
            </button>
          </div>
        </header>

        <div className="relative min-h-0 flex-1">
          <div
            ref={ scrollerRef }
            className="h-full overflow-auto pr-6 font-mono text-[0.8125rem] [&::-webkit-scrollbar]:hidden"
            style={ { scrollbarWidth: 'none' } }
          >
            <div ref={ diffContentRef } className="min-w-0">
              { view === 'split'
                ? <SplitDiff rows={ rows } />
                : <UnifiedDiff rows={ rows } /> }
            </div>
          </div>
          <DiffOverviewRuler
            markers={ markers }
            totalRows={ rows.length }
            scrollerRef={ scrollerRef }
            contentRef={ diffContentRef }
            addMarkerColor={ palette.addMarker }
            deleteMarkerColor={ palette.deleteMarker }
            labels={ {
              overview: t('overview'),
              jumpByPosition: t('jumpByPosition'),
              dragOverview: t('dragOverview'),
              jumpToAddedLine: line => t('jumpToAddedLine', { line }),
              jumpToDeletedLine: line => t('jumpToDeletedLine', { line }),
            } }
          />
        </div>
      </section>
    </main>
  )
})

MarkdownDiff.displayName = 'MarkdownDiff'

const SourceEditor = memo<SourceEditorProps>(({ label, value, onChange }) => (
  <label className="flex min-w-0 flex-col bg-background">
    <span className="shrink-0 border-b border-border px-4 py-2.5 text-xs font-semibold text-text2/70">
      { label }
    </span>
    <textarea
      value={ value }
      readOnly={ !onChange }
      spellCheck={ false }
      className="min-h-0 flex-1 resize-none border-0 bg-transparent px-4 py-3.5 font-mono text-[0.8125rem] leading-relaxed text-text outline-none"
      onChange={ event => onChange?.(event.target.value) }
    />
  </label>
))

SourceEditor.displayName = 'SourceEditor'

const SplitDiff = memo<DiffRowsProps>(({ rows }) => (
  <div className="w-full">
    { rows.map(row => (
      <div
        key={ row.key }
        id={ `markdown-diff-${row.key}` }
        className="grid min-w-0 grid-cols-[4rem_minmax(0,1fr)_4rem_minmax(0,1fr)]"
      >
        <LineNumber line={ row.oldLine } />
        <LineContent line={ row.oldLine } />
        <LineNumber line={ row.newLine } />
        <LineContent line={ row.newLine } />
      </div>
    )) }
  </div>
))

SplitDiff.displayName = 'SplitDiff'

const UnifiedDiff = memo<DiffRowsProps>(({ rows }) => (
  <div className="w-full">
    { rows.flatMap((row) => {
      if (row.oldLine?.type === 'delete' || row.newLine?.type === 'insert') {
        return [row.oldLine, row.newLine]
          .filter((line): line is DiffLine => line !== undefined)
          .map((line, index) => (
            <div
              key={ `${row.key}-${line.type}` }
              id={ index === 0
                ? `markdown-diff-${row.key}`
                : undefined }
              className="grid min-w-0 grid-cols-[4rem_minmax(0,1fr)]"
            >
              <LineNumber line={ line } />
              <LineContent line={ line } />
            </div>
          ))
      }

      return [(
        <div
          key={ row.key }
          id={ `markdown-diff-${row.key}` }
          className="grid min-w-0 grid-cols-[4rem_minmax(0,1fr)]"
        >
          <LineNumber line={ row.newLine } />
          <LineContent line={ row.newLine } />
        </div>
      )]
    }) }
  </div>
))

UnifiedDiff.displayName = 'UnifiedDiff'

const LineNumber = memo<LineProps>(({ line }) => (
  <span
    className="select-none border-r border-border px-2.5 text-right leading-[1.7] text-text2/70"
    style={ getLineStyle(line) }
  >
    { line?.lineNumber }
  </span>
))

LineNumber.displayName = 'LineNumber'

const LineContent = memo<LineProps>(({ line }) => (
  <code
    className="min-w-0 whitespace-pre-wrap break-words px-4 leading-[1.7] text-text [overflow-wrap:anywhere]"
    style={ getLineStyle(line) }
  >
    { line?.segments
      ? line.segments.map(segment => (
          <span
            key={ segment.key }
            style={ segment.changed
              ? {
                  backgroundColor: line.type === 'insert'
                    ? 'var(--diff-add-text)'
                    : 'var(--diff-delete-text)',
                }
              : undefined }
          >
            { segment.text }
          </span>
        ))
      : line?.text }
  </code>
))

LineContent.displayName = 'LineContent'

function getLineStyle(line?: DiffLine): CSSProperties {
  if (line?.type === 'insert')
    return { backgroundColor: 'var(--diff-add-line)' }
  if (line?.type === 'delete')
    return { backgroundColor: 'var(--diff-delete-line)' }
  return { backgroundColor: 'rgb(var(--background))' }
}

function getViewButtonClass(active: boolean) {
  const base = 'rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40'
  return active
    ? `${base} bg-button text-textSpecial`
    : `${base} bg-background text-text hover:bg-background3`
}

function resolvePalette(
  colors: MarkdownDiffColors,
  theme: 'light' | 'dark',
): MarkdownDiffPalette {
  return {
    ...DEFAULT_DIFF_COLORS[theme],
    ...colors[theme],
  }
}

type SourceEditorProps = {
  label: string
  value: string
  onChange?: (value: string) => void
}

type DiffRowsProps = {
  rows: DiffRow[]
}

type LineProps = {
  line?: DiffLine
}

type DiffView = 'split' | 'unified'

/** Markdown Diff 组件配置 */
export type MarkdownDiffProps = {
  /** 修改前 Markdown */
  before: string
  /** 修改后 Markdown */
  after: string
  /** 修改旧文本；未提供时旧文本只读 */
  onBeforeChange?: (value: string) => void
  /** 修改新文本；未提供时新文本只读 */
  onAfterChange?: (value: string) => void
  /** 修改前标签，默认使用当前语言的内置文案 */
  beforeLabel?: string
  /** 修改后标签，默认使用当前语言的内置文案 */
  afterLabel?: string
  /** @default true */
  showSources?: boolean
  /** 根元素附加类名 */
  className?: string
  /**
   * 双栏 Diff 的最小容器宽度，低于该值自动切换单栏
   * @default 960
   */
  splitViewMinWidth?: number
  /** Diff 在不同主题下的颜色配置 */
  colors?: MarkdownDiffColors
}

/** Diff 主题颜色配置 */
export type MarkdownDiffColors = {
  light?: Partial<MarkdownDiffPalette>
  dark?: Partial<MarkdownDiffPalette>
}

/** Diff 行、字符和 overview marker 的颜色 */
export type MarkdownDiffPalette = {
  addLine: string
  addText: string
  deleteLine: string
  deleteText: string
  addMarker: string
  deleteMarker: string
}

type DiffColorStyle = CSSProperties & {
  '--diff-add-line': string
  '--diff-add-text': string
  '--diff-delete-line': string
  '--diff-delete-text': string
}

const DEFAULT_DIFF_COLORS: Record<'light' | 'dark', MarkdownDiffPalette> = {
  light: {
    addLine: '#ebf5ec',
    addText: '#c6e4ca',
    deleteLine: '#fdedec',
    deleteText: '#f7c7c5',
    addMarker: '#34c759',
    deleteMarker: '#ff565e',
  },
  dark: {
    addLine: '#323c33',
    addText: '#3e5633',
    deleteLine: '#2d1615',
    deleteText: '#621d21',
    addMarker: '#34c759',
    deleteMarker: '#ff565e',
  },
}

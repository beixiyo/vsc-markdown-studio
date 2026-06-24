/**
 * 区域流式 loading 外框装饰层
 *
 * 仅通过 Decoration 渲染临时 UI，不写入 ProseMirror 文档。
 * 外部用 id 控制显示 / 隐藏，DecorationSet 会随事务自动 remap。
 */

import type { Editor } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import type { DecoRange } from './decorations'
import type {
  RegionLoadingFrameHideOptions,
  RegionLoadingFrameState,
  RegionSelectionOptions,
} from './types'
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { REGION_META } from './constants'

export const REGION_LOADING_FRAME_KEY = new PluginKey<DecorationSet>('region-loading-frame')

/**
 * 创建 loading 外框插件
 */
export function createRegionLoadingFramePlugin() {
  return new Plugin<DecorationSet>({
    key: REGION_LOADING_FRAME_KEY,
    state: {
      init: () => DecorationSet.empty,
      apply: (tr, set) => {
        const meta = tr.getMeta(REGION_LOADING_FRAME_KEY) as RegionLoadingFrameMeta | undefined
        const mapped = set.map(tr.mapping, tr.doc)
        if (!meta) {
          return mapped
        }

        switch (meta.type) {
          case 'set': {
            const withoutCurrent = removeFrame(mapped, meta.frame.id)
            return withoutCurrent.add(tr.doc, buildFrameDecorations(tr.doc, meta.frame))
          }
          case 'remove':
            return removeFrame(mapped, meta.id)
          case 'clear':
            return DecorationSet.empty
        }
      },
    },
    props: {
      decorations: state => REGION_LOADING_FRAME_KEY.getState(state),
    },
  })
}

/**
 * 设置或更新一个 loading 外框
 */
export function setRegionLoadingFrame(editor: Editor, frame: RegionLoadingFrameState) {
  if (!canUseEditor(editor))
    return

  const tr = editor.state.tr
    .setMeta(REGION_LOADING_FRAME_KEY, { type: 'set', frame } satisfies RegionLoadingFrameMeta)
    .setMeta(REGION_META.INTERNAL, true)
  editor.view.dispatch(tr)
}

/**
 * 按 id 清理 loading 外框，可选中并滚动到外框当前范围
 */
export function clearRegionLoadingFrame(
  editor: Editor,
  id: string,
  options: RegionLoadingFrameHideOptions = {},
): boolean {
  if (!canUseEditor(editor))
    return false

  const range = getRegionLoadingFrameRange(editor, id)
  const tr = editor.state.tr
    .setMeta(REGION_LOADING_FRAME_KEY, { type: 'remove', id } satisfies RegionLoadingFrameMeta)
    .setMeta(REGION_META.INTERNAL, true)
  editor.view.dispatch(tr)

  if (options.select && range && range.to > range.from) {
    selectRegionRange(editor, range, options)
  }

  return range !== null
}

/**
 * 清空所有 loading 外框
 */
export function clearAllRegionLoadingFrames(editor: Editor) {
  if (!canUseEditor(editor))
    return

  const tr = editor.state.tr
    .setMeta(REGION_LOADING_FRAME_KEY, { type: 'clear' } satisfies RegionLoadingFrameMeta)
    .setMeta(REGION_META.INTERNAL, true)
  editor.view.dispatch(tr)
}

/**
 * 读取某个外框当前 range；range 已经随文档事务 remap
 */
export function getRegionLoadingFrameRange(editor: Editor, id: string): DecoRange | null {
  const set = REGION_LOADING_FRAME_KEY.getState(editor.state)
  if (!set || set === DecorationSet.empty)
    return null

  const found = set.find(undefined, undefined, spec => spec.id === id && spec.kind !== 'tail')
  if (!found.length)
    return null

  return found.reduce<DecoRange | null>((range, deco) => {
    if (!range)
      return { from: deco.from, to: deco.to }
    return {
      from: Math.min(range.from, deco.from),
      to: Math.max(range.to, deco.to),
    }
  }, null)
}

/**
 * 选中并滚动到一个 ProseMirror range
 */
export function selectRegionRange(
  editor: Editor,
  range: DecoRange,
  options: RegionSelectionOptions = {},
): boolean {
  if (!canUseEditor(editor))
    return false

  const selectionRange = resolveTextSelectionRange(editor.state.doc, range)
  if (!selectionRange)
    return false

  const tr = editor.state.tr
    .setSelection(TextSelection.create(editor.state.doc, selectionRange.from, selectionRange.to))
    .scrollIntoView()
    .setMeta(REGION_META.INTERNAL, true)
  editor.view.dispatch(tr)

  scrollDOMAtPos(editor, selectionRange.from, options)
  return true
}

function buildFrameDecorations(doc: PMNode, frame: RegionLoadingFrameState): Decoration[] {
  const range = normalizeRange(doc, frame.range)
  if (!range)
    return []

  if (range.to <= range.from) {
    return [
      Decoration.widget(
        range.from,
        () => createLoadingShell(frame, 'placeholder'),
        { id: frame.id, kind: 'placeholder', key: `${frame.id}:placeholder`, side: 1 },
      ),
    ]
  }

  const blocks = getTopLevelBlocks(doc, range)
  if (!blocks.length) {
    return [
      Decoration.inline(
        range.from,
        range.to,
        frameAttrs(frame, 'single'),
        { id: frame.id, kind: 'inline', key: `${frame.id}:inline` },
      ),
    ]
  }

  const hasTail = frame.loading !== false
  const decorations = blocks.map((block, index) => {
    const role = resolveFrameRole(index, blocks.length, hasTail)
    return Decoration.node(
      block.from,
      block.to,
      frameAttrs(frame, role),
      { id: frame.id, kind: 'node', key: `${frame.id}:node:${block.from}` },
    )
  })

  if (hasTail) {
    decorations.push(
      Decoration.widget(
        range.to,
        () => createLoadingShell(frame, 'tail'),
        { id: frame.id, kind: 'tail', key: `${frame.id}:tail`, side: 1 },
      ),
    )
  }

  return decorations
}

function getTopLevelBlocks(doc: PMNode, range: DecoRange): TopLevelBlock[] {
  const blocks: TopLevelBlock[] = []
  doc.forEach((node, offset) => {
    const from = offset
    const to = offset + node.nodeSize
    if (from < range.to && to > range.from) {
      blocks.push({ from, to })
    }
  })
  return blocks
}

function createLoadingShell(frame: RegionLoadingFrameState, variant: 'placeholder' | 'tail'): HTMLElement {
  const shell = document.createElement('div')
  shell.className = `region-loading-frame-${variant}`
  shell.dataset.regionLoadingFrame = frame.id
  shell.contentEditable = 'false'
  shell.setAttribute('aria-hidden', 'true')

  const dots = document.createElement('span')
  dots.className = 'region-loading-frame-dots'
  dots.append(createDot(0), createDot(1), createDot(2))
  shell.appendChild(dots)

  return shell
}

function createDot(index: number): HTMLElement {
  const dot = document.createElement('span')
  dot.className = 'region-loading-frame-dot'
  dot.style.animationDelay = `${index * 120}ms`
  return dot
}

function frameAttrs(frame: RegionLoadingFrameState, role: RegionLoadingFrameRole) {
  return {
    class: `region-loading-frame region-loading-frame--${role}`,
    'data-region-loading-frame': frame.id,
  }
}

function resolveFrameRole(
  index: number,
  count: number,
  hasTail: boolean,
): RegionLoadingFrameRole {
  if (count === 1)
    return hasTail
      ? 'before-tail'
      : 'single'
  if (index === 0)
    return 'first'
  if (index === count - 1)
    return hasTail
      ? 'before-tail'
      : 'last'
  return 'middle'
}

function removeFrame(set: DecorationSet, id: string): DecorationSet {
  return set.remove(set.find(undefined, undefined, spec => spec.id === id))
}

function normalizeRange(doc: PMNode, range: DecoRange): DecoRange | null {
  const from = clamp(range.from, 0, doc.content.size)
  const to = clamp(range.to, from, doc.content.size)
  return { from, to }
}

function resolveTextSelectionRange(doc: PMNode, range: DecoRange): DecoRange | null {
  const normalized = normalizeRange(doc, range)
  if (!normalized || normalized.to <= normalized.from)
    return null

  let from: number | null = null
  let to: number | null = null
  doc.nodesBetween(normalized.from, normalized.to, (node, pos) => {
    if (!node.isTextblock)
      return true

    if (from === null)
      from = pos + 1
    to = pos + node.nodeSize - 1
    return false
  })

  if (from === null || to === null || to < from)
    return null
  return { from, to }
}

function scrollDOMAtPos(editor: Editor, pos: number, options: RegionSelectionOptions) {
  const {
    behavior = 'smooth',
    block = 'center',
  } = options

  const domAtPos = editor.view.domAtPos(pos)
  const node = domAtPos.node.nodeType === Node.TEXT_NODE
    ? domAtPos.node.parentElement
    : domAtPos.node

  if (node instanceof Element) {
    node.scrollIntoView({
      behavior,
      block,
      inline: 'nearest',
    })
  }
}

function canUseEditor(editor: Editor): boolean {
  return Boolean(editor && !editor.isDestroyed && editor.state && editor.view)
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max))
}

type RegionLoadingFrameMeta =
  | { type: 'set', frame: RegionLoadingFrameState }
  | { type: 'remove', id: string }
  | { type: 'clear' }

type RegionLoadingFrameRole =
  | 'single'
  | 'first'
  | 'middle'
  | 'last'
  | 'before-tail'

type TopLevelBlock = {
  from: number
  to: number
}

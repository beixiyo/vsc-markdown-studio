import { Extension } from '@tiptap/core'
import type { GetHoverContentOptions, HoverHighlightSpec } from 'tiptap-api'
import { getHoverContentFromViewCoords, getHoverHighlightSpecs } from 'tiptap-api'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export const hoverContextHighlightKey = new PluginKey('hoverContextHighlight')

const layerClass: Record<string, string> = {
  block: 'tiptap-hover-context-block',
  context: 'tiptap-hover-context-snippet',
  line: 'tiptap-hover-context-line',
}

/**
 * 为 hover 上下文探测提供可映射的 Decoration，不改变文档内容
 * 默认在 view 上监听指针并同步高亮；仅需 Tooltip 时可 `configure({ autoSyncOnPointer: false })`
 */
export const HoverContextHighlight = Extension.create<HoverContextHighlightOptions>({
  name: 'hoverContextHighlight',

  addOptions() {
    return {
      autoSyncOnPointer: true,
      throttleMs: 100,
      hoverContentOptions: {},
      disableOnDrag: true,
      disableOnSelection: false,
    }
  },

  addProseMirrorPlugins() {
    const opts = this.options

    return [
      new Plugin({
        key: hoverContextHighlightKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, old) {
            const meta = tr.getMeta(hoverContextHighlightKey)
            if (meta !== undefined) {
              if (meta === null || !Array.isArray(meta) || meta.length === 0)
                return DecorationSet.empty

              const decorations: Decoration[] = []
              for (const spec of meta as HoverHighlightSpec[]) {
                if (spec.from >= spec.to)
                  continue
                const cls = layerClass[spec.layer] ?? 'tiptap-hover-context-snippet'
                decorations.push(
                  Decoration.inline(spec.from, spec.to, { class: cls }),
                )
              }
              if (decorations.length === 0)
                return DecorationSet.empty
              return DecorationSet.create(tr.doc, decorations)
            }
            return old.map(tr.mapping, tr.doc)
          },
        },
        props: {
          decorations(state) {
            return hoverContextHighlightKey.getState(state)
          },
        },
        view: (editorView) => {
          if (!opts.autoSyncOnPointer) {
            return {}
          }

          const dom = editorView.dom
          let isDragging = false
          let lastThrottleAt = 0

          const dispatchMeta = (specs: HoverHighlightSpec[] | null) => {
            try {
              if (!editorView.dom.isConnected)
                return
              editorView.dispatch(
                editorView.state.tr.setMeta(hoverContextHighlightKey, specs),
              )
            }
            catch {
              /** view 已销毁 */
            }
          }

          const clear = () => {
            dispatchMeta(null)
          }

          const syncFromClientPoint = (clientX: number, clientY: number) => {
            if (!editorView.dom.isConnected)
              return
            const rect = dom.getBoundingClientRect()
            const inside
              = clientX >= rect.left
                && clientX <= rect.right
                && clientY >= rect.top
                && clientY <= rect.bottom
            if (!inside) {
              clear()
              return
            }
            if (isDragging && opts.disableOnDrag) {
              clear()
              return
            }
            if (opts.disableOnSelection) {
              const { from, to } = editorView.state.selection
              if (from !== to) {
                clear()
                return
              }
            }
            const now = performance.now()
            if (now - lastThrottleAt < opts.throttleMs)
              return
            lastThrottleAt = now

            const content = getHoverContentFromViewCoords(
              editorView,
              { left: clientX, top: clientY },
              opts.hoverContentOptions,
            )
            const specs = getHoverHighlightSpecs(content, editorView.state.doc)
            dispatchMeta(specs.length > 0
              ? specs
              : null)
          }

          const onMouseMove = (e: MouseEvent) => {
            syncFromClientPoint(e.clientX, e.clientY)
          }

          const onMouseLeave = () => {
            clear()
          }

          const onDocumentMouseOut = (event: MouseEvent) => {
            if (!pointerExitedDocument(event))
              return
            clear()
          }

          const onDragStart = () => {
            isDragging = true
            if (opts.disableOnDrag)
              clear()
          }

          const onDragEnd = () => {
            isDragging = false
          }

          dom.addEventListener('mousemove', onMouseMove)
          dom.addEventListener('mouseleave', onMouseLeave)
          document.addEventListener('mouseout', onDocumentMouseOut)
          document.addEventListener('dragstart', onDragStart)
          document.addEventListener('dragend', onDragEnd)

          return {
            destroy() {
              dom.removeEventListener('mousemove', onMouseMove)
              dom.removeEventListener('mouseleave', onMouseLeave)
              document.removeEventListener('mouseout', onDocumentMouseOut)
              document.removeEventListener('dragstart', onDragStart)
              document.removeEventListener('dragend', onDragEnd)
              clear()
            },
          }
        },
      }),
    ]
  },

  addCommands() {
    return {
      setHoverContextHighlight:
        (specs: HoverHighlightSpec[] | null) => ({ tr, dispatch }) => {
          tr.setMeta(hoverContextHighlightKey, specs)
          if (dispatch)
            dispatch(tr)
          return true
        },
    }
  },
})

function pointerExitedDocument(event: MouseEvent): boolean {
  const rel = event.relatedTarget
  if (rel == null)
    return true
  return !(rel instanceof Node && document.documentElement.contains(rel))
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    hoverContextHighlight: {
      /**
       * 设置 hover 探测用的临时背景高亮；传 null 清除
       */
      setHoverContextHighlight: (specs: HoverHighlightSpec[] | null) => ReturnType
    }
  }
}

export type HoverContextHighlightOptions = {
  /**
   * 是否在编辑器 DOM 上自动根据指针同步高亮
   * @default true
   */
  autoSyncOnPointer: boolean
  /** 同步高亮节流间隔（ms） */
  throttleMs: number
  /** 传给 getHoverContentFromViewCoords 的选项 */
  hoverContentOptions: GetHoverContentOptions
  /** 拖拽时是否清除高亮 */
  disableOnDrag: boolean
  /** 有选区时是否清除高亮 */
  disableOnSelection: boolean
}
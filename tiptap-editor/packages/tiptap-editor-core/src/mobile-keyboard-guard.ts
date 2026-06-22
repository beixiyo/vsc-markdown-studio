import type { EditorView } from '@tiptap/pm/view'
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

/**
 * 移动端「非文本交互」键盘守卫
 *
 * 点击编辑器内的非文本可交互元素时，移动端 WebView 会因 contenteditable 被聚焦而弹出软键盘
 * （甚至把可编辑根滚动到顶部）。本扩展按元素类型分别处置，且两条路径互不影响：
 *
 * 1. **任务项 checkbox**（`@tiptap/extension-list` TaskItem）
 *    上游在 `change` 回调里执行 `chain().focus().setNodeMarkup()`，那个 `focus()` 是弹键盘 / 跳滚根源
 *    捕获阶段拦 `change`、`stopImmediatePropagation` 掐掉上游回调，改为自己 `setNodeMarkup` 切换勾选——
 *    **全程不 focus**，故既不弹键盘也不跳滚
 *
 * 2. **图片等 atom 节点**（如 tiptap-nodes 的 image，DOM 带 `data-image-node`）
 *    点击会被 ProseMirror 转为 NodeSelection 并聚焦编辑器（选中态 Native 需要，不能去焦点）
 *    在聚焦发生前（捕获 `pointerdown` / `touchstart`）把可编辑根置 `inputmode="none"`，
 *    使这次聚焦不唤起键盘；点回正文时恢复 `''`，文本编辑照常弹键盘
 *
 * `inputmode="none"` 对 contenteditable 在 WebView Android 66+ / WebView iOS 12.2+ 均生效
 */
export const MobileKeyboardGuard = Extension.create<MobileKeyboardGuardOptions>({
  name: 'mobileKeyboardGuard',

  addOptions() {
    return { enabled: true }
  },

  addProseMirrorPlugins() {
    if (!this.options.enabled)
      return []

    const editor = this.editor

    return [
      new Plugin({
        key: new PluginKey('mobileKeyboardGuard'),
        view(view) {
          const dom = view.dom as HTMLElement

          /** checkbox：拦 change，无焦点切换勾选 */
          const onChange = (event: Event) => {
            const input = event.target
            if (!isTaskCheckbox(input))
              return

            /** 掐掉 TaskItem 自带的 change → chain().focus().setNodeMarkup() */
            event.stopImmediatePropagation()

            const checked = input.checked

            /** 只读：还原勾选、交还默认语义（与上游一致） */
            if (!editor.isEditable) {
              input.checked = !checked
              return
            }

            const pos = taskItemPos(view, input)
            if (pos == null) {
              /** 定位失败则回滚视觉态，避免与文档 desync */
              input.checked = !checked
              return
            }

            const node = view.state.doc.nodeAt(pos)
            /** 不 .scrollIntoView()、不 focus —— 这是不弹键盘 / 不跳滚的关键 */
            view.dispatch(view.state.tr.setNodeMarkup(pos, undefined, {
              ...node?.attrs,
              checked,
            }))
          }

          /** image 等 atom：聚焦前置 inputmode=none 压键盘；点正文恢复 */
          const onPointerDown = (event: Event) => {
            dom.inputMode = isInteractiveAtom(event.target)
              ? 'none'
              : ''
          }

          /** 捕获阶段：早于节点自身处理与随后的聚焦 */
          dom.addEventListener('change', onChange, true)
          dom.addEventListener('pointerdown', onPointerDown, true)
          dom.addEventListener('touchstart', onPointerDown, true)

          return {
            destroy() {
              dom.removeEventListener('change', onChange, true)
              dom.removeEventListener('pointerdown', onPointerDown, true)
              dom.removeEventListener('touchstart', onPointerDown, true)
            },
          }
        },
      }),
    ]
  },
})

/** 事件目标是否为任务项 checkbox（nodeView 结构：label > [input[checkbox], span]） */
function isTaskCheckbox(target: EventTarget | null): target is HTMLInputElement {
  if (!(target instanceof HTMLInputElement) || target.type !== 'checkbox')
    return false
  const label = target.closest('label')
  return !!label && label.contains(target)
}

/**
 * 事件目标是否落在「非文本 atom 节点」上（当前覆盖 image，DOM 标记 `data-image-node`）
 *
 * 新增其他需要压键盘的 atom 节点时，给其 nodeView DOM 打同类标记并在此扩展选择器即可
 */
function isInteractiveAtom(target: EventTarget | null): boolean {
  const el = target instanceof Element
    ? target
    : null
  return !!el?.closest('[data-image-node]')
}

/**
 * 由 checkbox 反查其所属 taskItem 节点的文档位置
 *
 * checkbox 在 `li`（taskItem nodeView 的根 DOM）内，用 `posAtDOM(li)` 落到节点内部再
 * 上溯到 taskItem，取其 `before` 位置用于 setNodeMarkup
 */
function taskItemPos(view: EditorView, input: HTMLInputElement): number | null {
  const li = input.closest('li')
  if (!li)
    return null

  try {
    const inner = view.posAtDOM(li, 0)
    const $pos = view.state.doc.resolve(inner)
    for (let depth = $pos.depth; depth > 0; depth--) {
      if ($pos.node(depth).type.name === 'taskItem')
        return $pos.before(depth)
    }
  }
  catch {
    return null
  }
  return null
}

/** MobileKeyboardGuard 扩展配置 */
export type MobileKeyboardGuardOptions = {
  /**
   * 是否启用
   * @default true
   */
  enabled: boolean
}

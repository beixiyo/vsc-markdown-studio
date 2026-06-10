/**
 * 区域编辑预览装饰层
 *
 * 独立 PluginKey，与选区 AI 的预览装饰互不干扰；
 * DecorationSet 经 mapping 自动跟随文档变化，预览范围无需手动维护
 */

import type { Editor } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { AI_META } from '../constants'

export const REGION_DECORATION_KEY = new PluginKey<DecorationSet>('region-edit-decoration')

/**
 * 创建装饰插件（由 RegionEdit 扩展注册）
 */
export function createRegionEditDecorationPlugin() {
  return new Plugin<DecorationSet>({
    key: REGION_DECORATION_KEY,
    state: {
      init: () => DecorationSet.empty,
      apply: (tr, set) => {
        const meta = tr.getMeta(REGION_DECORATION_KEY)
        if (meta !== undefined) {
          return meta
        }
        return set.map(tr.mapping, tr.doc)
      },
    },
    props: {
      decorations: state => REGION_DECORATION_KEY.getState(state),
    },
  })
}

export type DecoRange = { from: number, to: number }

/**
 * 设置预览装饰（覆盖式）
 */
export function setRegionDecorations(editor: Editor, ranges: DecoRange[], className: string) {
  if (!editor || editor.isDestroyed)
    return

  const decorations = ranges
    .filter(range => range.from >= 0 && range.to > range.from)
    .map(range => Decoration.inline(range.from, range.to, { class: className }))

  const tr = editor.state.tr
    .setMeta(REGION_DECORATION_KEY, DecorationSet.create(editor.state.doc, decorations))
    .setMeta(AI_META.INTERNAL, true)
  editor.view.dispatch(tr)
}

/**
 * 清空预览装饰
 */
export function clearRegionDecorations(editor: Editor) {
  if (!editor || editor.isDestroyed)
    return

  const tr = editor.state.tr
    .setMeta(REGION_DECORATION_KEY, DecorationSet.empty)
    .setMeta(AI_META.INTERNAL, true)
  editor.view.dispatch(tr)
}

/**
 * 读取当前装饰范围（已随文档变化自动 remap）
 */
export function getRegionDecorationRanges(editor: Editor): DecoRange[] {
  const set = REGION_DECORATION_KEY.getState(editor.state)
  if (!set || set === DecorationSet.empty)
    return []

  return set.find().map(deco => ({ from: deco.from, to: deco.to }))
}

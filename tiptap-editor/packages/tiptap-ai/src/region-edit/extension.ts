import { Extension } from '@tiptap/core'
import { createRegionEditDecorationPlugin } from './decorations'

/**
 * 区域编辑扩展：注册预览装饰插件
 *
 * 与选区 AI 的 `AI` 扩展相互独立，可同时启用
 */
export const RegionEdit = Extension.create({
  name: 'regionEdit',

  addProseMirrorPlugins() {
    return [createRegionEditDecorationPlugin()]
  },
})

import type { RegionEditExtensionOptions } from './types'
import { Extension } from '@tiptap/core'
import { createRegionEditDecorationPlugin } from './decorations'
import { createRegionLoadingFramePlugin } from './loading-frame'

/**
 * 区域编辑扩展：注册预览装饰插件
 *
 * 与选区 AI 的 `AI` 扩展相互独立，可同时启用
 */
export const RegionEdit = Extension.create<RegionEditExtensionOptions>({
  name: 'regionEdit',

  addOptions() {
    return { loadingFrameClasses: {} }
  },

  addProseMirrorPlugins() {
    return [
      createRegionEditDecorationPlugin(),
      createRegionLoadingFramePlugin(this.options.loadingFrameClasses),
    ]
  },
})

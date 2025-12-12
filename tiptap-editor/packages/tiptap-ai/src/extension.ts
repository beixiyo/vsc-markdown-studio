import { Extension } from '@tiptap/core'
import { createAIPreviewDecorationPlugin } from './TiptapEditorBridge'

/**
 * AI 预览装饰扩展
 * 用于在编辑器中显示 AI 预览的高亮装饰
 */
export const AI = Extension.create({
  name: 'ai',

  addProseMirrorPlugins() {
    return [createAIPreviewDecorationPlugin()]
  },
})

/**
 * 用于将 markdown-operate 的能力通过全局 MDBridge 暴露给 webview
 * 扩展了 speaker 和 gradient-styles 的能力
 */
import type { BlockNoteEditor } from '@blocknote/core'
import type { GradientStyleType } from 'custom-blocknote-gradient-styles'
import { setContentWithSpeakers as speakerSetContentWithSpeakers, setSpeakers as speakerSetSpeakers } from 'custom-blocknote-speaker'
import { useEffect } from 'react'
import { createMarkdownOperate } from 'markdown-operate'
import type { MDBridge } from '../types/MDBridge'
import { appendElements, insertAtBottom, insertAtTop, parseImagesToBlocks } from './imageUtils'
import { notifyNative } from 'notify'

/**
 * 创建命令对象
 * 从 markdown-operate 继承基础命令，并添加扩展（渐变样式相关命令）
 */
function createCommands(editor: BlockNoteEditor<any, any, any>): MDBridge['command'] {
  const base = createMarkdownOperate(editor)
  const baseCommand = base.command

  return {
    ...baseCommand,
    setGradient: (type: GradientStyleType) => {
      editor.addStyles({ gradient: type } as any)
    },
    unsetGradient: () => {
      const curStyle = editor.getActiveStyles()
      // 只移除 gradient 样式
      if (curStyle.gradient) {
        editor.removeStyles({ gradient: curStyle.gradient } as any)
      }
    },
  }
}

/**
 * 初始化并注入 MDBridge 到全局 window 上
 */
export function useSetupMDBridge(
  editor: BlockNoteEditor<any, any, any> | null,
) {
  useEffect(() => {
    if (!editor)
      return

    const base = createMarkdownOperate(editor)

    const bridge: MDBridge = {
      ...base,
      // Image operations
      setImagesWithURL: async (imageUrls: string[]) => {
        const urls = Array.isArray(imageUrls) ? imageUrls : []
        const blocks = parseImagesToBlocks(urls)
        await appendElements(editor, blocks)
      },
      setFooterImagesWithURL: async (imageUrls: string[]) => {
        const urls = Array.isArray(imageUrls) ? imageUrls : []
        const blocks = parseImagesToBlocks(urls)
        await insertAtBottom(editor, blocks)
      },
      setHeaderImagesWithURL: async (imageUrls: string[]) => {
        const urls = Array.isArray(imageUrls) ? imageUrls : []
        const blocks = parseImagesToBlocks(urls)
        await insertAtTop(editor, blocks)
      },
      // Speaker operations
      setSpeakers: async speakers => speakerSetSpeakers(editor, speakers),
      setContentWithSpeakers: async data => speakerSetContentWithSpeakers(editor, data.content || '', data.speakers),
      // Commands
      command: createCommands(editor),
    }

    if (typeof window !== 'undefined') {
      window.MDBridge = bridge
    }
    notifyNative('mdBridgeReady')
  }, [editor])
}



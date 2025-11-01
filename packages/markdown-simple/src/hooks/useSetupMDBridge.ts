/**
 * 用于将 markdown-operate 的能力通过全局 MDBridge 暴露给 webview
 * 只暴露 markdown-operate 提供的方法，方便原生侧调用
 */
import type { BlockNoteEditor } from '@blocknote/core'
import { useEffect } from 'react'
import { createMarkdownOperate } from 'markdown-operate'
import type { MDBridge } from '../types/MDBridge'

/**
 * 初始化并注入 MDBridge 到全局 window 上
 */
export function useSetupMDBridge(
  editor: BlockNoteEditor<any, any, any> | null,
) {
  useEffect(() => {
    if (!editor)
      return

    const bridge: MDBridge = createMarkdownOperate(editor)

    if (typeof window !== 'undefined') {
      window.MDBridge = bridge
    }
  }, [editor])
}



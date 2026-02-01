/**
 * 将 tiptap-api 的能力通过全局 MDBridge 暴露给 webview
 * 与 packages/markdown-mobile 的 MDBridge 契约兼容
 */
import type { Editor } from '@tiptap/core'
import { useEffect } from 'react'
import { createMarkdownOperate } from 'tiptap-api'
import type { MDBridge, SpeakerType } from '../types/MDBridge'
import { notifyNative } from 'notify'

function createCommands(editor: Editor | null): MDBridge['command'] {
  const base = createMarkdownOperate(editor)
  const baseCommand = base.command
  return {
    ...baseCommand,
    // 渐变：待 tiptap 渐变扩展实现，见 MISSING_IMPLEMENTATIONS.md
    setGradient: (_type: string) => {},
    unsetGradient: () => {},
  }
}

/**
 * 在当前光标位置插入图片节点（tiptap Image 扩展）
 */
function insertImagesAtPosition(editor: Editor | null, imageUrls: string[], position: 'cursor' | 'start' | 'end'): Promise<void> {
  if (!editor || !imageUrls.length)
    return Promise.resolve()
  const urls = Array.isArray(imageUrls) ? imageUrls : []
  const nodes = urls.map(src => ({ type: 'image', attrs: { src } }))
  let pos: number
  if (position === 'cursor') {
    pos = editor.state.selection.from
  }
  else if (position === 'start') {
    pos = 1
  }
  else {
    pos = editor.state.doc.content.size
  }
  editor.chain().focus().insertContentAt(pos, nodes).run()
  return Promise.resolve()
}

/**
 * 设置说话人列表 / 内容+说话人：待基于 SpeakerNode 实现，见 MISSING_IMPLEMENTATIONS.md
 */
async function setSpeakersStub(_editor: Editor | null, _speakers: SpeakerType[]): Promise<void> {}
async function setContentWithSpeakersStub(_editor: Editor | null, _data: { content: string, speakers: SpeakerType[] }): Promise<void> {}

/**
 * 初始化并注入 MDBridge 到全局 window 上
 */
export function useSetupMDBridge(editor: Editor | null) {
  useEffect(() => {
    if (!editor)
      return

    const base = createMarkdownOperate(editor)

    const bridge: MDBridge = {
      ...base,
      setImagesWithURL: imageUrls => insertImagesAtPosition(editor, imageUrls, 'cursor'),
      setFooterImagesWithURL: imageUrls => insertImagesAtPosition(editor, imageUrls, 'end'),
      setHeaderImagesWithURL: imageUrls => insertImagesAtPosition(editor, imageUrls, 'start'),
      setSpeakers: speakers => setSpeakersStub(editor, speakers),
      setContentWithSpeakers: data => setContentWithSpeakersStub(editor, data),
      command: createCommands(editor),
    }

    if (typeof window !== 'undefined') {
      window.MDBridge = bridge
    }
    notifyNative('mdBridgeReady')
  }, [editor])
}

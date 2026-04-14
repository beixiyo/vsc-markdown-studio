import type { Editor } from '@tiptap/core'
import type { SpeakerAttributes } from 'tiptap-nodes/speaker'
import type { MDBridge } from '../types/MDBridge'
import { notifyNative } from 'notify'
import { useEffect } from 'react'
import { createTiptapOperate } from '../operate/create'
import { appendAtCursor, insertAtBottom, insertAtTop } from '../operate/image'

/**
 * 注入 `window.MDBridge` 并派发 `mdBridgeReady`
 * @param editor tiptap 编辑器实例
 * @param setSpeakerMap 更新 Speaker 节点配置的回调
 */
export function useSetupMDBridge(
  editor: Editor | null,
  setSpeakerMap: (map: Record<string, { name: string, id?: string, label?: string }>) => void,
) {
  useEffect(() => {
    if (!editor)
      return

    const base = createTiptapOperate(editor)

    const bridge: MDBridge = {
      ...base,
      _editor: editor,
      setImagesWithURL: urls => appendAtCursor(editor, Array.isArray(urls)
        ? urls
        : []),
      setHeaderImagesWithURL: urls => insertAtTop(editor, Array.isArray(urls)
        ? urls
        : []),
      setFooterImagesWithURL: urls => insertAtBottom(editor, Array.isArray(urls)
        ? urls
        : []),
      setSpeakers: async (speakers: SpeakerAttributes[]) => {
        setSpeakerMap(buildSpeakerMap(speakers))
      },
      setContentWithSpeakers: async ({ content, speakers }) => {
        setSpeakerMap(buildSpeakerMap(speakers || []))
        editor.commands.setContent(content || '')
      },
    }

    window.MDBridge = bridge
    notifyNative('mdBridgeReady')
  }, [editor, setSpeakerMap])
}

function buildSpeakerMap(speakers: SpeakerAttributes[]) {
  const map: Record<string, { name: string, id?: string, label?: string }> = {}
  for (const s of speakers) {
    if (!s || s.originalLabel == null)
      continue
    map[String(s.originalLabel)] = {
      name: s.name ?? '',
      id: s.id,
      label: s.label,
    }
  }
  return map
}

import type { Editor } from '@tiptap/core'
import type { RefObject } from 'react'
import type { MDBridge } from '../types/MDBridge'
import type { SpeakerType } from '../types/Speaker'
import { notifyNative } from 'notify'
import { useEffect } from 'react'
import { preprocessSpeakerTags } from 'tiptap-nodes/speaker'
import { createTiptapOperate } from '../operate/create'
import { getImageAttrsById, removeImageById, setImage, updateImageById } from '../operate/image'
import { speakersToMap } from '../speaker'

type SpeakerMap = Record<string, { name: string, id?: string, label?: string }>

/**
 * 遍历文档，把 `map` 里的名称直接写进每个 speaker 节点的 attrs
 *
 * 原因：tiptap v3 里 `extension.options` 是 getter（每次返回新对象），
 * 没办法在运行时更新 `SpeakerNode` 的 `speakerMap` 配置。
 * 改用"在节点 attrs 上直接落值"——`SpeakerNode.resolveDisplayText`
 * 本身会优先用 `attrs.name`，所以渲染天然生效。
 */
/**
 * 递归走遍 JSON 文档，把 `map` 里的名称写到每个 speaker 节点的 attrs
 */
function injectSpeakerNamesInJSON(node: any, map: SpeakerMap): any {
  if (!node || typeof node !== 'object')
    return node
  const next: any = { ...node }
  if (next.type === 'speaker') {
    const key = String(next.attrs?.originalLabel ?? '')
    const entry = map[key]
    if (entry) {
      next.attrs = {
        ...(next.attrs || {}),
        name: entry.name,
        id: entry.id ?? next.attrs?.id ?? null,
        label: entry.label ?? next.attrs?.label ?? null,
      }
    }
  }
  if (Array.isArray(next.content))
    next.content = next.content.map((c: any) => injectSpeakerNamesInJSON(c, map))
  if (Array.isArray(next.marks))
    next.marks = next.marks.map((m: any) => injectSpeakerNamesInJSON(m, map))
  return next
}

/**
 * 用 markdown 填充内容，然后把 speakers 名称写回到节点 attrs
 * 必须"setContent → 取 JSON → 改 JSON → setContent"才能让新 NodeView 用到新 attrs
 * （tiptap v3 的 NodeView `update()` 在 atom 节点仅 attrs 改变时不会重绘 DOM）
 */
function setMarkdownWithSpeakers(editor: Editor, markdown: string, map: SpeakerMap) {
  editor.commands.setContent(preprocessSpeakerTags(markdown), { contentType: 'markdown' })
  if (Object.keys(map).length === 0)
    return
  const json = editor.getJSON()
  const patched = injectSpeakerNamesInJSON(json, map)
  editor.commands.setContent(patched)
}

/**
 * 注入 `window.MDBridge` 并派发 `mdBridgeReady`
 * @param editor tiptap 编辑器实例
 * @param editorElRef 编辑器容器 DOM 引用，用于 `setBottomMargin` 写入 padding
 */
export function useSetupMDBridge(
  editor: Editor | null,
  editorElRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!editor)
      return

    const base = createTiptapOperate(editor)

    const bridge: MDBridge = {
      ...base,
      _editor: editor,
      setImage: payload => setImage(editor, payload),
      updateImage: ({ id, attrs }) => updateImageById(editor, id, attrs),
      removeImage: ({ id }) => removeImageById(editor, id),
      getImageAttrs: id => getImageAttrsById(editor, id),

      /** 写入容器 paddingBottom；非有限数视为 0 */
      setBottomMargin: (px: number) => {
        const el = editorElRef.current
        if (!el)
          return
        const v = Number.isFinite(px)
          ? Math.max(0, Number(px))
          : 0
        el.style.paddingBottom = `${v}px`
      },

      /**
       * 对齐老版语义：
       * 1. 重新解析当前 markdown（把纯文本 `[speaker:X]` 变成节点）
       * 2. 把 speakers 的 name/id/label 写回到节点 attrs
       */
      setSpeakers: async (speakers: SpeakerType[]) => {
        const map = speakersToMap(Array.isArray(speakers)
          ? speakers
          : [])
        const storage = (editor.storage as any)?.markdown
        const md: string = storage?.getMarkdown?.() ?? ''
        setMarkdownWithSpeakers(editor, md, map)
      },

      setContentWithSpeakers: async ({ content, speakers }) => {
        const map = speakersToMap(Array.isArray(speakers)
          ? speakers
          : [])
        setMarkdownWithSpeakers(editor, content || '', map)
      },
    }

    window.MDBridge = bridge
    notifyNative('mdBridgeReady')
  }, [editor, editorElRef])
}

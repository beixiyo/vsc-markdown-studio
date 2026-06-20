import type { Editor } from '@tiptap/core'
import type { RefObject } from 'react'
import type { MDBridge, TypographyConfig } from '../types/MDBridge'
import { notifyNative } from 'notify'
import { useEffect } from 'react'
import { createRegionEdit } from 'tiptap-region'
import { createTiptapOperate } from '../operate/create'
import { getImageAttrsById, removeImageById, setImage, updateImageById } from '../operate/image'

const TYPOGRAPHY_SELECTOR: Record<string, string> = {
  heading1: '.tiptap.ProseMirror h1',
  heading2: '.tiptap.ProseMirror h2',
  heading3: '.tiptap.ProseMirror h3',
  heading4: '.tiptap.ProseMirror h4',
  heading5: '.tiptap.ProseMirror h5',
  heading6: '.tiptap.ProseMirror h6',
  paragraph: '.tiptap.ProseMirror p',
  code: '.tiptap.ProseMirror pre',
  inlineCode: '.tiptap.ProseMirror code',
  blockquote: '.tiptap.ProseMirror blockquote',
  list: '.tiptap.ProseMirror li',
}

const TYPOGRAPHY_STYLE_ID = 'md-typography-override'

function camelToKebab(s: string): string {
  return s.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)
}

function applyTypography(config: TypographyConfig) {
  let el = document.getElementById(TYPOGRAPHY_STYLE_ID) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = TYPOGRAPHY_STYLE_ID
    document.head.appendChild(el)
  }

  const rules: string[] = []
  for (const [key, styles] of Object.entries(config)) {
    const selector = TYPOGRAPHY_SELECTOR[key]
    if (!selector || !styles)
      continue
    const props = Object.entries(styles)
      .filter(([, v]) => v != null)
      .map(([prop, val]) => `${camelToKebab(prop)}: ${val} !important`)
      .join('; ')
    if (props)
      rules.push(`${selector} { ${props} }`)
  }

  el.textContent = rules.join('\n')
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

    /**
     * AI 区域编辑控制器：状态与冲突经 notify 上报原生
     *
     * 同时门控块级增量同步：preview/streaming 期间会把未采纳的内容临时写进 doc，
     * 暂停 blockSync 避免脏中间态被推后端；回到 idle（accept 落盘 / reject 还原）再恢复，
     * 此时 blockSync 只会同步「已采纳的最终状态」。`window.MDBridge.sync` 由 useBlockSyncBridge
     * 在本 hook 之后注入，运行时状态变更触发时它已就绪
     */
    const regionEdit = createRegionEdit(editor, {
      onStateChange: (state) => {
        notifyNative('aiEditStateChanged', { state })
        if (state === 'idle')
          window.MDBridge?.sync?.resume()
        else
          window.MDBridge?.sync?.pause()
      },
      onConflict: info => notifyNative('aiEditConflict', info),
    })

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

      setTextDirection: (direction: 'ltr' | 'rtl' | 'auto') => {
        editor.setOptions({ textDirection: direction })
        document.documentElement.setAttribute('dir', direction === 'auto'
          ? ''
          : direction)
      },

      setTypography: (config: TypographyConfig) => applyTypography(config),

      aiEdit: {
        readBlocks: options => regionEdit.readBlocks(options),
        applyOperations: payload => regionEdit.applyOperations(payload),
        beginStream: payload => regionEdit.beginStream(payload),
        pushChunk: (streamId, delta) => regionEdit.pushChunk(streamId, delta),
        endStream: streamId => regionEdit.endStream(streamId),
        accept: () => regionEdit.accept(),
        reject: () => regionEdit.reject(),
        getState: () => regionEdit.getState(),
      },
    }

    window.MDBridge = bridge
    notifyNative('mdBridgeReady')

    return () => {
      regionEdit.destroy()
    }
  }, [editor, editorElRef])
}

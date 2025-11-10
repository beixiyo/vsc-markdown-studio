import type { BlockNoteEditor } from '@blocknote/core'
import { debounce } from '@jl-org/tool'
import { notifyNative } from 'notify'
import { type RefObject, useEffect, useRef } from 'react'
import { getMarkdownWithEmptyLines } from 'markdown-operate'

function useNotifyFn(
  editor: BlockNoteEditor<any, any, any> | null
) {
  // ======================
  // * Fns
  // ======================
  const notifyBlockTypeChanged = () => {
    if (!editor)
      return

    const currentCursorPosition = editor.getTextCursorPosition()
    const block = currentCursorPosition.block
    const type = block.type
    let typeString = ''
    if (type === 'heading') {
      const level = block.props.level
      typeString = `h${level}`
    }
    else {
      if (type === 'bulletListItem') {
        typeString = 'unordered_list'
      }
      else if (type === 'numberedListItem') {
        typeString = 'ordered_list'
      }
      else if (type === 'checkListItem') {
        typeString = 'check_list'
      }
      else {
        typeString = type
      }
    }

    notifyNative('blockTypeChanged', typeString)
  }

  const notifyContentChanged = () => {
    if (!editor)
      return

    // 使用提取的函数获取处理后的 markdown（保留多个空行）
    let markdown = getMarkdownWithEmptyLines(editor)

    // 移除图片标记
    const noImgMarkdown = markdown.replace(/\[BlockNote image\]\(https?:\/\/\S{1,999}\)/g, '')

    notifyNative('contentChanged', noImgMarkdown)
    console.log('contentChanged\n', noImgMarkdown)
  }

  const notifyLabelClicked = (data: { blockId: string, label: string }) => {
    notifyNative('labelClicked', data)
  }

  return {
    notifyBlockTypeChanged,
    notifyContentChanged,
    notifyLabelClicked,
  }
}

export function useNotifyChnage(
  editor: BlockNoteEditor<any, any, any> | null,
  editorElRef: RefObject<HTMLDivElement | null>
) {
  const { notifyBlockTypeChanged, notifyContentChanged } = useNotifyFn(editor)

  // 监听内容变化
  useEffect(
    () => {
      if (!editor) return

      const sendChange = debounce(() => {
        notifyContentChanged()
        notifyBlockTypeChanged()
      })

      const unsubscribe = editor.onChange(sendChange)

      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe()
        }
      }
    },
    [editor, notifyBlockTypeChanged, notifyContentChanged]
  )

  // 监听块类型变化（选择变化时）
  useEffect(() => {
    if (!editor) return

    const unsubscribe = editor.onSelectionChange(() => {
      notifyBlockTypeChanged()
    })

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [editor, notifyBlockTypeChanged])

  // 监听高度变化
  const lastHeightRef = useRef<number>(0)
  useEffect(() => {
    if (!editorElRef.current) return

    const ob = new ResizeObserver(() => {
      const height = editorElRef.current?.clientHeight ?? 0
      if (height !== lastHeightRef.current) {
        notifyNative('heightChanged', height)
        lastHeightRef.current = height

        console.log('高度变化', lastHeightRef.current)
      }
    })
    ob.observe(editorElRef.current)

    return () => {
      ob.disconnect()
    }
  }, [editorElRef])
}
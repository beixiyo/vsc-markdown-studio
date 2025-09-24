import type { Block, BlockNoteEditor, PartialBlock } from '@blocknote/core'

/**
 * 悬浮块监听
 * @param editor 编辑器
 * @param callback 回调函数，回调字符串类型 Markdown 内容
 */
export function useHoverSection(
  editor: BlockNoteEditor<any, any, any>,
  callback?: (markdown: string) => void,
) {
  const lastHeading = useRef<Block<any, any, any> | null>(null)

  useEffect(
    () => {
      MDBridge.onBlockHover((block) => {
        if (!block?.id) {
          return
        }

        const data = MDBridge.groupBlockByHeading(editor, block.id)
        if (!data.heading) {
          return
        }

        if (data.heading === lastHeading.current) {
          console.warn('一样的，跳过')
          return
        }

        lastHeading.current = data.heading

        callback?.(MDBridge.getMarkdown([
          data.heading as PartialBlock<any, any, any>,
          ...data.blocks,
        ]))
      })
    },
    [],
  )
}

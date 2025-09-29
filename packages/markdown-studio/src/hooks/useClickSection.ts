import type { BlockNoteEditor } from '@blocknote/core'
import type { AnyBlock, SelectionContext } from '@/types/MDBridge'
import { GlobalBridgeManager } from './useSetupMDBridge/GlobalBridgeManager'
import { createSelectionContexts } from './useSetupMDBridge/selectionContext'

/**
 * 点击块监听
 * @param editor 编辑器
 * @param callback 回调函数，回调字符串类型 Markdown 内容
 */
export function useClickSection(
  editor: BlockNoteEditor<any, any, any>,
  callback?: (markdown: string) => void,
) {
  const lastHeading = useRef<AnyBlock | null>(null)

  useEffect(
    () => {
      const unsubscribe = MDBridge.onBlockClick((block) => {
        if (!block?.id) {
          return
        }

        const contexts = createSelectionContexts(editor, block.id, ['headingSection', 'block'])
        const headingContext = contexts.find(item => item.mode === 'headingSection')
        const blockContext = contexts.find(item => item.mode === 'block')

        const normalizedHeadingContext: SelectionContext = headingContext || {
          mode: 'headingSection',
          section: null,
          block: null,
          markdown: '',
        }

        const normalizedBlockContext: SelectionContext = blockContext || {
          mode: 'block',
          section: null,
          block: null,
          markdown: '',
        }

        if (!normalizedHeadingContext.section?.heading) {
          lastHeading.current = null
        }

        const contextsToDispatch: SelectionContext[] = [
          normalizedHeadingContext,
          normalizedBlockContext,
        ]

        GlobalBridgeManager.getInstance().setSelectionContexts(contextsToDispatch)

        if (!normalizedHeadingContext.section?.heading) {
          return
        }

        if (normalizedHeadingContext.section.heading === lastHeading.current) {
          return
        }

        lastHeading.current = normalizedHeadingContext.section.heading
        callback?.(normalizedHeadingContext.markdown)
      })

      return unsubscribe
    },
    [],
  )
}

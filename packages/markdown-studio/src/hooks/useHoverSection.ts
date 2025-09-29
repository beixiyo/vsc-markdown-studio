import type { BlockNoteEditor } from '@blocknote/core'
import type { AnyBlock } from '@/types/MDBridge'
import { GlobalBridgeManager } from './useSetupMDBridge/GlobalBridgeManager'
import { createSelectionContexts } from './useSetupMDBridge/selectionContext'

/**
 * 悬浮块监听
 * @param editor 编辑器
 * @param callback 回调函数，回调字符串类型 Markdown 内容
 */
export function useHoverSection(
  editor: BlockNoteEditor<any, any, any>,
  callback?: (markdown: string) => void,
) {
  const lastHeading = useRef<AnyBlock | null>(null)

  useEffect(
    () => {
      const unsubscribe = MDBridge.onBlockHover((block) => {
        if (!block?.id) {
          return
        }

        const contexts = createSelectionContexts(editor, block.id, ['headingSection'])
        const headingContext = contexts.find(item => item.mode === 'headingSection')

        const normalizedHeadingContext = headingContext || {
          mode: 'headingSection',
          section: null,
          block: null,
          markdown: '',
        }

        GlobalBridgeManager.getInstance().setSelectionContexts([normalizedHeadingContext])

        if (!normalizedHeadingContext.section?.heading) {
          lastHeading.current = null
          return
        }

        if (normalizedHeadingContext.section.heading === lastHeading.current) {
          console.warn('一样的，跳过')
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

/**
 * - **文件作用**: 监听块悬浮事件，基于 `createSelectionContexts` 生成 headingSection 上下文，写入 `GlobalBridgeManager`，并按需回调 markdown
 * - **一句话概括**: 悬浮块时同步分发选区上下文并回调
 * - **被谁使用**: `components/Editor/Document.tsx`、测试 `src/test/block-hover.test.ts`、`src/hooks/index.ts` 再导出
 */
import type { BlockNoteEditor } from '@blocknote/core'
import { createSelectionContexts, ensureContexts, getHeadingFromContexts } from 'markdown-operate'
import { GlobalBridgeManager } from './useSetupMDBridge/GlobalBridgeManager'

/**
 * 悬浮块监听
 * @param editor 编辑器
 * @param callback 回调函数，回调字符串类型 Markdown 内容
 */
export function useHoverSection(
  editor: BlockNoteEditor<any, any, any>,
  callback?: (markdown: string) => void,
) {
  const lastHeading = useRef<ReturnType<typeof getHeadingFromContexts>>(null)

  useEffect(
    () => {
      const unsubscribe = MDBridge.onBlockHover((block) => {
        if (!block?.id) {
          return
        }

        const contexts = createSelectionContexts(editor, block.id, ['headingSection'])
        const ensured = ensureContexts(contexts, ['headingSection'])

        const currentHeading = getHeadingFromContexts(ensured)

        GlobalBridgeManager.getInstance().setSelectionContexts(ensured)

        if (!currentHeading) {
          lastHeading.current = null
          return
        }

        if (currentHeading === lastHeading.current) {
          return
        }

        lastHeading.current = currentHeading
        const headingCtx = ensured[0]
        callback?.(headingCtx.markdown)
      })

      return unsubscribe
    },
    [],
  )
}

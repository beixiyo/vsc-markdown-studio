/**
 * - **文件作用**: 监听块点击事件，基于 `createSelectionContexts` 生成 headingSection 与 block 上下文，写入 `GlobalBridgeManager`，并按需回调 markdown
 * - **一句话概括**: 点击块时同步分发选区上下文并回调
 * - **被谁使用**: `components/Editor/Document.tsx`、测试 `src/test/block-click.test.ts`、`src/hooks/index.ts` 再导出
 */
import type { BlockNoteEditor } from '@blocknote/core'
import { createSelectionContexts, ensureContexts, getHeadingFromContexts } from 'markdown-operate'
import { GlobalBridgeManager } from './useSetupMDBridge/GlobalBridgeManager'

/**
 * 点击块监听
 * @param editor 编辑器
 * @param callback 回调函数，回调字符串类型 Markdown 内容
 */
export function useClickSection(
  editor: BlockNoteEditor<any, any, any>,
  callback?: (markdown: string) => void,
) {
  const lastHeading = useRef<ReturnType<typeof getHeadingFromContexts>>(null)

  useEffect(
    () => {
      const unsubscribe = MDBridge.onBlockClick((block) => {
        if (!block?.id) {
          return
        }

        const contexts = createSelectionContexts(editor, block.id, ['headingSection', 'block'])
        const ensured = ensureContexts(contexts, ['headingSection', 'block'])

        const currentHeading = getHeadingFromContexts(ensured)

        if (!currentHeading) {
          lastHeading.current = null
        }

        GlobalBridgeManager.getInstance().setSelectionContexts(ensured)

        if (!currentHeading) {
          return
        }

        if (currentHeading === lastHeading.current) {
          return
        }

        lastHeading.current = currentHeading
        const headingCtx = ensured.find(item => item.mode === 'headingSection')!
        callback?.(headingCtx.markdown)
      })

      return unsubscribe
    },
    [],
  )
}

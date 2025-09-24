import type { BlockNoteEditor } from '@blocknote/core'
import type { useNotify } from '../useNotify'
import type { BlockIdManager, CallbackManager } from './types'
import type { MDBridge } from '@/types/MDBridge'
import { loadTestTools } from '@/test'
import { createMDBridge } from './bridgeFactory'
import { createEditorChangeHandler, createMouseMoveHandler, createSelectionChangeHandler } from './eventHandlers'

export function useSetupMDBridge(
  editor: BlockNoteEditor<any, any, any> | null,
  notifyFns: ReturnType<typeof useNotify>,
) {
  const bridgeRef = useRef<MDBridge | null>(null)

  useEffect(() => {
    if (!editor)
      return

    if (import.meta.env.DEV) {
      loadTestTools()
    }

    // ======================
    // * Initialize managers
    // ======================
    const blockIdManager: BlockIdManager = {
      headerBlockIds: [],
      bottomBlockIds: [],
    }

    const callbackManager: CallbackManager = {
      onChangeCallbacks: new Set(),
      onSelectionChangeCallbacks: new Set(),
      onBlockHoverCallbacks: new Set(),
    }

    // ======================
    // * Create bridge
    // ======================
    const bridge = createMDBridge(editor, callbackManager, blockIdManager, notifyFns)
    bridgeRef.current = bridge
    window.MDBridge = bridge

    // ======================
    // * Initialize state
    // ======================
    if (!window.__MDBridgeState) {
      window.__MDBridgeState = {}
    }
    window.__MDBridgeState.imageUrls ||= []
    window.__MDBridgeState.headerImageUrls ||= []

    // ======================
    // * Setup event listeners
    // ======================
    const handleMouseMove = createMouseMoveHandler(editor, callbackManager)
    const handleEditorChange = createEditorChangeHandler(callbackManager, notifyFns)
    const handleSelectionChange = createSelectionChangeHandler(callbackManager)

    /** 添加鼠标移动监听器 */
    document.addEventListener('mousemove', handleMouseMove)

    /** 设置编辑器事件监听器 */
    const editorOnChangeUnsubscribe = editor.onChange(handleEditorChange)
    const editorOnSelectionChangeUnsubscribe = editor.onSelectionChange(handleSelectionChange)

    return () => {
      window.MDBridge = null
      bridgeRef.current = null

      /** 清理事件监听器 */
      document.removeEventListener('mousemove', handleMouseMove)
      editorOnChangeUnsubscribe?.()
      editorOnSelectionChangeUnsubscribe?.()

      /** 清理回调集合 */
      callbackManager.onChangeCallbacks.clear()
      callbackManager.onSelectionChangeCallbacks.clear()
      callbackManager.onBlockHoverCallbacks.clear()
    }
  }, [editor])

  return bridgeRef.current
}

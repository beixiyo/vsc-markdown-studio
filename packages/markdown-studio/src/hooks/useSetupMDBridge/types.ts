import type { Block, BlockNoteEditor } from '@blocknote/core'
import type { useNotify } from '../useNotify'

/**
 * MDBridge 回调函数类型定义
 */
export type OnChangeCallback = (editor: BlockNoteEditor) => void
export type OnSelectionChangeCallback = (editor: BlockNoteEditor) => void
export type OnBlockHoverCallback = (block: Block | null) => void
export type OnBlockClickCallback = (block: Block | null) => void

/**
 * 回调管理器类型
 */
export type CallbackManager = {
  onChangeCallbacks: Set<OnChangeCallback>
  onSelectionChangeCallbacks: Set<OnSelectionChangeCallback>
  onBlockHoverCallbacks: Set<OnBlockHoverCallback>
  onBlockClickCallbacks: Set<OnBlockClickCallback>
}

/**
 * 块 ID 管理器类型
 */
export type BlockIdManager = {
  headerBlockIds: string[]
  bottomBlockIds: string[]
}

/**
 * useSetupMDBridge Hook 的参数类型
 */
export type UseSetupMDBridgeParams = {
  editor: BlockNoteEditor | null
  notifyFns: ReturnType<typeof useNotify>
}

/**
 * 图片块属性类型
 */
export type ImageBlockProps = {
  url: string
  caption: string
  previewWidth: number
  textAlignment: 'center' | 'left' | 'right'
}

/**
 * 图片块类型
 */
export type ImageBlock = {
  type: 'image'
  props: ImageBlockProps
}

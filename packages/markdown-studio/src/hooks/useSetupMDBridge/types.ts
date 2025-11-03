/**
 * 文件作用：定义 useSetupMDBridge 相关的类型（回调、ID 管理、参数与图片块）
 * 一句话概括：本目录内部共享的类型声明
 * 被谁使用：本目录下的实现文件（如 `bridgeFactory.ts`、`imageUtils.ts`、`eventHandlers.ts` 等）
 */
import type { Block, BlockNoteEditor } from '@blocknote/core'
import type { useNotify } from 'notify'

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

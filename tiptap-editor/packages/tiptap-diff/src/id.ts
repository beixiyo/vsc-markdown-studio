/**
 * block-sync 的 id 基元
 *
 * hash 基元（fnv1a64 / hashBlock）在 `tiptap-utils`，调用方直接从那里引入
 */

import { nanoid } from 'nanoid'

/**
 * 合成 id 的保留前缀：当块缺失稳定 id 时，diff 用 `${SYNTHETIC_ID_PREFIX}{下标}_{hash}` 兜底。
 * 真实 blockId **不得**以此开头（BlockId 扩展会校验/规避），以免真假 id 混淆
 */
export const SYNTHETIC_ID_PREFIX = '__noid_'

/**
 * 生成 WebView 安全的随机 id（与 image 节点同款 nanoid 方案）
 *
 * 用 `nanoid` 而非 `crypto.randomUUID`：后者在非 secure context（WebView 的 http 场景）
 * 不可用会抛错；nanoid 走 `crypto.getRandomValues`（http 下也可用），随机质量优于 `Math.random`。
 * id 唯一性由 `BlockId` 扩展的 `backfillBlockIds` 再做一层文档内去重兜底
 * @param prefix id 前缀，方便日志肉眼分辨来源
 * @param size 随机部分长度 @default 12
 */
export function randomId(prefix: string, size = 12): string {
  return `${prefix}${nanoid(size)}`
}

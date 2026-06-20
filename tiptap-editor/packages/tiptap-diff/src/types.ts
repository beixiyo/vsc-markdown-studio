/**
 * 块级 id-diff 同步协议类型（编辑器 → 后端增量上报）
 *
 * 设计要点：
 * - 单元 = 顶层块，以**稳定 blockId** 为键（非内容 hash —— hash 只用于判变 / 校验）
 * - 载荷 = 仅变化块的内容（markdown 为主，lossy 块降级 html/json）+ 全量顺序清单
 * - 乐观锁 = `baseVersion`；后端校验不上则要求全量 resync（永远有兜底）
 */

/** 协议版本号，只增不减；消费方按版本协商行为 */
export const BLOCK_SYNC_PROTOCOL_VERSION = 1

/**
 * 单块内容格式
 * - `markdown`：默认、人类可读、最省
 * - `html`：markdown 无法无损表达时（如渐变高亮）的降级，含自定义节点 `data-*`
 * - `json`：ProseMirror JSON，完全无损的终极兜底
 */
export type SyncContentFormat = 'markdown' | 'html' | 'json'

/** 块内容载荷 */
export interface SyncContent {
  /** @default 'markdown' */
  format: SyncContentFormat
  /** markdown / html 为字符串；json 为 ProseMirror 单节点 JSON */
  value: string | Record<string, any>
}

/**
 * upsert：新增或更新一个块
 *
 * 后端按 `id` upsert；位置以 payload 顶层的 `order` 数组为权威
 */
export interface SyncUpsertOp {
  op: 'upsert'
  /** 稳定块 id */
  id: string
  /** 节点类型名（paragraph / heading / table ...），便于后端分类与调试 */
  type: string
  /** 该块内容 hash，后端可用于幂等去重 / 一致性校验 */
  hash: string
  content: SyncContent
  /** 为 true 表示 markdown 无法无损表达，`content` 已降级为 html / json */
  lossy?: boolean
}

/** delete：删除一个块 */
export interface SyncDeleteOp {
  op: 'delete'
  id: string
}

export type SyncOp = SyncUpsertOp | SyncDeleteOp

/**
 * 一次增量上报的载荷
 */
export interface BlockSyncPayload {
  protocolVersion: number
  /** 本次 diff 基于的后端版本号（乐观锁） */
  baseVersion: number
  /** 客户端 id，用于去重 / 幂等 */
  clientId: string
  /** 单调自增序号，后端可据此发现乱序 / 丢包 */
  seq: number
  /** 变化块操作（upsert / delete）；纯重排时可能为空 */
  ops: SyncOp[]
  /** 全量顶层块 id 顺序（位置权威；后端据此重排，纯移动无需重发内容） */
  order: string[]
  /** 结果文档校验和（fnv1a64 over 有序 id\0hash），用于静默漂移检测 */
  docChecksum: string
}

/**
 * 后端对一次上报的回执
 * - `ack`：已接受，给出新版本号
 * - `reject`：版本不匹配（有别的写入抢先），需全量 resync
 * - `resync`：后端要求客户端整篇重推（gap / 校验和不符 / 未知 base）
 */
export type BlockSyncResult =
  | { status: 'ack', version: number, checksum?: string }
  | { status: 'reject', version: number }
  | { status: 'resync', version: number }

/**
 * 客户端持有的「上次已同步」快照（内部状态）
 */
export interface BlockSnapshot {
  /** id → 内容 hash */
  hashes: Map<string, string>
  /** 顶层块 id 顺序 */
  order: string[]
  /** 文档校验和 */
  checksum: string
}

/**
 * computeBlockDiff 的结果
 */
export interface BlockDiffResult {
  ops: SyncOp[]
  order: string[]
  checksum: string
  /** 顺序是否变化（纯移动场景 ops 为空但 order 变） */
  orderChanged: boolean
  /** 是否有任何变化（ops 非空 或 顺序变） */
  changed: boolean
  /** 应用本次 diff 后应保存的新快照 */
  snapshot: BlockSnapshot
}

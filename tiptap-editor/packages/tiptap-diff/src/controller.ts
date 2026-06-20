/**
 * 块级 id-diff 同步控制器（框架无关）
 *
 * 职责：
 * - 订阅编辑器变化（防抖）→ 计算增量 → 通过 `onDiff` 传输
 * - 维护「上次已同步」快照与 `baseVersion`（乐观锁）
 * - 回执 ack → 推进版本 + 提交快照；reject / resync → 整篇全量重推（永远有兜底）
 * - 传输可同步可异步、可有回执可无回执（无回执 = 乐观提交，由 native 侧后续 `ack` 修正）
 *
 * 用法：
 * ```ts
 * const sync = createBlockSync(editor, {
 *   onDiff: payload => postToBackend(payload), // 返回 BlockSyncResult 即按回执处理
 * })
 * // 后端已有该文档时，把当前状态设为基线（不重发）：
 * sync.snapshotBaseline(serverVersion)
 * // 后端没有 / 首次：整篇推上去：
 * sync.pushFull()
 * // 组件卸载：
 * sync.destroy()
 * ```
 */

import type { Editor } from '@tiptap/core'
import type { BlockSyncPayload, BlockSyncResult } from './types'
import { computeBlockDiff, emptySnapshot } from './diff'
import { randomId } from './id'
import { BLOCK_SYNC_PROTOCOL_VERSION } from './types'

export interface BlockSyncOptions {
  /**
   * 传输回调：把一次增量发出去
   *
   * 返回 `BlockSyncResult` 则按回执处理（ack 推进版本 / reject / resync 整篇重推）；
   * 返回 `void`（如 WebView 单向 notify 桥）则乐观提交快照，版本由 native 侧后续调 `ack` 推进
   */
  onDiff: (payload: BlockSyncPayload) => void | BlockSyncResult | Promise<void | BlockSyncResult>
  /** 块身份 attr 名 @default 'blockId' */
  attributeName?: string
  /** lossy 块降级格式 @default 'html' */
  lossyFormat?: 'html' | 'json'
  /** 协议版本 @default BLOCK_SYNC_PROTOCOL_VERSION */
  protocolVersion?: number
  /** 变更防抖（ms）@default 500 */
  debounceMs?: number
  /** 客户端 id @default randomId('cli_') */
  clientId?: string
  /** 初始 baseVersion @default 0 */
  baseVersion?: number
  /** 是否自动订阅 editor 'update'（false 则只能手动 flush）@default true */
  autoFlush?: boolean
  /** 传输出错回调 */
  onError?: (error: unknown) => void
}

export interface BlockSyncController {
  /** 立即计算并发送增量（force 为 true 时即使无变化也发送空载荷） */
  flush: (force?: boolean) => Promise<void>
  /** 整篇全量重推（把当前每个块都当作 upsert）；reject / resync 时自动调用 */
  pushFull: () => Promise<void>
  /** 把当前文档状态设为「已同步基线」，不发送任何内容（后端已持有该文档时用） */
  snapshotBaseline: (version?: number) => void
  /** native 侧异步回执：推进版本并提交（配合无回执传输） */
  ack: (version: number) => void
  /** native 侧要求整篇重推 */
  requestResync: (version?: number) => void
  /** 设置 baseVersion（不触发同步） */
  setBaseVersion: (version: number) => void
  getBaseVersion: () => number
  getClientId: () => string
  destroy: () => void
}

/**
 * 创建块级同步控制器
 */
export function createBlockSync(editor: Editor, options: BlockSyncOptions): BlockSyncController {
  const attributeName = options.attributeName ?? 'blockId'
  const lossyFormat = options.lossyFormat ?? 'html'
  const protocolVersion = options.protocolVersion ?? BLOCK_SYNC_PROTOCOL_VERSION
  const debounceMs = options.debounceMs ?? 500
  const clientId = options.clientId ?? randomId('cli_')
  const diffOptions = { attributeName, lossyFormat }

  let baseVersion = options.baseVersion ?? 0
  let seq = 0
  let snapshot = emptySnapshot()
  let syncing = false
  let pendingFlush = false
  let pendingForce = false
  let destroyed = false
  /**
   * 带外（out-of-band）版本控制纪元：ack / requestResync / snapshotBaseline / setBaseVersion
   * 每次调用 +1。flush 发送前快照当前纪元，await 回来若纪元已变，说明期间有带外控制接管了
   * 版本，则 applyResult 不再回写版本 / 快照，避免「带外 ack 被在途回执覆盖」
   */
  let controlEpoch = 0

  /** 先补全块 id（注册了 BlockId 扩展才有该命令），再以当前状态建基线 */
  editor.commands.ensureBlockIds?.()
  takeBaseline()

  const debouncedFlush = createDebounce(() => {
    flush()
  }, debounceMs)

  const handleUpdate = () => {
    debouncedFlush.schedule()
  }

  if (options.autoFlush !== false) {
    editor.on('update', handleUpdate)
  }

  /** 以当前文档状态刷新本地快照（不发送） */
  function takeBaseline() {
    snapshot = computeBlockDiff(editor, emptySnapshot(), diffOptions).snapshot
  }

  async function flush(force = false): Promise<void> {
    if (destroyed)
      return

    /** 已有一次发送在途：标记待办，待回执后合并补发，避免乱序 */
    if (syncing) {
      pendingFlush = true
      pendingForce = pendingForce || force
      return
    }

    const diff = computeBlockDiff(editor, snapshot, diffOptions)
    if (!force && !diff.changed)
      return

    const payload: BlockSyncPayload = {
      protocolVersion,
      baseVersion,
      clientId,
      seq: seq++,
      ops: diff.ops,
      order: diff.order,
      docChecksum: diff.checksum,
    }

    syncing = true
    const flushEpoch = controlEpoch
    try {
      const result = await options.onDiff(payload)
      /** destroy 后保持惰性；带外控制接管则不回写 */
      if (!destroyed)
        applyResult(result, diff.snapshot, flushEpoch)
    }
    catch (error) {
      options.onError?.(error)
    }
    finally {
      syncing = false
      if (!destroyed && pendingFlush) {
        pendingFlush = false
        const nextForce = pendingForce
        pendingForce = false
        void flush(nextForce)
      }
    }
  }

  /** 根据回执推进状态；无回执（void）= 乐观提交快照 */
  function applyResult(result: void | BlockSyncResult, committedSnapshot: typeof snapshot, flushEpoch: number) {
    /** 期间有带外 ack / resync / baseline 接管，不覆盖它设的版本与快照（下次 flush 会重算） */
    if (controlEpoch !== flushEpoch)
      return

    if (!result) {
      snapshot = committedSnapshot
      return
    }

    if (result.status === 'ack') {
      baseVersion = result.version
      snapshot = committedSnapshot
      return
    }

    /** reject / resync：服务端权威版本 + 整篇重推 */
    baseVersion = result.version
    snapshot = emptySnapshot()
    pendingFlush = true
    pendingForce = true
  }

  async function pushFull(): Promise<void> {
    snapshot = emptySnapshot()
    await flush(true)
  }

  return {
    flush,
    pushFull,

    snapshotBaseline(version) {
      controlEpoch += 1
      editor.commands.ensureBlockIds?.()
      takeBaseline()
      if (typeof version === 'number')
        baseVersion = version
    },

    ack(version) {
      controlEpoch += 1
      baseVersion = version
    },

    requestResync(version) {
      controlEpoch += 1
      if (typeof version === 'number')
        baseVersion = version
      void pushFull()
    },

    setBaseVersion(version) {
      controlEpoch += 1
      baseVersion = version
    },
    getBaseVersion: () => baseVersion,
    getClientId: () => clientId,

    destroy() {
      destroyed = true
      debouncedFlush.cancel()
      editor.off('update', handleUpdate)
    },
  }
}

/** 极简防抖（零依赖，避免引外部包） */
function createDebounce(fn: () => void, ms: number) {
  let timer: ReturnType<typeof setTimeout> | null = null

  return {
    schedule() {
      if (timer)
        clearTimeout(timer)

      timer = setTimeout(() => {
        timer = null
        fn()
      }, ms)
    },

    cancel() {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    },
  }
}

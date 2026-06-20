import type { JSONContent } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import type { Editor } from '@tiptap/react'
import type { BlockSyncController, BlockSyncPayload, BlockSyncResult, SyncContent } from 'tiptap-diff'
import { DOMParser as PMDOMParser } from '@tiptap/pm/model'
import { useLatestCallback } from 'hooks'
import { useEffect, useRef, useState } from 'react'
import { buildSyncIndex, computeChecksum, createBlockSync } from 'tiptap-diff'
import { getMarkdownManager } from 'tiptap-utils'

/** buildSyncIndex 对缺 id 块的兜底前缀；这类块不回挂 id（让 BlockId 扩展重新生成） */
const SYNTHETIC_PREFIX = '__noid_'
const ATTR = 'blockId'

/**
 * 块同步测试面板逻辑 —— 模拟一条真实的「升级迁移 → 增量同步 → 拉取重建」闭环
 *
 * 内置一个**内存 mock 后端**：按 id 存**完整 SyncContent**（不再只存文字预览），用 baseVersion
 * 做乐观锁，并记下权威 docChecksum。三个阶段：
 * 1. 首开后端为空（模拟旧版只有 markdown、尚未迁移到块协议）→「同步并迁移」整篇播种
 * 2. 编辑器改动 → 增量 upsert / delete 入库
 * 3. 「从后端重建」：按 order 把每块内容解析回节点、原样回挂 blockId、setContent 回灌主编辑器，
 *    再用 checksum 比对后端权威值 → ✓/✗ 验证整条往返无损（先快照当前文档，可一键还原）
 */
export function useBlockSyncPanel(editor: Editor | null) {
  const [log, setLog] = useState<DiffLogEntry[]>([])
  const [selectedSeq, setSelectedSeq] = useState<number | null>(null)
  const [backendBlocks, setBackendBlocks] = useState<BackendBlock[]>([])
  const [backendVersion, setBackendVersion] = useState(0)
  const [baseVersion, setBaseVersion] = useState(0)
  const [clientId, setClientId] = useState('')
  const [rebuild, setRebuild] = useState<RebuildResult | null>(null)
  const [canRestore, setCanRestore] = useState(false)

  /** mock 后端存储（用 ref，onDiff 回调里读最新） */
  const storeRef = useRef<Map<string, BackendBlock>>(new Map())
  const orderRef = useRef<string[]>([])
  const versionRef = useRef(0)
  /** 后端权威 docChecksum（最近一次 ack 的 payload 带来） */
  const checksumRef = useRef('')
  const controllerRef = useRef<BlockSyncController | null>(null)
  /** 回灌前的文档快照，用于一键还原 */
  const snapshotRef = useRef<JSONContent | null>(null)

  const resetBackend = useLatestCallback(() => {
    storeRef.current = new Map()
    orderRef.current = []
    versionRef.current = 0
    checksumRef.current = ''
    snapshotRef.current = null
    setBackendVersion(0)
    setBackendBlocks([])
    setLog([])
    setSelectedSeq(null)
    setRebuild(null)
    setCanRestore(false)
  })

  /** mock 后端：应用一次增量并重建文档列表（按 order 排序） */
  const applyToBackend = useLatestCallback((payload: BlockSyncPayload) => {
    const store = storeRef.current
    for (const op of payload.ops) {
      if (op.op === 'upsert') {
        store.set(op.id, {
          id: op.id,
          type: op.type,
          hash: op.hash,
          content: op.content,
          lossy: !!op.lossy,
        })
      }
      else {
        store.delete(op.id)
      }
    }
    orderRef.current = payload.order
    setBackendBlocks(payload.order
      .map(id => store.get(id))
      .filter((b): b is BackendBlock => !!b))
  })

  /** onDiff：记日志（含完整 payload）+ 跑 mock 后端协议（乐观锁 + ack/resync） */
  const handleDiff = useLatestCallback((payload: BlockSyncPayload): BlockSyncResult => {
    const fullBytes = (editor?.getMarkdown?.() ?? '').length
    const bytes = JSON.stringify(payload).length
    const drift = payload.baseVersion !== versionRef.current

    const entry: DiffLogEntry = {
      payload,
      bytes,
      fullBytes,
      outcome: drift
        ? 'resync'
        : 'ack',
    }
    setLog(prev => [entry, ...prev].slice(0, 20))
    /** 默认跟随最新一条，方便边打字边看发出的数据 */
    setSelectedSeq(payload.seq)

    if (drift) {
      return { status: 'resync', version: versionRef.current }
    }

    applyToBackend(payload)
    versionRef.current += 1
    checksumRef.current = payload.docChecksum
    setBackendVersion(versionRef.current)
    /** 控制器在本回调返回后才推进 baseVersion，下一帧再读 */
    queueMicrotask(() => setBaseVersion(controllerRef.current?.getBaseVersion() ?? 0))
    return { status: 'ack', version: versionRef.current }
  })

  /** 与编辑器同步：创建 / 销毁控制器 */
  useEffect(() => {
    if (!editor)
      return

    resetBackend()
    const ctrl = createBlockSync(editor, {
      debounceMs: 400,
      /** lossy 块用 json 全量存（html 对自定义内联节点 / 空白非无损）——演示真正无损往返 */
      lossyFormat: 'json',
      onDiff: handleDiff,
    })
    controllerRef.current = ctrl
    setClientId(ctrl.getClientId())
    setBaseVersion(ctrl.getBaseVersion())

    return () => {
      ctrl.destroy()
      controllerRef.current = null
    }
    // resetBackend / handleDiff 为稳定引用，仅随 editor 重建
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  /** 整篇推送 / 首次迁移：把当前文档全量播种进后端 */
  const migrate = useLatestCallback(() => controllerRef.current?.pushFull())
  const flushNow = useLatestCallback(() => controllerRef.current?.flush(true))
  const baseline = useLatestCallback(() => {
    controllerRef.current?.snapshotBaseline(versionRef.current)
    setBaseVersion(controllerRef.current?.getBaseVersion() ?? 0)
  })
  /** 制造版本漂移：后端版本偷偷 +1，下次增量 baseVersion 不符 → 触发 resync 整篇重推 */
  const simulateDrift = useLatestCallback(() => {
    versionRef.current += 1
    setBackendVersion(versionRef.current)
  })

  /**
   * 从后端拉取并重建文档 → 回灌主编辑器
   *
   * 按 order 把每块内容解析回节点、原样回挂 blockId，setContent（不触发外发增量），
   * 再用 buildSyncIndex + computeChecksum 算出重建文档的 checksum 与后端权威值比对
   */
  const rebuildFromBackend = useLatestCallback(() => {
    if (!editor || orderRef.current.length === 0)
      return

    const before = editor.getJSON()
    snapshotRef.current = before
    setCanRestore(true)

    const blocks = orderRef.current
      .map(id => storeRef.current.get(id))
      .filter((b): b is BackendBlock => !!b)

    try {
      const doc = rebuildDoc(editor, blocks)
      editor.commands.setContent(doc, { emitUpdate: false })

      /** 主判据：内容是否无损 —— 剔除 blockId / 节点临时 id 等身份属性后逐块对比回灌前后文档 */
      const orig = (before.content ?? []) as Record<string, any>[]
      const rebuilt = (editor.getJSON().content ?? []) as Record<string, any>[]
      const diffIndex = firstContentDiff(orig, rebuilt)

      /** 参考：raw checksum（含身份 id）是否与后端权威值逐字节一致 —— 节点临时 id 重生成会让它不等 */
      const checksumMatch = computeChecksum(buildSyncIndex(editor, ATTR)) === checksumRef.current

      setRebuild({
        status: diffIndex < 0
          ? 'ok'
          : 'mismatch',
        blocks: blocks.length,
        diffIndex: diffIndex < 0
          ? undefined
          : diffIndex,
        diffType: diffIndex < 0
          ? undefined
          : orig[diffIndex]?.type ?? rebuilt[diffIndex]?.type,
        checksumMatch,
      })
    }
    catch (error) {
      setRebuild({ status: 'error', blocks: blocks.length, checksumMatch: false, message: String(error) })
    }
  })

  /** 还原回灌前的文档快照 */
  const restoreSnapshot = useLatestCallback(() => {
    if (!editor || !snapshotRef.current)
      return
    editor.commands.setContent(snapshotRef.current, { emitUpdate: false })
    snapshotRef.current = null
    setCanRestore(false)
    setRebuild(null)
  })

  const selected = log.find(e => e.payload.seq === selectedSeq) ?? log[0] ?? null

  return {
    ready: !!editor,
    migrated: backendVersion > 0,
    clientId,
    baseVersion,
    backendVersion,
    log,
    selected,
    selectedSeq: selected?.payload.seq ?? null,
    selectEntry: setSelectedSeq,
    backendBlocks,
    rebuild,
    canRestore,
    migrate,
    flushNow,
    baseline,
    simulateDrift,
    resetBackend,
    rebuildFromBackend,
    restoreSnapshot,
  }
}

/** 身份属性（块身份 + 节点临时 id），内容比对时一并剔除 —— 它们在 markdown/html 往返后会重新生成，非内容 */
const IDENTITY_ATTRS = ['blockId', 'id']

/** 第一个内容不一致的块下标（剔除身份属性 + 归一化后比较）；全等返回 -1 */
function firstContentDiff(a: Record<string, any>[], b: Record<string, any>[]): number {
  if (a.length !== b.length)
    return Math.min(a.length, b.length)
  for (let i = 0; i < a.length; i++) {
    if (canon(a[i]) !== canon(b[i]))
      return i
  }
  return -1
}

function canon(value: any): string {
  return JSON.stringify(normalizeForCompare(value))
}

/** 归一化：去 null / 空容器，attrs 里剔除身份属性 */
function normalizeForCompare(value: any): any {
  if (Array.isArray(value))
    return value.map(normalizeForCompare)

  if (value && typeof value === 'object') {
    const out: Record<string, any> = {}
    for (const [key, val] of Object.entries(value)) {
      if (val == null)
        continue

      if (key === 'attrs' && typeof val === 'object') {
        const attrs = { ...(val as Record<string, any>) }
        for (const id of IDENTITY_ATTRS)
          delete attrs[id]
        const normalized = normalizeForCompare(attrs)
        if (Object.keys(normalized).length)
          out.attrs = normalized
        continue
      }

      const normalized = normalizeForCompare(val)
      if (typeof normalized === 'object' && !Array.isArray(normalized) && !Object.keys(normalized).length)
        continue
      if (Array.isArray(normalized) && !normalized.length)
        continue
      out[key] = normalized
    }
    return out
  }

  return value
}

/** 后端块 → 顶层节点数组（markdown / html / json 三通道，镜像 region-edit 的逆解析） */
function parseSyncContent(editor: Editor, content: SyncContent): PMNode[] {
  if (content.format === 'json') {
    const raw = typeof content.value === 'string'
      ? JSON.parse(content.value)
      : content.value
    const list = Array.isArray(raw)
      ? raw
      : raw?.type === 'doc'
        ? raw.content ?? []
        : [raw]
    return (list as Record<string, any>[]).map(item => editor.schema.nodeFromJSON(item))
  }

  let docNode: PMNode
  if (content.format === 'html') {
    const container = document.createElement('div')
    container.innerHTML = String(content.value)
    docNode = PMDOMParser.fromSchema(editor.schema).parse(container)
  }
  else {
    const json = getMarkdownManager(editor).parse(String(content.value))
    docNode = editor.schema.nodeFromJSON(json)
  }

  const nodes: PMNode[] = []
  docNode.forEach(node => nodes.push(node))
  return nodes
}

/** 后端块集合 → 文档 JSON；单块单节点时把 blockId 原样回挂，保证身份与后端一致 */
function rebuildDoc(editor: Editor, blocks: BackendBlock[]): JSONContent {
  const content: Record<string, any>[] = []

  for (const block of blocks) {
    const jsons = parseSyncContent(editor, block.content).map(node => node.toJSON())
    if (jsons.length === 1 && !block.id.startsWith(SYNTHETIC_PREFIX)) {
      jsons[0].attrs = { ...(jsons[0].attrs ?? {}), [ATTR]: block.id }
    }
    content.push(...jsons)
  }

  return { type: 'doc', content }
}

export interface DiffLogEntry {
  /** 本次发出的完整数据包 */
  payload: BlockSyncPayload
  /** 本次传输字节数 */
  bytes: number
  /** 同时刻整篇 markdown 字节数（对比用） */
  fullBytes: number
  /** mock 后端回执 */
  outcome: 'ack' | 'resync'
}

export interface BackendBlock {
  id: string
  type: string
  /** 内容 hash（后端幂等去重用） */
  hash: string
  /** 完整内容载荷（markdown / html / json） */
  content: SyncContent
  /** markdown 无法无损表达，已降级 */
  lossy: boolean
}

export interface RebuildResult {
  /** ok：内容无损往返；mismatch：有块内容不一致；error：解析失败 */
  status: 'ok' | 'mismatch' | 'error'
  /** 重建块数 */
  blocks: number
  /** mismatch 时第一个不一致块的下标 */
  diffIndex?: number
  /** mismatch 时该块类型 */
  diffType?: string
  /** raw checksum（含身份 id）是否与后端权威值逐字节一致；节点临时 id 重生成会让它不等，仅参考 */
  checksumMatch: boolean
  /** error 时的信息 */
  message?: string
}

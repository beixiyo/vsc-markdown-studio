import type { BlockSyncPayload, BlockSyncResult, SyncUpsertOp } from '../index'
import { Editor } from '@tiptap/core'
import { Markdown } from '@tiptap/markdown'
import { StarterKit } from '@tiptap/starter-kit'
import { hashBlock } from 'tiptap-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  BlockId,
  buildSyncIndex,
  computeBlockDiff,
  createBlockSync,
  emptySnapshot,
} from '../index'

const DIFF_OPTS = { attributeName: 'blockId', lossyFormat: 'html' as const }

function makeEditor(content: any = '', blockId: any = BlockId) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const editor = new Editor({
    element: el,
    content,
    extensions: [
      StarterKit,
      Markdown.configure({
        indentation: { style: 'space', size: 2 },
        markedOptions: { gfm: true, breaks: true, pedantic: false },
      }),
      blockId,
    ],
  })
  return {
    editor,
    cleanup: () => {
      editor.destroy()
      el.remove()
    },
  }
}

/** 手动控制 resolve 的 promise，用于模拟在途异步 onDiff */
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

function paras(...texts: string[]) {
  return {
    type: 'doc',
    content: texts.map(text => ({
      type: 'paragraph',
      content: text
        ? [{ type: 'text', text }]
        : [],
    })),
  }
}

/** 顶层第 index 个块内部起始位置（插入文本用） */
function blockInnerStart(editor: Editor, index: number): number {
  let pos = 1
  editor.state.doc.forEach((_node, offset, i) => {
    if (i === index)
      pos = offset + 1
  })
  return pos
}

function idsOf(editor: Editor): string[] {
  return buildSyncIndex(editor, 'blockId').map(e => e.id)
}

const cleanups: Array<() => void> = []
afterEach(() => {
  cleanups.splice(0).forEach(fn => fn())
  vi.useRealTimers()
})

function setup(content: any = '', blockId: any = BlockId) {
  const { editor, cleanup } = makeEditor(content, blockId)
  cleanups.push(cleanup)
  /** 经 `content` 选项创建不会触发 appendTransaction，显式补全（控制器与 setContent 路径同理） */
  editor.commands.ensureBlockIds()
  return editor
}

describe('blockId extension', () => {
  it('每个顶层块都获得稳定 id', () => {
    const editor = setup(paras('one', 'two', 'three'))
    const ids = idsOf(editor)
    expect(ids).toHaveLength(3)
    expect(ids.every(id => id.startsWith('blk_'))).toBe(true)
    expect(new Set(ids).size).toBe(3)
  })

  it('id 不进入 markdown，但进入 getJSON', () => {
    const editor = setup(paras('hello world'))
    const md = editor.getMarkdown()
    expect(md).not.toContain('blk_')
    expect(md.trim()).toBe('hello world')

    const json = JSON.stringify(editor.getJSON())
    expect(json).toContain('blockId')
    expect(json).toContain('blk_')
  })

  it('原地编辑不改变块 id', () => {
    const editor = setup(paras('one', 'two', 'three'))
    const before = idsOf(editor)
    editor.commands.insertContentAt(blockInnerStart(editor, 1), 'X')
    const after = idsOf(editor)
    expect(after).toEqual(before)
  })

  it('块分裂后两半 id 唯一（appendTransaction 重发重复 id）', () => {
    const editor = setup(paras('hello'))
    expect(idsOf(editor)).toHaveLength(1)
    /** 在 "hel|lo" 处回车分裂 */
    editor.commands.setTextSelection(4)
    editor.commands.splitBlock()
    const ids = idsOf(editor)
    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(2)
  })
})

describe('hashBlock（stripAttr 剔除 blockId）', () => {
  it('忽略 blockId：内容相同则 hash 相同', () => {
    const a = setup(paras('same text'))
    const b = setup(paras('same text'))
    const ha = hashBlock(a.state.doc.child(0), { stripAttr: 'blockId' })
    const hb = hashBlock(b.state.doc.child(0), { stripAttr: 'blockId' })
    expect(ha).toBe(hb)
  })

  it('内容变化则 hash 变化', () => {
    const editor = setup(paras('foo'))
    const before = hashBlock(editor.state.doc.child(0), { stripAttr: 'blockId' })
    editor.commands.insertContentAt(blockInnerStart(editor, 0), 'X')
    const after = hashBlock(editor.state.doc.child(0), { stripAttr: 'blockId' })
    expect(after).not.toBe(before)
  })
})

describe('computeBlockDiff', () => {
  it('对空快照：全部块 upsert', () => {
    const editor = setup(paras('a', 'b', 'c'))
    const diff = computeBlockDiff(editor, emptySnapshot(), DIFF_OPTS)
    expect(diff.ops.filter(o => o.op === 'upsert')).toHaveLength(3)
    expect(diff.changed).toBe(true)
    expect(diff.order).toHaveLength(3)
  })

  it('无变化：无 op', () => {
    const editor = setup(paras('a', 'b'))
    const base = computeBlockDiff(editor, emptySnapshot(), DIFF_OPTS)
    const again = computeBlockDiff(editor, base.snapshot, DIFF_OPTS)
    expect(again.ops).toHaveLength(0)
    expect(again.changed).toBe(false)
  })

  it('编辑一个块：仅该块一条 upsert', () => {
    const editor = setup(paras('a', 'b', 'c'))
    const base = computeBlockDiff(editor, emptySnapshot(), DIFF_OPTS)
    const targetId = idsOf(editor)[1]

    editor.commands.insertContentAt(blockInnerStart(editor, 1), 'Z')
    const diff = computeBlockDiff(editor, base.snapshot, DIFF_OPTS)

    expect(diff.ops).toHaveLength(1)
    const op = diff.ops[0] as SyncUpsertOp
    expect(op.op).toBe('upsert')
    expect(op.id).toBe(targetId)
    expect(op.content.format).toBe('markdown')
    expect(op.content.value).toContain('Z')
  })

  it('新增块：一条 upsert（新 id）', () => {
    const editor = setup(paras('a'))
    const base = computeBlockDiff(editor, emptySnapshot(), DIFF_OPTS)
    editor.commands.insertContentAt(editor.state.doc.content.size, { type: 'paragraph', content: [{ type: 'text', text: 'b' }] })
    const diff = computeBlockDiff(editor, base.snapshot, DIFF_OPTS)
    const upserts = diff.ops.filter(o => o.op === 'upsert')
    expect(upserts).toHaveLength(1)
    expect(base.snapshot.hashes.has((upserts[0] as SyncUpsertOp).id)).toBe(false)
  })

  it('删除块：一条 delete', () => {
    const editor = setup(paras('a', 'b'))
    const base = computeBlockDiff(editor, emptySnapshot(), DIFF_OPTS)
    const removedId = idsOf(editor)[1]

    /** 删除第二个块 */
    let from = 0
    let to = 0
    editor.state.doc.forEach((node, offset, i) => {
      if (i === 1) {
        from = offset
        to = offset + node.nodeSize
      }
    })
    editor.commands.deleteRange({ from, to })

    const diff = computeBlockDiff(editor, base.snapshot, DIFF_OPTS)
    const deletes = diff.ops.filter(o => o.op === 'delete')
    expect(deletes).toHaveLength(1)
    expect(deletes[0].id).toBe(removedId)
  })

  it('纯重排：无 op 但 orderChanged', () => {
    const editor = setup(paras('a', 'b'))
    const base = computeBlockDiff(editor, emptySnapshot(), DIFF_OPTS)
    /** 构造一个仅顺序不同的快照（手动反转 order） */
    const reordered = {
      ...base.snapshot,
      order: [...base.snapshot.order].reverse(),
    }
    const diff = computeBlockDiff(editor, reordered, DIFF_OPTS)
    expect(diff.ops).toHaveLength(0)
    expect(diff.orderChanged).toBe(true)
    expect(diff.changed).toBe(true)
  })
})

describe('createBlockSync controller', () => {
  it('pushFull 发送全部块', async () => {
    const editor = setup(paras('a', 'b'))
    const sent: BlockSyncPayload[] = []
    const sync = createBlockSync(editor, {
      autoFlush: false,
      onDiff: (p) => {
        sent.push(p)
        return { status: 'ack', version: p.baseVersion + 1 } as BlockSyncResult
      },
    })
    cleanups.push(() => sync.destroy())

    await sync.pushFull()
    expect(sent).toHaveLength(1)
    expect(sent[0].ops.filter(o => o.op === 'upsert')).toHaveLength(2)
    expect(sync.getBaseVersion()).toBe(1)
  })

  it('ack 推进 baseVersion 并提交快照', async () => {
    const editor = setup(paras('a'))
    const sent: BlockSyncPayload[] = []
    const sync = createBlockSync(editor, {
      autoFlush: false,
      onDiff: (p) => {
        sent.push(p)
        return { status: 'ack', version: p.baseVersion + 10 }
      },
    })
    cleanups.push(() => sync.destroy())

    await sync.pushFull()
    expect(sync.getBaseVersion()).toBe(10)

    /** 提交快照后再 flush 无变化 → 不再发送 */
    await sync.flush()
    expect(sent).toHaveLength(1)
  })

  it('snapshotBaseline 后只发送增量', async () => {
    const editor = setup(paras('a', 'b'))
    const sent: BlockSyncPayload[] = []
    const sync = createBlockSync(editor, {
      autoFlush: false,
      onDiff: (p) => {
        sent.push(p)
        return { status: 'ack', version: p.baseVersion + 1 }
      },
    })
    cleanups.push(() => sync.destroy())

    sync.snapshotBaseline(5)
    expect(sync.getBaseVersion()).toBe(5)

    editor.commands.insertContentAt(blockInnerStart(editor, 0), 'Z')
    await sync.flush()

    expect(sent).toHaveLength(1)
    expect(sent[0].baseVersion).toBe(5)
    expect(sent[0].ops).toHaveLength(1)
  })

  it('resync 回执触发整篇重推', async () => {
    const editor = setup(paras('a', 'b'))
    const sent: BlockSyncPayload[] = []
    let first = true
    const sync = createBlockSync(editor, {
      autoFlush: false,
      onDiff: (p) => {
        sent.push(p)
        if (first) {
          first = false
          return { status: 'resync', version: 99 }
        }
        return { status: 'ack', version: 100 }
      },
    })
    cleanups.push(() => sync.destroy())

    sync.snapshotBaseline(0)
    editor.commands.insertContentAt(blockInnerStart(editor, 0), 'Z')
    await sync.flush()

    /** 第一次被 resync，自动整篇重推第二次 */
    expect(sent).toHaveLength(2)
    expect(sent[1].baseVersion).toBe(99)
    expect(sent[1].ops.filter(o => o.op === 'upsert')).toHaveLength(2)
    expect(sync.getBaseVersion()).toBe(100)
  })

  it('autoFlush 防抖订阅 editor update', async () => {
    vi.useFakeTimers()
    const editor = setup(paras('a'))
    const sent: BlockSyncPayload[] = []
    const sync = createBlockSync(editor, {
      debounceMs: 200,
      onDiff: (p) => {
        sent.push(p)
        return { status: 'ack', version: p.baseVersion + 1 }
      },
    })
    cleanups.push(() => sync.destroy())

    sync.snapshotBaseline(0)
    editor.commands.insertContentAt(blockInnerStart(editor, 0), 'Z')
    editor.commands.insertContentAt(blockInnerStart(editor, 0), 'Y')

    expect(sent).toHaveLength(0) // 防抖未触发
    await vi.advanceTimersByTimeAsync(250)
    expect(sent).toHaveLength(1) // 多次编辑合批为一次
  })

  it('destroy 后在途回执不再改状态', async () => {
    const editor = setup(paras('a'))
    const d = deferred<{ status: 'ack', version: number }>()
    const sync = createBlockSync(editor, { autoFlush: false, onDiff: () => d.promise })
    cleanups.push(() => sync.destroy())

    sync.snapshotBaseline(0)
    editor.commands.insertContentAt(blockInnerStart(editor, 0), 'Z')
    const p = sync.flush() // 进入 await onDiff
    sync.destroy()
    d.resolve({ status: 'ack', version: 7 })
    await p

    expect(sync.getBaseVersion()).toBe(0) // 未被在途回执推进
  })

  it('在途回执不覆盖带外 ack（controlEpoch 守卫）', async () => {
    const editor = setup(paras('a'))
    const d = deferred<{ status: 'ack', version: number }>()
    const sync = createBlockSync(editor, { autoFlush: false, onDiff: () => d.promise })
    cleanups.push(() => sync.destroy())

    sync.snapshotBaseline(0)
    editor.commands.insertContentAt(blockInnerStart(editor, 0), 'Z')
    const p = sync.flush()
    sync.ack(99) // 带外 ack（如原生侧回执）
    d.resolve({ status: 'ack', version: 10 })
    await p

    expect(sync.getBaseVersion()).toBe(99) // 带外 ack 不被在途结果覆盖
  })
})

describe('blockId 生成器健壮性', () => {
  it('generateId 返回重复值时仍保证块 id 唯一', () => {
    const editor = setup(paras('a', 'b', 'c'), BlockId.configure({ generateId: () => 'dup' }))
    const ids = idsOf(editor)
    expect(ids).toHaveLength(3)
    expect(new Set(ids).size).toBe(3)
  })

  it('generateId 误用合成保留前缀时会被规避', () => {
    const editor = setup(paras('a', 'b'), BlockId.configure({ generateId: () => '__noid_evil' }))
    const ids = idsOf(editor)
    expect(ids.every(id => !id.startsWith('__noid_'))).toBe(true)
    expect(new Set(ids).size).toBe(2)
  })
})

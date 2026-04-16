import type { Comment } from '../comment-store'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CommentStore } from '../comment-store'

function makeComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 'c1',
    content: 'test comment',
    author: { id: 'u1', name: 'Alice' },
    createdAt: Date.now(),
    status: 'active',
    ...overrides,
  }
}

describe('commentStore', () => {
  let store: CommentStore

  beforeEach(() => {
    store = new CommentStore()
  })

  it('addComment + getComment', () => {
    const c = makeComment()
    store.addComment(c)
    expect(store.getComment('c1')).toBe(c)
    expect(store.getCommentCount()).toBe(1)
  })

  it('addComment throws on duplicate id', () => {
    store.addComment(makeComment())
    expect(() => store.addComment(makeComment())).toThrow(/已存在/)
  })

  it('updateComment merges fields', () => {
    store.addComment(makeComment())
    store.updateComment('c1', { content: 'updated' })
    expect(store.getComment('c1')!.content).toBe('updated')
    expect(store.getComment('c1')!.updatedAt).toBeGreaterThan(0)
  })

  it('updateComment throws for unknown id', () => {
    expect(() => store.updateComment('nope', {})).toThrow(/不存在/)
  })

  it('deleteComment soft-deletes', () => {
    store.addComment(makeComment())
    expect(store.deleteComment('c1')).toBe(true)
    expect(store.getComment('c1')!.deleted).toBe(true)
    expect(store.getAllComments()).toHaveLength(0)
    expect(store.getAllComments(true)).toHaveLength(1)
  })

  it('restoreComment reverses soft-delete', () => {
    store.addComment(makeComment())
    store.deleteComment('c1')
    expect(store.restoreComment('c1')).toBe(true)
    expect(store.getComment('c1')!.deleted).toBeUndefined()
    expect(store.getAllComments()).toHaveLength(1)
  })

  it('permanentlyDeleteComment removes from map', () => {
    store.addComment(makeComment())
    expect(store.permanentlyDeleteComment('c1')).toBe(true)
    expect(store.getComment('c1')).toBeUndefined()
    expect(store.getCommentCount()).toBe(0)
  })

  it('getCommentsByStatus filters correctly', () => {
    store.addComment(makeComment({ id: 'a', status: 'active' }))
    store.addComment(makeComment({ id: 'r', status: 'resolved' }))
    expect(store.getCommentsByStatus('active')).toHaveLength(1)
    expect(store.getCommentsByStatus('resolved')).toHaveLength(1)
  })

  it('getSnapshot returns stable reference until change', () => {
    store.addComment(makeComment())
    const s1 = store.getSnapshot()
    const s2 = store.getSnapshot()
    expect(s1).toBe(s2)
    store.updateComment('c1', { content: 'x' })
    expect(store.getSnapshot()).not.toBe(s1)
  })

  it('subscribe notifies on changes', () => {
    const fn = vi.fn()
    const unsub = store.subscribe(fn)
    store.addComment(makeComment())
    expect(fn).toHaveBeenCalledTimes(1)
    unsub()
    store.updateComment('c1', { content: 'x' })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('toJSON / fromJSON round-trip', () => {
    store.addComment(makeComment({ id: 'a' }))
    store.addComment(makeComment({ id: 'b', content: 'second' }))
    const json = store.toJSON()

    const store2 = new CommentStore()
    store2.fromJSON(json)
    expect(store2.getCommentCount()).toBe(2)
    expect(store2.getComment('b')!.content).toBe('second')
  })

  it('fromJSON validates required fields', () => {
    expect(() => store.fromJSON([{ id: 'x' } as any])).toThrow(/必需字段/)
  })

  it('fromJSON rejects non-array', () => {
    expect(() => store.fromJSON('{}' as any)).toThrow(/数组/)
  })

  it('clear empties everything', () => {
    store.addComment(makeComment())
    store.clear()
    expect(store.getCommentCount()).toBe(0)
    expect(store.getSnapshot()).toEqual([])
  })
})

describe('commentStore reply chain', () => {
  let store: CommentStore

  beforeEach(() => {
    store = new CommentStore()
    store.addComment(makeComment({ id: 'root', createdAt: 1000 }))
    store.addComment(makeComment({ id: 'r1', replyTo: 'root', createdAt: 2000 }))
    store.addComment(makeComment({ id: 'r2', replyTo: 'root', createdAt: 3000 }))
    store.addComment(makeComment({ id: 'r1a', replyTo: 'r1', createdAt: 4000 }))
  })

  it('getCommentsByReplyTo returns direct replies', () => {
    const replies = store.getCommentsByReplyTo('root')
    expect(replies.map(c => c.id).sort()).toEqual(['r1', 'r2'])
  })

  it('getReplyCount counts direct replies', () => {
    expect(store.getReplyCount('root')).toBe(2)
    expect(store.getReplyCount('r1')).toBe(1)
    expect(store.getReplyCount('r2')).toBe(0)
  })

  it('getReplyChain builds full chain sorted by time', () => {
    const chain = store.getReplyChain('root')
    expect(chain.map(c => c.id)).toEqual(['root', 'r1', 'r2', 'r1a'])
  })

  it('getTopLevelComments excludes replies', () => {
    const top = store.getTopLevelComments()
    expect(top).toHaveLength(1)
    expect(top[0].id).toBe('root')
  })
})

describe('commentStore getCommentsByRange', () => {
  let store: CommentStore

  beforeEach(() => {
    store = new CommentStore()
    store.addComment(makeComment({ id: 'a' }))
    store.addComment(makeComment({ id: 'b' }))
  })

  it('returns comments whose ranges intersect query', () => {
    const ranges = new Map([
      ['a', { commentId: 'a', from: 10, to: 20 }],
      ['b', { commentId: 'b', from: 30, to: 40 }],
    ])
    expect(store.getCommentsByRange(ranges, 15, 25).map(c => c.id)).toEqual(['a'])
    expect(store.getCommentsByRange(ranges, 5, 35).map(c => c.id)).toEqual(['a', 'b'])
    expect(store.getCommentsByRange(ranges, 50, 60)).toEqual([])
  })

  it('handles multi-segment ranges', () => {
    const ranges = new Map([
      ['a', { commentId: 'a', from: 10, to: 50, segments: [{ from: 10, to: 20 }, { from: 40, to: 50 }] }],
    ])
    expect(store.getCommentsByRange(ranges, 25, 35)).toEqual([])
    expect(store.getCommentsByRange(ranges, 15, 25).map(c => c.id)).toEqual(['a'])
    expect(store.getCommentsByRange(ranges, 45, 55).map(c => c.id)).toEqual(['a'])
  })

  it('caches results for same query', () => {
    const ranges = new Map([
      ['a', { commentId: 'a', from: 0, to: 100 }],
    ])
    const r1 = store.getCommentsByRange(ranges, 10, 20)
    const r2 = store.getCommentsByRange(ranges, 10, 20)
    expect(r1).toBe(r2)
  })
})

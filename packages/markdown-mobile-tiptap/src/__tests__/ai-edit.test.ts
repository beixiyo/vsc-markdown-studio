/**
 * AI 区域编辑（hash 锚点协议）端到端测试
 *
 * 协议文档：tiptap-editor/docs/ai-region-edit-protocol.md
 */

import { createRegionEdit, RegionEdit } from 'tiptap-ai'
import { describe, expect, it } from 'vitest'
import { makeEditor } from './helpers'

const BASE_MD = [
  '# 标题',
  '',
  '第一段内容',
  '',
  '第二段内容',
].join('\n')

function setup(markdown = BASE_MD) {
  const ctx = makeEditor('', [RegionEdit])
  ctx.editor.commands.setContent(markdown, { contentType: 'markdown' })
  const regionEdit = createRegionEdit(ctx.editor)

  return {
    ...ctx,
    regionEdit,
    dispose: () => {
      regionEdit.destroy()
      ctx.cleanup()
    },
  }
}

describe('readBlocks', () => {
  it('返回顶层块列表：hash + 类型 + markdown', () => {
    const { regionEdit, dispose } = setup()

    const result = regionEdit.readBlocks()
    expect(result.protocolVersion).toBe(1)

    const { blocks } = result
    expect(blocks).toHaveLength(3)
    expect(blocks.map(b => b.type)).toEqual(['heading', 'paragraph', 'paragraph'])
    expect(blocks[0].markdown).toBe('# 标题')
    expect(blocks[1].markdown).toBe('第一段内容')
    blocks.forEach(b => expect(b.hash).toMatch(/^[0-9a-f]{16}$/))

    dispose()
  })

  it('重复块按文档顺序追加 #n 后缀消歧', () => {
    const { regionEdit, dispose } = setup('相同内容\n\n相同内容\n\n相同内容')

    const { blocks } = regionEdit.readBlocks()
    expect(blocks[0].hash).toMatch(/^[0-9a-f]{16}$/)
    expect(blocks[1].hash).toBe(`${blocks[0].hash}#2`)
    expect(blocks[2].hash).toBe(`${blocks[0].hash}#3`)

    dispose()
  })

  it('渐变高亮块不再 lossy，markdown 直接携带 <mark data-color>', () => {
    const { editor, regionEdit, dispose } = setup()
    editor.commands.insertContentAt(
      editor.state.doc.content.size,
      '<p>普通文字<mark data-color="skyBlue">渐变高亮</mark></p>',
    )

    const { blocks } = regionEdit.readBlocks()
    const target = blocks.find(b => b.markdown.includes('渐变高亮'))
    expect(target).toBeDefined()
    expect(target!.markdown).toContain('<mark data-color="skyBlue">渐变高亮</mark>')
    expect(target!.lossy).toBeFalsy()

    dispose()
  })

  it('markdown 表达不了的块（下划线）标记 lossy 并附带 html', () => {
    const { editor, regionEdit, dispose } = setup()
    editor.commands.insertContentAt(
      editor.state.doc.content.size,
      '<p>前<u>下划线</u>后</p>',
    )

    const { blocks } = regionEdit.readBlocks()
    const lossyBlock = blocks.find(b => b.lossy)
    expect(lossyBlock).toBeDefined()
    expect(lossyBlock!.html).toContain('<u>下划线</u>')

    dispose()
  })
})

describe('applyOperations', () => {
  it('replace：按 hash 整块替换并返回 newHash，可链式继续修改', () => {
    const { editor, regionEdit, dispose } = setup()
    const { blocks } = regionEdit.readBlocks()

    const { results } = regionEdit.applyOperations({
      operations: [{
        target: blocks[1].hash,
        op: 'replace',
        content: { format: 'markdown', value: '替换后的 **新内容**' },
      }],
    })

    expect(results[0].success).toBe(true)
    expect(editor.getMarkdown()).toContain('替换后的 **新内容**')

    /** newHash 与重新读取的块 hash 一致，支持链式修改 */
    const after = regionEdit.readBlocks()
    expect(after.blocks.map(b => b.hash)).toContain(results[0].newHash)

    dispose()
  })

  it('hash 失效返回 TARGET_NOT_FOUND，且不影响同批其他操作', () => {
    const { editor, regionEdit, dispose } = setup()
    const { blocks } = regionEdit.readBlocks()

    const { results } = regionEdit.applyOperations({
      operations: [
        { target: 'deadbeefdeadbeef', op: 'delete' },
        { target: blocks[2].hash, op: 'delete' },
      ],
    })

    expect(results[0]).toMatchObject({ success: false, error: 'TARGET_NOT_FOUND' })
    expect(results[1].success).toBe(true)
    expect(editor.getMarkdown()).not.toContain('第二段内容')

    dispose()
  })

  it('searchReplace：块内唯一匹配替换；无匹配 / 多匹配分别报错', () => {
    const { editor, regionEdit, dispose } = setup('改这里，别动那里\n\n重复 重复')
    const { blocks } = regionEdit.readBlocks()

    const { results } = regionEdit.applyOperations({
      operations: [
        { target: blocks[0].hash, op: 'searchReplace', search: '改这里', replace: '已修改' },
        { target: blocks[1].hash, op: 'searchReplace', search: '不存在的串', replace: 'x' },
        { target: blocks[1].hash, op: 'searchReplace', search: '重复', replace: 'x' },
      ],
    })

    expect(results[0].success).toBe(true)
    expect(results[1]).toMatchObject({ success: false, error: 'SEARCH_NOT_FOUND' })
    expect(results[2]).toMatchObject({ success: false, error: 'SEARCH_NOT_UNIQUE' })
    expect(editor.getMarkdown()).toContain('已修改，别动那里')

    dispose()
  })

  it('同批次内修改过的块，旧 hash 随即失效（快照锚点语义）', () => {
    const { regionEdit, dispose } = setup('改这里，别动那里')
    const { blocks } = regionEdit.readBlocks()

    const { results } = regionEdit.applyOperations({
      operations: [
        { target: blocks[0].hash, op: 'searchReplace', search: '改这里', replace: '已修改' },
        { target: blocks[0].hash, op: 'searchReplace', search: '那里', replace: 'x' },
      ],
    })

    expect(results[0].success).toBe(true)
    expect(results[1]).toMatchObject({ success: false, error: 'TARGET_NOT_FOUND' })

    dispose()
  })

  it('insertAfter html：渐变高亮等非 Markdown 样式经 html 通道写入', () => {
    const { editor, regionEdit, dispose } = setup()
    const { blocks } = regionEdit.readBlocks()

    const { results } = regionEdit.applyOperations({
      operations: [{
        target: blocks[1].hash,
        op: 'insertAfter',
        content: { format: 'html', value: '<p><mark data-color="skyBlue">高亮新段</mark></p>' },
      }],
    })

    expect(results[0].success).toBe(true)
    expect(regionEdit.readBlocks().blocks).toHaveLength(4)
    expect(editor.getHTML()).toContain('data-color="skyBlue"')

    dispose()
  })

  it('target "doc"：append 追加到文档末尾', () => {
    const { regionEdit, dispose } = setup()

    const { results } = regionEdit.applyOperations({
      operations: [{
        target: 'doc',
        op: 'append',
        content: { format: 'markdown', value: '## 末尾新标题' },
      }],
    })

    expect(results[0].success).toBe(true)
    /** StarterKit 的 trailingNode 会在末尾补一个空段落，所以按内容查找而非取末位 */
    const { blocks } = regionEdit.readBlocks()
    expect(blocks.map(b => b.markdown)).toContain('## 末尾新标题')

    dispose()
  })
})

describe('preview 决策', () => {
  it('preview + reject 还原原文', () => {
    const { editor, regionEdit, dispose } = setup()
    const before = editor.getMarkdown()
    const { blocks } = regionEdit.readBlocks()

    regionEdit.applyOperations({
      operations: [{
        target: blocks[1].hash,
        op: 'replace',
        content: { format: 'markdown', value: '预览内容' },
      }],
      options: { preview: true },
    })

    expect(regionEdit.getState()).toBe('preview')
    expect(editor.getMarkdown()).toContain('预览内容')

    regionEdit.reject()
    expect(regionEdit.getState()).toBe('idle')
    expect(editor.getMarkdown()).toBe(before)

    dispose()
  })

  it('preview + accept 落盘，且可被 undo 撤销', () => {
    const { editor, regionEdit, dispose } = setup()
    const before = editor.getMarkdown()
    const { blocks } = regionEdit.readBlocks()

    regionEdit.applyOperations({
      operations: [{
        target: blocks[1].hash,
        op: 'replace',
        content: { format: 'markdown', value: '采纳内容' },
      }],
      options: { preview: true },
    })
    regionEdit.accept()

    expect(regionEdit.getState()).toBe('idle')
    expect(editor.getMarkdown()).toContain('采纳内容')

    editor.commands.undo()
    expect(editor.getMarkdown()).toBe(before)

    dispose()
  })
})

describe('流式三件套', () => {
  it('beginStream → pushChunk → endStream → accept 完整链路', () => {
    const { editor, regionEdit, dispose } = setup()
    const { blocks } = regionEdit.readBlocks()

    const { streamId } = regionEdit.beginStream({
      target: blocks[1].hash,
      op: 'replace',
      format: 'markdown',
    })
    expect(regionEdit.getState()).toBe('streaming')

    regionEdit.pushChunk(streamId, '流式 ')
    regionEdit.pushChunk(streamId, '**改写**')
    regionEdit.endStream(streamId)
    expect(regionEdit.getState()).toBe('preview')

    regionEdit.accept()
    expect(editor.getMarkdown()).toContain('流式 **改写**')
    expect(editor.getMarkdown()).not.toContain('第一段内容')

    dispose()
  })

  it('流式 reject 还原被替换的原块', () => {
    const { editor, regionEdit, dispose } = setup()
    const before = editor.getMarkdown()
    const { blocks } = regionEdit.readBlocks()

    const { streamId } = regionEdit.beginStream({ target: blocks[1].hash, op: 'replace' })
    regionEdit.pushChunk(streamId, '将被丢弃的内容')
    regionEdit.endStream(streamId)
    regionEdit.reject()

    expect(regionEdit.getState()).toBe('idle')
    expect(editor.getMarkdown()).toBe(before)

    dispose()
  })

  it('目标 hash 不存在时 beginStream 抛 TARGET_NOT_FOUND', () => {
    const { regionEdit, dispose } = setup()

    expect(() => regionEdit.beginStream({ target: 'deadbeefdeadbeef', op: 'replace' }))
      .toThrowError(/TARGET_NOT_FOUND/)

    dispose()
  })
})

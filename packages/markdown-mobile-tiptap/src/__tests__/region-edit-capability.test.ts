/**
 * 区域编辑协议能力边界测试
 *
 * 实证三个产品关键问题：
 * 1. 自定义插件节点（speaker / image / ctx-ref）能否经协议通道写入
 * 2. 无任何注释 marker 的旧文档能否被精确改动（hash 锚点不依赖文档内标记）
 * 3. 能否精确指定插入位置（insertBefore / insertAfter）
 *
 * 内容通道：markdown（含 `![alt](src)` 图片语法）/ html / json（ProseMirror JSON，无损首选）
 */

import { createRegionEdit, RegionEdit } from 'tiptap-ai'
import { CtxRefNode, SummaryBoundaryNode } from 'tiptap-nodes/ctx-ref'
import { SpeakerNode } from 'tiptap-nodes/speaker'
import { describe, expect, it } from 'vitest'
import { makeEditor } from './helpers'

function setup(markdown = '# 原有文档\n\n这是一篇完全没有任何注释标记的旧文档') {
  const ctx = makeEditor('', [CtxRefNode, SummaryBoundaryNode, SpeakerNode, RegionEdit])
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

describe('1. 自定义插件节点写入', () => {
  it('markdown 通道：speaker / ctx-ref 解析为自定义节点', () => {
    const { editor, regionEdit, dispose } = setup()
    const { blocks } = regionEdit.readBlocks()

    const { results } = regionEdit.applyOperations({
      operations: [{
        target: blocks[0].hash,
        op: 'insertAfter',
        content: {
          format: 'markdown',
          value: '[speaker:0] 这是说话人发言\n\n***被采纳的补充。***<!--ctx-ref:note:9-->',
        },
      }],
    })
    expect(results[0].success).toBe(true)

    const json = JSON.stringify(editor.getJSON())
    expect(json).toContain('"speaker"')
    expect(json).toContain('"ctxRef"')

    dispose()
  })

  it('html 通道：<img> 解析为自定义 image 节点（含自动 id）', () => {
    const { editor, regionEdit, dispose } = setup()
    const { blocks } = regionEdit.readBlocks()

    const { results } = regionEdit.applyOperations({
      operations: [{
        target: blocks[0].hash,
        op: 'insertAfter',
        content: { format: 'html', value: '<p><img src="https://example.com/a.png" alt="白板图"></p>' },
      }],
    })
    expect(results[0].success).toBe(true)

    const imageNode = editor.getJSON().content!
      .flatMap((n: any) => n.content ?? [])
      .find((n: any) => n.type === 'image')
    expect(imageNode?.attrs?.src).toBe('https://example.com/a.png')
    expect(imageNode?.attrs?.id).toBeTruthy()

    dispose()
  })

  it('markdown 通道：![alt](src) 解析为 image 节点，且可序列化回 markdown', () => {
    const { editor, regionEdit, dispose } = setup()
    const { blocks } = regionEdit.readBlocks()

    regionEdit.applyOperations({
      operations: [{
        target: blocks[0].hash,
        op: 'insertAfter',
        content: { format: 'markdown', value: '![白板图](https://example.com/a.png)' },
      }],
    })

    const imageNode = editor.getJSON().content!
      .flatMap((n: any) => n.content ?? [])
      .find((n: any) => n.type === 'image')
    expect(imageNode?.attrs?.src).toBe('https://example.com/a.png')
    expect(imageNode?.attrs?.alt).toBe('白板图')

    /** 反向：节点 → markdown 不再丢图 */
    expect(editor.getMarkdown()).toContain('![白板图](https://example.com/a.png)')

    dispose()
  })

  it('json 通道：ProseMirror JSON 直接写入，渐变高亮与图片富属性无损', () => {
    const { editor, regionEdit, dispose } = setup()
    const { blocks } = regionEdit.readBlocks()

    const { results } = regionEdit.applyOperations({
      operations: [{
        target: blocks[0].hash,
        op: 'insertAfter',
        content: {
          format: 'json',
          value: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: '普通文字' },
                {
                  type: 'text',
                  text: '渐变高亮',
                  marks: [{ type: 'highlight', attrs: { color: 'skyBlue' } }],
                },
              ],
            },
            {
              type: 'paragraph',
              content: [{
                type: 'image',
                attrs: { src: 'https://example.com/b.png', width: 200, borderRadius: '8px' },
              }],
            },
          ],
        },
      }],
    })
    expect(results[0].success).toBe(true)

    expect(editor.getHTML()).toContain('data-color="skyBlue"')

    /** json 通道无损：width 等 markdown / html 表达不了的富属性直达节点 */
    const imageNode = editor.getJSON().content!
      .flatMap((n: any) => n.content ?? [])
      .find((n: any) => n.attrs?.src === 'https://example.com/b.png')
    expect(imageNode?.attrs?.width).toBe(200)
    expect(imageNode?.attrs?.borderRadius).toBe('8px')

    dispose()
  })

  it('json 通道：整个 doc 形态与 JSON 字符串形态同样接受', () => {
    const { editor, regionEdit, dispose } = setup()

    const { results } = regionEdit.applyOperations({
      operations: [
        {
          target: 'doc',
          op: 'append',
          content: {
            format: 'json',
            value: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'doc 形态' }] }] },
          },
        },
        {
          target: 'doc',
          op: 'append',
          content: {
            format: 'json',
            value: JSON.stringify({ type: 'paragraph', content: [{ type: 'text', text: '字符串形态' }] }),
          },
        },
      ],
    })
    expect(results.every(r => r.success)).toBe(true)

    const md = editor.getMarkdown()
    expect(md).toContain('doc 形态')
    expect(md).toContain('字符串形态')

    dispose()
  })
})

describe('2. 无 marker 旧文档可精确改动', () => {
  it('readBlocks 对任意文档生成 hash 锚点，无需文档内有任何标记', () => {
    const { regionEdit, dispose } = setup('随便一篇旧文章\n\n第二段\n\n第三段')

    const { blocks } = regionEdit.readBlocks()
    expect(blocks).toHaveLength(3)
    blocks.forEach(b => expect(b.hash).toMatch(/^[0-9a-f]{16}/))

    const { results } = regionEdit.applyOperations({
      operations: [{
        target: blocks[1].hash,
        op: 'replace',
        content: { format: 'markdown', value: '旧文档的第二段被精确替换了' },
      }],
    })
    expect(results[0].success).toBe(true)

    dispose()
  })
})

describe('3. 精确指定插入位置', () => {
  it('insertBefore / insertAfter 落点准确', () => {
    const { editor, regionEdit, dispose } = setup('第一段\n\n第二段')
    const { blocks } = regionEdit.readBlocks()

    regionEdit.applyOperations({
      operations: [
        { target: blocks[1].hash, op: 'insertBefore', content: { format: 'markdown', value: '插在第二段前' } },
        { target: blocks[0].hash, op: 'insertAfter', content: { format: 'markdown', value: '插在第一段后' } },
      ],
    })

    const md = editor.getMarkdown()
    const order = ['第一段', '插在第一段后', '插在第二段前', '第二段']
    const indexes = order.map(s => md.indexOf(s))
    indexes.forEach(i => expect(i).toBeGreaterThan(-1))
    expect([...indexes]).toEqual([...indexes].sort((a, b) => a - b))

    dispose()
  })
})

describe('4. 老文档自举：无任何 marker 的旧文档接入新功能', () => {
  it('第一次插入自带哨兵 → 文档升级 → 第二次更新可哨兵定位', () => {
    /** 老代码生成的文档：没有任何 ctx-ref / 哨兵 */
    const { editor, regionEdit, dispose } = setup('# 旧会议总结\n\n这是老版本生成的内容')

    /** 第一次：图片任务产出的内容【自带】哨兵与 marker，追加到文末 */
    const { results } = regionEdit.applyOperations({
      operations: [{
        target: 'doc',
        op: 'append',
        content: {
          format: 'markdown',
          value: [
            '<!--summary-added-images:start-->',
            '',
            '## Related images',
            '',
            '- 这张图补充了白板内容。<!--ctx-ref:image:101-->',
            '',
            '<!--summary-added-images:end-->',
          ].join('\n'),
        },
      }],
    })
    expect(results[0].success).toBe(true)

    /** 文档已升级：哨兵成为真实节点，可定位 */
    const { blocks } = regionEdit.readBlocks()
    const startIdx = blocks.findIndex(b => b.type === 'summaryBoundary' && b.markdown.includes('start'))
    expect(startIdx).toBeGreaterThan(-1)

    /** 第二次：按哨兵定位更新区块内容 */
    const { results: r2 } = regionEdit.applyOperations({
      operations: [{
        target: blocks[startIdx + 1].hash,
        op: 'replace',
        content: { format: 'markdown', value: '## Related images（第二轮更新）' },
      }],
    })
    expect(r2[0].success).toBe(true)

    const md = editor.getMarkdown()
    expect(md).toContain('# 旧会议总结')
    expect(md).toContain('## Related images（第二轮更新）')
    expect(md).toContain('<!--ctx-ref:image:101-->')
    expect(md).toContain('<!--summary-added-images:end-->')

    dispose()
  })
})

describe('5. 同一区域可多轮替换（非一次性）', () => {
  it('哨兵定位 + 重新读块：连续三轮更新同一区块', () => {
    const { editor, regionEdit, dispose } = setup([
      '# 总结',
      '',
      '<!--summary-added-images:start-->',
      '',
      '## Related images（第 0 版）',
      '',
      '<!--summary-added-images:end-->',
    ].join('\n'))

    for (let round = 1; round <= 3; round++) {
      /** 每轮重新读块：哨兵是稳定节点，区块内容变了它不变 */
      const { blocks } = regionEdit.readBlocks()
      const startIdx = blocks.findIndex(b => b.type === 'summaryBoundary' && b.markdown.includes('start'))
      expect(startIdx).toBeGreaterThan(-1)

      const { results } = regionEdit.applyOperations({
        operations: [{
          target: blocks[startIdx + 1].hash,
          op: 'replace',
          content: { format: 'markdown', value: `## Related images（第 ${round} 版）` },
        }],
      })
      expect(results[0].success).toBe(true)
    }

    const md = editor.getMarkdown()
    expect(md).toContain('第 3 版')
    expect(md).not.toContain('第 0 版')
    expect(md).toContain('<!--summary-added-images:start-->')
    expect(md).toContain('<!--summary-added-images:end-->')

    dispose()
  })

  it('newHash 链式更新：不重新读块，同一块连改三次', () => {
    const { editor, regionEdit, dispose } = setup('目标段落 v0')
    let hash = regionEdit.readBlocks().blocks[0].hash

    for (let round = 1; round <= 3; round++) {
      const { results } = regionEdit.applyOperations({
        operations: [{
          target: hash,
          op: 'replace',
          content: { format: 'markdown', value: `目标段落 v${round}` },
        }],
      })
      expect(results[0].success).toBe(true)
      /** 每次返回 newHash，直接作为下一轮目标，无需 readBlocks */
      hash = results[0].newHash! as string
    }

    expect(editor.getMarkdown()).toContain('目标段落 v3')

    dispose()
  })
})

describe('6. 哨兵区块含多个顶层块时的整体更新（upsert 语义）', () => {
  const START = '<!--summary-added-images:start-->'
  const END = '<!--summary-added-images:end-->'

  /** README §4.2 的标准实现：定位哨兵对 → 替换区间内全部块；残缺/缺失则重建 */
  function upsertRegion(regionEdit: any, innerValue: string, fullBlockValue: string) {
    const { blocks } = regionEdit.readBlocks()
    const startIdx = blocks.findIndex((b: any) => b.type === 'summaryBoundary' && b.markdown === START)
    const endIdx = startIdx === -1
      ? -1
      : blocks.findIndex((b: any, i: number) => i > startIdx && b.type === 'summaryBoundary' && b.markdown === END)

    if (startIdx === -1 || endIdx === -1) {
      const orphanOps = [startIdx, endIdx]
        .filter(i => i !== -1)
        .map(i => ({ target: blocks[i].hash, op: 'delete' as const }))
      return regionEdit.applyOperations({
        operations: [
          ...orphanOps,
          { target: 'doc', op: 'append', content: { format: 'markdown', value: fullBlockValue } },
        ],
      })
    }

    const inner = blocks.slice(startIdx + 1, endIdx)
    const operations = inner.length === 0
      ? [{ target: blocks[startIdx].hash, op: 'insertAfter' as const, content: { format: 'markdown', value: innerValue } }]
      : [
          { target: inner[0].hash, op: 'replace' as const, content: { format: 'markdown', value: innerValue } },
          ...inner.slice(1).map((b: any) => ({ target: b.hash, op: 'delete' as const })),
        ]
    return regionEdit.applyOperations({ operations })
  }

  const FULL_BLOCK = [START, '', '## Related images', '', '- 新图片说明', '', END].join('\n')

  it('区块含标题 + 列表两个块：整体替换无旧内容残留', () => {
    const { editor, regionEdit, dispose } = setup([
      '# 总结',
      '',
      START,
      '',
      '## Related images',
      '',
      '- 旧的图片说明一',
      '- 旧的图片说明二',
      '',
      END,
      '',
      '区块外的尾部段落',
    ].join('\n'))

    const { results } = upsertRegion(regionEdit, '## Related images（v2）\n\n- 全新说明', FULL_BLOCK)
    expect(results.every((r: any) => r.success)).toBe(true)

    const md = editor.getMarkdown()
    expect(md).toContain('## Related images（v2）')
    expect(md).toContain('全新说明')
    /** 旧列表必须无残留 */
    expect(md).not.toContain('旧的图片说明')
    /** 哨兵与区块外内容完好 */
    expect(md).toContain(START)
    expect(md).toContain(END)
    expect(md).toContain('区块外的尾部段落')

    dispose()
  })

  it('哨兵残缺（只剩 start）：清掉孤哨兵并整体重建', () => {
    const { editor, regionEdit, dispose } = setup(['# 总结', '', START, '', '残缺区块的内容'].join('\n'))

    const { results } = upsertRegion(regionEdit, '不会用到', FULL_BLOCK)
    expect(results.every((r: any) => r.success)).toBe(true)

    const md = editor.getMarkdown()
    /** 孤哨兵被清掉，重建后 start/end 各恰好一个 */
    expect(md.split(START).length - 1).toBe(1)
    expect(md.split(END).length - 1).toBe(1)
    expect(md).toContain('- 新图片说明')

    dispose()
  })

  it('哨兵对存在但区块为空：贴着 start 后插入', () => {
    const { editor, regionEdit, dispose } = setup(['# 总结', '', START, '', END].join('\n'))

    const { results } = upsertRegion(regionEdit, '## Related images\n\n- 填充内容', FULL_BLOCK)
    expect(results.every((r: any) => r.success)).toBe(true)

    const md = editor.getMarkdown()
    expect(md).toContain('- 填充内容')
    /** 内容落在两哨兵之间 */
    expect(md.indexOf('填充内容')).toBeGreaterThan(md.indexOf(START))
    expect(md.indexOf('填充内容')).toBeLessThan(md.indexOf(END))

    dispose()
  })
})

describe('7. 同类哨兵存在多对时仍可精确替换', () => {
  const START = '<!--summary-added-images:start-->'
  const END = '<!--summary-added-images:end-->'

  /** 枚举文档中全部哨兵区块（按文档顺序） */
  function listRegions(blocks: any[]) {
    const regions: { startIdx: number, endIdx: number, inner: any[] }[] = []
    let cursor = 0
    while (cursor < blocks.length) {
      const startIdx = blocks.findIndex((b, i) => i >= cursor && b.type === 'summaryBoundary' && b.markdown === START)
      if (startIdx === -1)
        break
      const endIdx = blocks.findIndex((b, i) => i > startIdx && b.type === 'summaryBoundary' && b.markdown === END)
      if (endIdx === -1)
        break
      regions.push({ startIdx, endIdx, inner: blocks.slice(startIdx + 1, endIdx) })
      cursor = endIdx + 1
    }
    return regions
  }

  it('两对完全相同的哨兵：hash 按 #n 消歧，只替换第二个区块、第一个不动', () => {
    const { editor, regionEdit, dispose } = setup([
      '# 总结',
      '',
      START,
      '',
      '第一个区块的内容',
      '',
      END,
      '',
      '中间普通段落',
      '',
      START,
      '',
      '第二个区块的内容',
      '',
      END,
    ].join('\n'))

    const { blocks } = regionEdit.readBlocks()

    /** 同内容的哨兵块 hash 带 #n 后缀，互不相同 */
    const sentinels = blocks.filter(b => b.type === 'summaryBoundary')
    expect(sentinels).toHaveLength(4)
    expect(new Set(sentinels.map(b => b.hash)).size).toBe(4)

    /** 枚举出两个区块，精确替换第二个 */
    const regions = listRegions(blocks)
    expect(regions).toHaveLength(2)

    const { results } = regionEdit.applyOperations({
      operations: [{
        target: regions[1].inner[0].hash,
        op: 'replace',
        content: { format: 'markdown', value: '只有第二个被改了' },
      }],
    })
    expect(results[0].success).toBe(true)

    const md = editor.getMarkdown()
    expect(md).toContain('第一个区块的内容')
    expect(md).toContain('只有第二个被改了')
    expect(md).not.toContain('第二个区块的内容')
    expect(md).toContain('中间普通段落')

    dispose()
  })
})

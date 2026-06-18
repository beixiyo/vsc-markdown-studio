/**
 * 区域编辑协议能力边界测试
 *
 * 实证核心能力：
 * 1. Markdown / HTML / JSON 通道能否经协议通道写入
 * 2. 普通旧文档能否被精确改动（hash 锚点不依赖文档内标记）
 * 3. 能否精确指定插入位置（insertBefore / insertAfter）
 *
 * 内容通道：markdown（含 `![alt](src)` 图片语法）/ html / json（ProseMirror JSON，无损首选）
 */

import { createRegionEdit, RegionEdit } from 'tiptap-ai'
import { describe, expect, it } from 'vitest'
import { makeEditor } from './helpers'

function setup(markdown = '# 原有文档\n\n这是一篇完全没有任何注释标记的旧文档') {
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

describe('1. 内容通道写入', () => {
  it('markdown 通道：标题、列表和图片能写入并往返', () => {
    const { editor, regionEdit, dispose } = setup()
    const { blocks } = regionEdit.readBlocks()

    const { results } = regionEdit.applyOperations({
      operations: [{
        target: blocks[0].hash,
        op: 'insertAfter',
        content: {
          format: 'markdown',
          value: '## 新增章节\n\n- 第一项\n- 第二项\n\n![白板图](https://example.com/a.png)',
        },
      }],
    })
    expect(results[0].success).toBe(true)

    const md = editor.getMarkdown()
    expect(md).toContain('## 新增章节')
    expect(md).toContain('- 第一项')
    expect(md).toContain('![白板图](https://example.com/a.png)')

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

describe('5. 同一区域可多轮替换（非一次性）', () => {
  it('重新读块定位（按标题）：连续三轮更新同一区块', () => {
    const { editor, regionEdit, dispose } = setup([
      '# 总结',
      '',
      '## 固定锚点标题',
      '',
      '区块内容（第 0 版）',
    ].join('\n'))

    for (let round = 1; round <= 3; round++) {
      /** 每轮重新读块：锚点标题不动，定位其后的内容块替换 */
      const { blocks } = regionEdit.readBlocks()
      const anchorIdx = blocks.findIndex(b => b.markdown.includes('固定锚点标题'))
      expect(anchorIdx).toBeGreaterThan(-1)

      const { results } = regionEdit.applyOperations({
        operations: [{
          target: blocks[anchorIdx + 1].hash,
          op: 'replace',
          content: { format: 'markdown', value: `区块内容（第 ${round} 版）` },
        }],
      })
      expect(results[0].success).toBe(true)
    }

    const md = editor.getMarkdown()
    expect(md).toContain('第 3 版')
    expect(md).not.toContain('第 0 版')
    expect(md).toContain('## 固定锚点标题')

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

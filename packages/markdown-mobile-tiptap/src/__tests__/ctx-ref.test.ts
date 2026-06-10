/**
 * ctx-ref marker 端到端测试（mobile 完整扩展栈）
 *
 * 验证算法侧 V2 的 HTML comment marker 在 mobile 编辑器全家桶
 * （speaker / image / gradient-highlight / task 共存）下的存活与协作，
 * 以及与 AI 区域编辑（hash 锚点协议）的配合
 */

import { createRegionEdit, RegionEdit } from 'tiptap-ai'
import { CtxRefNode, SummaryBoundaryNode } from 'tiptap-nodes/ctx-ref'
import { SpeakerNode } from 'tiptap-nodes/speaker'
import { describe, expect, it } from 'vitest'
import { makeEditor } from './helpers'

const SUMMARY_MD = [
  '# 会议总结',
  '',
  '[speaker:0] 提出了关键结论',
  '',
  '***这个结论需要关注。***<!--ctx-ref:mark:mark_123-->',
  '',
  '***这个补充被采纳进总结。***<!--ctx-ref:note:1-->',
  '',
  '<!--summary-added-images:start-->',
  '',
  '## Related images',
  '',
  '- 这张图补充了会议中的白板内容。<!--ctx-ref:image:101-->',
  '',
  '<!--summary-added-images:end-->',
].join('\n')

const ALL_MARKERS = [
  '<!--ctx-ref:mark:mark_123-->',
  '<!--ctx-ref:note:1-->',
  '<!--ctx-ref:image:101-->',
  '<!--summary-added-images:start-->',
  '<!--summary-added-images:end-->',
]

function setup() {
  const ctx = makeEditor('', [CtxRefNode, SummaryBoundaryNode, SpeakerNode, RegionEdit])
  ctx.editor.commands.setContent(SUMMARY_MD, { contentType: 'markdown' })
  return ctx
}

describe('完整扩展栈下的 marker 存活', () => {
  it('与 speaker 等自定义 token 共存时 roundtrip 全部存活', () => {
    const { editor, cleanup } = setup()

    const out = editor.getMarkdown()
    ALL_MARKERS.forEach(marker => expect(out).toContain(marker))
    expect(out).toContain('[speaker:0]')
    expect(out).not.toContain('******')

    cleanup()
  })

  it('用户编辑其他段落后 marker 仍存活', () => {
    const { editor, cleanup } = setup()

    editor.commands.insertContentAt(editor.state.doc.content.size, '<p>用户手动补充的内容</p>')
    const out = editor.getMarkdown()
    ALL_MARKERS.forEach(marker => expect(out).toContain(marker))

    cleanup()
  })
})

describe('与 AI 区域编辑协议配合', () => {
  it('readBlocks 输出的块 markdown 中 marker 原样保留（变更承接的定位依据）', () => {
    const { editor, cleanup } = setup()
    const regionEdit = createRegionEdit(editor)

    const { blocks } = regionEdit.readBlocks()
    const allMd = blocks.map(b => b.markdown).join('\n')
    expect(allMd).toContain('<!--ctx-ref:note:1-->')
    expect(allMd).toContain('<!--summary-added-images:start-->')

    regionEdit.destroy()
    cleanup()
  })

  it('哨兵区块可定位，并经 region-edit 假流式整体替换', () => {
    const { editor, cleanup } = setup()
    const regionEdit = createRegionEdit(editor)

    /** 定位 start 哨兵块（节点查询，而非字符串匹配） */
    const { blocks } = regionEdit.readBlocks()
    const startIdx = blocks.findIndex(b => b.type === 'summaryBoundary' && b.markdown.includes('start'))
    expect(startIdx).toBeGreaterThan(-1)

    /** 假流式：把图片区块第一个内容块整体替换 */
    const target = blocks[startIdx + 1]
    const { streamId } = regionEdit.beginStream({ target: target.hash, op: 'replace' })
    regionEdit.pushChunk(streamId, '## Related images（更新）')
    regionEdit.endStream(streamId)
    regionEdit.accept()

    const out = editor.getMarkdown()
    expect(out).toContain('## Related images（更新）')
    /** 区块外的 marker 不受影响 */
    expect(out).toContain('<!--ctx-ref:note:1-->')
    expect(out).toContain('<!--summary-added-images:end-->')

    regionEdit.destroy()
    cleanup()
  })
})

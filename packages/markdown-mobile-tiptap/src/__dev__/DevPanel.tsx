import { useEffect, useState } from 'react'
import { devFixture } from './fixture'

/**
 * 开发环境专用调试面板：一键调用 MDBridge 上的每个方法以肉眼验证渲染
 * 生产构建由 `import.meta.env.DEV` 分支裁掉
 */

const SAMPLE_MARKDOWN = `# 一级标题 Heading 1

## 二级标题 Heading 2

### 三级标题 Heading 3

#### 四级标题 Heading 4

这是一段普通正文，测试段落的字体大小和行高。包含 **加粗**、*斜体*、~~删除线~~、\`行内 code\`。

第二段正文。English text mixed with 中文，测试混排效果。The quick brown fox jumps over the lazy dog.

- 无序列表 A
- 无序列表 B
  - 嵌套项
    - 深层嵌套

1. 有序列表第一项
2. 有序列表第二项
   1. 嵌套有序

- [ ] 任务未完成
- [x] 任务已完成

> 引用文本：好的设计是尽可能少的设计。
>
> 第二行引用，包含 **加粗** 和 \`代码\`。

\`\`\`typescript
const x: number = 42
const greet = (name: string) => \`Hello, \${name}!\`
console.log(greet('World'))
\`\`\`

| 属性 | 旧版 | 新版 | 差值 |
|------|------|------|------|
| 段落 | 16.5px | 14px | -2.5px |
| H1 | 18px | 17px | -1px |

[链接](https://example.com) 和图片 ![alt](https://picsum.photos/seed/sample/400/200)

---

[speaker:0] 这是说话人甲的发言内容，测试说话人标记的样式。

[speaker:1] 这是说话人乙的回应，确认说话人切换正常显示。
`

const SAMPLE_SPEAKERS = [
  { name: '说话人甲', originalLabel: 0, label: 0 },
  { name: '说话人乙', originalLabel: 1, label: 1 },
]

/** 追加到文末的 ctx-ref 增量示例（模拟算法侧新采纳一条 Note，不动现有内容） */
const CTX_REF_APPEND = `***性能优化方案被采纳进了总结。***<!--ctx-ref:note:2-->`

let directReplaceCount = 0

const SENTINEL_START = '<!--summary-added-images:start-->'
const SENTINEL_END = '<!--summary-added-images:end-->'

/** 定位哨兵对，返回两哨兵之间的全部块（README §4.2 同款逻辑） */
function locateAddedImagesRegion() {
  const { blocks } = window.MDBridge.aiEdit.readBlocks()
  const startIdx = blocks.findIndex(b => b.type === 'summaryBoundary' && b.markdown === SENTINEL_START)
  const endIdx = startIdx === -1
    ? -1
    : blocks.findIndex((b, i) => i > startIdx && b.type === 'summaryBoundary' && b.markdown === SENTINEL_END)
  if (startIdx === -1 || endIdx === -1)
    return null
  return { blocks, startIdx, endIdx, inner: blocks.slice(startIdx + 1, endIdx) }
}

/** fixture「ctx-ref 引用标记」一节自带的 marker，验证存活用 */
const CTX_REF_MARKERS = [
  '<!--ctx-ref:mark:mark_123-->',
  '<!--ctx-ref:note:1-->',
  '<!--ctx-ref:image:101-->',
  '<!--summary-added-images:start-->',
  '<!--summary-added-images:end-->',
]

const IMG_URLS = [
  'https://picsum.photos/seed/a/200/120',
  'https://picsum.photos/seed/b/200/120',
]

function safeCall(name: string, fn: () => any) {
  try {
    const r = fn()
    console.log('[DevPanel]', name, '→', r)
    return r
  }
  catch (e) {
    console.error('[DevPanel]', name, 'FAILED', e)
  }
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div style={ { borderTop: '1px solid #333', padding: '6px 8px' } }>
      <div style={ { fontSize: 11, color: '#9aa', margin: '2px 0 4px' } }>{ title }</div>
      <div style={ { display: 'flex', flexWrap: 'wrap', gap: 4 } }>{ children }</div>
    </div>
  )
}

function Btn({ label, onClick }: { label: string, onClick: () => void }) {
  return (
    <button
      onClick={ onClick }
      style={ {
        background: '#1f2937',
        color: '#e5e7eb',
        border: '1px solid #374151',
        borderRadius: 4,
        padding: '3px 8px',
        fontSize: 12,
        cursor: 'pointer',
      } }
    >
      { label }
    </button>
  )
}

export default function DevPanel() {
  const [open, setOpen] = useState(true)
  const [output, setOutput] = useState('')

  /** 挂载即注入默认 fixture，确保编辑器一开始就有真实数据可看 */
  useEffect(() => {
    /** 等 MDBridge 注入一帧后再调用，避免与初始化竞争 */
    const t = setTimeout(() => {
      window.MDBridge?.setContentWithSpeakers?.(devFixture)
    }, 0)
    return () => clearTimeout(t)
  }, [])

  const bridge = () => window.MDBridge
  const show = (label: string, v: any) => {
    console.log('[DevPanel]', label, '→', v)
    setOutput(`${label}:\n${typeof v === 'string'
      ? v
      : JSON.stringify(v, null, 2)}`)
  }

  return (
    <div
      style={ {
        position: 'fixed',
        right: 8,
        bottom: 8,
        zIndex: 9999,
        width: open
          ? 340
          : 72,
        maxHeight: '85vh',
        background: '#111827',
        color: '#e5e7eb',
        border: '1px solid #374151',
        borderRadius: 6,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 12,
        overflow: 'auto',
        boxShadow: '0 4px 18px rgba(0,0,0,0.35)',
      } }
    >
      <div
        style={ { display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: '#0b1221' } }
      >
        <strong>MDBridge Dev</strong>
        <button
          onClick={ () => setOpen(v => !v) }
          style={ { background: 'transparent', color: '#9aa', border: 0, cursor: 'pointer' } }
        >
          { open
            ? '−'
            : '+' }
        </button>
      </div>

      { !open
        ? null
        : (
            <>
              <Section title="Content">
                <Btn label="setMarkdown(sample)" onClick={ () => safeCall('setMarkdown', () => bridge().setMarkdown(SAMPLE_MARKDOWN)) } />
                <Btn label="setContentWithSpeakers(fixture)" onClick={ () => safeCall('setContentWithSpeakers', () => bridge().setContentWithSpeakers(devFixture)) } />
                <Btn label="setContentWithSpeakers(sample+speakers)" onClick={ () => safeCall('setContentWithSpeakers', () => bridge().setContentWithSpeakers({ content: SAMPLE_MARKDOWN, speakers: SAMPLE_SPEAKERS })) } />
                <Btn label="setSpeakers(甲/乙)" onClick={ () => safeCall('setSpeakers', () => bridge().setSpeakers(SAMPLE_SPEAKERS)) } />
                <Btn label="getMarkdown" onClick={ () => show('getMarkdown', bridge().getMarkdown()) } />
                <Btn label="getHTML" onClick={ () => show('getHTML', bridge().getHTML()) } />
                <Btn label="getJSON" onClick={ () => show('getJSON', bridge().getJSON()) } />
              </Section>

              <Section title="ctx-ref marker（页面默认内容里已有「## ctx-ref 引用标记」一节）">
                <Btn
                  label="① 追加新 Note 到文末（不动现有内容）"
                  onClick={ () => safeCall('aiEdit.append(ctxRef)', () => bridge().aiEdit.applyOperations({
                    operations: [{
                      target: 'doc',
                      op: 'append',
                      content: { format: 'markdown', value: CTX_REF_APPEND },
                    }],
                  })) }
                />
                <Btn
                  label="② 直接替换图片区块（非流式）"
                  onClick={ () => {
                    /** 哨兵对定位 → 替换区间内全部块（第一块替换、其余删除），一次性生效 */
                    const region = locateAddedImagesRegion()
                    if (!region || region.inner.length === 0) {
                      show('直接替换', '未找到完整的 summary-added-images 哨兵区块')
                      return
                    }

                    directReplaceCount += 1
                    const { results } = bridge().aiEdit.applyOperations({
                      operations: [
                        {
                          target: region.inner[0].hash,
                          op: 'replace',
                          content: { format: 'markdown', value: `### Related images（直接替换第 ${directReplaceCount} 次）\n\n- 第 ${directReplaceCount} 版图片说明` },
                        },
                        ...region.inner.slice(1).map(b => ({ target: b.hash, op: 'delete' as const })),
                      ],
                    })
                    show('直接替换', results.every(r => r.success)
                      ? `成功（第 ${directReplaceCount} 次），区间 ${region.inner.length} 个块已整体替换\n连点本按钮可验证同一区块的多轮替换；可 undo 撤销`
                      : `部分失败：${JSON.stringify(results)}`)
                  } }
                />
                <Btn
                  label="③ 假流式更新图片区块（哨兵定位）"
                  onClick={ () => {
                    const region = locateAddedImagesRegion()
                    if (!region || region.inner.length === 0) {
                      show('假流式', '未找到完整的 summary-added-images 哨兵区块')
                      return
                    }

                    /** 流式只能对单个目标：先把区间内多余的块删掉，再对第一块流式替换 */
                    if (region.inner.length > 1) {
                      bridge().aiEdit.applyOperations({
                        operations: region.inner.slice(1).map(b => ({ target: b.hash, op: 'delete' as const })),
                      })
                    }
                    const { streamId } = bridge().aiEdit.beginStream({ target: region.inner[0].hash, op: 'replace' })
                    const updated = `### Related images（图片任务已更新）`
                    let pos = 0
                    const timer = setInterval(() => {
                      if (pos >= updated.length) {
                        clearInterval(timer)
                        bridge().aiEdit.endStream(streamId)
                        bridge().aiEdit.accept()
                        show('假流式', '完成：哨兵区块首块已流式替换，区块外内容未动（可 undo 撤销）')
                        return
                      }
                      bridge().aiEdit.pushChunk(streamId, updated.slice(pos, pos + 4))
                      pos += 4
                    }, 80)
                  } }
                />
                <Btn
                  label="④ 验证 marker 存活"
                  onClick={ () => {
                    const md = bridge().getMarkdown()
                    const checks = CTX_REF_MARKERS.map(m => `${md.includes(m)
                      ? '✓'
                      : '✗'} ${m}`)
                    checks.push(md.includes('******')
                      ? '✗ 出现悬空 *** 脏数据'
                      : '✓ 无悬空 *** 脏数据')
                    show('marker 存活检查', checks.join('\n'))
                  } }
                />
              </Section>

              <Section title="Block commands">
                <Btn label="H1" onClick={ () => bridge().command.setHeading(1) } />
                <Btn label="H2" onClick={ () => bridge().command.setHeading(2) } />
                <Btn label="H3" onClick={ () => bridge().command.setHeading(3) } />
                <Btn label="Paragraph" onClick={ () => bridge().command.setParagraph() } />
                <Btn label="• List" onClick={ () => bridge().command.setUnorderedList() } />
                <Btn label="1. List" onClick={ () => bridge().command.setOrderedList() } />
                <Btn label="☐ CheckList" onClick={ () => bridge().command.setCheckList() } />
              </Section>

              <Section title="Inline / Styles">
                <Btn label="Bold" onClick={ () => bridge().command.setBold() } />
                <Btn label="Italic" onClick={ () => bridge().command.setItalic() } />
                <Btn label="Underline" onClick={ () => bridge().command.setUnderline() } />
                <Btn label="toggle Bold" onClick={ () => bridge().toggleStyles({ bold: true }) } />
                <Btn label="toggle B+I" onClick={ () => bridge().toggleStyles({ bold: true, italic: true }) } />
                <Btn label="remove Bold" onClick={ () => bridge().removeStyles({ bold: true }) } />
                <Btn label="Gradient mysticPurpleBlue" onClick={ () => bridge().command.setGradient('mysticPurpleBlue') } />
                <Btn label="Gradient tropicalSummer" onClick={ () => bridge().command.setGradient('tropicalSummer') } />
                <Btn label="unset Gradient" onClick={ () => bridge().command.unsetGradient() } />
                <Btn label="getActiveStyles" onClick={ () => show('getActiveStyles', bridge().getActiveStyles()) } />
              </Section>

              <Section title="Images">
                <Btn
                  label="top · block (id=top-a,top-b)"
                  onClick={ () => safeCall('top/block', () => bridge().setImage({
                    at: 'top',
                    preset: 'block',
                    images: [
                      { src: IMG_URLS[0], id: 'top-a' },
                      { src: IMG_URLS[1], id: 'top-b' },
                    ],
                  })) }
                />
                <Btn
                  label="bottom · block"
                  onClick={ () => safeCall('bottom/block', () => bridge().setImage({
                    at: 'bottom',
                    preset: 'block',
                    images: IMG_URLS.map(src => ({ src })),
                  })) }
                />
                <Btn
                  label="cursor · block"
                  onClick={ () => safeCall('cursor/block', () => bridge().setImage({
                    at: 'cursor',
                    preset: 'block',
                    images: [{ src: IMG_URLS[0] }],
                  })) }
                />
                <Btn
                  label="cursor · inline (1em)"
                  onClick={ () => safeCall('cursor/inline', () => bridge().setImage({
                    at: 'cursor',
                    preset: 'inline',
                    images: [{ src: IMG_URLS[0] }],
                  })) }
                />
                <Btn
                  label="cursor · custom (aspect 16/9)"
                  onClick={ () => safeCall('cursor/custom', () => bridge().setImage({
                    at: 'cursor',
                    images: [{ src: IMG_URLS[0], id: 'hero', width: '100%', aspectRatio: '16/9', borderRadius: '12px' }],
                  })) }
                />
                <Btn
                  label="updateImage(top-a → 200px)"
                  onClick={ () => safeCall('update', () => bridge().updateImage({ id: 'top-a', attrs: { width: 200 } })) }
                />
                <Btn
                  label="removeImage(top-b)"
                  onClick={ () => safeCall('remove', () => bridge().removeImage({ id: 'top-b' })) }
                />
                <Btn
                  label="getImageAttrs(top-a)"
                  onClick={ () => show('getImageAttrs(top-a)', bridge().getImageAttrs('top-a')) }
                />
              </Section>

              <Section title="Cursor / Selection">
                <Btn label="getTextCursorPosition" onClick={ () => show('cursor', bridge().getTextCursorPosition()) } />
                <Btn label="getSelectedText" onClick={ () => show('selected', bridge().getSelectedText()) } />
                <Btn label="focus" onClick={ () => bridge().focus() } />
              </Section>

              <Section title="Editor state">
                <Btn label="isEditable" onClick={ () => show('isEditable', bridge().isEditable()) } />
                <Btn label="setEditable(false)" onClick={ () => bridge().setEditable(false) } />
                <Btn label="setEditable(true)" onClick={ () => bridge().setEditable(true) } />
                <Btn label="isEmpty" onClick={ () => show('isEmpty', bridge().isEmpty()) } />
                <Btn label="undo" onClick={ () => bridge().undo() } />
                <Btn label="redo" onClick={ () => bridge().redo() } />
              </Section>

              <Section title="Text Direction">
                <Btn label="RTL" onClick={ () => safeCall('setTextDirection', () => bridge().setTextDirection('rtl')) } />
                <Btn label="LTR" onClick={ () => safeCall('setTextDirection', () => bridge().setTextDirection('ltr')) } />
                <Btn label="Auto" onClick={ () => safeCall('setTextDirection', () => bridge().setTextDirection('auto')) } />
              </Section>

              <Section title="Layout">
                <Btn label="setBottomMargin(160)" onClick={ () => bridge().setBottomMargin(160) } />
                <Btn label="setBottomMargin(0)" onClick={ () => bridge().setBottomMargin(0) } />
              </Section>

              <Section title="Typography">
                <Btn
                  label="大号（老年模式）"
                  onClick={ () => safeCall('setTypography/large', () => bridge().setTypography({
                    heading1: { fontSize: '22px', fontWeight: '700' },
                    heading2: { fontSize: '20px', fontWeight: '700' },
                    heading3: { fontSize: '19px' },
                    paragraph: { fontSize: '18px', lineHeight: '2' },
                    list: { fontSize: '18px' },
                    code: { fontSize: '14px' },
                    inlineCode: { fontSize: '16px' },
                    blockquote: { fontSize: '18px' },
                  })) }
                />
                <Btn
                  label="小号"
                  onClick={ () => safeCall('setTypography/small', () => bridge().setTypography({
                    heading1: { fontSize: '16px' },
                    heading2: { fontSize: '15px' },
                    heading3: { fontSize: '14px' },
                    paragraph: { fontSize: '13px', lineHeight: '1.6' },
                    list: { fontSize: '13px' },
                    code: { fontSize: '11px' },
                  })) }
                />
                <Btn
                  label="重置默认"
                  onClick={ () => safeCall('setTypography/reset', () => bridge().setTypography({})) }
                />
              </Section>

              <div style={ { padding: 8, borderTop: '1px solid #333' } }>
                <div style={ { fontSize: 11, color: '#9aa', marginBottom: 4 } }>Output</div>
                <pre
                  style={ {
                    background: '#0b1221',
                    color: '#cbd5e1',
                    padding: 6,
                    maxHeight: 200,
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    margin: 0,
                    fontSize: 11,
                  } }
                >
                  { output || '(点按钮触发；getX 类方法会把结果打在这里，其余写到控制台)' }
                </pre>
              </div>
            </>
          ) }
    </div>
  )
}

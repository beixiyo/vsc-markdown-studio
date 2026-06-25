import type { ReactNode } from 'react'
import { memo, useEffect, useState } from 'react'
import { devFixture } from './fixture'

/**
 * 开发环境专用调试面板：一键调用 MDBridge 上的通用方法以肉眼验证渲染
 * 生产构建由 `import.meta.env.DEV` 分支裁掉
 *
 * 交互约定（避免在长文档里滚动半天找内容）：
 * - 「内容类」按钮点击前会先重置编辑器（清空 / 回到 fixture / 短样例），结果不再累积
 * - 调试项按场景分到若干 Tab，减少纵向滚动
 */

const SAMPLE_MARKDOWN = `# 一级标题 Heading 1

## 二级标题 Heading 2

### 三级标题 Heading 3

这是一段普通正文，测试段落的字体大小和行高。包含 **加粗**、*斜体*、~~删除线~~、\`行内 code\`。

第二段正文。English text mixed with 中文，测试混排效果。The quick brown fox jumps over the lazy dog.

- 无序列表 A
- 无序列表 B
  - 嵌套项

1. 有序列表第一项
2. 有序列表第二项

- [ ] 任务未完成
- [x] 任务已完成

> 引用文本：好的设计是尽可能少的设计。

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
`

/** 给图片类调试用的短正文：top / bottom / cursor 都能不滚动直接看到 */
const SHORT_MARKDOWN = `# 图片调试基线

这是一段用于挂载图片的短正文，方便 top / bottom / cursor 定位且无需滚动。

第二段，给 cursor 插入提供落点。
`

/** 流式 / AI edit 调试用的短基线：保留一段可 wrap 的正文与若干块，足够短，追加/插入结果立刻可见 */
const STREAM_FIXTURE = `## 流式调试基线

这是一段用于 wrap / 流式插入的普通正文，足够短，追加结果立刻可见。

- 列表项，给 readBlocks 多一个块。
`

const STREAM_MARKDOWN = [
  '## Streamed section',
  '',
  '这段内容通过 aiEdit 的流式接口追加到文末。',
  '',
  '- 支持分片写入',
  '- 支持预览后 accept',
].join('\n')

const LOADING_FRAME_MANUAL_ID = 'dev-loading-frame-manual'
const LOADING_FRAME_STREAM_ID = 'dev-loading-frame-stream'
const LOADING_FRAME_STREAM_CONTENT = [
  '## Follow-up actions',
  '',
  '- It shifts users from simply reading to actively engaging with content.',
  '- Next step: review the generated action list and assign owners.',
].join('\n')

const IMG_URLS = [
  'https://picsum.photos/seed/a/200/120',
  'https://picsum.photos/seed/b/200/120',
]

/** Tab 分栏定义：按调试场景合并 */
const TABS = [
  { key: 'content', label: '内容' },
  { key: 'stream', label: '流式' },
  { key: 'images', label: '图片' },
  { key: 'format', label: '排版' },
  { key: 'editor', label: '编辑器' },
] as const

type TabKey = (typeof TABS)[number]['key']

/** 内容类按钮点击前的重置策略 */
type ResetMode = 'none' | 'empty' | 'fixture' | 'short' | 'stream'

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

const Section = memo<SectionProps>(({ title, children }) => {
  return (
    <section className="border-b border-border px-4 py-3">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-text3">{ title }</div>
      <div className="flex flex-wrap gap-2">{ children }</div>
    </section>
  )
})

Section.displayName = 'Section'

const Btn = memo<BtnProps>(({ label, onClick }) => {
  return (
    <button
      className="min-h-8 rounded-md border border-border bg-background px-2.5 py-1.5 text-[12px] font-medium leading-4 text-text transition-colors hover:bg-background3 active:bg-background4"
      type="button"
      onClick={ onClick }
    >
      { label }
    </button>
  )
})

Btn.displayName = 'Btn'

export default function DevPanel() {
  const [open, setOpen] = useState(true)
  const [tab, setTab] = useState<TabKey>('content')
  const [output, setOutput] = useState('')

  /** 挂载即注入默认 fixture，确保编辑器一开始就有真实数据可看 */
  useEffect(() => {
    /** 等 MDBridge 注入一帧后再调用，避免与初始化竞争 */
    const t = setTimeout(() => {
      window.MDBridge?.setMarkdown?.(devFixture)
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

  /** 内容类调试前先重置编辑器，避免结果累积、需要滚动查找 */
  const reset = (mode: ResetMode) => {
    if (mode === 'none')
      return
    try {
      if (mode === 'empty')
        bridge().setMarkdown('')
      else if (mode === 'fixture')
        bridge().setMarkdown(devFixture)
      else if (mode === 'short')
        bridge().setMarkdown(SHORT_MARKDOWN)
      else if (mode === 'stream')
        bridge().setMarkdown(STREAM_FIXTURE)
    }
    catch (e) {
      console.error('[DevPanel]', `reset:${mode}`, 'FAILED', e)
    }
  }

  /** 包装一次点击：先按 mode 重置编辑器，再执行原动作 */
  const withReset = (mode: ResetMode, fn: () => void) => () => {
    reset(mode)
    fn()
  }

  return (
    <aside
      className={ open
        ? 'fixed right-0 top-0 z-[9999] flex h-dvh w-full flex-col border-l border-border bg-background text-text shadow-card sm:w-[420px]'
        : 'fixed right-0 top-0 z-[9999] flex h-dvh w-14 flex-col items-center border-l border-border bg-background text-text shadow-card' }
    >
      <header
        className={ open
          ? 'flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4'
          : 'flex h-12 shrink-0 items-center justify-center border-b border-border bg-background' }
      >
        { open && (
          <div>
            <strong className="block text-[13px] font-semibold leading-4 text-text">MDBridge Dev</strong>
            <span className="text-[11px] leading-4 text-text3">Mobile Markdown playground</span>
          </div>
        ) }
        <button
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background2 text-[16px] leading-none text-text2 transition-colors hover:bg-background3"
          type="button"
          onClick={ () => setOpen(v => !v) }
        >
          { open
            ? '−'
            : '+' }
        </button>
      </header>

      { !open
        ? null
        : (
            <>
              <nav className="flex shrink-0 border-b border-border bg-background">
                { TABS.map(t => (
                  <button
                    key={ t.key }
                    type="button"
                    className={ [
                      'flex-1 px-1 py-2 text-[12px] font-medium transition-colors',
                      tab === t.key
                        ? 'border-b-2 border-text text-text'
                        : 'border-b-2 border-transparent text-text3 hover:text-text2',
                    ].join(' ') }
                    onClick={ () => setTab(t.key) }
                  >
                    { t.label }
                  </button>
                )) }
              </nav>

              <div className="min-h-0 flex-1 overflow-y-auto">
                { tab === 'content' && (
                  <Section title="Content（整篇覆盖，自带重置）">
                    <Btn label="setMarkdown(fixture)" onClick={ () => safeCall('setMarkdown', () => bridge().setMarkdown(devFixture)) } />
                    <Btn label="setMarkdown(sample)" onClick={ () => safeCall('setMarkdown', () => bridge().setMarkdown(SAMPLE_MARKDOWN)) } />
                    <Btn label="getMarkdown" onClick={ () => show('getMarkdown', bridge().getMarkdown()) } />
                    <Btn label="getHTML" onClick={ () => show('getHTML', bridge().getHTML()) } />
                    <Btn label="getJSON" onClick={ () => show('getJSON', bridge().getJSON()) } />
                  </Section>
                ) }

                { tab === 'stream' && (
                  <>
                    <Section title="AI edit（点击前回到短基线，结果立刻可见）">
                      <Btn
                        label="readBlocks"
                        onClick={ withReset('stream', () => show('readBlocks', bridge().aiEdit.readBlocks())) }
                      />
                      <Btn
                        label="append paragraph"
                        onClick={ withReset('empty', () => safeCall('aiEdit.append', () => bridge().aiEdit.applyOperations({
                          operations: [{
                            target: 'doc',
                            op: 'append',
                            content: { format: 'markdown', value: '这是一段通过 aiEdit 追加的普通 Markdown 内容。' },
                          }],
                        }))) }
                      />
                      <Btn
                        label="stream append"
                        onClick={ withReset('empty', () => {
                          const { streamId } = bridge().aiEdit.beginStream({ target: 'doc', op: 'append' })
                          let pos = 0
                          const timer = setInterval(() => {
                            if (pos >= STREAM_MARKDOWN.length) {
                              clearInterval(timer)
                              bridge().aiEdit.endStream(streamId)
                              bridge().aiEdit.accept()
                              show('stream append', 'done')
                              return
                            }
                            bridge().aiEdit.pushChunk(streamId, STREAM_MARKDOWN.slice(pos, pos + 8))
                            pos += 8
                          }, 60)
                        }) }
                      />
                      <Btn label="accept" onClick={ () => safeCall('aiEdit.accept', () => bridge().aiEdit.accept()) } />
                      <Btn label="reject" onClick={ () => safeCall('aiEdit.reject', () => bridge().aiEdit.reject()) } />
                      <Btn label="getState" onClick={ () => show('aiEdit.getState', bridge().aiEdit.getState()) } />
                    </Section>

                    <Section title="AI loading frame（渐变外框 + 三点 loading）">
                      <Btn
                        label="① show placeholder(doc append)"
                        onClick={ withReset('empty', () => safeCall('loadingFrame/show placeholder', () => {
                          bridge().aiEdit.showLoadingFrame({
                            id: LOADING_FRAME_MANUAL_ID,
                            target: 'doc',
                            op: 'append',
                          })
                          show('loadingFrame', `已显示空占位 loading 外框：${LOADING_FRAME_MANUAL_ID}`)
                        })) }
                      />
                      <Btn
                        label="② wrap first paragraph"
                        onClick={ withReset('stream', () => safeCall('loadingFrame/wrap paragraph', () => {
                          const { blocks } = bridge().aiEdit.readBlocks()
                          const target = blocks.find(block => block.type === 'paragraph') ?? blocks[0]
                          if (!target) {
                            show('loadingFrame', '未找到可包裹的块')
                            return
                          }

                          bridge().aiEdit.showLoadingFrame({
                            id: LOADING_FRAME_MANUAL_ID,
                            target: target.hash,
                            op: 'replace',
                          })
                          show('loadingFrame', `已包裹块：${target.markdown.slice(0, 80)}`)
                        })) }
                      />
                      <Btn
                        label="③ hide + select（作用于已显示的外框，不重置）"
                        onClick={ () => safeCall('loadingFrame/hide select', () => {
                          const ok = bridge().aiEdit.hideLoadingFrame(LOADING_FRAME_MANUAL_ID, {
                            select: true,
                            behavior: 'smooth',
                            block: 'center',
                          })
                          show('loadingFrame', ok
                            ? `已隐藏并尝试选中：${LOADING_FRAME_MANUAL_ID}`
                            : `未找到：${LOADING_FRAME_MANUAL_ID}`)
                        }) }
                      />
                      <Btn
                        label="④ stream append + selectOnAccept"
                        onClick={ withReset('empty', () => {
                          const { streamId, loadingFrameId } = bridge().aiEdit.beginStream({
                            target: 'doc',
                            op: 'append',
                            format: 'markdown',
                            loadingFrame: {
                              id: LOADING_FRAME_STREAM_ID,
                              selectOnAccept: true,
                            },
                          })
                          let pos = 0
                          const timer = setInterval(() => {
                            if (pos >= LOADING_FRAME_STREAM_CONTENT.length) {
                              clearInterval(timer)
                              bridge().aiEdit.endStream(streamId)
                              bridge().aiEdit.accept()
                              show('loadingFrame stream', `完成：${loadingFrameId} 已清理，生成文本已选中`)
                              return
                            }
                            bridge().aiEdit.pushChunk(streamId, LOADING_FRAME_STREAM_CONTENT.slice(pos, pos + 8))
                            pos += 8
                          }, 60)
                        }) }
                      />
                    </Section>
                  </>
                ) }

                { tab === 'images' && (
                  <Section title="Images（点击前重置为短正文）">
                    <Btn
                      label="top block"
                      onClick={ withReset('short', () => safeCall('top/block', () => bridge().setImage({
                        at: 'top',
                        preset: 'block',
                        images: [
                          { src: IMG_URLS[0], id: 'top-a' },
                          { src: IMG_URLS[1], id: 'top-b' },
                        ],
                      }))) }
                    />
                    <Btn
                      label="bottom block"
                      onClick={ withReset('short', () => safeCall('bottom/block', () => bridge().setImage({
                        at: 'bottom',
                        preset: 'block',
                        images: IMG_URLS.map(src => ({ src })),
                      }))) }
                    />
                    <Btn
                      label="cursor block"
                      onClick={ withReset('short', () => safeCall('cursor/block', () => bridge().setImage({
                        at: 'cursor',
                        preset: 'block',
                        images: [{ src: IMG_URLS[0] }],
                      }))) }
                    />
                    <Btn
                      label="cursor inline"
                      onClick={ withReset('short', () => safeCall('cursor/inline', () => bridge().setImage({
                        at: 'cursor',
                        preset: 'inline',
                        images: [{ src: IMG_URLS[0] }],
                      }))) }
                    />
                    <Btn
                      label="cursor custom"
                      onClick={ withReset('short', () => safeCall('cursor/custom', () => bridge().setImage({
                        at: 'cursor',
                        images: [{ src: IMG_URLS[0], id: 'hero', width: '100%', aspectRatio: '16/9', borderRadius: '12px' }],
                      }))) }
                    />
                    <Btn
                      label="updateImage(top-a)"
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
                ) }

                { tab === 'format' && (
                  <>
                    <Section title="Block commands">
                      <Btn label="H1" onClick={ () => bridge().command.setHeading(1) } />
                      <Btn label="H2" onClick={ () => bridge().command.setHeading(2) } />
                      <Btn label="H3" onClick={ () => bridge().command.setHeading(3) } />
                      <Btn label="Paragraph" onClick={ () => bridge().command.setParagraph() } />
                      <Btn label="List" onClick={ () => bridge().command.setUnorderedList() } />
                      <Btn label="Numbered list" onClick={ () => bridge().command.setOrderedList() } />
                      <Btn label="CheckList" onClick={ () => bridge().command.setCheckList() } />
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

                    <Section title="Text Direction">
                      <Btn label="RTL" onClick={ () => safeCall('setTextDirection', () => bridge().setTextDirection('rtl')) } />
                      <Btn label="LTR" onClick={ () => safeCall('setTextDirection', () => bridge().setTextDirection('ltr')) } />
                      <Btn label="Auto" onClick={ () => safeCall('setTextDirection', () => bridge().setTextDirection('auto')) } />
                    </Section>

                    <Section title="Typography（点击前回到 fixture 以便看到效果）">
                      <Btn
                        label="Large text"
                        onClick={ withReset('fixture', () => safeCall('setTypography/large', () => bridge().setTypography({
                          heading1: { fontSize: '22px', fontWeight: '700' },
                          heading2: { fontSize: '20px', fontWeight: '700' },
                          heading3: { fontSize: '19px' },
                          paragraph: { fontSize: '18px', lineHeight: '2' },
                          list: { fontSize: '18px' },
                          code: { fontSize: '14px' },
                          inlineCode: { fontSize: '16px' },
                          blockquote: { fontSize: '18px' },
                        }))) }
                      />
                      <Btn
                        label="Small text"
                        onClick={ withReset('fixture', () => safeCall('setTypography/small', () => bridge().setTypography({
                          heading1: { fontSize: '16px' },
                          heading2: { fontSize: '15px' },
                          heading3: { fontSize: '14px' },
                          paragraph: { fontSize: '13px', lineHeight: '1.6' },
                          list: { fontSize: '13px' },
                          code: { fontSize: '11px' },
                        }))) }
                      />
                      <Btn
                        label="Reset"
                        onClick={ withReset('fixture', () => safeCall('setTypography/reset', () => bridge().setTypography({}))) }
                      />
                    </Section>
                  </>
                ) }

                { tab === 'editor' && (
                  <>
                    <Section title="Cursor / Selection">
                      <Btn label="getTextCursorPosition" onClick={ () => show('cursor', bridge().getTextCursorPosition()) } />
                      <Btn label="getSelectedText" onClick={ () => show('selected', bridge().getSelectedText()) } />
                      <Btn label="focus" onClick={ () => bridge().focus() } />
                      <Btn label="scrollToRange(1)" onClick={ () => show('scrollToRange', bridge().scrollToRange(1)) } />
                    </Section>

                    <Section title="Editor state">
                      <Btn label="isEditable" onClick={ () => show('isEditable', bridge().isEditable()) } />
                      <Btn label="setEditable(false)" onClick={ () => bridge().setEditable(false) } />
                      <Btn label="setEditable(true)" onClick={ () => bridge().setEditable(true) } />
                      <Btn label="isEmpty" onClick={ () => show('isEmpty', bridge().isEmpty()) } />
                      <Btn label="undo" onClick={ () => bridge().undo() } />
                      <Btn label="redo" onClick={ () => bridge().redo() } />
                    </Section>

                    <Section title="Layout">
                      <Btn label="setBottomMargin(160)" onClick={ () => bridge().setBottomMargin(160) } />
                      <Btn label="setBottomMargin(0)" onClick={ () => bridge().setBottomMargin(0) } />
                    </Section>
                  </>
                ) }
              </div>

              <div className="shrink-0 border-t border-border bg-background px-4 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text3">Output</div>
                  <button
                    className="h-7 rounded-md border border-border bg-background2 px-2 text-[11px] font-medium text-text2 transition-colors hover:bg-background3"
                    type="button"
                    onClick={ () => setOutput('') }
                  >
                    Clear
                  </button>
                </div>
                <pre
                  className="m-0 max-h-[30dvh] min-h-24 overflow-auto rounded-md border border-border bg-background2 p-3 font-mono text-[11px] leading-5 text-text2 whitespace-pre-wrap break-all"
                >
                  { output || '(点按钮触发；getX 类方法会把结果打在这里，其余写到控制台)' }
                </pre>
              </div>
            </>
          ) }
    </aside>
  )
}

type SectionProps = {
  /** 分组标题 */
  title: string
  /** 分组内容 */
  children: ReactNode
}

type BtnProps = {
  /** 按钮文案 */
  label: string
  /** 点击动作 */
  onClick: () => void
}

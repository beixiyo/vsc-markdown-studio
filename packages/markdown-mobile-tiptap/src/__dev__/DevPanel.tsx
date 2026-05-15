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
  const show = (label: string, v: any) =>
    setOutput(`${label}:\n${typeof v === 'string'
      ? v
      : JSON.stringify(v, null, 2)}`)

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

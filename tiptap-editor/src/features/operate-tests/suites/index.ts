import type { OperateTestSuite } from '../types'
import { getHoverContent, scrollToRange, scrollToRangeSelection, scrollToText, selectAndScrollToText } from 'tiptap-api'

const contentBackup: { markdown: string | null } = {
  markdown: null,
}

export const defaultOperateSuites: OperateTestSuite[] = [
  {
    id: 'content',
    title: '内容读写',
    description: 'set/get HTML、Markdown、JSON 相关操作',
    cases: [
      {
        id: 'content-set-and-get-markdown',
        title: '设置并读取 Markdown',
        description: '验证 setMarkdown 与 getMarkdown 的基础链路',
        run: async ({ operate }, logger) => {
          contentBackup.markdown = operate.getMarkdown()
          const sample = '# 测试标题'
          const ok = operate.setMarkdown(sample)
          if (!ok) {
            throw new Error('setMarkdown 返回 false')
          }
          const read = operate.getMarkdown()
          if (!read || !read.includes('测试标题')) {
            throw new Error('getMarkdown 结果为空或不包含预期文本')
          }
          logger('设置并读取 Markdown 成功')
        },
        cleanup: ({ operate }) => {
          if (contentBackup.markdown !== null) {
            operate.setMarkdown(contentBackup.markdown)
          }
        },
      },
      {
        id: 'content-set-and-get-html',
        title: '设置并读取 HTML',
        description: '验证 setHTML 与 getHTML 的基础链路',
        run: ({ operate }) => {
          contentBackup.markdown = contentBackup.markdown ?? operate.getMarkdown()
          const html = '<p>HTML 测试片段</p>'
          const ok = operate.setHTML(html)
          if (!ok) {
            throw new Error('setHTML 返回 false')
          }
          const read = operate.getHTML()
          if (!read || !read.includes('HTML 测试片段')) {
            throw new Error('getHTML 结果为空或不包含预期文本')
          }
        },
        cleanup: ({ operate }) => {
          if (contentBackup.markdown !== null) {
            operate.setMarkdown(contentBackup.markdown)
          }
        },
      },
      {
        id: 'content-export-markdown',
        title: '导出 Markdown',
        description: '验证包含 speaker 的 Markdown 能原样导出',
        run: ({ operate }) => {
          const original = operate.getMarkdown()
          const sample = '# 导出测试\n\n[speaker:1] 参与讨论'
          operate.setMarkdown(sample)
          const exported = operate.getMarkdown()
          const hasTitle = exported?.includes('导出测试')
          const hasSpeaker = exported?.includes('[speaker:1]')
          if (!exported || !hasTitle || !hasSpeaker) {
            throw new Error('getMarkdown 导出缺少标题或 speaker 标记')
          }
          contentBackup.markdown = original
        },
        cleanup: ({ operate }) => {
          if (contentBackup.markdown !== null) {
            operate.setMarkdown(contentBackup.markdown)
          }
        },
      },
      {
        id: 'content-export-html',
        title: '导出 HTML',
        description: '验证包含 speaker 的 HTML 导出包含映射后的 data 属性',
        run: ({ operate }) => {
          const original = operate.getMarkdown()
          const sample = '# HTML 导出\n\n[speaker:1] 出现在段落中'
          operate.setMarkdown(sample)
          const html = operate.getHTML()
          const hasTitle = html?.includes('HTML 导出')
          const hasSpeakerName = html?.includes('data-speaker-name="Alice"')
          const hasSpeakerId = html?.includes('data-speaker-id="u1"')
          if (!html || !hasTitle || !hasSpeakerName || !hasSpeakerId) {
            throw new Error('getHTML 未包含标题或 speaker data 属性')
          }
          contentBackup.markdown = original
        },
        cleanup: ({ operate }) => {
          if (contentBackup.markdown !== null) {
            operate.setMarkdown(contentBackup.markdown)
          }
        },
      },
      {
        id: 'content-export-json',
        title: '导出 JSON',
        description: '验证 JSON 导出包含 speaker 节点与原始标签',
        run: ({ operate, editor }) => {
          const original = operate.getMarkdown()
          const sample = 'JSON 导出测试 [speaker:1]'
          operate.setMarkdown(sample)
          const json = editor?.getJSON()
          const hasContent = Array.isArray(json?.content) && json.content.length > 0
          const first = json?.content?.[0]
          const para = first?.type === 'paragraph'
            ? first
            : undefined
          const speakerNode = (para?.content as any[])?.find((item: any) => item.type === 'speaker') as any
          const hasSpeaker = speakerNode?.attrs?.originalLabel === '1'
          if (!json || !hasContent || !hasSpeaker) {
            throw new Error('editor.getJSON 未包含 speaker 节点或内容为空')
          }
          contentBackup.markdown = original
        },
        cleanup: ({ operate }) => {
          if (contentBackup.markdown !== null) {
            operate.setMarkdown(contentBackup.markdown)
          }
        },
      },
    ],
  },
  {
    id: 'text',
    title: '文本插入',
    description: 'insertText 及文本相关的基础能力',
    cases: [
      {
        id: 'text-insert-and-read',
        title: '插入文本并读取',
        description: '验证 insertText 会写入文档，且 getMarkdown 可读到新增文本',
        run: ({ operate, editor }) => {
          const original = operate.getMarkdown()
          const sample = '初始文本'
          operate.setMarkdown(sample)
          const docSize = editor?.state.doc.content.size ?? 0
          operate.setTextCursorPosition(docSize)
          const appended = '，追加内容'
          const ok = operate.insertText(appended)
          if (!ok) {
            throw new Error('insertText 返回 false')
          }
          const read = operate.getMarkdown()
          if (!read || !read.includes(appended)) {
            throw new Error('未读取到追加的文本')
          }
          contentBackup.markdown = original
        },
        cleanup: ({ operate }) => {
          if (contentBackup.markdown !== null) {
            operate.setMarkdown(contentBackup.markdown)
          }
        },
      },
    ],
  },
  {
    id: 'selection',
    title: '选区与光标',
    description: '选区读取/设置、光标位置相关操作',
    cases: [
      {
        id: 'selection-set-and-get-range',
        title: '设置并读取选区',
        description: '验证 setSelection 能设置范围，getSelection 与 getSelectedText 可读取',
        run: ({ operate, editor }) => {
          const original = operate.getMarkdown()
          operate.setMarkdown('选择测试文本')
          const docSize = editor?.state.doc.content.size ?? 0
          const from = 1
          const to = Math.min(from + 4, docSize)
          const ok = operate.setSelection(from, to)
          if (!ok) {
            throw new Error('setSelection 返回 false')
          }
          const range = operate.getSelection()
          if (!range || range.from !== from || range.to !== to) {
            throw new Error('getSelection 未返回预期范围')
          }
          const selected = operate.getSelectedText()
          if (!selected) {
            throw new Error('getSelectedText 返回空字符串')
          }
          contentBackup.markdown = original
        },
        cleanup: ({ operate }) => {
          if (contentBackup.markdown !== null) {
            operate.setMarkdown(contentBackup.markdown)
          }
        },
      },
      {
        id: 'selection-set-cursor-position',
        title: '设置并读取光标位置',
        description: '验证 setTextCursorPosition 能移动光标，getTextCursorPosition 能读到位置',
        run: ({ operate }) => {
          const original = operate.getMarkdown()
          operate.setMarkdown('光标测试')
          const targetPos = 1
          const ok = operate.setTextCursorPosition(targetPos)
          if (!ok) {
            throw new Error('setTextCursorPosition 返回 false')
          }
          const pos = operate.getTextCursorPosition()
          if (pos !== targetPos) {
            throw new Error('getTextCursorPosition 未返回预期位置')
          }
          contentBackup.markdown = original
        },
        cleanup: ({ operate }) => {
          if (contentBackup.markdown !== null) {
            operate.setMarkdown(contentBackup.markdown)
          }
        },
      },
    ],
  },
  {
    id: 'link',
    title: '链接',
    description: '创建链接与读取链接地址',
    cases: [
      {
        id: 'link-create-and-read',
        title: '创建并读取链接',
        description: '验证 createLink 插入链接后，可通过 getSelectedLinkUrl 读取',
        run: ({ operate, editor }) => {
          const original = operate.getMarkdown()
          const url = 'https://example.com'
          const linkText = '示例链接'
          operate.setMarkdown('链接测试')
          const created = operate.createLink(url, linkText)
          if (!created) {
            throw new Error('createLink 返回 false')
          }
          const textContent = editor?.state.doc.textContent ?? ''
          const start = textContent.indexOf(linkText)
          if (start < 0) {
            throw new Error('未找到插入的链接文本')
          }
          const ok = operate.setSelection(start, start + linkText.length)
          if (!ok) {
            throw new Error('设置链接选区失败')
          }
          const href = operate.getSelectedLinkUrl()
          if (href !== url) {
            throw new Error('getSelectedLinkUrl 未返回预期链接')
          }
          contentBackup.markdown = original
        },
        cleanup: ({ operate }) => {
          if (contentBackup.markdown !== null) {
            operate.setMarkdown(contentBackup.markdown)
          }
        },
      },
    ],
  },
  {
    id: 'state',
    title: '编辑器状态',
    description: 'focus、isEditable、setEditable、isEmpty',
    cases: [
      {
        id: 'state-toggle-editable',
        title: '切换可编辑状态',
        description: '验证 setEditable 可切换读写，isEditable 可读取状态',
        run: ({ operate }) => {
          const originalEditable = operate.isEditable()
          const toReadonly = operate.setEditable(false)
          if (!toReadonly) {
            throw new Error('setEditable(false) 返回 false')
          }
          if (operate.isEditable()) {
            throw new Error('isEditable 在只读状态下返回 true')
          }
          const toEditable = operate.setEditable(true)
          if (!toEditable) {
            throw new Error('setEditable(true) 返回 false')
          }
          if (!operate.isEditable()) {
            throw new Error('isEditable 在可编辑状态下返回 false')
          }
          operate.setEditable(!!originalEditable)
        },
      },
      {
        id: 'state-focus-and-empty',
        title: '聚焦并检测空文档',
        description: '验证 focus 返回成功，设置内容后 isEmpty 变化正确',
        run: ({ operate }) => {
          const original = operate.getMarkdown()
          const focused = operate.focus()
          if (!focused) {
            throw new Error('focus 返回 false')
          }
          operate.setMarkdown('非空内容')
          if (operate.isEmpty()) {
            throw new Error('isEmpty 对非空文档返回 true')
          }
          operate.setMarkdown('')
          const empty = operate.isEmpty()
          if (!empty) {
            throw new Error('isEmpty 对空文档返回 false')
          }
          if (original !== null) {
            operate.setMarkdown(original)
          }
        },
      },
    ],
  },
  {
    id: 'history',
    title: '历史与命令',
    description: 'undo/redo 以及格式化命令集合',
    cases: [
      {
        id: 'history-undo-and-redo',
        title: '撤销与重做',
        description: '验证 undo/redo 可正确恢复与重做内容',
        run: ({ operate }) => {
          const original = operate.getMarkdown()
          operate.setMarkdown('历史测试')
          const token = '【追加段落】'
          operate.insertText(token)
          const afterInsert = operate.getMarkdown() ?? ''
          if (!afterInsert.includes(token)) {
            throw new Error('插入文本后未读到追加内容')
          }
          const undoOk = operate.undo()
          if (!undoOk) {
            throw new Error('undo 返回 false')
          }
          const afterUndo = operate.getMarkdown() ?? ''
          if (afterUndo.includes(token)) {
            throw new Error('undo 后仍包含追加内容')
          }
          const redoOk = operate.redo()
          if (!redoOk) {
            throw new Error('redo 返回 false')
          }
          const afterRedo = operate.getMarkdown() ?? ''
          if (!afterRedo.includes(token)) {
            throw new Error('redo 后未找回追加内容')
          }
          if (original !== null) {
            operate.setMarkdown(original)
          }
        },
      },
      {
        id: 'command-heading-and-paragraph',
        title: '标题与段落命令',
        description: '验证 setHeading 与 setParagraph 能切换节点类型',
        run: ({ operate, editor }) => {
          const original = operate.getMarkdown()
          operate.setMarkdown('段落命令测试')
          operate.setSelection(1, 1)
          const headingOk = operate.command.setHeading(1)
          if (!headingOk) {
            throw new Error('setHeading 返回 false')
          }
          const headingType = editor?.state.doc.firstChild?.type.name
          if (headingType !== 'heading') {
            throw new Error('设置标题后节点类型不是 heading')
          }
          const paragraphOk = operate.command.setParagraph()
          if (!paragraphOk) {
            throw new Error('setParagraph 返回 false')
          }
          const paragraphType = editor?.state.doc.firstChild?.type.name
          if (paragraphType !== 'paragraph') {
            throw new Error('设置段落后节点类型不是 paragraph')
          }
          if (original !== null) {
            operate.setMarkdown(original)
          }
        },
      },
    ],
  },
  {
    id: 'scroll',
    title: '滚动与定位',
    description: 'scrollToRange/mark/text 等定位与滚动能力',
    cases: [
      {
        id: 'scroll-to-range-and-selection',
        title: '滚动到指定范围',
        description: '验证 scrollToRange 与 scrollToRangeSelection 返回成功',
        run: ({ operate, editor }) => {
          const original = operate.getMarkdown()
          operate.setMarkdown('滚动测试段落\n\n第二段内容')
          const docSize = editor?.state.doc.content.size ?? 0
          const pos = Math.min(2, docSize)
          const okRange = scrollToRange(editor, pos)
          if (!okRange) {
            throw new Error('scrollToRange 返回 false')
          }
          const okSelection = scrollToRangeSelection(editor, 0, Math.min(4, docSize))
          if (!okSelection) {
            throw new Error('scrollToRangeSelection 返回 false')
          }
          if (original !== null) {
            operate.setMarkdown(original)
          }
        },
      },
      {
        id: 'scroll-select-and-scroll-text',
        title: '搜索文本并滚动',
        description: '验证 selectAndScrollToText 与 scrollToText 可找到文本',
        run: ({ operate, editor }) => {
          const original = operate.getMarkdown()
          const keyword = '滚动定位关键字'
          operate.setMarkdown(`段落一\n\n${keyword} 出现在这里`)
          const okSelect = selectAndScrollToText(editor, keyword)
          if (!okSelect) {
            throw new Error('selectAndScrollToText 返回 false')
          }
          const okScroll = scrollToText(editor, keyword)
          if (!okScroll) {
            throw new Error('scrollToText 返回 false')
          }
          if (original !== null) {
            operate.setMarkdown(original)
          }
        },
      },
    ],
  },
  {
    id: 'hover',
    title: '悬浮探测',
    description: 'hover 位置与内容获取相关能力',
    cases: [
      {
        id: 'hover-get-content',
        title: '读取 Hover 内容',
        description: '验证 getHoverContent 在有效位置返回内容',
        run: ({ operate, editor }) => {
          const original = operate.getMarkdown()
          operate.setMarkdown('Hover 内容测试')
          const docSize = editor?.state.doc.content.size ?? 0
          const pos = Math.min(1, docSize)
          const content = getHoverContent(editor, pos)
          if (!content || content.pos !== pos) {
            throw new Error('getHoverContent 未返回有效内容')
          }
          if (content.textContent && !content.textContent.includes('Hover')) {
            throw new Error('getHoverContent 返回的文本不包含预期关键字')
          }
          if (original !== null) {
            operate.setMarkdown(original)
          }
        },
      },
    ],
  },
  {
    id: 'speaker',
    title: '说话人节点',
    description: '校验 speaker 节点映射与渲染属性',
    cases: [
      {
        id: 'speaker-map-and-attrs',
        title: '映射并渲染 data 属性',
        description: '验证 speakerMap 合并后渲染的 data-speaker-* 属性包含映射值',
        run: ({ operate }) => {
          const original = operate.getMarkdown()
          operate.setMarkdown('[speaker:1]')
          const html = operate.getHTML() || ''
          const hasName = html.includes('data-speaker-name="Alice"')
          const hasId = html.includes('data-speaker-id="u1"')
          if (!hasName || !hasId) {
            throw new Error('data-speaker-* 未包含映射的 name 或 id')
          }
          contentBackup.markdown = original
        },
        cleanup: ({ operate }) => {
          if (contentBackup.markdown !== null) {
            operate.setMarkdown(contentBackup.markdown)
          }
        },
      },
    ],
  },
]

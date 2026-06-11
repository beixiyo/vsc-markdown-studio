import type { Editor } from '@tiptap/react'
import { useLatestCallback } from 'hooks'
import { useState } from 'react'

/** 预置 markdown 样例：覆盖富属性 `<img />`、纯净 `![]()`、图文混排三种形态 */
export const MD_PRESETS = [
  {
    key: 'rich',
    label: '富属性图片',
    value: `# 富属性图片

<img src="https://picsum.photos/300/200" alt="风景" width="300" height="200" data-align="center" data-border-radius="8px" />

上面的 \`<img />\` 带 width / height / 居中 / 圆角，导入后应渲染为一张可交互的图片节点`,
  },
  {
    key: 'plain',
    label: '纯净图片',
    value: `# 纯净图片

![占位图](https://picsum.photos/200 "标题")

仅 src / alt / title，导出应保持 \`![]()\` 语法、不出现 \`<img\``,
  },
  {
    key: 'mixed',
    label: '图文混排',
    value: `段前文字 <img src="https://picsum.photos/64" width="64" height="64" data-vertical-align="middle" /> 段后文字

- 列表项
- ![小图](https://picsum.photos/48)`,
  },
  {
    key: 'highlight',
    label: '高亮',
    value: `# 高亮序列化

前文 ==无色高亮== 中段 <mark data-color="skyBlue">天空蓝渐变</mark> 与 <mark data-color="#fef08a">黄色高亮</mark> 后文

无色保持 \`==\` 语法，带色降级为 \`<mark data-color>\`，渐变 key 导入后应渲染为文字渐变`,
  },
] as const

export interface PanelNotice {
  tone: 'ok' | 'warn'
  text: string
}

/**
 * Markdown 导入导出面板逻辑
 *
 * 导入 = `setContent(md, { contentType: 'markdown' })`（没有 setMarkdown 命令）
 * 导出 = `editor.getMarkdown()`
 * 幂等检测走 markdown manager 的 parse/serialize 纯函数路径，不污染编辑器内容
 */
export function useMarkdownIOPanel(editor: Editor | null) {
  const [mdText, setMdText] = useState<string>(MD_PRESETS[0].value)
  const [notice, setNotice] = useState<PanelNotice | null>(null)

  const fillPreset = useLatestCallback((key: string) => {
    const preset = MD_PRESETS.find(p => p.key === key)
    if (preset) {
      setMdText(preset.value)
      setNotice(null)
    }
  })

  const importMd = useLatestCallback(() => {
    if (!editor) {
      return
    }
    const ok = editor.commands.setContent(mdText, { contentType: 'markdown' })
    setNotice(ok
      ? { tone: 'ok', text: '已导入编辑器，观察图片是否按属性渲染' }
      : { tone: 'warn', text: '导入失败：setContent 返回 false' })
  })

  const exportMd = useLatestCallback(() => {
    if (!editor) {
      return
    }
    setMdText(editor.getMarkdown())
    setNotice({ tone: 'ok', text: '已导出编辑器当前内容，检查图片的序列化形态' })
  })

  /** 6 轮 parse → serialize 往返，断言逐字符稳定 */
  const checkRoundtrip = useLatestCallback(() => {
    if (!editor) {
      return
    }
    const mgr = (editor as any).markdown as {
      parse: (md: string) => unknown
      serialize: (json: unknown) => string
    }

    const outs: string[] = []
    let cur = mdText
    for (let i = 0; i < 6; i++) {
      cur = mgr.serialize(mgr.parse(cur))
      outs.push(cur)
    }

    const driftRound = outs.findIndex(out => out !== outs[0])
    if (driftRound === -1) {
      setMdText(outs[0])
      setNotice({ tone: 'ok', text: '6 轮往返逐字符幂等 ✓（已显示归一化结果）' })
    }
    else {
      setNotice({ tone: 'warn', text: `第 ${driftRound + 1} 轮往返发生漂移 ✗` })
    }
  })

  return {
    ready: !!editor,
    mdText,
    setMdText,
    notice,
    fillPreset,
    importMd,
    exportMd,
    checkRoundtrip,
  }
}

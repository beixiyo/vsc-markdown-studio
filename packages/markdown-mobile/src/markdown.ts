/**
 * markdown-mobile 输入兼容层
 *
 * 这里只修复已知的上游强调 / code 重叠产物；标准 Markdown 仍原样交给 Tiptap 解析
 */

const OVERLAPPED_EMPHASIS_CODE = /\*\*`\*\*([^\n`]+?)\*{3}`\*{3}(?=<!--ctx-ref:[\w-]+:[\w-]+-->)/g
const SPEAKER_MARKER = /<speaker>[^<]+<\/speaker>|\[speaker:[^\]]+\]/

/**
 * 把包含 speaker 与 ctx-ref 的非预期 emphasis / code 重叠产物还原为标准粗斜体
 *
 * 转换前：
 * `**\`**TEXT_A<speaker>2</speaker>TEXT_B***\`***<!--ctx-ref:mark:70576-->`
 *
 * 转换后：
 * `***TEXT_A<speaker>2</speaker>TEXT_B***<!--ctx-ref:mark:70576-->`
 *
 * Markdown 通常不会把这类输入判为“语法错误”，而是按既定优先级继续解析。`marked`
 * 会把两个反引号之间的 `**TEXT_A...TEXT_B***` 整体识别为 code span：其中的星号
 * 变成代码文本，speaker 也无法进入自定义 tokenizer；code span 外的 `***` 只用掉
 * 两颗关闭粗体，最后一颗作为普通文本显示。这与内容生产方想表达的“整段粗斜体”不同
 *
 * 该兼容只匹配“speaker 位于重叠标记内，且后面紧邻 ctx-ref”的已知形态，不修改
 * 合法的普通 code span；ctx-ref lookahead 不参与替换，因此 marker 会原样保留
 */
export function normalizeMobileMarkdownInput(markdown: string): string {
  return markdown.replace(OVERLAPPED_EMPHASIS_CODE, (raw, content: string) => {
    if (!SPEAKER_MARKER.test(content))
      return raw

    return `***${content}***`
  })
}

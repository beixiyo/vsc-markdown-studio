/**
 * 预处理函数：将 <speaker>X</speaker> 格式转换为 [speaker:X] 格式
 * 这样可以确保通过 markdownTokenizer 正确解析，而不是通过 parseHTML 解析
 */
export function preprocessSpeakerTags(markdown: string): string {
  return markdown.replace(/<speaker>([^<]+?)<\/speaker>/g, (_match, label) => {
    return `[speaker:${label.trim()}]`
  })
}

/**
 * 格式化时间戳
 * @param timestamp 时间戳（毫秒）
 * @param language 语言代码（'zh-CN' | 'en-US'）
 * @returns 格式化后的日期字符串
 */
export function formatDate(timestamp: number, language: string = 'zh-CN'): string {
  const date = new Date(timestamp)
  return date.toLocaleString(language === 'zh-CN'
    ? 'zh-CN'
    : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

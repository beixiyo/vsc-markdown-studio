/**
 * Markdown 序列化共享工具
 *
 * 供「富属性降级为内联 HTML」的扩展（image、gradient-highlight 等）复用
 */

/** HTML 属性值转义（& 必须最先替换） */
export function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
}

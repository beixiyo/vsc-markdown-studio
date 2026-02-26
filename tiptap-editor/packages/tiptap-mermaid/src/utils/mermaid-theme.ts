/**
 * Mermaid 主题配置工具函数
 */
import { THEMES } from 'beautiful-mermaid'
import type { DiagramColors } from 'beautiful-mermaid'

/**
 * 获取 Mermaid 主题配置
 * @param isDarkMode 是否为深色模式
 * @returns beautiful-mermaid 内置主题
 */
export function getMermaidThemeColors(isDarkMode: boolean): DiagramColors {
  return isDarkMode
    ? THEMES['zinc-dark']
    : THEMES['zinc-light']
}

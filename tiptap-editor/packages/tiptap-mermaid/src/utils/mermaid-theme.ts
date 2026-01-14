/**
 * Mermaid 主题配置工具函数
 */
import type { MermaidConfig } from 'mermaid'

/**
 * 获取 Mermaid 主题配置
 * @param isDarkMode 是否为深色模式
 * @returns Mermaid 配置对象
 */
export function getMermaidThemeConfig(isDarkMode: boolean): Partial<MermaidConfig> {
  return {
    startOnLoad: false,
    theme: isDarkMode
      ? 'dark'
      : 'default',
    themeVariables: isDarkMode
      ? {
          /** 深色模式配色 */
          primaryColor: '#3b82f6',
          primaryTextColor: '#f3f4f6',
          primaryBorderColor: '#2563eb',
          lineColor: '#6b7280',
          secondaryColor: '#374151',
          tertiaryColor: '#1f2937',
          background: '#111827',
          mainBkg: '#374151',
          secondBkg: '#4b5563',
          tertiaryBkg: '#6b7280',
        }
      : {
          /** 浅色模式配色 */
          primaryColor: '#3b82f6',
          primaryTextColor: '#1f2937',
          primaryBorderColor: '#2563eb',
          lineColor: '#94a3b8',
          secondaryColor: '#f3f4f6',
          tertiaryColor: '#fef3c7',
          background: '#ffffff',
          mainBkg: '#ffffff',
          secondBkg: '#f9fafb',
          tertiaryBkg: '#f3f4f6',
        },
  }
}

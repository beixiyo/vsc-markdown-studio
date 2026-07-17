import type { SpeakerAttributes, SpeakerOptions } from './types'

export const SPEAKER_TOKEN_NAME = 'speaker'

export const DEFAULT_SPEAKER_RENDER_TAG = 'strong'

/**
 * 匹配当前位置的 markdown speaker token
 *
 * @example
 * SPEAKER_MARKDOWN_TOKEN_REGEX.exec('[speaker:1] hello')?.slice(1)
 * // => ['1']
 */
export const SPEAKER_MARKDOWN_TOKEN_REGEX = /^\[speaker:([^\]]+?)\]/

export function getSpeakerMarkdownStart(src: string) {
  return src.indexOf('[speaker:')
}

export function tokenizeSpeakerMarkdown(src: string): SpeakerMarkdownToken | undefined {
  const match = SPEAKER_MARKDOWN_TOKEN_REGEX.exec(src)
  if (!match) {
    return undefined
  }

  return {
    type: SPEAKER_TOKEN_NAME,
    raw: match[0],
    value: match[1].trim(),
  }
}

export function parseSpeakerMarkdownToken(token: unknown) {
  const value = (token as { value?: unknown } | null)?.value

  return {
    type: SPEAKER_TOKEN_NAME,
    attrs: {
      originalLabel: String(value || '').trim(),
    },
  }
}

/**
 * 序列化回 `[speaker:X]`
 * 注意：两侧不补任何字符，保证 parse → serialize 往返幂等
 * （补空格会每轮累加，最终把整行变成缩进代码块）
 */
export function renderSpeakerMarkdown(attrs: Partial<SpeakerAttributes> = {}) {
  return `[speaker:${attrs.originalLabel || ''}]`
}

/**
 * 展示名解析，与标签渲染、renderText 共用同一函数，保证「看到什么就能搜到什么」
 *
 * 优先级：attrs.name（节点级、可随时更新）> speakerMap 兜底 > i18n 缺省名（`Speaker X`）
 *
 * 缺省名走 `formatFallback` 注入而非在此硬编码：i18n 属于宿主环境，
 * 让 rules 保持纯函数、可被单测直接断言（见同目录 `rules` 相关测试）
 */
export function resolveSpeakerDisplayText(
  attrs: Partial<SpeakerAttributes>,
  options: ResolveSpeakerDisplayOptions = {},
): string {
  if (attrs.name) {
    return attrs.name
  }

  const originalLabel = attrs.originalLabel ?? ''
  const mapped = originalLabel
    ? options.speakerMap?.[originalLabel]
    : undefined
  if (mapped?.name) {
    return mapped.name
  }

  const displayLabel = options.formatLabel
    ? options.formatLabel(originalLabel)
    : originalLabel

  return options.formatFallback
    ? options.formatFallback(displayLabel, originalLabel)
    : `Speaker ${displayLabel}`
}

export type ResolveSpeakerDisplayOptions = Pick<SpeakerOptions, 'speakerMap' | 'formatLabel'> & {
  /** 缺省名生成器：拿到（格式化后的展示标签, 原始标签），返回最终缺省名（通常接 i18n） */
  formatFallback?: (displayLabel: string, originalLabel: string) => string
}

export type SpeakerMarkdownToken = {
  type: typeof SPEAKER_TOKEN_NAME
  raw: string
  value: string
}

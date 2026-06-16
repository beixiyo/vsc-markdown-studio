import type { CtxRefIconRenderer, CtxRefType } from './types'

/**
 * 内置默认图标（开箱即用，无需配置）
 *
 * - 未在 `options.icons` 指定的 refType 走这里的内置图标
 * - `options.icons[type]` 传函数 → 自定义；传 `false` / `null` → 该类型不渲染
 * - 全部用 inline 样式 + Web Animations API，**不依赖任何外部 CSS**，可独立使用
 *
 * 内置外观仅作合理默认，业务可整体替换；marker 词表（mark / note / image）不变
 */

/** 旗帜（Mark） */
const FLAG_SVG = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.34961 1.98271C2.34961 1.33283 2.96879 0.877713 3.57422 1.04131L3.69434 1.08232L11.2412 4.19268C12.1675 4.57443 12.1462 5.89295 11.208 6.24443L3.65039 9.07549V12.4993C3.6503 12.8582 3.35893 13.1497 3 13.1497C2.64107 13.1497 2.3497 12.8582 2.34961 12.4993V1.98271Z" fill="#FAD541"/></svg>`

/** 笔记（Note） */
const NOTE_SVG = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.1338 4.38379L12.2041 4.28125C12.2321 4.26444 12.3616 4.28424 12.6592 4.49707C12.9577 4.71059 12.9742 4.80942 12.9453 4.83203L12.8994 4.89941C13.0133 5.01947 13.0216 5.08297 13.0195 5.12109L12.8232 5.38477L10.7432 8.39551L8.63379 11.4238C8.17427 11.9149 7.15617 12.8316 6.83203 12.624C6.50788 12.4164 7.08767 11.152 7.41797 10.5459L11.8125 4.26953H11.8838L12.1338 4.38379ZM6.3125 4.3623C6.67109 4.36267 6.96177 4.65308 6.96191 5.01172C6.96169 5.37029 6.67104 5.66174 6.3125 5.66211H1.75C1.39115 5.66211 1.09983 5.37051 1.09961 5.01172C1.09975 4.65286 1.3911 4.3623 1.75 4.3623H6.3125ZM8.91895 1.40039C9.27774 1.40061 9.56934 1.69193 9.56934 2.05078C9.56911 2.40944 9.27761 2.70095 8.91895 2.70117H1.75C1.39115 2.70117 1.09983 2.40958 1.09961 2.05078C1.09961 1.6918 1.39101 1.40039 1.75 1.40039H8.91895Z" fill="black" fill-opacity="0.6"/></svg>`

/** 图片（Image） */
const IMAGE_SVG = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1.6" y="2.6" width="10.8" height="8.8" rx="1.6" stroke="black" stroke-opacity="0.6" stroke-width="1.2"/><circle cx="4.9" cy="5.5" r="1.05" fill="black" fill-opacity="0.6"/><path d="M2.2 10.2L5.4 7.2L7.6 9L9.4 7.6L11.8 9.8" stroke="black" stroke-opacity="0.6" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`

const STATIC_SVG: Record<CtxRefType, string> = {
  mark: FLAG_SVG,
  note: NOTE_SVG,
  image: IMAGE_SVG,
}

/**
 * 把 SVG 包进定宽 span，锚定在斜体旁（inline）
 *
 * 只产出裸图标，不带任何背景 / 圆角等装饰——这些属于业务设计系统，
 * 由调用方在 `options.icons` 里用 `ctx.defaultIcon()` 取出后自行包装
 */
function makeIconSpan(svg: string): HTMLElement {
  const span = document.createElement('span')
  span.className = 'tiptap-ctx-ref-icon'
  const s = span.style
  s.display = 'inline-flex'
  s.alignItems = 'center'
  s.verticalAlign = 'middle'
  s.margin = '0 1px 0 3px'
  s.lineHeight = '0'
  s.cursor = 'pointer'
  span.innerHTML = svg
  return span
}

/** 流式态：三点循环动画（「书写中」效果），用 WAAPI，无需 CSS */
function makeStreamingDots(): HTMLElement {
  const span = document.createElement('span')
  span.className = 'tiptap-ctx-ref-streaming'
  const s = span.style
  s.display = 'inline-flex'
  s.alignItems = 'center'
  s.gap = '3px'
  s.verticalAlign = 'middle'
  s.margin = '0 2px 0 3px'

  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('i')
    const ds = dot.style
    ds.display = 'inline-block'
    ds.width = '4px'
    ds.height = '4px'
    ds.borderRadius = '50%'
    ds.background = 'rgba(0, 0, 0, 0.55)'
    span.appendChild(dot)

    /** jsdom 等环境无 WAAPI，跳过动画但保留点位（不影响测试与降级） */
    dot.animate?.(
      [
        { opacity: '0.3', transform: 'scale(0.6)' },
        { opacity: '1', transform: 'scale(1)' },
        { opacity: '0.3', transform: 'scale(0.6)' },
      ],
      { duration: 1000, iterations: Number.POSITIVE_INFINITY, delay: i * 160, easing: 'ease-in-out' },
    )
  }
  return span
}

/** 三类均可点击（点击事件由插件统一抛出，行为交给调用方）；均为裸图标，装饰交给调用方 */
function builtinRenderer(type: CtxRefType): CtxRefIconRenderer {
  return ({ streaming }) => (streaming
    ? makeStreamingDots()
    : makeIconSpan(STATIC_SVG[type]))
}

/** 内置图标工厂表：作为 `options.icons` 各类型的默认值 */
export const builtinCtxRefIcons: Record<CtxRefType, CtxRefIconRenderer> = {
  mark: builtinRenderer('mark'),
  note: builtinRenderer('note'),
  image: builtinRenderer('image'),
}

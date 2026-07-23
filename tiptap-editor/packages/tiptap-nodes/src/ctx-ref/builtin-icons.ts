import type { CtxRefIconRenderer, KnownCtxRefType } from './types'

/**
 * 内置默认图标（开箱即用，无需配置）
 *
 * - 未在 `options.icons` 指定的 refType 走这里的内置图标
 * - `options.icons[type]` 传函数 → 自定义；传 `false` / `null` → 该类型不渲染
 * - 全部用 inline 样式 + Web Animations API，**不依赖任何外部 CSS**，可独立使用
 *
 * 内置外观仅作合理默认，业务可整体替换；marker 词表（mark / note / image / scribe）不变
 */

/** 旗帜（Mark） */
const FLAG_SVG = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.34961 1.98271C2.34961 1.33283 2.96879 0.877713 3.57422 1.04131L3.69434 1.08232L11.2412 4.19268C12.1675 4.57443 12.1462 5.89295 11.208 6.24443L3.65039 9.07549V12.4993C3.6503 12.8582 3.35893 13.1497 3 13.1497C2.64107 13.1497 2.3497 12.8582 2.34961 12.4993V1.98271Z" fill="#FAD541"/></svg>`

/** 笔记（Note） */
const NOTE_SVG = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.1338 4.38379L12.2041 4.28125C12.2321 4.26444 12.3616 4.28424 12.6592 4.49707C12.9577 4.71059 12.9742 4.80942 12.9453 4.83203L12.8994 4.89941C13.0133 5.01947 13.0216 5.08297 13.0195 5.12109L12.8232 5.38477L10.7432 8.39551L8.63379 11.4238C8.17427 11.9149 7.15617 12.8316 6.83203 12.624C6.50788 12.4164 7.08767 11.152 7.41797 10.5459L11.8125 4.26953H11.8838L12.1338 4.38379ZM6.3125 4.3623C6.67109 4.36267 6.96177 4.65308 6.96191 5.01172C6.96169 5.37029 6.67104 5.66174 6.3125 5.66211H1.75C1.39115 5.66211 1.09983 5.37051 1.09961 5.01172C1.09975 4.65286 1.3911 4.3623 1.75 4.3623H6.3125ZM8.91895 1.40039C9.27774 1.40061 9.56934 1.69193 9.56934 2.05078C9.56911 2.40944 9.27761 2.70095 8.91895 2.70117H1.75C1.39115 2.70117 1.09983 2.40958 1.09961 2.05078C1.09961 1.6918 1.39101 1.40039 1.75 1.40039H8.91895Z" fill="black" fill-opacity="0.6"/></svg>`

/** 图片（Image） */
const IMAGE_SVG = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1.6" y="2.6" width="10.8" height="8.8" rx="1.6" stroke="black" stroke-opacity="0.6" stroke-width="1.2"/><circle cx="4.9" cy="5.5" r="1.05" fill="black" fill-opacity="0.6"/><path d="M2.2 10.2L5.4 7.2L7.6 9L9.4 7.6L11.8 9.8" stroke="black" stroke-opacity="0.6" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`

/** 记录（Scribe） */
const SCRIBE_SVG = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.4131 1.375C11.7441 1.37529 12.0125 1.64354 12.0127 1.97461V8.53027C12.0127 9.23916 11.7984 10.1718 11.5479 10.9082C11.4213 11.2802 11.2748 11.6324 11.124 11.9023C11.0501 12.0347 10.9613 12.1718 10.8574 12.2842C10.7795 12.3685 10.5722 12.5742 10.2559 12.5742C9.93956 12.5741 9.73221 12.3684 9.6543 12.2842C9.55044 12.1718 9.46165 12.0347 9.3877 11.9023C9.23682 11.6323 9.09052 11.2794 8.96387 10.9072C8.71338 10.1709 8.5 9.23901 8.5 8.53027V7H8.11914C7.83241 7 7.59979 6.76716 7.59961 6.48047V3.51855C7.59979 3.23186 7.83241 3 8.11914 3H8.5V1.97461C8.50013 1.64335 8.76832 1.375 9.09961 1.375C9.43085 1.37506 9.69909 1.64339 9.69922 1.97461V8.53027C9.69922 9.0527 9.87002 9.84386 10.1006 10.5215C10.1518 10.6718 10.2046 10.8106 10.2559 10.9346C10.3071 10.8105 10.3609 10.6719 10.4121 10.5215C10.6427 9.84388 10.8125 9.05268 10.8125 8.53027V1.97461C10.8127 1.64337 11.0818 1.375 11.4131 1.375ZM4.5498 3.64746C4.54996 3.30128 4.96041 3.11896 5.21777 3.35059L6.71973 4.70215C6.89611 4.86103 6.89611 5.138 6.71973 5.29688L5.21777 6.64844C4.96041 6.88006 4.54996 6.69774 4.5498 6.35156V5.5498H2.0498C1.74621 5.5498 1.50026 5.30353 1.5 5C1.5 4.69624 1.74605 4.4502 2.0498 4.4502H4.5498V3.64746Z" fill="#FAD541"/></svg>`

export const CTX_REF_ICON_SVG: Record<KnownCtxRefType, string> = {
  mark: FLAG_SVG,
  note: NOTE_SVG,
  image: IMAGE_SVG,
  scribe: SCRIBE_SVG,
}

/**
 * 底板型角标的边长（note / image）
 *
 * 定高 28px 而非跟随 1em：note 徽标与 image 缩略图在正文里是同一类视觉元素，
 * 混排在同一行时尺寸必须一致，否则高低不齐。缩略图本身也需要一个能看清内容的
 * 最小尺寸，1em 太小
 */
const BADGE_SIZE = '28px'

/** 走 28px 底板的类型；其余（mark / scribe）只是行内小图标，套底板反而喧宾夺主 */
const BADGE_TYPES = new Set<KnownCtxRefType>(['note', 'image'])

/**
 * 底板型角标的几何
 *
 * 抽成常量是因为有两种载体要用同一套尺寸：`<span>` 底板（占位图标）与
 * `<img>` 缩略图。写成一份，改尺寸不会漏改
 */
const BADGE_STYLE = {
  width: BADGE_SIZE,
  height: BADGE_SIZE,
  margin: '0 8px',
  borderRadius: '8px',
  verticalAlign: 'middle',
  cursor: 'pointer',
} as const satisfies Partial<Record<keyof CSSStyleDeclaration, string>>

/**
 * 底板描边，按类型给
 *
 * 只有 `image` 需要：内置图标只是占位，业务通常会把内容换成真实缩略图，
 * 缩略图得有边界感才不至于糊进正文——占位态就带上同一圈轮廓，换图时视觉不跳
 * 用 `outline` 而非 `border`：outline 不占布局，不会内缩挤压本就不大的图
 */
const BADGE_OUTLINE: Partial<Record<KnownCtxRefType, string>> = {
  image: '1px solid rgba(0, 0, 0, 0.1)',
}

/**
 * 把 SVG 包进定宽 span，锚定在斜体旁（inline）
 *
 * 只产出裸图标，不带背景等装饰——底色属于业务设计系统，由调用方在
 * `options.icons` 里用 `ctx.defaultIcon()` 取出后补样式（无需再包一层 DOM）
 *
 * `verticalAlign: middle` 交给行盒对齐，不做基线微调：按 1em 行内图算出来的
 * `-0.125em` 之类偏移在定高元素上不再成立，会明显偏下
 */
function makeIconSpan(svg: string): HTMLElement {
  const span = document.createElement('span')
  span.className = 'tiptap-ctx-ref-icon'
  const s = span.style
  s.display = 'inline-flex'
  s.alignItems = 'center'
  s.verticalAlign = 'middle'
  s.margin = '0 7px'
  s.lineHeight = '0'
  s.cursor = 'pointer'
  span.innerHTML = svg
  return span
}

/**
 * 底板型角标：图标居中于 28px 圆角方块
 *
 * 只给几何，**不给背景**：内置图标本身已是完整可读的视觉，垫一层灰底反而与图标
 * 描边打架；底色属于设计系统，业务在 `options.icons` 里补一行 `background` 即可，
 * 几何不必重写。`borderRadius` 预置是为了业务补底色后直接成型
 */
function makeBadgeSpan(svg: string, outline?: string): HTMLElement {
  const span = makeIconSpan(svg)
  const s = span.style
  Object.assign(s, BADGE_STYLE)
  s.justifyContent = 'center'

  if (outline) {
    s.outline = outline
    s.outlineOffset = '0px'
  }

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

/**
 * 缩略图角标：`setCtxRefImages` 写过 URL 的 image 节点渲染真实图片
 *
 * 必须是 `<img>` 而不能给底板铺 `background-image`：背景图由元素的渲染生命周期
 * 驱动，而 NodeView 在文档重建时会整批重造角标，在途请求随即被取消
 * （Network 里一片 NS_BINDING_ABORTED），新元素又得重发，图永远画不出来
 */
function makeThumbnail(url: string): HTMLElement {
  const img = document.createElement('img')
  img.className = 'tiptap-ctx-ref-icon'
  img.src = url
  img.alt = ''

  const s = img.style
  Object.assign(s, BADGE_STYLE)
  s.display = 'inline-block'
  s.objectFit = 'cover'
  s.outline = BADGE_OUTLINE.image ?? ''
  s.outlineOffset = '0px'
  return img
}

/** 内置类型均可点击（点击事件由插件统一抛出，行为交给调用方） */
function builtinRenderer(type: KnownCtxRefType): CtxRefIconRenderer {
  const make = (svg: string) => (BADGE_TYPES.has(type)
    ? makeBadgeSpan(svg, BADGE_OUTLINE[type])
    : makeIconSpan(svg))

  return (ctx) => {
    if (ctx.streaming)
      return makeStreamingDots()

    /** 查得到 URL 就画缩略图，查不到（未推表 / 已删除）保持占位图标 */
    if (type === 'image') {
      const url = ctx.editor?.storage?.ctxRef?.imageUrls?.get(ctx.refId)
      if (url)
        return makeThumbnail(url)
    }

    return make(CTX_REF_ICON_SVG[type])
  }
}

/** 内置图标工厂表：作为 `options.icons` 各类型的默认值 */
export const builtinCtxRefIcons: Record<KnownCtxRefType, CtxRefIconRenderer> = {
  mark: builtinRenderer('mark'),
  note: builtinRenderer('note'),
  image: builtinRenderer('image'),
  scribe: builtinRenderer('scribe'),
}

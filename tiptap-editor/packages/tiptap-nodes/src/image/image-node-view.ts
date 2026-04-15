import type { Editor, NodeViewRendererProps } from '@tiptap/core'
import type { NodeView } from '@tiptap/pm/view'
import type { ImageAttrs, ImageOptions } from './types'

/**
 * 骨架屏 className（Tailwind 需要能在源码中静态扫描到这串字面量）
 * 与 packages/comps/src/components/Skeleton/Skeleton.tsx 的配色/节奏保持一致
 */
const SKELETON_CLASS = 'animate-skeleton bg-[length:400%_100%] bg-[linear-gradient(to_right,rgb(var(--skeletonBase))_0%,rgb(var(--skeletonBase))_30%,rgb(var(--skeletonHighlight))_45%,rgb(var(--skeletonHighlight))_50%,rgb(var(--skeletonBase))_60%,rgb(var(--skeletonBase))_100%)]'

function toCssLength(value: number | string | null | undefined): string {
  if (value == null || value === '')
    return ''
  if (typeof value === 'number')
    return `${value}px`
  return value
}

/**
 * 根据 attrs 同步 img 的 inline style 与 DOM 属性
 */
function applyAttrs(img: HTMLImageElement, attrs: ImageAttrs, baseClass: string | null): void {
  const displayMode = attrs.display ?? 'inline-block'
  const alignMargin = displayMode === 'block' && attrs.align
    ? attrs.align === 'center'
      ? '0 auto'
      : attrs.align === 'right'
        ? '0 0 0 auto'
        : '0 auto 0 0'
    : ''

  const s = img.style
  s.display = displayMode
  s.width = toCssLength(attrs.width)
  s.height = toCssLength(attrs.height)
  s.aspectRatio = attrs.aspectRatio ?? ''
  s.verticalAlign = attrs.verticalAlign ?? (displayMode === 'block'
    ? ''
    : 'middle')
  s.float = attrs.float ?? ''
  s.margin = attrs.margin ?? alignMargin
  s.padding = attrs.padding ?? ''
  s.objectFit = attrs.objectFit ?? ''
  s.borderRadius = attrs.borderRadius ?? ''
  s.border = attrs.border ?? ''
  s.boxShadow = attrs.boxShadow ?? ''
  s.opacity = attrs.opacity != null
    ? String(attrs.opacity)
    : ''
  s.filter = attrs.filter ?? ''
  s.transform = attrs.rotate != null
    ? `rotate(${attrs.rotate}deg)`
    : ''

  if (attrs.style) {
    for (const [k, v] of Object.entries(attrs.style))
      s.setProperty(k, String(v))
  }

  if (attrs.alt != null)
    img.alt = attrs.alt
  else
    img.removeAttribute('alt')

  if (attrs.title)
    img.title = attrs.title
  else
    img.removeAttribute('title')

  img.loading = attrs.loading ?? 'lazy'
  img.decoding = attrs.decoding ?? 'async'

  if (attrs.crossOrigin)
    img.crossOrigin = attrs.crossOrigin
  else
    img.removeAttribute('crossorigin')

  if (attrs.referrerPolicy)
    img.referrerPolicy = attrs.referrerPolicy
  else
    img.removeAttribute('referrerpolicy')

  /** 合并用户 className + 骨架/状态类由调用方单独控制 */
  img.className = [attrs.className ?? null, baseClass].filter(Boolean).join(' ')
}

/**
 * 应用 placeholder 背景（色值 or url）
 */
function applyPlaceholder(img: HTMLImageElement, placeholder: string | null | undefined, on: boolean): void {
  if (on && placeholder) {
    const isUrl = /^(?:https?:|data:|blob:|\/)/.test(placeholder)
    img.style.background = isUrl
      ? `url("${placeholder}") center/cover no-repeat`
      : placeholder
  }
  else {
    img.style.background = ''
  }
}

type Payload<E extends Event = Event> = {
  node: NodeViewRendererProps['node']
  attrs: ImageAttrs
  pos: number | undefined
  event: E
  editor: Editor
}

/**
 * 创建 image 节点的原生 NodeView
 * 直接以 <img> 作为 dom，不引入任何外层 span/div
 */
export function createImageNodeView(options: ImageOptions) {
  return ({ node, editor, getPos }: NodeViewRendererProps): NodeView => {
    const img = document.createElement('img')
    /** 标记位：让 _images.scss 的默认 img 规则跳过本节点 */
    img.setAttribute('data-image-node', '')
    let current = node.attrs as ImageAttrs
    let loaded = false
    let errored = false
    /** 标记预加载器替换引起的 load，不应再次触发骨架消除以外的副作用 */

    const resolvePos = () => (typeof getPos === 'function'
      ? getPos()
      : undefined)

    const shouldShowSkeleton = () =>
      !loaded && !errored && !current.placeholder && !current.thumbnailSrc

    const syncVisual = () => {
      applyAttrs(img, current, shouldShowSkeleton()
        ? SKELETON_CLASS
        : null)
      applyPlaceholder(img, current.placeholder, !loaded && !errored)
    }

    const loadRealSrc = () => {
      /** 预加载原图，就绪后替换 img.src，触发二次 load 事件以清骨架 */
      const pre = new Image()
      pre.onload = () => {
        img.src = current.src
      }
      pre.onerror = () => {
        if (current.fallbackSrc)
          img.src = current.fallbackSrc
      }
      pre.src = current.src
    }

    const applySrc = (reset: boolean) => {
      if (reset) {
        loaded = false
        errored = false
      }
      if (current.thumbnailSrc && current.thumbnailSrc !== current.src) {
        img.src = current.thumbnailSrc
        loadRealSrc()
      }
      else {
        img.src = current.src
      }
    }

    const makePayload = <E extends Event>(event: E): Payload<E> => ({
      node,
      attrs: current,
      pos: resolvePos(),
      event,
      editor: editor as Editor,
    })

    img.addEventListener('click', e => options.onClick?.(makePayload(e) as any))
    img.addEventListener('dblclick', e => options.onDoubleClick?.(makePayload(e) as any))
    img.addEventListener('contextmenu', e => options.onContextMenu?.(makePayload(e) as any))
    img.addEventListener('mouseenter', e => options.onMouseEnter?.(makePayload(e) as any))
    img.addEventListener('mouseleave', e => options.onMouseLeave?.(makePayload(e) as any))
    img.addEventListener('dragstart', e => options.onDragStart?.(makePayload(e) as any))
    img.addEventListener('drop', e => options.onDrop?.(makePayload(e) as any))

    img.addEventListener('load', (e) => {
      loaded = true
      errored = false
      syncVisual()
      options.onLoad?.(makePayload(e) as any)
    })

    img.addEventListener('error', (e) => {
      errored = true
      options.onError?.(makePayload(e) as any)
      if (current.fallbackSrc && img.src !== current.fallbackSrc) {
        img.src = current.fallbackSrc
        return
      }
      syncVisual()
    })

    syncVisual()
    applySrc(false)

    return {
      dom: img,
      update(newNode) {
        if (newNode.type.name !== 'image')
          return false
        const prev = current
        current = newNode.attrs as ImageAttrs

        const srcChanged = prev.src !== current.src || prev.thumbnailSrc !== current.thumbnailSrc
        if (srcChanged)
          applySrc(true)

        syncVisual()

        options.onUpdateAttrs?.({
          prev,
          next: current,
          node: newNode,
          pos: resolvePos(),
          editor: editor as Editor,
        })
        return true
      },
      selectNode() {
        img.setAttribute('data-selected', '')
        options.onSelect?.({ node, attrs: current, pos: resolvePos(), editor: editor as Editor })
      },
      deselectNode() {
        img.removeAttribute('data-selected')
        options.onDeselect?.({ node, attrs: current, pos: resolvePos(), editor: editor as Editor })
      },
      destroy() {
        options.onRemove?.({ node, attrs: current, pos: resolvePos(), editor: editor as Editor })
      },
    }
  }
}

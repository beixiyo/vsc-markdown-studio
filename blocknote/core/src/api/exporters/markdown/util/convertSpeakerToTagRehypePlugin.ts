import { Parent as HASTParent, Element as HASTElement } from 'hast'
import { visit } from 'unist-util-visit'

/**
 * @description 将 <span> 元素转换为 [speaker:originalLabel] 占位符格式
 */
export function convertSpeakerToTag() {
  return (tree: HASTParent) => {
    visit(tree, 'element', (node, index, parent) => {
      if (parent && node.tagName === 'span') {
        const props = node.properties || {}

        // 检查是否包含 speaker 相关的 data 属性
        // 在 HAST 中，kebab-case 属性需要使用字符串键访问
        const inlineContentType = props['data-inline-content-type'] || props.dataInlineContentType
        if (inlineContentType === 'speaker') {
          let originalLabel: number | null = null

          // 递归查找内层节点中的 originalLabel 属性
          function findOriginalLabel(element: HASTElement): void {
            const elementProps = element.properties || {}

            // 优先使用内层节点的 data-speaker-original-label（kebab-case）
            // 在 HAST 中，需要使用字符串键访问 kebab-case 属性
            const value = elementProps['data-speaker-original-label'] || elementProps.dataSpeakerOriginalLabel
            if (originalLabel === null && value !== undefined && value !== null) {
              originalLabel = Number(value)
              return
            }

            // 递归查找子元素
            for (const child of element.children) {
              if (child.type === 'element') {
                findOriginalLabel(child)
                if (originalLabel !== null) return
              }
            }
          }

          // 先查找内层节点的属性
          for (const child of node.children) {
            if (child.type === 'element') {
              findOriginalLabel(child)
              if (originalLabel !== null) break
            }
          }

          // 如果内层节点没有 originalLabel，尝试使用外层节点的属性
          if (originalLabel === null) {
            const value = props['data-speaker-original-label'] || props.dataSpeakerOriginalLabel || props['data-original-label'] || props.dataOriginalLabel || props.originalLabel
            if (value !== undefined && value !== null) {
              originalLabel = Number(value)
            }
          }

          // 生成 [speaker:originalLabel] 格式的占位符
          // 如果找不到 originalLabel，则使用 0 作为默认值
          const placeholder = `[speaker:${originalLabel ?? 0}]`

          // 将元素替换为文本节点，内容是占位符
          parent.children[index!] = {
            type: 'text',
            value: placeholder,
          }
        }
      }
    })
  }
}


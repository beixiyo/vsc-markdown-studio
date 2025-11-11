/**
 * 文件作用：在 markdown-operate 的基础上包装命令，增加渐变样式，并在执行后通知
 * 一句话概括：命令层统一封装与变更通知
 * 被谁使用：`bridgeFactory.ts` 将其挂到 `bridge.command`
 */
import type { BlockNoteEditor } from '@blocknote/core'
import type { GradientStyleType } from 'custom-blocknote-gradient-styles'
import type { MDBridge } from '@/types/MDBridge'
import { filterKeys } from '@jl-org/tool'
import { createMarkdownOperate } from 'markdown-operate'

/**
 * 创建命令对象
 * 从 markdown-operate 继承基础命令，并添加扩展（渐变样式相关命令）
 */
export function createCommands(editor: BlockNoteEditor): MDBridge['command'] {
  const base = createMarkdownOperate(editor)
  const baseCommand = base.command

  /** 包装基础命令，添加 notifyFns 通知 */
  const wrapCommand = <T extends (...args: any[]) => any>(fn: T): T => {
    return ((...args: any[]) => {
      const result = fn(...args)
      return result
    }) as T
  }

  return {
    ...baseCommand,
    setHeading: wrapCommand(baseCommand.setHeading),
    setParagraph: wrapCommand(baseCommand.setParagraph),
    setOrderedList: wrapCommand(baseCommand.setOrderedList),
    setUnorderedList: wrapCommand(baseCommand.setUnorderedList),
    setBold: wrapCommand(baseCommand.setBold),
    unsetBold: wrapCommand(baseCommand.unsetBold),
    setItalic: wrapCommand(baseCommand.setItalic),
    unsetItalic: wrapCommand(baseCommand.unsetItalic),
    setUnderline: wrapCommand(baseCommand.setUnderline),
    unsetUnderline: wrapCommand(baseCommand.unsetUnderline),
    setCheckList: wrapCommand(baseCommand.setCheckList),

    setGradient: (type: GradientStyleType) => {
      editor.addStyles({ gradient: type } as any)
    },
    unsetGradient: () => {
      const curStyle = editor.getActiveStyles()
      editor.removeStyles(filterKeys(curStyle, ['gradient'] as any))
    },
  }
}

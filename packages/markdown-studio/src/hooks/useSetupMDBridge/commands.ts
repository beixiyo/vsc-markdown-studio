import type { BlockNoteEditor } from '@blocknote/core'
import type { useNotify } from '../useNotify'
import type { GradientStyleType } from '@/blocknoteExts/styles/gradientStyles'
import type { MDBridge } from '@/types/MDBridge'
import { createMarkdownOperate } from 'markdown-operate'
import { filterKeys } from '@jl-org/tool'

/**
 * 创建命令对象
 * 从 markdown-operate 继承基础命令，并添加扩展（渐变样式相关命令）
 */
export function createCommands(editor: BlockNoteEditor, notifyFns: ReturnType<typeof useNotify>): MDBridge['command'] {
  const base = createMarkdownOperate(editor)
  const baseCommand = base.command

  // 包装基础命令，添加 notifyFns 通知
  const wrapCommand = <T extends (...args: any[]) => any>(fn: T): T => {
    return ((...args: any[]) => {
      const result = fn(...args)
      notifyFns.notifyBlockTypeChanged()
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
      notifyFns.notifyBlockTypeChanged()
    },
    unsetGradient: () => {
      const curStyle = editor.getActiveStyles()
      editor.removeStyles(filterKeys(curStyle, ['gradient'] as any))
      notifyFns.notifyBlockTypeChanged()
    },
  }
}

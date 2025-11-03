import type { ChangeEvent } from 'react'
import type { TextareaCounterProps } from './TextareaCounter'

export type TextareaProps
  = Omit<React.PropsWithChildren<React.TextareaHTMLAttributes<HTMLTextAreaElement>>, 'onPaste' | 'onChange' | 'value'>
    & {
    /**
     * 占位文本
     */
      placeholder?: string
      /**
       * 是否禁用
       * @default false
       */
      disabled?: boolean
      /**
       * 是否为只读
       * @default false
       */
      readOnly?: boolean
      /**
       * 是否自动调整高度
       * @default false
       */
      autoResize?: boolean
      /**
       * 最大字符数
       */
      maxLength?: number
      /**
       * 是否显示字符计数
       * @default false
       */
      showCount?: boolean
      /**
       * 错误状态
       * @default false
       */
      error?: boolean
      /**
       * 错误信息
       */
      errorMessage?: string
      /**
       * 是否必填
       * @default false
       */
      required?: boolean
      /**
       * 类名
       */
      focusedClassName?: string
      /**
       * 容器类名
       */
      containerClassName?: string
      /**
       * 尺寸
       * @default 'md'
       */
      size?: 'sm' | 'md' | 'lg'
      value?: string
      /**
       * 输入内容变化时的回调
       */
      onChange?: (value: string, e: ChangeEvent<HTMLTextAreaElement>) => void
      /**
       * 聚焦时的回调
       */
      onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void
      /**
       * 失焦时的回调
       */
      onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void
      /**
       * 按下键盘时的回调
       */
      onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
      /**
       * 按键释放时的回调
       */
      onKeyUp?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
      /**
       * 按下回车键时的回调
       */
      onPressEnter?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
      /**
       * 标签文本
       */
      label?: string
      /**
       * 标签位置
       * @default 'top'
       */
      labelPosition?: 'top' | 'left'
      /**
       * 计数器位置。'left'/'right' 控制 TextareaCounter 内部的 text-align
       * @default 'right'
       */
      counterPosition?: TextareaCounterProps['position']
      /**
       * 格式化计数器文本
       */
      counterFormat?: TextareaCounterProps['format']
    }

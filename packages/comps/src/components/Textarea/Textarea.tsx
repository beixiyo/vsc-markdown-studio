'use client'

import type { ChangeEvent } from 'react'
import type { TextareaProps } from './types'
import { forwardRef, memo, useCallback, useMemo, useRef, useState } from 'react'
import { cn } from 'utils'
import { useFormField } from '../Form'
import { useStyles } from './hooks'
import { TextareaProvider } from './TextareaContext'
import { TextareaCounter } from './TextareaCounter'

const InnerTextarea = forwardRef<HTMLTextAreaElement, TextareaProps>((props, ref) => {
  const {
    children,
    placeholder,
    disabled = false,
    readOnly = false,

    autoResize = false,
    maxLength,
    showCount = false,
    error = false,
    errorMessage,
    required = false,
    className,
    style,
    focusedClassName,
    containerClassName,
    size = 'md',

    onChange,
    onFocus,
    onBlur,
    onKeyDown,
    onKeyUp,
    onPressEnter,

    label,
    labelPosition = 'top',
    value,
    name,

    /** 计数器属性 */
    counterPosition,
    counterFormat,

    ...rest
  } = props

  /** 使用 useFormField hook 处理表单集成 */
  const {
    actualValue,
    actualError,
    actualErrorMessage,
    handleChangeVal,
    handleBlur: handleFieldBlur,
  } = useFormField<string, ChangeEvent<HTMLTextAreaElement>>({
    name,
    value,
    error,
    errorMessage,
    onChange,
    defaultValue: '',
  })

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [isFocused, setIsFocused] = useState(false)

  /** 调整高度的函数 */
  const adjustHeight = useCallback(() => {
    const currentTextarea = textareaRef.current
    if (!currentTextarea || !autoResize) // 仅在 autoResize 为 true 时调整
      return

    /** 先重置高度以获取正确的 scrollHeight */
    currentTextarea.style.height = 'auto'
    const newHeight = currentTextarea.scrollHeight
    currentTextarea.style.height = `${newHeight}px`
  }, [autoResize])

  /** 处理输入变化 (由用户输入或程序化粘贴触发) */
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value.slice(0, maxLength)
      e.target.value = value
      handleChangeVal?.(value, e)

      if (autoResize) {
        /** 使用 requestAnimationFrame 确保在 DOM 更新后（特别是值更新后）计算 scrollHeight */
        requestAnimationFrame(() => adjustHeight())
      }
    },
    [adjustHeight, autoResize, handleChangeVal, maxLength],
  )

  /** 处理聚焦 */
  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    },
    [onFocus],
  )

  /** 处理失焦 */
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false)
      handleFieldBlur()
      onBlur?.(e)
    },
    [onBlur, handleFieldBlur],
  )

  /** 处理按键 */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      onKeyDown?.(e)
      if (e.key === 'Enter' && onPressEnter) {
        onPressEnter(e)
      }
    },
    [onKeyDown, onPressEnter],
  )

  /** 组合所有样式 */
  const { textareaClasses, containerClasses } = useStyles({
    autoResize,
    size,
    disabled,
    className: className || '',
    focusedClassName: focusedClassName || '',
    actualError,
    isFocused,
  })

  /** 上下文值 */
  const contextValue = useMemo(() => ({
    disabled,
    required,
    error: actualError,
    errorMessage: actualErrorMessage,
    isFocused,
    value: actualValue || '',
    maxLength,
  }), [disabled, actualError, actualErrorMessage, isFocused, maxLength, actualValue, required])

  return (
    <TextareaProvider value={ contextValue }>
      <div
        className={ cn(
          'flex h-full',
          {
            'flex-col gap-1': labelPosition === 'top', // 仅当label在顶部时应用gap
            'flex-row items-start gap-2': labelPosition === 'left', // label在左侧时应用不同的gap和对齐
          },
          /** 如果没有label，但有counter，也需要一个布局 */
          (showCount && !label) && labelPosition === 'top'
            ? 'flex-col'
            : '',
          containerClassName,
        ) }
        style={ style }
      >
        {/* Label (假设你有Label组件或直接渲染) */ }
        { label && (
          <label
            htmlFor={ rest.id }
            className={ cn(
              'block text-sm font-medium text-textPrimary',
              labelPosition === 'top'
                ? 'mb-1'
                : 'mr-2 pt-px', // 根据位置调整边距
              /** 确保 pt-px 或类似值使 label 与 textarea 对齐（当 size 不同时） */
              { 'text-rose-500': actualError },
            ) }
          >
            { label }
            { required && <span className="ml-1 text-rose-500">*</span> }
          </label>
        ) }

        <div className={ cn(
          'relative w-full h-full',
          label && labelPosition === 'left'
            ? 'flex-1'
            : '', // 如果label在左边，textarea部分占剩余空间
        ) }>
          <div className={ containerClasses }>
            <textarea
              ref={ (node) => {
                if (typeof ref === 'function') {
                  ref(node)
                }
                else if (ref) {
                  ref.current = node
                }
                textareaRef.current = node
              } }
              value={ actualValue }
              onChange={ handleChange }
              onFocus={ handleFocus }
              onBlur={ handleBlur }
              onKeyDown={ handleKeyDown }
              onKeyUp={ onKeyUp }
              placeholder={ placeholder }
              disabled={ disabled }
              readOnly={ readOnly }
              maxLength={ maxLength }
              className={ textareaClasses }
              aria-invalid={ actualError }
              aria-errormessage={ actualError && actualErrorMessage
                ? `${rest.id}-error`
                : undefined }
              aria-required={ required }
              name={ name }
              { ...rest }
            />

            { children }

            { showCount && <TextareaCounter
              format={ counterFormat }
              position={ counterPosition }
            /> }
          </div>

          {/* 错误信息 */ }
          { actualError && actualErrorMessage && (
            <div
              id={ `${rest.id}-error` }
              className="mt-1 text-sm text-rose-500"
            >
              { actualErrorMessage }
            </div>
          ) }
        </div>
      </div>
    </TextareaProvider>
  )
})

export const Textarea = memo(InnerTextarea) as typeof InnerTextarea

Textarea.displayName = 'Textarea'

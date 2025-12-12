'use client'

import { useCallback, useRef } from 'react'

/**
 * 用户提供的 ref 类型，排除了字符串类型的 ref
 * 基本上是 Exclude<React.ClassAttributes<T>["ref"], string>
 */
type UserRef<T> =
  | ((instance: T | null) => void)
  | React.RefObject<T | null>
  | null
  | undefined

/**
 * 安全地更新 ref 的值
 * @param ref - 要更新的 ref，可以是函数或对象类型
 * @param value - 要设置的新值
 * @template T - ref 指向的元素类型
 */
function updateRef<T>(ref: NonNullable<UserRef<T>>, value: T | null) {
  if (typeof ref === 'function') {
    ref(value)
  }
  else if (ref && typeof ref === 'object' && 'current' in ref) {
    /** 安全赋值，不使用 MutableRefObject */
    ;(ref as { current: T | null }).current = value
  }
}

/**
 * 组合多个 ref 的自定义 Hook
 *
 * 用于将库内部使用的 ref 和用户提供的 ref 合并为一个回调函数。
 * 当组件需要同时处理内部 ref 逻辑和外部 ref 传递时非常有用。
 *
 * @example
 * ```tsx
 * const MyComponent = forwardRef<HTMLDivElement, MyComponentProps>((props, ref) => {
 *   const internalRef = useRef<HTMLDivElement>(null);
 *   const composedRef = useComposedRef(internalRef, ref);
 *
 *   return <div ref={composedRef}>...</div>;
 * });
 * ```
 *
 * @template T - ref 指向的 HTML 元素类型，必须是 HTMLElement 的子类
 * @param libRef - 库内部使用的 ref 对象
 * @param userRef - 用户提供的 ref，可以是函数、对象或 null/undefined
 * @returns 一个回调函数，可以传递给 React 元素的 ref 属性
 */
export function useComposedRef<T extends HTMLElement>(libRef: React.RefObject<T | null>, userRef: UserRef<T>) {
  const prevUserRef = useRef<UserRef<T>>(null)

  return useCallback(
    (instance: T | null) => {
      /** 更新库内部 ref */
      if (libRef && 'current' in libRef) {
        ;(libRef as { current: T | null }).current = instance
      }

      /** 清理之前的用户 ref */
      if (prevUserRef.current) {
        updateRef(prevUserRef.current, null)
      }

      /** 更新当前用户 ref */
      prevUserRef.current = userRef

      /** 更新新的用户 ref */
      if (userRef) {
        updateRef(userRef, instance)
      }
    },
    [libRef, userRef],
  )
}

export default useComposedRef

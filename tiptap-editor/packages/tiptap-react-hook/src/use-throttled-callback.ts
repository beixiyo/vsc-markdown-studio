import throttle from "lodash.throttle"
import { useMemo } from "react"
import useUnmount from './use-unmount'

interface ThrottleSettings {
  leading?: boolean | undefined
  trailing?: boolean | undefined
}

const defaultOptions: ThrottleSettings = {
  leading: false,
  trailing: true,
}

/**
 * 返回节流回调函数的 Hook
 *
 * @param fn 需要节流的函数
 * @param wait 调用函数前等待的时间（毫秒）
 * @param dependencies 监听变化的依赖项
 * @param options 节流选项
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useThrottledCallback<T extends (...args: any[]) => any>(
  fn: T,
  wait = 250,
  dependencies: React.DependencyList = [],
  options: ThrottleSettings = defaultOptions
): {
  (this: ThisParameterType<T>, ...args: Parameters<T>): ReturnType<T>
  cancel: () => void
  flush: () => void
} {
  const handler = useMemo(
    () => throttle<T>(fn, wait, options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    dependencies
  )

  useUnmount(() => {
    handler.cancel()
  })

  return handler
}

export default useThrottledCallback

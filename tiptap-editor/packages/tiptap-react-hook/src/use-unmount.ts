import { useRef, useEffect } from "react"

/**
 * 在组件卸载时执行回调的 Hook
 *
 * @param callback 组件卸载时要调用的函数
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useUnmount = (callback: (...args: Array<any>) => any) => {
  const ref = useRef(callback)
  ref.current = callback

  useEffect(
    () => () => {
      ref.current()
    },
    []
  )
}

export default useUnmount

import { useEffect, useRef } from 'react'

/**
 * 在组件卸载时执行回调的 Hook
 *
 * @param callback 组件卸载时要调用的函数
 */
export function useUnmount(callback: (...args: Array<any>) => any) {
  const ref = useRef(callback)
  ref.current = callback

  useEffect(
    () => () => {
      ref.current()
    },
    [],
  )
}

export default useUnmount

import { act, createElement, type FC } from 'react'
import { createRoot } from 'react-dom/client'

/**
 * 极简 hook 测试容器：渲染一个空组件、运行 hook、返回 unmount
 * 不引入 @testing-library/react，避免新增依赖
 */
export function renderHook(hook: () => void): () => void {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  const Comp: FC = () => {
    hook()
    return null
  }
  act(() => {
    root.render(createElement(Comp))
  })
  return () => {
    act(() => {
      root.unmount()
    })
    host.remove()
  }
}

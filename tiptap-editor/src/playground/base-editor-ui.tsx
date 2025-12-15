import type { BaseEditorUIProps } from './types'
import { useCurrentEditor } from '@tiptap/react'
import { memo } from 'react'
import { useCursorVisibility } from 'tiptap-api/react'
import { HeaderToolbar, MobileToolbarContent, Toolbar } from 'tiptap-comps'

/**
 * 通用编辑器 UI 组件：提供基础的 Toolbar 功能
 * 通过 children 可以传递自定义的工具栏内容和额外的 UI 组件
 */
export const BaseEditorUI = memo<BaseEditorUIProps>(({
  isMobile,
  height,
  mobileView,
  setMobileView,
  toolbarRef,
  children,
}) => {
  const { editor } = useCurrentEditor()

  const rect = useCursorVisibility({
    editor: editor || null,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  return (
    <>
      <Toolbar
        ref={ toolbarRef }
        style={ {
          ...(isMobile
            ? {
                bottom: `calc(100% - ${height - rect.y}px)`,
              }
            : {}),
        } }
      >
        { mobileView === 'main'
          ? (
              <HeaderToolbar
                onHighlighterClick={ () => setMobileView('highlighter') }
                onLinkClick={ () => setMobileView('link') }
                isMobile={ isMobile }
              >
                { children }
              </HeaderToolbar>
            )
          : (
              <MobileToolbarContent
                type={ mobileView === 'highlighter'
                  ? 'highlighter'
                  : 'link' }
                onBack={ () => setMobileView('main') }
              />
            ) }
      </Toolbar>
    </>
  )
})

BaseEditorUI.displayName = 'BaseEditorUI'


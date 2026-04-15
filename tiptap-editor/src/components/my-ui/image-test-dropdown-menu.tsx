'use client'

import type { Editor } from '@tiptap/react'
import {
  Button,
  Card,
  Popover,
  type PopoverRef,
} from 'comps'
import { useRef } from 'react'
import { useTiptapEditor } from 'tiptap-api/react'
import { ChevronDownIcon } from 'tiptap-comps/icons'

/**
 * 图片节点渲染测试：通过下拉菜单插入不同属性组合的图片，观察渲染效果
 * 事件（click/dblclick/contextmenu/load/error）直接打到 console
 */

const SAMPLES = {
  small: 'https://picsum.photos/seed/a/200/120',
  wide: 'https://picsum.photos/seed/b/600/200',
  square: 'https://picsum.photos/seed/c/300/300',
  broken: 'https://picsum.photos/broken-url-xxxx',
  fallback: 'https://picsum.photos/seed/fallback/120/80',
  thumbnail: 'https://picsum.photos/seed/a/20/12',
}

type Preset = {
  label: string
  attrs: Record<string, any>
}

const INLINE_PRESETS: Preset[] = [
  { label: '行内 1em', attrs: { src: SAMPLES.small, height: '1em', display: 'inline', verticalAlign: 'middle' } },
  { label: '行内 1.3em', attrs: { src: SAMPLES.small, height: '1.3em', display: 'inline', verticalAlign: 'middle' } },
  { label: '行内方形 1em', attrs: { src: SAMPLES.square, width: '1em', height: '1em', display: 'inline', objectFit: 'cover', borderRadius: '4px' } },
  { label: '圆形头像 32', attrs: { src: SAMPLES.square, width: 32, height: 32, display: 'inline-block', objectFit: 'cover', borderRadius: '50%', verticalAlign: 'middle' } },
  { label: 'inline-block 80x48', attrs: { src: SAMPLES.small, width: 80, height: 48, display: 'inline-block', objectFit: 'cover', borderRadius: '4px', margin: '0 4px' } },
]

const BLOCK_PRESETS: Preset[] = [
  { label: 'block 居中 480', attrs: { src: SAMPLES.wide, display: 'block', align: 'center', width: 480, borderRadius: '8px' } },
  { label: 'block 左对齐', attrs: { src: SAMPLES.wide, display: 'block', align: 'left', width: 320 } },
  { label: 'block 右对齐', attrs: { src: SAMPLES.wide, display: 'block', align: 'right', width: 320 } },
  { label: '16/9 宽 100%', attrs: { src: SAMPLES.wide, display: 'block', width: '100%', aspectRatio: '16/9', objectFit: 'cover' } },
  { label: '左浮动环绕', attrs: { src: SAMPLES.small, display: 'inline-block', width: 120, float: 'left', margin: '0 12px 8px 0' } },
]

const STYLE_PRESETS: Preset[] = [
  { label: '边框+阴影', attrs: { src: SAMPLES.small, display: 'inline-block', width: 120, border: '2px solid #3b82f6', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', borderRadius: '6px' } },
  { label: '旋转 10°', attrs: { src: SAMPLES.small, display: 'inline-block', width: 120, rotate: 10, margin: '8px' } },
  { label: '灰度滤镜', attrs: { src: SAMPLES.small, display: 'inline-block', width: 120, filter: 'grayscale(1)' } },
  { label: '半透明', attrs: { src: SAMPLES.small, display: 'inline-block', width: 120, opacity: 0.4 } },
]

const LOADING_PRESETS: Preset[] = [
  { label: '缩略图→原图', attrs: { src: SAMPLES.wide, display: 'block', width: 400, thumbnailSrc: SAMPLES.thumbnail } },
  { label: '失败→fallback', attrs: { src: SAMPLES.broken, display: 'inline-block', width: 120, fallbackSrc: SAMPLES.fallback } },
  { label: '占位色+慢加载', attrs: { src: `${SAMPLES.wide}?t=${Date.now()}`, display: 'block', width: 400, aspectRatio: '3/1', placeholder: '#1f2937' } },
]

const UPDATE_ACTIONS: { label: string, patch: Record<string, any> | ((e: Editor) => Record<string, any>) }[] = [
  { label: '→ inline 1em', patch: { display: 'inline', height: '1em', width: null } },
  { label: '→ block 居中', patch: { display: 'block', align: 'center' } },
  { label: 'width=200', patch: { width: 200 } },
  { label: 'width=100%', patch: { width: '100%' } },
  { label: 'rotate+=15', patch: (e) => {
    const cur = e.getAttributes('image').rotate ?? 0
    return { rotate: (cur || 0) + 15 }
  } },
  { label: 'opacity=0.5', patch: { opacity: 0.5 } },
  { label: 'opacity=1', patch: { opacity: 1 } },
  { label: '清样式', patch: { rotate: null, opacity: null, filter: null, boxShadow: null, border: null, borderRadius: null } },
]

type ImageTestDropdownMenuProps = {
  editor?: Editor | null
  portal?: boolean
  disabled?: boolean
}

export function ImageTestDropdownMenu({
  editor: providedEditor,
  portal: _portal = false,
  disabled = false,
}: ImageTestDropdownMenuProps) {
  const { editor } = useTiptapEditor(providedEditor)
  const popoverRef = useRef<PopoverRef>(null)

  const insert = (preset: Preset) => {
    if (!editor)
      return
    editor.chain().focus().setImage(preset.attrs as any).run()
    console.log('[ImageTest] setImage', preset.label, preset.attrs)
  }

  const update = (action: typeof UPDATE_ACTIONS[number]) => {
    if (!editor)
      return
    const patch = typeof action.patch === 'function'
      ? action.patch(editor)
      : action.patch
    editor.chain().focus().updateImage(patch as any).run()
    console.log('[ImageTest] updateImage', action.label, patch)
  }

  return (
    <Popover
      ref={ popoverRef }
      trigger="click"
      position="bottom"
      content={
        <Card className="p-2 max-w-[480px]" shadow="md" padding="none">
          <div className="space-y-3">
            <Section title="Inline 插入">
              { INLINE_PRESETS.map(p => (
                <TinyBtn key={ p.label } onClick={ () => insert(p) }>{ p.label }</TinyBtn>
              )) }
            </Section>

            <Section title="Block 插入">
              { BLOCK_PRESETS.map(p => (
                <TinyBtn key={ p.label } onClick={ () => insert(p) }>{ p.label }</TinyBtn>
              )) }
            </Section>

            <Section title="样式变体">
              { STYLE_PRESETS.map(p => (
                <TinyBtn key={ p.label } onClick={ () => insert(p) }>{ p.label }</TinyBtn>
              )) }
            </Section>

            <Section title="加载态">
              { LOADING_PRESETS.map(p => (
                <TinyBtn key={ p.label } onClick={ () => insert(p) }>{ p.label }</TinyBtn>
              )) }
            </Section>

            <Section title="更新选中图片">
              { UPDATE_ACTIONS.map(a => (
                <TinyBtn key={ a.label } onClick={ () => update(a) }>{ a.label }</TinyBtn>
              )) }
              <TinyBtn onClick={ () => {
                if (!editor)
                  return
                console.log('[ImageTest] getAttributes(image)', editor.getAttributes('image'))
              } }
              >
                打印属性
              </TinyBtn>
            </Section>
          </div>
        </Card>
      }
    >
      <Button
        type="button"
        variant="ghost"
        tabIndex={ -1 }
        disabled={ disabled || !editor }
        aria-label="Image tests"
        tooltip="Image tests"
        size="sm"
      >
        <span className="tiptap-button-label">图片测试</span>
        <ChevronDownIcon className="size-4 text-icon" />
      </Button>
    </Popover>
  )
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-tiptap-muted px-1 mb-1">{ title }</div>
      <div className="flex flex-wrap gap-1">{ children }</div>
    </div>
  )
}

function TinyBtn({ children, onClick }: { children: React.ReactNode, onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="px-2 py-1 text-xs"
      onClick={ onClick }
    >
      { children }
    </Button>
  )
}

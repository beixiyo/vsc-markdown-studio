import { memo } from 'react'
import { Button, ToolbarGroup, ToolbarSeparator } from 'tiptap-styles/ui'
import { ArrowLeftIcon, HighlighterIcon, LinkIcon } from 'tiptap-styles/icons'
import { ColorHighlightPopoverContent } from '@/components/tiptap-ui/color-highlight-popover'
import { LinkContent } from '@/components/tiptap-ui/link-popover'

export type MobileToolbarContentProps = {
  type: 'highlighter' | 'link'
  onBack: () => void
}

export const MobileToolbarContent = memo<MobileToolbarContentProps>((props) => {
  const { type, onBack } = props

  return (
    <>
      <ToolbarGroup>
        <Button data-style="ghost" onClick={ onBack }>
          <ArrowLeftIcon className="tiptap-button-icon" />
          { type === 'highlighter'
            ? <HighlighterIcon className="tiptap-button-icon" />
            : <LinkIcon className="tiptap-button-icon" /> }
        </Button>
      </ToolbarGroup>

      <ToolbarSeparator />

      { type === 'highlighter'
        ? <ColorHighlightPopoverContent />
        : <LinkContent /> }
    </>
  )
})

MobileToolbarContent.displayName = 'MobileToolbarContent'


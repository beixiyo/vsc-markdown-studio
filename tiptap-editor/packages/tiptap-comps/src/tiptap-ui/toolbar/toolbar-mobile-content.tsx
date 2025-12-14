import { memo } from 'react'
import { ArrowLeftIcon, HighlighterIcon, LinkIcon } from '../../icons'
import {
  Button,
  ToolbarGroup,
  ToolbarSeparator,
} from '../../ui'
import {
  ColorHighlightPopoverContent,
  LinkContent,
} from '../index'

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

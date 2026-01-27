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
          <ArrowLeftIcon className="size-4" />
          { type === 'highlighter'
            ? <HighlighterIcon className="size-4" />
            : <LinkIcon className="size-4" /> }
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

import {
  Button,
  Toolbar,
} from 'comps'
import { memo } from 'react'
import { ArrowLeftIcon, HighlighterIcon, LinkIcon } from '../../icons'
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
      <Toolbar.Group>
        <Button data-style="ghost" onClick={ onBack }>
          <ArrowLeftIcon className="size-4" />
          { type === 'highlighter'
            ? <HighlighterIcon className="size-4" />
            : <LinkIcon className="size-4" /> }
        </Button>
      </Toolbar.Group>

      <Toolbar.Separator />

      { type === 'highlighter'
        ? <ColorHighlightPopoverContent />
        : <LinkContent /> }
    </>
  )
})

MobileToolbarContent.displayName = 'MobileToolbarContent'

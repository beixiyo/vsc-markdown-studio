import {
  Button,
  Toolbar,
} from 'comps'
import { memo } from 'react'
import { ArrowLeftIcon, HighlighterIcon, LinkIcon } from '../../icons'
import { TIPTAP_UI_STYLES } from '../constants'
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
          <ArrowLeftIcon className={ TIPTAP_UI_STYLES.icon } />
          { type === 'highlighter'
            ? <HighlighterIcon className={ TIPTAP_UI_STYLES.iconHighlight } />
            : <LinkIcon className={ TIPTAP_UI_STYLES.icon } /> }
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

import type { NodeViewProps } from '@tiptap/react'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import { Button, Cascader } from 'comps'
import { useT } from 'i18n/react'
import React, { useMemo } from 'react'
import { CODE_LANGUAGES, type CodeLanguage } from './constants'

export const CodeBlockNode: React.FC<NodeViewProps> = (props) => {
  const t = useT()
  const language: string = props.node.attrs.language || 'plaintext'
  const isEmpty = props.node.content.size === 0

  const activeLanguage = useMemo(() => {
    return (
      CODE_LANGUAGES.find((lang: CodeLanguage) => lang.value === language)
      || CODE_LANGUAGES.find((lang: CodeLanguage) => lang.value === 'plaintext')!
    )
  }, [language])

  const setLanguage = (value: string) => {
    props.updateAttributes({ language: value })
  }

  const handleSelectLanguage = (value: string | string[]) => {
    const lang = Array.isArray(value) ? value[value.length - 1] : value
    setLanguage(lang)
  }

  return (
    <NodeViewWrapper className="group my-3 rounded-lg border border-border bg-transparent overflow-hidden text-text">
      <div className="flex justify-self-end mt-1 select-none" aria-hidden>
        <Cascader
          searchable
          options={ CODE_LANGUAGES }
          value={ language }
          onChange={ handleSelectLanguage }
          placement="bottom-end"
          dropdownHeight={ 260 }
          className="mr-2 select-none"
          trigger={
            <Button
              size="sm"
              className="text-text2 text-[11px] py-0 select-none"
              tabIndex={ -1 }
              onMouseDown={ (event) => {
                event.preventDefault()
                event.stopPropagation()
              } }
            >
              <span className="truncate max-w-[120px] select-none">
                { activeLanguage.label }
              </span>
            </Button>
          }
        />
      </div>

      <pre className="overflow-auto text-xs leading-relaxed p-3 relative">
        {/* placeholder */ }
        <span
          className="code-block-placeholder absolute left-3 top-3"
          aria-hidden
        >
          { isEmpty
            ? t('placeholder.codeBlock')
            : '' }
        </span>

        <NodeViewContent
          className={ language
            ? `language-${language}`
            : '' }
        />
      </pre>
    </NodeViewWrapper>
  )
}

CodeBlockNode.displayName = 'CodeBlockNode'

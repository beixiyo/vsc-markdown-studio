import type { NodeViewProps } from '@tiptap/react'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import { Button, Cascader } from 'comps'
import { useT } from 'i18n/react'
import React, { useMemo } from 'react'

type CodeLanguage = {
  value: string
  label: string
}

const CODE_LANGUAGES: CodeLanguage[] = [
  { value: 'plaintext', label: 'Plain text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'tsx', label: 'TSX' },
  { value: 'jsx', label: 'JSX' },
  { value: 'json', label: 'JSON' },
  { value: 'css', label: 'CSS' },
  { value: 'html', label: 'HTML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'bash', label: 'Bash' },
  { value: 'python', label: 'Python' },
]

export const CodeBlockNode: React.FC<NodeViewProps> = (props) => {
  const t = useT()
  const language: string = props.node.attrs.language || 'plaintext'
  const isEmpty = props.node.content.size === 0

  const activeLanguage = useMemo<CodeLanguage>(() => {
    return (
      CODE_LANGUAGES.find(lang => lang.value === language)
      ?? { value: language, label: language || 'Plain text' }
    )
  }, [language])

  const handleSelectLanguage = (value: string) => {
    props.updateAttributes({ language: value })
  }

  return (
    <NodeViewWrapper className="group my-3 rounded-lg border border-border bg-background2 overflow-hidden text-text">
      <div className="flex justify-self-end mt-1 select-none" aria-hidden>
        <Cascader
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
            : undefined }
        />
      </pre>
    </NodeViewWrapper>
  )
}

CodeBlockNode.displayName = 'CodeBlockNode'

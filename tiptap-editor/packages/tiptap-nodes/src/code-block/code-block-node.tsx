import type { NodeViewProps } from '@tiptap/react'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import { Button } from 'comps'
import React, { useMemo, useState } from 'react'

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
  const language: string = props.node.attrs.language || 'plaintext'
  const [open, setOpen] = useState(false)

  const activeLanguage = useMemo<CodeLanguage>(() => {
    return (
      CODE_LANGUAGES.find(lang => lang.value === language)
      ?? { value: language, label: language || 'Plain text' }
    )
  }, [language])

  const handleSelectLanguage = (value: string) => {
    props.updateAttributes({ language: value })
    setOpen(false)
  }

  return (
    <NodeViewWrapper className="group my-3 rounded-lg border border-border bg-background2 text-text">
      <div className="flex items-center justify-between border-b border-border bg-background3 px-3 py-1.5 text-[11px] leading-none text-text2">
        <div className="relative inline-flex items-center">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[11px] leading-none text-text2 hover:bg-background"
            tabIndex={ -1 }
            onClick={ (event) => {
              event.preventDefault()
              event.stopPropagation()
              setOpen(prev => !prev)
            } }
          >
            <span className="truncate max-w-[120px]">
              { activeLanguage.label }
            </span>
            <span className="ml-1 text-[10px] text-text2">
              ▾
            </span>
          </Button>

          { open && (
            <div
              className="absolute right-0 top-[110%] z-50 mt-1 w-40 rounded-md border border-border bg-background shadow-card"
              onClick={ event => event.stopPropagation() }
            >
              <ul className="max-h-64 overflow-auto py-1 text-xs">
                { CODE_LANGUAGES.map(lang => (
                  <li key={ lang.value }>
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center justify-between px-3 py-1.5 text-left text-text hover:bg-background2"
                      onClick={ () => handleSelectLanguage(lang.value) }
                    >
                      <span className="truncate">
                        { lang.label }
                      </span>
                      { lang.value === language && (
                        <span className="ml-2 text-[10px] text-systemOrange">
                          ●
                        </span>
                      ) }
                    </button>
                  </li>
                )) }
              </ul>
            </div>
          ) }
        </div>
      </div>

      <pre className="overflow-auto px-3 py-2 text-xs leading-relaxed">
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

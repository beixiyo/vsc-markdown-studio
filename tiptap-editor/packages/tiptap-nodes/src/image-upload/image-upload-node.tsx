import React, { useRef } from 'react'
import type { NodeViewProps } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react'
import { Button } from 'tiptap-comps'
import { focusNextNode, isValidPosition } from 'tiptap-utils'
import type { UploadOptions } from './types'
import { useFileUpload } from './hooks/use-file-upload'
import { ImageUploadDragArea } from './components/image-upload-drag-area'
import { ImageUploadPreview } from './components/image-upload-preview'
import { DropZoneContent } from './components/drop-zone-content'

export const ImageUploadNode: React.FC<NodeViewProps> = (props) => {
  const { accept, limit, maxSize } = props.node.attrs
  const inputRef = useRef<HTMLInputElement>(null)
  const extension = props.extension

  const uploadOptions: UploadOptions = {
    maxSize,
    limit,
    accept,
    upload: extension.options.upload,
    onSuccess: extension.options.onSuccess,
    onError: extension.options.onError,
  }

  const { fileItems, uploadFiles, removeFileItem, clearAllFiles }
    = useFileUpload(uploadOptions)

  const handleUpload = async (files: File[]) => {
    const urls = await uploadFiles(files)

    if (urls.length > 0) {
      const pos = props.getPos()

      if (isValidPosition(pos)) {
        const imageNodes = urls.map((url, index) => {
          const filename
            = files[index]?.name.replace(/\.[^/.]+$/, '') || 'unknown'
          return {
            type: extension.options.type,
            attrs: {
              ...extension.options,
              src: url,
              alt: filename,
              title: filename,
            },
          }
        })

        props.editor
          .chain()
          .focus()
          .deleteRange({ from: pos, to: pos + props.node.nodeSize })
          .insertContentAt(pos, imageNodes)
          .run()

        focusNextNode(props.editor)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) {
      extension.options.onError?.(new Error('No file selected'))
      return
    }
    handleUpload(Array.from(files))
  }

  const handleClick = () => {
    if (inputRef.current && fileItems.length === 0) {
      inputRef.current.value = ''
      inputRef.current.click()
    }
  }

  const hasFiles = fileItems.length > 0

  return (
    <NodeViewWrapper
      className="my-8 outline-none"
      tabIndex={ 0 }
      onClick={ handleClick }
    >
      { !hasFiles && (
        <ImageUploadDragArea onFile={ handleUpload } selected={ props.selected }>
          <DropZoneContent maxSize={ maxSize } limit={ limit } />
        </ImageUploadDragArea>
      ) }

      { hasFiles && (
        <div className="flex flex-col gap-3">
          { fileItems.length > 1 && (
            <div className="flex items-center justify-between py-2 border-b border-border mb-2 max-[480px]:flex-col max-[480px]:items-start max-[480px]:gap-2">
              <span className="text-sm font-medium text-textPrimary">
                Uploading
                { ' ' }
                { fileItems.length }
                { ' ' }
                { fileItems.length === 1 ? 'file' : 'files' }
              </span>
              <Button
                type="button"
                data-style="ghost"
                onClick={ (e) => {
                  e.stopPropagation()
                  clearAllFiles()
                } }
              >
                Clear All
              </Button>
            </div>
          ) }
          { fileItems.map(fileItem => (
            <ImageUploadPreview
              key={ fileItem.id }
              fileItem={ fileItem }
              onRemove={ () => removeFileItem(fileItem.id) }
            />
          )) }
        </div>
      ) }

      <input
        ref={ inputRef }
        name="file"
        className="hidden"
        accept={ accept }
        type="file"
        multiple={ limit > 1 }
        onChange={ handleChange }
        onClick={ (e: React.MouseEvent<HTMLInputElement>) => e.stopPropagation() }
      />
    </NodeViewWrapper>
  )
}

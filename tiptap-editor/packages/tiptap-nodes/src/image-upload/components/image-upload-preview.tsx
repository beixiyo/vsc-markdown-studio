import type { FileItem } from '../types'
import { Button } from 'comps'
import React from 'react'
import { CloseIcon, CloudUploadIcon } from 'tiptap-comps/icons'

interface ImageUploadPreviewProps {
  /**
   * The file item to preview
   */
  fileItem: FileItem
  /**
   * Callback to remove this file from upload queue
   */
  onRemove: () => void
}

/**
 * Component that displays a preview of an uploading file with progress
 */
export const ImageUploadPreview: React.FC<ImageUploadPreviewProps> = ({
  fileItem,
  onRemove,
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0)
      return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
  }

  return (
    <div className="relative rounded-lg overflow-hidden">
      { fileItem.status === 'uploading' && (
        <div
          className="absolute inset-0 bg-brand/10 transition-all duration-300 ease-out"
          style={ { width: `${fileItem.progress}%` } }
        />
      ) }

      <div className="relative border border-border rounded-lg p-4 flex items-center justify-between max-[480px]:p-3">
        <div className="flex items-center gap-3 h-8">
          <div className="p-2 bg-brand rounded-xl flex items-center justify-center">
            <CloudUploadIcon className="text-textSpecial" />
          </div>
          <div className="flex flex-col">
            <span className="text-text font-medium text-sm leading-normal line-clamp-1">
              { fileItem.file.name }
            </span>
            <span className="text-text2 font-semibold text-xs leading-normal">
              { formatFileSize(fileItem.file.size) }
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          { fileItem.status === 'uploading' && (
            <span className="text-xs text-brand font-semibold">
              { fileItem.progress }
              %
            </span>
          ) }
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={ (e: React.MouseEvent) => {
              e.stopPropagation()
              onRemove()
            } }
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

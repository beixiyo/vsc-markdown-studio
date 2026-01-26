import React from 'react'
import { CloudUploadIcon, FileIcon, FileCornerIcon } from './icons'

interface DropZoneContentProps {
  maxSize: number
  limit: number
}

export const DropZoneContent: React.FC<DropZoneContentProps> = ({
  maxSize,
  limit,
}) => (
  <>
    <div className="relative w-[50px] h-[60px] inline-flex items-start justify-center select-none">
      <FileIcon />
      <FileCornerIcon />
      <div className="absolute w-7 h-7 bottom-0 right-0 bg-brand rounded-xl flex items-center justify-center">
        <CloudUploadIcon className="text-textSpecial" />
      </div>
    </div>

    <div className="flex flex-col items-center justify-center gap-1 mt-4 select-none">
      <span className="text-textPrimary font-medium text-sm leading-normal">
        <em className="not-italic underline">Click to upload</em>
        { ' ' }
        or drag and drop
      </span>
      <span className="text-textSecondary font-semibold text-xs leading-normal">
        Maximum
        { ' ' }
        { limit }
        { ' ' }
        file
        { limit === 1
          ? ''
          : 's' }
        ,
        { ' ' }
        { maxSize / 1024 / 1024 }
        MB
        each.
      </span>
    </div>
  </>
)

import { useT } from 'i18n/react'
import React from 'react'
import { CloudUploadIcon, FileCornerIcon, FileIcon } from './icons'

interface DropZoneContentProps {
  maxSize: number
  limit: number
}

export const DropZoneContent: React.FC<DropZoneContentProps> = ({
  maxSize,
  limit,
}) => {
  const t = useT()
  const maxSizeMB = maxSize / 1024 / 1024

  return (
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
          <em className="not-italic underline">{ t('image.uploadClick') }</em>
          { ' ' }
          { t('image.uploadDrag') }
        </span>
        <span className="text-textSecondary font-semibold text-xs leading-normal">
          { t('image.uploadLimit', {
            limit,
            maxSize: maxSizeMB,
            plural: limit === 1
              ? ''
              : 's',
          }) }
        </span>
      </div>
    </>
  )
}

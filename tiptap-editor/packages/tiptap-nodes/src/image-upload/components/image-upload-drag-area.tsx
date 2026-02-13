import React, { useState } from 'react'
import { cn } from 'utils'

interface ImageUploadDragAreaProps {
  /**
   * Callback function triggered when files are dropped or selected
   * @param {File[]} files - Array of File objects that were dropped or selected
   */
  onFile: (files: File[]) => void
  /**
   * Optional child elements to render inside the drag area
   * @optional
   * @default undefined
   */
  children?: React.ReactNode
  /**
   * Whether the node is currently selected in the editor
   */
  selected?: boolean
}

/**
 * A component that creates a drag-and-drop area for image uploads
 */
export const ImageUploadDragArea: React.FC<ImageUploadDragAreaProps> = ({
  onFile,
  children,
  selected,
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragActive(false)
      setIsDragOver(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      onFile(files)
    }
  }

  return (
    <div
      className={ cn(
        'p-8 md:p-6 border-[1.5px] border-dashed border-border rounded-lg text-center cursor-pointer relative overflow-hidden transition-all duration-200 hover:border-border3',
        {
          'border-brand bg-brand/5': isDragActive,
          'border-brand bg-brand/10': isDragOver,
          'border-brand': selected,
        },
      ) }
      onDragEnter={ handleDragEnter }
      onDragLeave={ handleDragLeave }
      onDragOver={ handleDragOver }
      onDrop={ handleDrop }
    >
      { children }
    </div>
  )
}

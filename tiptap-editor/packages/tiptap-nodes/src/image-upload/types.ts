import type { NodeType } from '@tiptap/pm/model'

export type UploadFunction = (
  file: File,
  onProgress?: (event: { progress: number }) => void,
  abortSignal?: AbortSignal
) => Promise<string>

export interface ImageUploadNodeOptions {
  /**
   * The type of the node.
   * @default 'image'
   */
  type?: string | NodeType | undefined
  /**
   * Acceptable file types for upload.
   * @default 'image/*'
   */
  accept?: string
  /**
   * Maximum number of files that can be uploaded.
   * @default 1
   */
  limit?: number
  /**
   * Maximum file size in bytes (0 for unlimited).
   * @default 0
   */
  maxSize?: number
  /**
   * Function to handle the upload process.
   */
  upload?: UploadFunction
  /**
   * Callback for upload errors.
   */
  onError?: (error: Error) => void
  /**
   * Callback for successful uploads.
   */
  onSuccess?: (url: string) => void
  /**
   * HTML attributes to add to the image element.
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>
}

export interface FileItem {
  /**
   * Unique identifier for the file item
   */
  id: string
  /**
   * The actual File object being uploaded
   */
  file: File
  /**
   * Current upload progress as a percentage (0-100)
   */
  progress: number
  /**
   * Current status of the file upload process
   * @default "uploading"
   */
  status: 'uploading' | 'success' | 'error'

  /**
   * URL to the uploaded file, available after successful upload
   * @optional
   */
  url?: string
  /**
   * Controller that can be used to abort the upload process
   * @optional
   */
  abortController?: AbortController
}

export interface UploadOptions {
  /**
   * Maximum allowed file size in bytes
   */
  maxSize: number
  /**
   * Maximum number of files that can be uploaded
   */
  limit: number
  /**
   * String specifying acceptable file types (MIME types or extensions)
   * @example ".jpg,.png,image/jpeg" or "image/*"
   */
  accept: string
  /**
   * Function that handles the actual file upload process
   * @param {File} file - The file to be uploaded
   * @param {Function} onProgress - Callback function to report upload progress
   * @param {AbortSignal} signal - Signal that can be used to abort the upload
   * @returns {Promise<string>} Promise resolving to the URL of the uploaded file
   */
  upload: (
    file: File,
    onProgress: (event: { progress: number }) => void,
    signal: AbortSignal
  ) => Promise<string>
  /**
   * Callback triggered when a file is uploaded successfully
   * @param {string} url - URL of the successfully uploaded file
   * @optional
   */
  onSuccess?: (url: string) => void
  /**
   * Callback triggered when an error occurs during upload
   * @param {Error} error - The error that occurred
   * @optional
   */
  onError?: (error: Error) => void
}

/**
 * 文件上传相关工具函数
 */

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

/**
 * 处理图像上传，支持进度跟踪和取消功能
 * @param file 要上传的文件
 * @param onProgress 用于跟踪上传进度的可选回调
 * @param abortSignal 用于取消上传的可选 AbortSignal
 * @returns 解析为上传图像 URL 的 Promise
 */
export async function handleImageUpload(file: File, onProgress?: (event: { progress: number }) => void, abortSignal?: AbortSignal): Promise<string> {
  // Validate file
  if (!file) {
    throw new Error('No file provided')
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File size exceeds maximum allowed (${MAX_FILE_SIZE / (1024 * 1024)}MB)`,
    )
  }

  // For demo/testing: Simulate upload progress. In production, replace the following code
  // with your own upload implementation.
  for (let progress = 0; progress <= 100; progress += 10) {
    if (abortSignal?.aborted) {
      throw new Error('Upload cancelled')
    }
    await new Promise(resolve => setTimeout(resolve, 500))
    onProgress?.({ progress })
  }

  return '/images/tiptap-ui-placeholder-image.jpg'
}

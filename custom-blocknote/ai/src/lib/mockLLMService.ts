/**
 * @TODO: 此处为模拟数据，未来需替换为真实网络请求
 *
 * 模拟一个 AI 流式响应的服务
 * @returns {Promise<ReadableStream<Uint8Array>>} 一个模拟的 AI 响应流
 */
export type MockAIStreamOptions = {
  /**
   * 模拟提示词，用于拼接在最终输出中
   */
  prompt?: string
}

export async function getMockAIStream(options?: MockAIStreamOptions): Promise<ReadableStream<Uint8Array>> {
  const normalizedPrompt = options?.prompt?.trim() || ''
  const baseText = normalizedPrompt
    ? `收到指令：${normalizedPrompt}。这是一个模拟的 AI 流式响应，我们一步步地构建功能，确保逻辑严谨闭环。`
    : '这是一个模拟的 AI 流式响应。我们一步步地构建功能，确保逻辑严谨闭环。'
  const mockResponse = baseText.split(' ')
  let wordIndex = 0

  const stream = new ReadableStream({
    start(controller) {
      const pushWord = () => {
        if (wordIndex >= mockResponse.length) {
          controller.close()
          return
        }

        const word = `${mockResponse[wordIndex]} `
        const encoded = new TextEncoder().encode(word)
        controller.enqueue(encoded)
        wordIndex++

        const randomDelay = Math.random() * 100 + 50
        setTimeout(pushWord, randomDelay)
      }

      pushWord()
    },
  })

  return stream
}

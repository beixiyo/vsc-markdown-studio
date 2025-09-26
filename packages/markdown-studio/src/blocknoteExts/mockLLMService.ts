/**
 * @TODO: 此处为模拟数据，未来需替换为真实网络请求
 *
 * 模拟一个 AI 流式响应的服务
 * @returns {Promise<ReadableStream<Uint8Array>>} 一个模拟的 AI 响应流
 */
export async function getMockAIStream(): Promise<ReadableStream<Uint8Array>> {
  // 预设的模拟 AI 回复
  const mockResponse = "这是一个模拟的 AI 流式响应。我们一步步地构建功能，确保逻辑严谨闭环。".split(" ");
  let wordIndex = 0;

  const stream = new ReadableStream({
    start(controller) {
      const pushWord = () => {
        if (wordIndex >= mockResponse.length) {
          // 所有单词都已发送，关闭流
          controller.close();
          return;
        }

        // 加上空格，模拟真实句子
        const word = mockResponse[wordIndex] + " ";
        // 将字符串编码为 Uint8Array
        const encoded = new TextEncoder().encode(word);
        controller.enqueue(encoded);
        wordIndex++;

        // 模拟网络延迟和打字效果
        const randomDelay = Math.random() * 100 + 50;
        setTimeout(pushWord, randomDelay);
      };

      // 开始推送第一个单词
      pushWord();
    },
  });

  return stream;
}

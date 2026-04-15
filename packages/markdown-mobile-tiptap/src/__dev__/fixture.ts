/**
 * 真实 Native 下发数据样本，仅用于开发环境肉眼验证
 * 与 `MDBridge.setContentWithSpeakers` 入参结构一致
 */
export const devFixture = {
  speakers: [
    { name: '说话人1', label: 0, originalLabel: 0 },
  ],
  content: '![BlockNote image](https://flowtica-stg.s3.amazonaws.com/image/2025/11/03/9_fceb835a-b5a7-4e3a-b11f-4dfb96f45ba0.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256\\&X-Amz-Credential=AKIA42PHHLD26IULA7GL%2F20251103%2Fus-east-2%2Fs3%2Faws4_request\\&X-Amz-Date=20251103T114829Z\\&X-Amz-Expires=43200\\&X-Amz-SignedHeaders=host\\&X-Amz-Signature=c9c3d101717ef1d3a2cb632d22a4b06920f2de1f20369037769349b102e4898e)\n\n## 设备调试与录音测\n\n[speaker:0]在会议开始前进行了简短的设备调试与录音l\n',
}

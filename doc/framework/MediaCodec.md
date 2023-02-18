# MediaCodec

## 本篇文章目标

- 了解 MediaCodec
- 掌握 MediaCodec API 使用流程
- 掌握 MediaCodec API

## MediaCodec 基本介绍

MediaCodec 类可用于访问低级媒体编解码器，即编码器/解码器组件。  
MediaCodec 是 Android 提供的用于对音视频进行编解码的类，它通过访问底层的 codec 来实现编解码的功能  
它是 Android 低级多媒体支持基础结构的一部分  
它为芯片厂商和应用开发者搭建了一个统一接口

## MediaCodec 在 Android 中的位置

![](../../assets/mediacodec_in_android.svg)

## MediaCodec 的生命周期

![](../../assets/mediacodec_states.svg)

## MediaCodec 数据处理流程设计

![](../../assets/mediacodec_buffers.svg)

从上图可以看出 MediaCodec 架构上采用了 2 个缓冲区队列，异步处理 input 和 output 数据，并且使用了一组输入输出缓存。

Client 请求或接收到一个空的输入缓存（input buffer），向其中填充满数据并将它传递给编解码器处理。  
编解码器处理完这些数据并将处理结果输出至一个空的输出缓存（output buffer）中。  
最终，Client 请求或接收到一个填充了结果数据的输出缓存（output buffer），使用完其中的数据，并将其释放给编解码器再次使用。

具体工作如下：

1. Client 从 input 缓冲区队列申请 empty buffer [dequeueInputBuffer]
2. Client 把需要编解码的数据拷贝到 empty buffer，然后放入 input 缓冲区队列 [queueInputBuffer]
3. MediaCodec 模块从 input 缓冲区队列取一帧数据进行编解码处理
4. 编解码处理结束后，MediaCodec 将原始数据 buffer 置为 empty 后放回 input 缓冲区队列，将编解码后的数据放入到 output 缓冲区队列
5. Client 从 output 缓冲区队列申请编解码后的 buffer [dequeueOutputBuffer]
6. Client 对编解码后的 buffer 进行渲染/播放
7. 渲染/播放完成后，Client 再将该 buffer 放回 output 缓冲区队列 [releaseOutputBuffer]

## MediaCodec 的基本调用流程

### 同步模式调用流程 (synchronous mode)

```
MediaCodec codec = MediaCodec.createByCodecName(name);
codec.configure(format, …);
MediaFormat outputFormat = codec.getOutputFormat(); // option B
codec.start();
for (;;) {
 int inputBufferId = codec.dequeueInputBuffer(timeoutUs);
 if (inputBufferId >= 0) {
   ByteBuffer inputBuffer = codec.getInputBuffer(…);
   // fill inputBuffer with valid data
   …
   codec.queueInputBuffer(inputBufferId, …);
 }
 int outputBufferId = codec.dequeueOutputBuffer(…);
 if (outputBufferId >= 0) {
   ByteBuffer outputBuffer = codec.getOutputBuffer(outputBufferId);
   MediaFormat bufferFormat = codec.getOutputFormat(outputBufferId); // option A
   // bufferFormat is identical to outputFormat
   // outputBuffer is ready to be processed or rendered.
   …
   codec.releaseOutputBuffer(outputBufferId, …);
 } else if (outputBufferId == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
   // Subsequent data will conform to new format.
   // Can ignore if using getOutputFormat(outputBufferId)
   outputFormat = codec.getOutputFormat(); // option B
 }
}
codec.stop();
codec.release();
```

### 异步模式调用流程(asynchronous mode)

```
MediaCodec codec = MediaCodec.createByCodecName(name);
MediaFormat mOutputFormat; // member variable
codec.setCallback(new MediaCodec.Callback() {
 @Override
 void onInputBufferAvailable(MediaCodec mc, int inputBufferId) {
   ByteBuffer inputBuffer = codec.getInputBuffer(inputBufferId);
   // fill inputBuffer with valid data
   …
   codec.queueInputBuffer(inputBufferId, …);
 }

 @Override
 void onOutputBufferAvailable(MediaCodec mc, int outputBufferId, …) {
   ByteBuffer outputBuffer = codec.getOutputBuffer(outputBufferId);
   MediaFormat bufferFormat = codec.getOutputFormat(outputBufferId); // option A
   // bufferFormat is equivalent to mOutputFormat
   // outputBuffer is ready to be processed or rendered.
   …
   codec.releaseOutputBuffer(outputBufferId, …);
 }

 @Override
 void onOutputFormatChanged(MediaCodec mc, MediaFormat format) {
   // Subsequent data will conform to new format.
   // Can ignore if using getOutputFormat(outputBufferId)
   mOutputFormat = format; // option B
 }

 @Override
 void onError(…) {
   …
 }
});
codec.configure(format, …);
mOutputFormat = codec.getOutputFormat(); // option B
codec.start();
// wait for processing to complete
codec.stop();
codec.release();
```

## MediaCodec API 介绍

<https://developer.android.com/reference/android/media/MediaCodec#public-methods_1>

## 参考资料

1. <https://developer.android.com/reference/android/media/MediaCodec>

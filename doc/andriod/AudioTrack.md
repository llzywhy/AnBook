# AudioTrack

## 本篇文章目标

- 了解 java 层 Audio Track 的使用流程和具体参数的作用
- 了解 C++ 层 Audio Track 的使用流程和具体参数的作用

## java 层 Audio Track 的使用

### Audio Track 官方文档：
https://developer.android.com/reference/android/media/AudioTrack

### Audio Track 源码：
https://cs.android.com/android/platform/superproject/+/android-12.1.0_r8:frameworks/base/media/java/android/media/AudioTrack.java;l=639

### Audio Track java demo 代码

``` java
frameworks/base/media/tests/MediaFrameworkTest/src/com/android/mediaframeworktest/functional/audio/MediaAudioTrackTest.java

public void testSetPlaybackRate() throws Exception {
    // constants for test
    final String TEST_NAME = "testSetPlaybackRate";
    final int TEST_SR = 22050;
    final int TEST_CONF = AudioFormat.CHANNEL_OUT_STEREO;
    final int TEST_FORMAT = AudioFormat.ENCODING_PCM_16BIT;
    final int TEST_MODE = AudioTrack.MODE_STREAM;
    final int TEST_STREAM_TYPE = AudioManager.STREAM_MUSIC;
    
    //-------- initialization --------------
    int minBuffSize = AudioTrack.getMinBufferSize(TEST_SR, TEST_CONF, TEST_FORMAT);
    AudioTrack track = new AudioTrack(TEST_STREAM_TYPE, TEST_SR, TEST_CONF, TEST_FORMAT,
            minBuffSize, TEST_MODE);
    byte data[] = new byte[minBuffSize/2];
    //--------    test        --------------
    track.write(data, 0, data.length);
    track.write(data, 0, data.length);
    assumeTrue(TEST_NAME, track.getState() == AudioTrack.STATE_INITIALIZED);
    track.play();
    assertTrue(TEST_NAME, track.setPlaybackRate((int)(TEST_SR/2)) == AudioTrack.SUCCESS);
    //-------- tear down      --------------
    track.release();
}
```

### Audio Track 创建参数解析

**Audio Track 数据传输模式**

- AudioTrack.MODE_STREAM

在流模式（MODE_STREAM）下，音频数据是动态写入到AudioTrack对象中的。这意味着你可以一边播放一边不断地提供数据。这种模式适用于持续不断的音频流，比如音乐播放或者网络音频流。流模式通常用于播放较长的音频文件或者实时的音频流，因为它不需要一次性将所有的音频数据加载到内存中。

使用流模式时，应用程序需要不断地调用write()方法来提供新的音频数据。AudioTrack会处理这些数据，将它们发送到音频缓冲区，然后由音频硬件进行播放。


- AudioTrack.MODE_STATIC

静态模式（MODE_STATIC）允许应用程序一次性将所有音频数据加载到AudioTrack中。这种模式适合播放时间较短的音频片段，如游戏的音效。由于数据是预先加载的，因此可以立即播放，而且在播放时不会有延迟。

在静态模式下，整个音频样本是在创建AudioTrack对象时一次性写入的。之后，可以重复播放这些数据而无需再次写入。这种模式对于资源有限的环境非常有用，因为它减少了CPU的使用，但是它受到可用内存大小的限制。

**stream type**

**AudioAttribute**

### 基本使用流程

1. new Audio Track
2. 写数据
3. 播放数据
4. release Audio Track

## C++ 层 Audio Track 的使用

### Audio Track C++ demo 代码:

```
bp 文件修改：
 
cc_test {
    name: "atdemo",
    gtest: false,
 
    srcs: ["audio_track_demo.cpp"],
 
    shared_libs: [
        "liblog",
        "libcutils",
        "libutils",
        "libbinder",
        "libhardware_legacy",
        "libmedia",
        "libaudioclient",
    ],
 
    header_libs: [
        "libmediametrics_headers",
    ],
 
    cflags: [
        "-Wall",
        "-Werror",
        "-Wno-error=deprecated-declarations",
        "-Wunused",
        "-Wunreachable-code",
    ],
}
 
产物路径：Android12\out\target\product\tcl9618\data\nativetest
 
demo代码：
 
#define LOG_TAG "atdemo"
 
#include <stdlib.h>
#include <stdio.h>
#include <cutils/properties.h>
#include <media/AudioSystem.h>
#include <media/AudioTrack.h>
#include <math.h>
 
#include <binder/MemoryDealer.h>
#include <binder/MemoryHeapBase.h>
#include <binder/MemoryBase.h>
#include <binder/ProcessState.h>
 
#include <utils/Log.h>
 
#include <fcntl.h>
 
namespace android {
 
class AudioTrackTest{
    public:
        AudioTrackTest(void);
        ~AudioTrackTest() {};
 
        void Execute(void);
        int Test01();
        int Test02();
 
        void Generate(short *buffer, long bufferSz, long amplitude, unsigned long &phi, long dPhi);
        void InitSine();
        short ComputeSine(long amplitude, long phi);
 
        #define SIN_SZ    1024
        short sin1024[SIN_SZ];           // sine table 2*pi = 1024
};
 
/************************************************************
*
*    Constructor
*
************************************************************/
AudioTrackTest::AudioTrackTest(void) {
 
    InitSine();         // init sine table
 
}
 
 
/************************************************************
*
*
************************************************************/
void AudioTrackTest::Execute(void) {
    if (Test01() == 0) {
        printf("01 passed\n");
    } else {
        printf("01 failed\n");
    }
 
    if (Test02() == 0) {
        printf("02 passed\n");
    } else {
        printf("02 failed\n");
    }
}
 
/************************************************************
*
*    Shared memory test
*
************************************************************/
#define BUF_SZ 441000
 
int AudioTrackTest::Test01() {
 
    printf("Test01\n");
    sp<MemoryDealer> heap;
    sp<IMemory> iMem;
    uint8_t* data;
 
    short smpBuf[BUF_SZ];
    long rate = 44100;
    unsigned long phi;
    unsigned long dPhi;
    long amplitude;
    long freq = 1237;
    float f0;
 
    f0 = pow(2., 32.) * freq / (float)rate;
    dPhi = (unsigned long)f0;
    amplitude = 1000;
    phi = 0;
    Generate(smpBuf, BUF_SZ, amplitude, phi, dPhi);  // fill buffer
 
    printf("before loop\n");
    for (int i = 0; i < 1; i++) {
 
        printf("new MemoryDealer\n");
        heap = new MemoryDealer(1024*1024*4, "AudioTrack Heap Base");
 
        iMem = heap->allocate(BUF_SZ*sizeof(short));
 
        data = static_cast<uint8_t*>(iMem->unsecurePointer());
        memcpy(data, smpBuf, BUF_SZ*sizeof(short));
 
        printf("new AudioTrack\n");
        sp<AudioTrack> track = new AudioTrack(AUDIO_STREAM_MUSIC,// stream type
               rate,
               AUDIO_FORMAT_PCM_16_BIT,// word length, PCM
               AUDIO_CHANNEL_OUT_MONO,
               iMem);
 
        printf("track initCheck\n");
        status_t status = track->initCheck();
        if(status != NO_ERROR) {
            track.clear();
            printf("Failed for initCheck()\n");
            return -1;
        }
 
        printf("set volume 1.0\n");
        track->setVolume(1.0f);
 
        // start play
        printf("start\n");
        track->start();
 
        printf("sleep 2s\n");
        usleep(2000000);
 
        printf("stop\n");
        track->stop();
        iMem.clear();
        heap.clear();
        usleep(20000);
    }
 
    return 0;
 
}
 
 
//#define FRAME_COUNT 1024
//#define pcm_file "/data/audio.pcm"
 
int AudioTrackTest::Test02() {
    // long rate = 44100;
    // int fd = 0;
    // int length = 0;
    size_t MinFrameCount = 0;
    // unsigned char mBuffer[FRAME_COUNT];
 
    // fd = open(pcm_file, O_RDWR);
    // if (fd < 0) {
    //     printf("%s open failed\n", pcm_file);
    //     return -1;
    // }
 
    short smpBuf[BUF_SZ];
    long rate = 44100;
    unsigned long phi;
    unsigned long dPhi;
    long amplitude;
    long freq = 1237;
    float f0;
 
    f0 = pow(2., 32.) * freq / (float)rate;
    dPhi = (unsigned long)f0;
    amplitude = 1000;
    phi = 0;
    Generate(smpBuf, BUF_SZ, amplitude, phi, dPhi);  // fill buffer
 
    AudioTrack::getMinFrameCount(&MinFrameCount, AUDIO_STREAM_MUSIC, rate);
    printf("MinFrameCount = %zu\n", MinFrameCount);
 
    sp<AudioTrack> track = new AudioTrack(AUDIO_STREAM_MUSIC, // stream type
                                          rate,
                                          AUDIO_FORMAT_PCM_16_BIT, // word length, PCM
                                          AUDIO_CHANNEL_OUT_STEREO, 0);
 
    status_t status = track->initCheck();
    if (status != NO_ERROR) {
        track.clear();
        printf("Failed for initCheck()");
        return -1;
    }
 
    printf("set volume 1.0\n");
    track->setVolume(1.0f);
 
    // start play
    printf("start");
    track->start();
 
    int us;
    for (int i = 0; i < 2; i++) {
        Generate(smpBuf, BUF_SZ, amplitude, phi, dPhi);  // fill buffer
        // length = read(fd, mBuffer, FRAME_COUNT);
        track->write(smpBuf, BUF_SZ, true);
        us = BUF_SZ * 1000 / (rate * 2 * 16);
        usleep(us);
        printf("write data:%d\n", i);
    }
 
    usleep(20000);
 
    printf("stop");
    track->stop();
 
    usleep(20000);
 
    return 0;
}
 
/************************************************************
*
*    Generate a mono buffer
*    Error is less than 3lsb
*
************************************************************/
void AudioTrackTest::Generate(short *buffer, long bufferSz, long amplitude, unsigned long &phi, long dPhi)
{
    // fill buffer
    for(int i0=0; i0<bufferSz; i0++) {
        buffer[i0] = ComputeSine( amplitude, phi);
        phi += dPhi;
    }
}
 
/************************************************************
*
*    Generate a sine
*    Error is less than 3lsb
*
************************************************************/
short AudioTrackTest::ComputeSine(long amplitude, long phi)
{
    long pi13 = 25736;   // 2^13*pi
    long sample;
    long l0, l1;
 
    sample = (amplitude*sin1024[(phi>>22) & 0x3ff]) >> 15;
    // correct with interpolation
    l0 = (phi>>12) & 0x3ff;         // 2^20 * x / (2*pi)
    l1 = (amplitude*sin1024[((phi>>22) + 256) & 0x3ff]) >> 15;    // 2^15*cosine
    l0 = (l0 * l1) >> 10;
    l0 = (l0 * pi13) >> 22;
    sample = sample + l0;
 
    return (short)sample;
}
 
 
/************************************************************
*
*    init sine table
*
************************************************************/
void AudioTrackTest::InitSine(void) {
    printf("InitSine\n");
    double phi = 0;
    double dPhi = 2 * M_PI / SIN_SZ;
    for(int i0 = 0; i0<SIN_SZ; i0++) {
        long d0;
 
        d0 = 32768. * sin(phi);
        phi += dPhi;
        if(d0 >= 32767) d0 = 32767;
        if(d0 <= -32768) d0 = -32768;
        sin1024[i0] = (short)d0;
    }
}
 
/************************************************************
*
*    main in name space
*
************************************************************/
int main() {
    printf("android main in\n");
    ProcessState::self()->startThreadPool();
    AudioTrackTest *test;
 
    test = new AudioTrackTest();
    printf("test->Execute()\n");
    test->Execute();
    delete test;
 
    return 0;
}
 
}
 
/************************************************************
*
*    global main
*
************************************************************/
int main() {
    printf("main in\n");
    return android::main();
}
```
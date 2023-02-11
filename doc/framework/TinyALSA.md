# TinyALSA

## 本篇文章目标

1. 了解 TinyALSA
2. 掌握 TinyALSA 命令行工具的使用
3. 掌握 TinyALSA API 的使用

## TinyALSA 基本介绍

TinyALSA 是一个适用于 Linux 系统的 PCM 音频小型库。  
它提供了一个简单轻量的 API，用于访问和控制 Linux 上的音频设备。  
TinyALSA 的设计目的是易于使用和理解，因此是需要基本 PCM 音频功能的项目的好选择。

目标是：

1. 提供基本的 pcm 和 mixer API。
2. 如果不是绝对需要，请不要将其添加到 API 中。
3. 避免支持可以在更高级别处理的复杂和不必要的操作。
4. 提供全面的文档。

**TinyALSA 位于 Android 源码的 external/TinyALSA 位置**

> 关键点：PCM, API, 轻量

## TinyALSA 命令行工具

TinyALSA 提供了如下命令行工具: tinyplay, tinycap, tinymix, tinypcminfo

- tinyplay：用于播放音频数据，它可以用于播放音频文件（wav 或原始音频样本）到音频设备
- tinycap：用于录制音频数据，它可以从音频设备读取数据，并将数据写入 WAV 文件或标准输出（作为原始样本）
- tinymix：用于控制音频设备，它可以用来控制音量、混音器等
- tinypcminfo：用于显示有关音频设备的信息。它可以用来检查音频硬件的可用性，并显示关于该硬件的详细信息，例如支持的音频格式，最大播放速率等。

> 关键点：tinyplay, tinycap, tinymix, tinypcminfo

### tinyplay

**用法**

```
tinyplay file [ options ]
```

其中 file 表示需要播放的音频文件，options 表示指定音频设备和文件参数的选项。

**选项**

-D, --card card：音频设备的卡编号。默认为 0。  
-d, --device device：音频设备的设备编号。默认为 0。  
-c, --channels channels：音频设备的通道数。仅对原始音频文件有效。默认为 2。  
-r, --rate rate：每秒的帧数。仅对原始音频文件有效。默认为 48000。  
-i, --file-type file-type：用于播放的文件类型。可用类型为 raw 和 wav。指定 raw 意味着通道数、帧率和比特数也可能需要指定。默认情况下，文件类型由文件名确定。使用该选项指定的文件类型优先于由文件名确定的文件类型。  
-b, --bits bits：每个样本的比特数。仅对原始音频文件有效。默认为 16。
-p, --period-size period_size: PCM 中一个周期的帧数。默认值为 1024。  
-n, --period-count periods: PCM 中的周期数。默认值为 4。

**例子**

- 播放名为 output.wav 的音频文件

```
tinyplay output.wav
```

- 在声卡 1 上播放名为 output.wav 的音频文件

```
tinyplay output.wav -D 1
```

- 使用 2 个声道、44100 每秒帧数和每采样 32 位播放名为 output.raw 的原始音频文件

```
tinyplay output.raw -i raw --channels 2 --rate 44100 --bits 32
```

### tinycap

**用法**

```
tinycap [ file ] [ options ]
```

其中 file 表示录音生成的文件，options 表示指定音频设备和文件参数的选项。

**选项**

-D, --card card：音频设备的卡编号。默认为 0。  
-d, --device device：音频设备的设备编号。默认为 0。  
-M：使用内存映射 I/O 方法。如果不指定此选项，则使用读写 I/O 方法。  
-c, --channels channels：音频设备的通道数。仅对原始音频文件有效。默认为 2。  
-r, --rate rate：每秒的帧数。仅对原始音频文件有效。默认为 48000。  
-i, --file-type file-type：用于播放的文件类型。可用类型为 raw 和 wav。指定 raw 意味着通道数、帧率和比特数也可能需要指定。默认情况下，文件类型由文件名确定。使用该选项指定的文件类型优先于由文件名确定的文件类型。  
-b, --bits bits：每个样本的比特数。仅对原始音频文件有效。默认为 16。  
-p, --period-size period_size: PCM 中一个周期的帧数。默认值为 1024。  
-n, --period-count periods: PCM 中的周期数。默认值为 4。
-t seconds：录制音频的秒数。

**例子**

- 录制名为 output.wav 的文件，直到捕获中断信号

```
tinycap output.wav
```

- 录制名为 output.wav 的文件，从第 1 个声卡上录制两秒音频或直到捕获中断信号。

```
tinycap output.wav -D 1 -t 2
```

- 录制到标准输出，录制三秒音频或直到捕获中断信号。

```
tinycap -- -t 3
```

### tinymix

**用法**

```
tinymix [ options ] command
```

**options 选项**

-D, --card card：混音器卡号，默认值为 0。  
-h, --help：打印帮助内容并退出。  
-v, --version：打印当前 tinymix 版本并退出。

**command**

- 输出指定控件的值

```
get <control-id|control-name>
```

- 设置指定控件的值

```
set <control-id|control-name> <control-value>
```

- 输出所有混音器控件的内容

```
contents
```

- 输出所有混音器控件的名称和 ID

```
controls
```

**例子**

- 输出编号为 0 的混音器的控件 ID 列表。

```
tinymix controls
```

- 输出编号为 1 的混音器的控件 ID 列表。

```
tinymix -D 1 controls
```

- 输出编号为 0 的控件的信息。

```
tinymix get 0
```

- 输出名称为“Headphone Playback Volume”的控件的信息。

```
tinymix get "Headphone Playback Volume"
```

- 将控件 0 的值设置为 4。

```
tinymix set 0 4
```

- 将编号为 1 的混音器的控件 2 的值设置为 32。

```
tinymix --card 1 set 2 32
```

### tinypcminfo

**用法**

```
tinypcminfo [ options ]
```

**选项**

-D card: 指定 PCM 所在的卡号。默认为 0。  
-d device：指定 PCM 所在的设备号。默认为 0。

**例子**

- 输出卡号为 1，设备号为 1 的 PCM 的硬件参数。

```
tinypcminfo -D 1 -d 1
```

## TinyALSA API

## 参考资料

1. <https://github.com/tinyalsa/tinyalsa>

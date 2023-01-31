# FFmpeg

## 本篇文章目标

- 掌握 FFmpeg 命令的使用
- 掌握 FFmpeg 库的使用
- 了解 FFmpeg 架构
- 了解 FFmpeg 基本概念/术语

## FFmpeg 简介

FFmpeg 项目试图为应用程序开发人员和最终用户提供技术上可能的最佳解决方案。  
FFmpeg 是领先的多媒体框架，能够解码、编码、转码、多路复用、多路分解、流式传输、过滤和播放人类和机器创建的几乎所有内容。  
用于处理音频、视频、字幕和相关元数据等多媒体内容的库和工具的集合。  

它包含可供应用程序使用的 libavcodec、libavutil、libavformat、libavfilter、libavdevice、libswscale 和 libswresample。  
还有ffmpeg、ffplay、ffprobe，可供终端用户转码播放。

## FFmpeg 命令行工具的使用

FFmpeg 有3个命令行工具：ffmpeg, ffplay, ffprobe  

ffmpeg: 用于操作、转换和流式传输多媒体内容的命令行工具箱。  
ffplay: 一个简约的多媒体播放器。  
ffprobe: 一个简单的分析工具来检查多媒体内容。  

## FFmpeg 库的使用

libavutil: 是一个包含用于简化编程的函数的库，包括随机数生成器、数据结构、数学例程、核心多媒体实用程序等等  
libavcodec: 是一个包含音频/视频编解码器的解码器和编码器的库。  
libavformat: 是一个包含多媒体容器格式的多路分解器和多路复用器的库。  
libavdevice: 是一个包含输入和输出设备的库，用于从许多常见的多媒体输入/输出软件框架（包括 Video4Linux、Video4Linux2、VfW 和 ALSA）中获取和渲染。  
libavfilter: 是一个包含媒体过滤器的库。  
libswscale: 是一个执行高度优化的图像缩放和色彩空间/像素格式转换操作的库。  
libswresample: 是一个执行高度优化的音频重采样、重新矩阵化和样本格式转换操作的库。  

## FFmpeg 架构

## FFmpeg 应用


## AnBook文档访问链接
[AnBook](https://llzywhy.github.io/AnBook/)

## 目的
建立 Android 音视频知识库

## 定位
**Android 音视频，多人协作**​

## 目标人群

## 多人协作

## 撰写
**所有文档均使用 Markdown 撰写**

## 原则

1. 表达必须简单易懂，不费脑力
2. 用词必须准确，避免误解
3. 结构清晰简单有逻辑性
4. 整体框架大于关键点远大于细节，且整体和细节必须分开
5. 能用一句话表达的，绝不用两句话
6. 牵扯的东西越少越好，越独立越好
7. 二八原则。用 20% 的知识撬动剩下的 80% 的知识
8. 一个东西往往会有多个视图，多个角度
9. 一个东西往往会有历史，且不完美

## 红线

1. 避免摆细节
2. 避免不讲逻辑

## 开发 / 贡献环境

### node 环境

gitbook 已很久没有更新，最新的 node 版本并不适配，需要特定的 node 版本。

建议使用 nvm 管理 node 版本。

以下版本测试没有问题, 使用如下的版本即可。

```
$ node -v
v13.14.0

$ npm -v
6.14.14
```

### gitbook 安装

```
$ npm install -g gitbook-cli

$ gitbook --version
CLI version: 2.3.2
GitBook version: 3.2.3
```

### 仓库下载

```
$ git clone https://github.com/llzywhy/AnBook.git
$ cd AnBook  # 进入到仓库根目录中
$ npm install  # 安装全部依赖
```

### 本地调试

```
$ cd AnBook  # 进入到仓库根目录中
$ npm run serve
```
一切 OK 即可通过如下链接访问本地文档：http://localhost:4000/

### 本地编译

```
$ cd AnBook  # 进入到仓库根目录中
$ npm run build
```
根目录下的 _book/ 目录即是生成的静态网站文件

### 修改文档

所有的文档都存放在 doc/ 目录下，并合理分类  
找到相应的文档位置，打开编辑修改即可

### 新建文档

修改 SUMMARY.md 文件，在相应合适的位置添加条目  
然后执行如下命令，即可在相应的位置生成文件

```
$ npm run init
```

### push 修改

修改完并本地调试 OK 之后，即可按照 git 流程 push 相应的修改到 main branch

push 到 main 的命令：

```
$ cd AnBook  # 进入到仓库根目录中
$ git push origin main
```

github merge 后，会自动触发 workflow, 自动更新文档

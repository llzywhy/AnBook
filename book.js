module.exports = {
  // 书籍信息
  title: "",
  description: "Android Book",
  isbn: "",
  author: "llzywhy",
  lang: "zh-cn",

  // 插件列表
  plugins: [
    "splitter",
    "-sharing",
    "search-pro",
    "code",
    "expandable-chapters",
    "back-to-top-button",
    "flexible-alerts",
    "theme-lou",
    // 'github'
  ],

  // 插件全局配置
  pluginsConfig: {
    // "github": {
    //     "url": "https://github.com/llzywhy/AnBook"
    // },

    "flexible-alerts": {
      style: "flat", // callout 或 flat
    },

    "theme-lou": {
      color: "#434242", // 主题色
      favicon: "assets/favicon.ico", // favicon图标
      logo: "assets/logo.png", // 顶部左侧图标
      appleTouchIconPrecomposed152: "assets/apple.png", // apple图标
      copyrightLogo: "assets/copyright.png", // 底部水印LOGO
      forbidCopy: false, // 页面是否禁止复制
      "search-placeholder": "", // 搜索框默认文本
      "book-summary-title": "文章列表", // 目录标题
      "book-anchor-title": "目录", // 本章目录标题
      "hide-elements": [".summary .gitbook-link", ".summary .divider"], // 需要隐藏的标签
      copyright: {
        author: "llzywhy", // 底部版权展示的作者名
      },
    },
  },

  // 模板变量
  variables: {
    // 自定义
    themeLou: {
      // 顶部导航栏配置
      nav: [
        // {
        //   "target": "_blank", // 跳转方式: 打开新页面
        //   "url": "http://...",  // 跳转页面
        //   "name": "简易教程"  // 导航名称
        // }
      ],
      // 底部打赏配置
      footer: {
        // "donate": {
        //   "button": "捐赠", // 打赏按钮
        //   "avatar": "头像地址", // 头像地址
        //   "nickname": "ALLDIE", // 昵称
        //   "message": "随意打赏，但不要超过一顿早餐钱！", // 打赏消息文本
        //   "text": "『 赠人玫瑰 🌹 手有余香 』", // 打赏话语
        //   "wxpay": "你的微信收款码地址", // 微信收款码
        //   "alipay": "你的支付宝收款码地址" // 支付宝收款码
        // },
        copyright: true, // 是否显示版权
      },
    },
  },
};

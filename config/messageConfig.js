// config/messageConfig.js
// 消息发送配置

module.exports = {
  // 目标用户配置
  TARGET_USER: {
    // 您丈夫的微信ID
    WECHAT_ID: 'Dingding7654321_',
    // 您丈夫的微信昵称（用于显示）
    NICKNAME: '宝宝',
    // 您丈夫的手机号（可选，用于其他联系方式）
    PHONE: '18056052398'
  },

  // 客服消息配置
  CUSTOMER_SERVICE: {
    // 企业微信客服ID
    CORP_ID: 'your_corp_id',
    // 客服URL
    SERVICE_URL: 'https://work.weixin.qq.com/kfid/kfc123456'
  },

  // 模板消息配置
  TEMPLATE_MESSAGE: {
    // 菜单模板ID
    MENU_TEMPLATE_ID: 'tLEKQiiMe8JDjm1GIGq5UDbHrZNZX0bxOhuRM0zho4g',
    // 评价模板ID
    RATING_TEMPLATE_ID: '2Vcnqwh-J_Tr-5Dx3TQBG_eEgzcLogNO2lUE5uTMdtk',
    // 菜品推荐模板ID
    DISH_TEMPLATE_ID: 'your_dish_template_id'
  },

  // 服务器配置
  SERVER: {
    // 后端API地址
    API_BASE_URL: 'https://your-server.com/api',
    // 发送消息接口
    SEND_MESSAGE_URL: '/send-message',
    // 发送模板消息接口
    SEND_TEMPLATE_URL: '/send-template-message'
  },

  // 消息模板
  MESSAGE_TEMPLATES: {
    // 菜单消息模板
    MENU: `今天中午的菜单：

{menu}

时间：{date}

来自：家庭菜单小程序`,

    // 评价消息模板
    RATING: `今天的菜品评价：

{rating}

评价时间：{time}

来自：家庭菜单小程序`,

    // 菜品推荐模板
    DISH: `推荐一道美味的{name}！

难度：{difficulty}
制作时间：{time}
适合人数：{servings}人

食材清单：
{ingredients}

来自：家庭菜单小程序`
  },

  // 发送方式配置
  SEND_METHODS: {
    // 是否启用客服消息
    ENABLE_CUSTOMER_SERVICE: false,
    // 是否启用模板消息
    ENABLE_TEMPLATE_MESSAGE: true,
    // 是否启用复制到剪贴板
    ENABLE_CLIPBOARD: true,
    // 是否启用分享功能
    ENABLE_SHARE: false
  }
}

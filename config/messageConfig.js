const secureConfig = require('./secureConfig')

module.exports = {
  TARGET_USER: {
    WECHAT_ID: secureConfig.targetWechatId,
    NICKNAME: secureConfig.targetNickname,
    PHONE: secureConfig.targetPhone
  },
  CUSTOMER_SERVICE: {
    CORP_ID: 'your-corp-id',
    SERVICE_URL: 'https://work.weixin.qq.com/kfid/your-kf-id'
  },
  TEMPLATE_MESSAGE: {
    MENU_TEMPLATE_ID: secureConfig.menuTemplateId,
    RATING_TEMPLATE_ID: secureConfig.ratingTemplateId,
    DISH_TEMPLATE_ID: secureConfig.dishTemplateId
  },
  SERVER: {
    API_BASE_URL: secureConfig.apiBaseUrl,
    SEND_MESSAGE_URL: '/send-message',
    SEND_TEMPLATE_URL: '/send-template-message'
  },
  MESSAGE_TEMPLATES: {
    MENU: `今日菜单：\n\n{menu}\n\n时间：{date}\n\n来自：家庭菜单小程序`,
    RATING: `今日菜品评价：\n\n{rating}\n\n评价时间：{time}\n\n来自：家庭菜单小程序`,
    DISH: `推荐一道美味的{name}\n\n难度：{difficulty}\n制作时间：{time}\n适合人数：{servings}人\n\n食材清单：\n{ingredients}\n\n来自：家庭菜单小程序`
  },
  SEND_METHODS: {
    ENABLE_CUSTOMER_SERVICE: false,
    ENABLE_TEMPLATE_MESSAGE: true,
    ENABLE_CLIPBOARD: true,
    ENABLE_SHARE: false
  }
}

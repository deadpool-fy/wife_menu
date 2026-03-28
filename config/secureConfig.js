const localConfig = (() => {
  try {
    return require('./private')
  } catch (error) {
    return {}
  }
})()

const config = {
  cloudEnvId: localConfig.cloudEnvId || 'cloud1-your-env-id',
  wechatAppId: localConfig.wechatAppId || 'wx-your-app-id',
  wechatAppSecret: localConfig.wechatAppSecret || 'your-wechat-app-secret',
  menuTemplateId: localConfig.menuTemplateId || 'your-template-id',
  ratingTemplateId: localConfig.ratingTemplateId || 'your-rating-template-id',
  dishTemplateId: localConfig.dishTemplateId || 'your-dish-template-id',
  targetWechatId: localConfig.targetWechatId || 'your-target-wechat-id',
  targetNickname: localConfig.targetNickname || '家人',
  targetPhone: localConfig.targetPhone || 'your-phone-number',
  apiBaseUrl: localConfig.apiBaseUrl || 'https://your-server.com/api'
}

module.exports = config

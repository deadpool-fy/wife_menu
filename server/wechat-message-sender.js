const express = require('express')
const axios = require('axios')

const app = express()
app.use(express.json())

const WECHAT_CONFIG = {
  appId: process.env.WECHAT_APP_ID || 'wx-your-app-id',
  appSecret: process.env.WECHAT_APP_SECRET || 'your-wechat-app-secret',
  templateId: process.env.WECHAT_TEMPLATE_ID || 'your-template-id',
  targetUserId: process.env.WECHAT_TARGET_USER_ID || 'your-target-wechat-id'
}

function ensureWechatConfig() {
  const missing = []
  if (!WECHAT_CONFIG.appId || WECHAT_CONFIG.appId === 'wx-your-app-id') missing.push('WECHAT_APP_ID')
  if (!WECHAT_CONFIG.appSecret || WECHAT_CONFIG.appSecret === 'your-wechat-app-secret') missing.push('WECHAT_APP_SECRET')
  if (!WECHAT_CONFIG.templateId || WECHAT_CONFIG.templateId === 'your-template-id') missing.push('WECHAT_TEMPLATE_ID')
  if (!WECHAT_CONFIG.targetUserId || WECHAT_CONFIG.targetUserId === 'your-target-wechat-id') missing.push('WECHAT_TARGET_USER_ID')
  if (missing.length) {
    throw new Error(`缺少微信服务端配置: ${missing.join(', ')}`)
  }
}

async function getAccessToken() {
  ensureWechatConfig()

  const response = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
    params: {
      grant_type: 'client_credential',
      appid: WECHAT_CONFIG.appId,
      secret: WECHAT_CONFIG.appSecret
    }
  })

  if (response.data.access_token) {
    return response.data.access_token
  }

  throw new Error(response.data.errmsg || '获取 access_token 失败')
}

async function sendTemplateMessage(accessToken, message, targetUserId) {
  const templateData = {
    touser: targetUserId,
    template_id: WECHAT_CONFIG.templateId,
    data: {
      content: {
        value: message,
        color: '#173177'
      }
    }
  }

  const response = await axios.post(
    `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`,
    templateData
  )

  if (response.data.errcode === 0) {
    return { success: true, message: '模板消息发送成功' }
  }

  throw new Error(response.data.errmsg || '模板消息发送失败')
}

app.post('/api/send-template-message', async (req, res) => {
  try {
    const { message, targetUserId } = req.body || {}

    if (!message) {
      return res.status(400).json({
        success: false,
        message: '消息内容不能为空'
      })
    }

    const accessToken = await getAccessToken()
    const result = await sendTemplateMessage(accessToken, message, targetUserId || WECHAT_CONFIG.targetUserId)
    res.json(result)
  } catch (error) {
    console.error('发送消息失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '发送失败'
    })
  }
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`微信消息发送服务已启动，端口 ${PORT}`)
})

module.exports = app

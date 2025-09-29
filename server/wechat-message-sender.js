// server/wechat-message-sender.js
// 微信消息发送服务端实现

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// 微信小程序配置
const WECHAT_CONFIG = {
  appId: 'wx5783986edcbaba40',
  appSecret: '7a20e8b86940fb858346f1c328a7f190', // 需要替换为实际的AppSecret
  templateId: 'tLEKQiiMe8JDjm1GIGq5UDbHrZNZX0bxOhuRM0zho4g', // 需要替换为实际的模板ID
  targetUserId: 'Dingding7654321_' // 目标用户微信ID
};

// 获取访问令牌
async function getAccessToken() {
  try {
    const response = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
      params: {
        grant_type: 'client_credential',
        appid: WECHAT_CONFIG.appId,
        secret: WECHAT_CONFIG.appSecret
      }
    });
    
    if (response.data.access_token) {
      return response.data.access_token;
    } else {
      throw new Error('获取访问令牌失败');
    }
  } catch (error) {
    console.error('获取访问令牌错误:', error);
    throw error;
  }
}

// 发送模板消息
async function sendTemplateMessage(accessToken, message, targetUserId) {
  try {
    const templateData = {
      touser: targetUserId,
      template_id: WECHAT_CONFIG.templateId,
      data: {
        content: {
          value: message,
          color: '#173177'
        }
      }
    };

    const response = await axios.post(
      `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`,
      templateData
    );

    if (response.data.errcode === 0) {
      return { success: true, message: '模板消息发送成功' };
    } else {
      throw new Error(`发送失败: ${response.data.errmsg}`);
    }
  } catch (error) {
    console.error('发送模板消息错误:', error);
    throw error;
  }
}

// 发送消息接口
app.post('/api/send-template-message', async (req, res) => {
  try {
    const { message, targetUserId } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: '消息内容不能为空'
      });
    }

    // 获取访问令牌
    const accessToken = await getAccessToken();
    
    // 发送模板消息
    const result = await sendTemplateMessage(accessToken, message, targetUserId || WECHAT_CONFIG.targetUserId);
    
    res.json(result);
  } catch (error) {
    console.error('发送消息错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '发送失败'
    });
  }
});

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`微信消息发送服务已启动，端口: ${PORT}`);
});

module.exports = app;

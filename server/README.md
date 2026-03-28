# 微信消息发送服务

## 功能说明

这个服务用于通过微信模板消息直接发送消息给指定用户，无需手动复制粘贴。

## 部署步骤

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置微信小程序

1. 登录微信公众平台：https://mp.weixin.qq.com/
2. 进入小程序后台
3. 获取 AppSecret：开发 → 开发设置 → 开发者ID
4. 申请模板消息：功能 → 模板消息 → 添加模板

### 3. 修改配置

编辑 `server/wechat-message-sender.js`：

```javascript
const WECHAT_CONFIG = {
  appId: 'wx-your-app-id', // 您的小程序AppID
  appSecret: 'your_app_secret', // 替换为实际的AppSecret
  templateId: 'your_template_id', // 替换为实际的模板ID
  targetUserId: 'your-target-wechat-id' // 目标用户微信ID
};
```

### 4. 启动服务

```bash
npm start
```

服务将在 http://localhost:3000 启动

### 5. 部署到云服务器

推荐使用以下平台：
- 腾讯云
- 阿里云
- 华为云
- Vercel
- Railway

## API 接口

### 发送模板消息

**POST** `/api/send-template-message`

**请求参数：**
```json
{
  "message": "消息内容",
  "targetUserId": "目标用户微信ID（可选）"
}
```

**响应：**
```json
{
  "success": true,
  "message": "模板消息发送成功"
}
```

### 健康检查

**GET** `/api/health`

**响应：**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 小程序配置

在小程序中修改 `utils/messageService.js`：

```javascript
// 修改服务器地址
wx.request({
  url: 'https://your-server.com/api/send-template-message', // 替换为实际服务器地址
  method: 'POST',
  data: {
    message: message,
    targetUserId: CONFIG.TARGET_USER_ID
  },
  // ...
});
```

## 注意事项

1. **安全性**：请妥善保管 AppSecret，不要提交到代码仓库
2. **模板消息**：需要用户主动授权才能发送
3. **频率限制**：微信对模板消息有发送频率限制
4. **用户ID**：确保目标用户已关注小程序

## 故障排除

### 1. 获取访问令牌失败
- 检查 AppID 和 AppSecret 是否正确
- 确认网络连接正常

### 2. 模板消息发送失败
- 检查模板ID是否正确
- 确认用户是否已授权
- 查看错误码对照表

### 3. 服务无法启动
- 检查端口是否被占用
- 确认 Node.js 版本兼容性

## 开发模式

使用 nodemon 进行开发：

```bash
npm run dev
```

## 生产部署

使用 PM2 进行生产部署：

```bash
npm install -g pm2
pm2 start wechat-message-sender.js --name "wechat-message-sender"
pm2 save
pm2 startup
```

# 微信小程序订阅消息模板ID获取指南

## 获取步骤

### 1. 登录微信公众平台
- 访问：https://mp.weixin.qq.com/
- 使用小程序管理员账号登录

### 2. 进入订阅消息管理
- 左侧菜单：**功能** → **订阅消息**
- 点击进入订阅消息管理页面

### 3. 添加消息模板
- 点击 **"添加"** 按钮
- 选择模板类目（推荐：**餐饮** 或 **生活服务**）
- 搜索关键词：
  - `菜单通知`
  - `评价通知`
  - `消息通知`
  - `服务通知`

### 4. 选择合适模板
推荐模板：
- **菜单通知模板**
- **评价反馈模板**
- **服务消息模板**

### 5. 获取模板ID
- 添加成功后，在 **"我的模板"** 中查看
- 复制模板ID（格式：`xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）

## 模板配置

### 在代码中配置模板ID

#### 1. 修改消息服务配置
```javascript
// utils/messageService.js
auth.requestSubscribeMessage('您的实际模板ID') // 替换为实际模板ID
```

#### 2. 修改授权工具配置
```javascript
// utils/authorization.js
wx.requestSubscribeMessage({
  tmplIds: ['您的实际模板ID'], // 替换为实际模板ID
  // ...
})
```

#### 3. 修改服务器配置
```javascript
// server/wechat-message-sender.js
const WECHAT_CONFIG = {
  templateId: '您的实际模板ID', // 替换为实际模板ID
  // ...
}
```

## 模板字段配置

### 菜单通知模板字段
```
{{thing1.DATA}} - 菜品名称
{{thing2.DATA}} - 制作时间
{{thing3.DATA}} - 难度等级
{{time4.DATA}} - 发送时间
```

### 评价通知模板字段
```
{{thing1.DATA}} - 菜品名称
{{number2.DATA}} - 评分
{{thing3.DATA}} - 评价内容
{{time4.DATA}} - 评价时间
```

## 注意事项

### 1. 模板审核
- 新添加的模板需要审核
- 审核时间：1-3个工作日
- 审核通过后才能使用

### 2. 使用限制
- 每个用户每月最多接收4条订阅消息
- 用户可随时取消订阅
- 模板内容不能包含营销信息

### 3. 测试建议
- 先在开发环境测试
- 确认模板ID正确
- 验证消息发送功能

## 常见问题

### Q1: 找不到合适的模板
**A:** 可以搜索更通用的关键词，如"通知"、"消息"等

### Q2: 模板审核不通过
**A:** 确保模板内容符合规范，不包含营销信息

### Q3: 用户收不到消息
**A:** 检查用户是否已授权，模板ID是否正确

### Q4: 发送频率限制
**A:** 订阅消息有发送频率限制，建议合理使用

## 配置示例

### 完整配置示例
```javascript
// 配置信息
const CONFIG = {
  // 模板ID
  TEMPLATE_ID: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  // 目标用户
  TARGET_USER_ID: 'Dingding7654321_',
  // 接收者昵称
  TARGET_NICKNAME: '宝宝'
}

// 使用示例
auth.requestSubscribeMessage(CONFIG.TEMPLATE_ID)
  .then(() => {
    // 发送消息
    sendTemplateMessage(message)
  })
  .catch(() => {
    // 降级处理
    fallbackToClipboard(message)
  })
```

## 测试步骤

### 1. 配置模板ID
- 在代码中替换为实际模板ID
- 保存并重新编译

### 2. 测试授权
- 清除小程序数据
- 重新进入小程序
- 点击发送消息

### 3. 验证功能
- 确认授权弹窗出现
- 测试同意/拒绝授权
- 验证消息发送/降级功能

现在您知道如何获取和配置模板ID了！

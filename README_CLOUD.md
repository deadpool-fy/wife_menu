# 微信云开发配置指南

本指南将帮助您配置微信云开发平台，将菜谱爬虫系统部署到云开发环境中。

## 🚀 云开发优势

- **无需服务器**: 无需购买和配置服务器
- **自动扩缩容**: 根据访问量自动调整资源
- **内置数据库**: 云数据库，无需单独配置
- **云函数**: 无服务器架构，按需执行
- **云存储**: 图片和文件存储
- **CDN加速**: 全球CDN加速

## 📋 准备工作

### 1. 开通云开发

1. 登录微信公众平台
2. 进入小程序管理后台
3. 点击「开发」→「云开发」
4. 开通云开发服务
5. 创建云环境（建议选择「按量计费」）

### 2. 获取环境信息

- **环境ID**: 在云开发控制台获取
- **AppID**: 小程序AppID
- **Secret**: 小程序Secret（可选）

## 🔧 配置步骤

### 1. 修改app.js配置

```javascript
// app.js
App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'your-env-id', // 替换为你的环境ID
        traceUser: true,
      });
    }
  }
});
```

### 2. 修改project.config.json

```json
{
  "appid": "your-appid",
  "cloudfunctionRoot": "cloudfunctions/",
  "cloudfunctionTemplateRoot": "cloudfunctionTemplate/"
}
```

### 3. 部署云函数

#### 3.1 部署爬虫云函数

```bash
# 在微信开发者工具中
# 右键 cloudfunctions/crawler 文件夹
# 选择「上传并部署：云端安装依赖」
```

#### 3.2 部署数据库初始化云函数

```bash
# 右键 cloudfunctions/init-database 文件夹
# 选择「上传并部署：云端安装依赖」
```

### 4. 初始化数据库

#### 4.1 调用初始化云函数

```javascript
// 在微信开发者工具控制台执行
wx.cloud.callFunction({
  name: 'init-database',
  success: res => {
    console.log('数据库初始化成功:', res);
  },
  fail: err => {
    console.error('数据库初始化失败:', err);
  }
});
```

#### 4.2 手动创建数据库集合

在云开发控制台创建以下集合：

- `recipes` - 菜谱数据
- `categories` - 分类数据
- `user_favorites` - 用户收藏
- `user_ratings` - 用户评分
- `crawl_logs` - 爬取日志

### 5. 配置数据库权限

#### 5.1 设置集合权限

在云开发控制台设置集合权限：

```json
{
  "read": "auth != null",
  "write": "auth != null"
}
```

#### 5.2 设置索引

为以下字段创建索引：

- `recipes.title` - 文本索引
- `recipes.category` - 普通索引
- `recipes.rating` - 普通索引
- `recipes.createdAt` - 普通索引

## 📊 数据库结构

### recipes 集合

```javascript
{
  _id: "自动生成",
  title: "菜谱标题",
  description: "菜谱描述",
  image: "图片URL",
  category: "分类",
  difficulty: "难度",
  cookingTime: "制作时间",
  servings: "适合人数",
  calories: "卡路里",
  ingredients: [
    { name: "食材名称", amount: "用量" }
  ],
  steps: [
    { step: 1, description: "制作步骤" }
  ],
  tips: "小贴士",
  author: "作者",
  tags: ["标签"],
  rating: 4.5,
  viewCount: 0,
  likeCount: 0,
  isFeatured: true,
  isActive: true,
  createdAt: "创建时间",
  updatedAt: "更新时间"
}
```

### categories 集合

```javascript
{
  _id: "自动生成",
  name: "分类名称",
  icon: "图标",
  description: "分类描述",
  sortOrder: 1,
  isActive: true,
  createdAt: "创建时间",
  updatedAt: "更新时间"
}
```

### user_favorites 集合

```javascript
{
  _id: "自动生成",
  userId: "用户ID",
  recipeId: "菜谱ID",
  recipeData: "菜谱数据",
  createdAt: "创建时间"
}
```

### user_ratings 集合

```javascript
{
  _id: "自动生成",
  userId: "用户ID",
  recipeId: "菜谱ID",
  rating: 4.5,
  comment: "评价内容",
  createdAt: "创建时间",
  updatedAt: "更新时间"
}
```

## 🔌 云函数API

### 爬虫云函数 (crawler)

#### 获取菜谱列表

```javascript
wx.cloud.callFunction({
  name: 'crawler',
  data: {
    action: 'getRecipes',
    data: {
      page: 1,
      limit: 20,
      category: '荤菜',
      difficulty: '简单',
      search: '红烧肉'
    }
  }
});
```

#### 获取菜谱详情

```javascript
wx.cloud.callFunction({
  name: 'crawler',
  data: {
    action: 'getRecipeById',
    data: {
      id: 'recipe-id'
    }
  }
});
```

#### 更新评分

```javascript
wx.cloud.callFunction({
  name: 'crawler',
  data: {
    action: 'updateRating',
    data: {
      id: 'recipe-id',
      rating: 4.5
    }
  }
});
```

#### 执行爬虫

```javascript
wx.cloud.callFunction({
  name: 'crawler',
  data: {
    action: 'crawlRecipes',
    data: {
      keywords: ['家常菜', '快手菜']
    }
  }
});
```

## 📱 小程序配置

### 1. 修改utils/cloudApi.js

```javascript
// 确保使用云开发API
const cloudApiService = require('../../utils/cloudApi.js');
```

### 2. 修改页面文件

所有页面文件已经更新为使用云开发API：

- `pages/index/index.js` - 首页
- `pages/category/category.js` - 分类页
- `pages/detail/detail.js` - 详情页

### 3. 配置云开发权限

在微信公众平台配置：

- 云开发环境ID
- 云函数权限
- 云数据库权限

## 🚀 部署流程

### 1. 开发环境部署

1. 在微信开发者工具中打开项目
2. 右键 `cloudfunctions` 文件夹
3. 选择「上传并部署：云端安装依赖」
4. 等待部署完成

### 2. 生产环境部署

1. 在云开发控制台创建生产环境
2. 修改 `app.js` 中的环境ID
3. 重新部署云函数
4. 初始化生产环境数据库

### 3. 数据迁移

如果需要从其他环境迁移数据：

```javascript
// 导出数据
const db = wx.cloud.database();
const recipes = await db.collection('recipes').get();

// 导入数据
const batch = db.batch();
recipes.data.forEach(recipe => {
  batch.set(db.collection('recipes').doc(), recipe);
});
await batch.commit();
```

## 📈 监控和维护

### 1. 云开发控制台

- 查看云函数调用次数
- 监控数据库读写量
- 查看存储使用情况
- 监控错误日志

### 2. 性能优化

- 设置数据库索引
- 优化云函数代码
- 使用CDN加速
- 合理设置缓存

### 3. 成本控制

- 监控资源使用量
- 设置告警阈值
- 优化云函数执行时间
- 合理使用存储空间

## 🚨 注意事项

### 1. 安全配置

- 设置合适的数据库权限
- 限制云函数访问
- 配置安全域名
- 定期更新依赖

### 2. 性能优化

- 避免频繁的数据库查询
- 使用批量操作
- 合理设置缓存
- 优化云函数代码

### 3. 错误处理

- 添加错误处理逻辑
- 记录错误日志
- 设置重试机制
- 监控异常情况

## 📞 技术支持

如有问题，请查看：

- 微信云开发文档
- 云开发控制台
- 错误日志
- 社区论坛

## 🔄 更新日志

### v1.0.0 (2024-01-01)

- 初始版本发布
- 支持微信云开发
- 云函数部署
- 云数据库集成
- 小程序前端适配

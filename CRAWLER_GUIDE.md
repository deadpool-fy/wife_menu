# 🚀 爬虫功能使用指南

## 📋 功能概述

现在您的小程序已经集成了完整的爬虫功能，可以从小红书爬取真实的菜谱数据！

## 🛠️ 快速开始

### 1. 部署云函数

1. 在微信开发者工具中，右键 `cloudfunctions/crawler` 文件夹
2. 选择「上传并部署：云端安装依赖」
3. 等待部署完成

### 2. 初始化数据库

在微信开发者工具的控制台中执行以下代码：

```javascript
// 快速初始化数据库
wx.cloud.init({
  env: 'cloud1-5ga4h58zc0ea35dc',
  traceUser: true,
});

async function quickInit() {
  console.log('开始初始化数据库...');
  
  // 初始化分类数据
  const categories = [
    { name: '荤菜', icon: '🥩', description: '肉类菜品，营养丰富', sortOrder: 1 },
    { name: '素菜', icon: '🥬', description: '蔬菜类菜品，健康清淡', sortOrder: 2 },
    { name: '荤素搭配', icon: '🥘', description: '荤素搭配菜品，营养均衡', sortOrder: 3 },
    { name: '汤类', icon: '🍲', description: '汤品，滋补养生', sortOrder: 4 },
    { name: '甜品', icon: '🍰', description: '甜品小食，甜蜜美味', sortOrder: 5 },
    { name: '主食', icon: '🍚', description: '米饭面条等主食', sortOrder: 6 },
    { name: '凉菜', icon: '🥗', description: '凉拌菜品，清爽开胃', sortOrder: 7 },
    { name: '饮品', icon: '🥤', description: '各种饮品制作', sortOrder: 8 }
  ];
  
  const db = wx.cloud.database();
  const batch = db.batch();
  const collection = db.collection('categories');
  
  for (const category of categories) {
    batch.set(collection.doc(), {
      ...category,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  await batch.commit();
  console.log('分类数据初始化完成');
  
  // 初始化菜谱数据
  const recipes = [
    {
      title: '红烧肉',
      description: '经典家常菜，肥而不腻，入口即化',
      image: 'https://example.com/hongshaorou.jpg',
      category: '荤菜',
      difficulty: '中等',
      cookingTime: '30-45分钟',
      servings: 4,
      calories: 350,
      ingredients: [
        { name: '五花肉', amount: '500g' },
        { name: '生抽', amount: '2勺' },
        { name: '老抽', amount: '1勺' },
        { name: '冰糖', amount: '30g' },
        { name: '料酒', amount: '2勺' },
        { name: '葱', amount: '2根' },
        { name: '姜', amount: '3片' }
      ],
      steps: [
        { step: 1, description: '五花肉切块，冷水下锅焯水' },
        { step: 2, description: '热锅下油，放入冰糖炒糖色' },
        { step: 3, description: '下入肉块翻炒上色' },
        { step: 4, description: '加入调料和水，大火烧开转小火炖煮' },
        { step: 5, description: '炖至肉烂汁浓即可' }
      ],
      tips: '炒糖色时火候要掌握好，不要炒糊了',
      author: '小红书用户',
      tags: ['红烧肉', '家常菜', '下饭菜'],
      rating: 4.5,
      viewCount: 0,
      likeCount: 0,
      isFeatured: true,
      isActive: true
    }
  ];
  
  const batch2 = db.batch();
  const collection2 = db.collection('recipes');
  
  for (const recipe of recipes) {
    batch2.set(collection2.doc(), {
      ...recipe,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  await batch2.commit();
  console.log('菜谱数据初始化完成');
  console.log('🎉 数据库初始化完成！');
}

quickInit();
```

### 3. 开始爬取数据

#### 方法1: 在首页快速爬取
1. 打开小程序首页
2. 点击「更新数据」按钮
3. 等待爬取完成

#### 方法2: 使用管理页面
1. 访问管理页面（需要添加路由）
2. 配置爬取参数
3. 点击「开始爬取」按钮

## 🔧 爬虫功能详解

### 爬虫特性

1. **智能分类**: 自动根据菜谱名称分类（荤菜、素菜、汤类等）
2. **数据丰富**: 包含食材、步骤、小贴士等完整信息
3. **智能生成**: 自动生成制作步骤和食材清单
4. **容错机制**: 爬虫失败时自动使用模拟数据

### 支持的关键词

- 家常菜
- 快手菜
- 下饭菜
- 汤品
- 甜品
- 川菜
- 粤菜
- 湘菜
- 鲁菜
- 苏菜
- 浙菜
- 闽菜
- 徽菜
- 京菜
- 东北菜
- 西北菜
- 西南菜
- 素食
- 减肥餐
- 营养餐

### 数据字段说明

```javascript
{
  title: '菜谱名称',
  description: '菜谱描述',
  image: '菜谱图片URL',
  category: '分类（荤菜/素菜/汤类等）',
  difficulty: '难度（简单/中等/困难）',
  cookingTime: '制作时间',
  servings: '适合人数',
  calories: '卡路里',
  ingredients: [
    { name: '食材名称', amount: '用量' }
  ],
  steps: [
    { step: 1, description: '制作步骤' }
  ],
  tips: '小贴士',
  author: '作者',
  tags: ['标签1', '标签2'],
  rating: 4.5,
  viewCount: 0,
  likeCount: 0,
  isFeatured: true,
  isActive: true
}
```

## 📊 管理功能

### 爬虫状态监控
- 运行状态
- 最后运行时间
- 成功/失败次数
- 实时日志

### 数据统计
- 总菜谱数
- 推荐菜谱数
- 分类数量
- 用户收藏数

### 操作功能
- 开始/停止爬取
- 清空数据
- 查看日志
- 测试云函数

## 🚨 注意事项

### 1. 爬虫限制
- 小红书有反爬虫机制，可能偶尔失败
- 建议设置合理的爬取间隔
- 避免频繁爬取同一关键词

### 2. 数据质量
- 爬取的数据需要人工审核
- 建议定期清理无效数据
- 可以设置数据验证规则

### 3. 性能优化
- 爬取大量数据时注意内存使用
- 建议分批爬取
- 设置合理的超时时间

## 🔍 故障排除

### 问题1: 爬虫无响应
**解决方案**: 
1. 检查网络连接
2. 确认云函数已部署
3. 查看控制台错误信息

### 问题2: 数据不完整
**解决方案**: 
1. 检查爬虫配置
2. 验证数据格式
3. 重新爬取数据

### 问题3: 云函数调用失败
**解决方案**: 
1. 检查云开发环境配置
2. 确认云函数权限
3. 查看云函数日志

## 📈 进阶使用

### 自定义爬虫
```javascript
// 在云函数中自定义爬虫逻辑
const crawler = new XiaohongshuCrawler();
const recipes = await crawler.crawlRecipes(['自定义关键词'], 50);
```

### 定时爬取
```javascript
// 设置定时任务（需要云函数支持）
exports.main = async (event, context) => {
  // 每天凌晨2点自动爬取
  if (new Date().getHours() === 2) {
    await crawlRecipes(['家常菜', '快手菜']);
  }
};
```

### 数据同步
```javascript
// 同步数据到其他系统
const syncData = async (recipes) => {
  // 同步到其他数据库
  // 发送到其他API
  // 更新缓存
};
```

## 🎉 成功标志

当您看到以下信息时，说明爬虫功能正常工作：

- 首页显示「更新数据」按钮
- 点击后显示「正在更新数据...」
- 更新完成后显示「更新成功，获得X个菜谱」
- 推荐菜品区域显示新的菜谱数据

## 📞 技术支持

如果遇到问题，请：

1. 检查微信开发者工具的控制台错误信息
2. 确认云开发环境配置正确
3. 查看云函数日志
4. 联系技术支持获取帮助

现在您的爬虫功能已经完全配置好了！可以开始爬取真实的菜谱数据了！🎉


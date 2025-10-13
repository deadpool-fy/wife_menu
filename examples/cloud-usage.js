// 微信云开发使用示例
// 这些代码可以在微信开发者工具的控制台中执行

// 1. 初始化云开发
console.log('初始化云开发...');
wx.cloud.init({
  env: 'your-env-id', // 替换为你的环境ID
  traceUser: true,
});

// 2. 初始化数据库
console.log('初始化数据库...');
wx.cloud.callFunction({
  name: 'init-database',
  success: res => {
    console.log('数据库初始化成功:', res);
  },
  fail: err => {
    console.error('数据库初始化失败:', err);
  }
});

// 3. 获取菜谱列表
console.log('获取菜谱列表...');
wx.cloud.callFunction({
  name: 'crawler',
  data: {
    action: 'getRecipes',
    data: {
      page: 1,
      limit: 10
    }
  },
  success: res => {
    console.log('菜谱列表:', res.result);
  },
  fail: err => {
    console.error('获取菜谱列表失败:', err);
  }
});

// 4. 获取菜谱详情
console.log('获取菜谱详情...');
wx.cloud.callFunction({
  name: 'crawler',
  data: {
    action: 'getRecipeById',
    data: {
      id: 'recipe-id' // 替换为实际的菜谱ID
    }
  },
  success: res => {
    console.log('菜谱详情:', res.result);
  },
  fail: err => {
    console.error('获取菜谱详情失败:', err);
  }
});

// 5. 更新菜谱评分
console.log('更新菜谱评分...');
wx.cloud.callFunction({
  name: 'crawler',
  data: {
    action: 'updateRating',
    data: {
      id: 'recipe-id', // 替换为实际的菜谱ID
      rating: 4.5
    }
  },
  success: res => {
    console.log('评分更新成功:', res.result);
  },
  fail: err => {
    console.error('评分更新失败:', err);
  }
});

// 6. 执行爬虫任务
console.log('执行爬虫任务...');
wx.cloud.callFunction({
  name: 'crawler',
  data: {
    action: 'crawlRecipes',
    data: {
      keywords: ['家常菜', '快手菜', '下饭菜']
    }
  },
  success: res => {
    console.log('爬虫任务执行成功:', res.result);
  },
  fail: err => {
    console.error('爬虫任务执行失败:', err);
  }
});

// 7. 直接操作云数据库
console.log('直接操作云数据库...');

// 添加菜谱
const db = wx.cloud.database();
db.collection('recipes').add({
  data: {
    title: '测试菜谱',
    description: '这是一个测试菜谱',
    category: '荤菜',
    difficulty: '简单',
    cookingTime: '30分钟',
    servings: 2,
    calories: 200,
    ingredients: [
      { name: '测试食材', amount: '100g' }
    ],
    steps: [
      { step: 1, description: '测试步骤' }
    ],
    rating: 4.0,
    viewCount: 0,
    likeCount: 0,
    isFeatured: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  success: res => {
    console.log('菜谱添加成功:', res);
  },
  fail: err => {
    console.error('菜谱添加失败:', err);
  }
});

// 查询菜谱
db.collection('recipes').where({
  category: '荤菜'
}).get({
  success: res => {
    console.log('查询结果:', res.data);
  },
  fail: err => {
    console.error('查询失败:', err);
  }
});

// 更新菜谱
db.collection('recipes').doc('recipe-id').update({
  data: {
    rating: 4.5,
    updatedAt: new Date()
  },
  success: res => {
    console.log('菜谱更新成功:', res);
  },
  fail: err => {
    console.error('菜谱更新失败:', err);
  }
});

// 删除菜谱
db.collection('recipes').doc('recipe-id').remove({
  success: res => {
    console.log('菜谱删除成功:', res);
  },
  fail: err => {
    console.error('菜谱删除失败:', err);
  }
});

// 8. 用户收藏操作
console.log('用户收藏操作...');

// 添加收藏
db.collection('user_favorites').add({
  data: {
    userId: 'user-id',
    recipeId: 'recipe-id',
    recipeData: {
      title: '菜谱标题',
      image: '图片URL'
    },
    createdAt: new Date()
  },
  success: res => {
    console.log('收藏添加成功:', res);
  },
  fail: err => {
    console.error('收藏添加失败:', err);
  }
});

// 查询用户收藏
db.collection('user_favorites').where({
  userId: 'user-id'
}).get({
  success: res => {
    console.log('用户收藏:', res.data);
  },
  fail: err => {
    console.error('查询收藏失败:', err);
  }
});

// 删除收藏
db.collection('user_favorites').where({
  userId: 'user-id',
  recipeId: 'recipe-id'
}).remove({
  success: res => {
    console.log('收藏删除成功:', res);
  },
  fail: err => {
    console.error('收藏删除失败:', err);
  }
});

// 9. 用户评分操作
console.log('用户评分操作...');

// 添加评分
db.collection('user_ratings').add({
  data: {
    userId: 'user-id',
    recipeId: 'recipe-id',
    rating: 4.5,
    comment: '很好吃！',
    createdAt: new Date()
  },
  success: res => {
    console.log('评分添加成功:', res);
  },
  fail: err => {
    console.error('评分添加失败:', err);
  }
});

// 查询用户评分
db.collection('user_ratings').where({
  userId: 'user-id'
}).get({
  success: res => {
    console.log('用户评分:', res.data);
  },
  fail: err => {
    console.error('查询评分失败:', err);
  }
});

// 10. 统计信息
console.log('获取统计信息...');
wx.cloud.callFunction({
  name: 'crawler',
  data: {
    action: 'getStats'
  },
  success: res => {
    console.log('统计信息:', res.result);
  },
  fail: err => {
    console.error('获取统计信息失败:', err);
  }
});

// 11. 搜索功能
console.log('搜索功能...');
db.collection('recipes').where({
  title: db.RegExp({
    regexp: '红烧',
    options: 'i'
  })
}).get({
  success: res => {
    console.log('搜索结果:', res.data);
  },
  fail: err => {
    console.error('搜索失败:', err);
  }
});

// 12. 分页查询
console.log('分页查询...');
db.collection('recipes').orderBy('createdAt', 'desc').limit(10).skip(0).get({
  success: res => {
    console.log('分页结果:', res.data);
  },
  fail: err => {
    console.error('分页查询失败:', err);
  }
});

console.log('所有示例代码已执行完成！');

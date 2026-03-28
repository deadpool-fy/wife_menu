// 检查数据来源脚本
// 在微信开发者工具的控制台中执行

console.log('开始检查数据来源...');

// 初始化云开发
wx.cloud.init({
  env: 'cloud1-your-env-id',
  traceUser: true,
});

async function checkDataSource() {
  try {
    console.log('1. 检查菜谱数据...');
    
    const db = wx.cloud.database();
    
    // 获取菜谱数据
    const recipesResult = await db.collection('recipes').get();
    console.log(`菜谱总数: ${recipesResult.data.length}`);
    
    if (recipesResult.data.length > 0) {
      console.log('菜谱列表:');
      recipesResult.data.forEach((recipe, index) => {
        console.log(`${index + 1}. ${recipe.title} (${recipe.category})`);
        console.log(`   - 创建时间: ${recipe.createdAt}`);
        console.log(`   - 作者: ${recipe.author}`);
        console.log(`   - 是否活跃: ${recipe.isActive}`);
        console.log('---');
      });
    } else {
      console.log('✅ 没有菜谱数据');
    }
    
    console.log('2. 检查分类数据...');
    
    // 获取分类数据
    const categoriesResult = await db.collection('categories').get();
    console.log(`分类总数: ${categoriesResult.data.length}`);
    
    if (categoriesResult.data.length > 0) {
      console.log('分类列表:');
      categoriesResult.data.forEach((category, index) => {
        console.log(`${index + 1}. ${category.name} (${category.description})`);
        console.log(`   - 创建时间: ${category.createdAt}`);
        console.log('---');
      });
    } else {
      console.log('✅ 没有分类数据');
    }
    
    console.log('3. 检查用户数据...');
    
    // 获取用户收藏数据
    const favoritesResult = await db.collection('user_favorites').get();
    console.log(`用户收藏总数: ${favoritesResult.data.length}`);
    
    // 获取用户评分数据
    const ratingsResult = await db.collection('user_ratings').get();
    console.log(`用户评分总数: ${ratingsResult.data.length}`);
    
    console.log('4. 数据来源分析...');
    
    if (recipesResult.data.length > 0) {
      const authors = [...new Set(recipesResult.data.map(r => r.author))];
      console.log('菜谱作者:', authors);
      
      const categories = [...new Set(recipesResult.data.map(r => r.category))];
      console.log('菜谱分类:', categories);
      
      // 检查是否有测试数据特征
      const testDataIndicators = recipesResult.data.filter(r => 
        r.author === '小红书用户' || 
        r.author === '管理员' ||
        r.title.includes('测试') ||
        r.description.includes('示例')
      );
      
      if (testDataIndicators.length > 0) {
        console.log('⚠️ 发现可能的测试数据:');
        testDataIndicators.forEach(recipe => {
          console.log(`- ${recipe.title} (作者: ${recipe.author})`);
        });
      } else {
        console.log('✅ 没有发现明显的测试数据特征');
      }
    }
    
  } catch (error) {
    console.error('❌ 检查数据来源失败:', error);
  }
}

// 执行检查
checkDataSource();



// 清空所有测试数据脚本
// 在微信开发者工具的控制台中执行

console.log('开始清空所有测试数据...');

// 初始化云开发
wx.cloud.init({
  env: 'cloud1-5ga4h58zc0ea35dc',
  traceUser: true,
});

async function clearAllTestData() {
  try {
    console.log('1. 开始清空菜谱数据...');
    
    const db = wx.cloud.database();
    
    // 分批清空菜谱数据
    let recipesCleared = 0;
    let hasMoreRecipes = true;
    
    while (hasMoreRecipes) {
      const recipesResult = await db.collection('recipes').limit(10).get();
      if (recipesResult.data.length === 0) {
        hasMoreRecipes = false;
      } else {
        for (const recipe of recipesResult.data) {
          await db.collection('recipes').doc(recipe._id).remove();
          recipesCleared++;
        }
        console.log(`已清空 ${recipesCleared} 个菜谱`);
      }
    }
    
    console.log('2. 开始清空分类数据...');
    
    // 分批清空分类数据
    let categoriesCleared = 0;
    let hasMoreCategories = true;
    
    while (hasMoreCategories) {
      const categoriesResult = await db.collection('categories').limit(10).get();
      if (categoriesResult.data.length === 0) {
        hasMoreCategories = false;
      } else {
        for (const category of categoriesResult.data) {
          await db.collection('categories').doc(category._id).remove();
          categoriesCleared++;
        }
        console.log(`已清空 ${categoriesCleared} 个分类`);
      }
    }
    
    console.log('3. 开始清空用户收藏数据...');
    
    // 分批清空用户收藏数据
    let favoritesCleared = 0;
    let hasMoreFavorites = true;
    
    while (hasMoreFavorites) {
      const favoritesResult = await db.collection('user_favorites').limit(10).get();
      if (favoritesResult.data.length === 0) {
        hasMoreFavorites = false;
      } else {
        for (const favorite of favoritesResult.data) {
          await db.collection('user_favorites').doc(favorite._id).remove();
          favoritesCleared++;
        }
        console.log(`已清空 ${favoritesCleared} 个用户收藏`);
      }
    }
    
    console.log('4. 开始清空用户评分数据...');
    
    // 分批清空用户评分数据
    let ratingsCleared = 0;
    let hasMoreRatings = true;
    
    while (hasMoreRatings) {
      const ratingsResult = await db.collection('user_ratings').limit(10).get();
      if (ratingsResult.data.length === 0) {
        hasMoreRatings = false;
      } else {
        for (const rating of ratingsResult.data) {
          await db.collection('user_ratings').doc(rating._id).remove();
          ratingsCleared++;
        }
        console.log(`已清空 ${ratingsCleared} 个用户评分`);
      }
    }
    
    console.log('🎉 所有测试数据清空完成！');
    console.log(`清空结果:`);
    console.log(`- 菜谱: ${recipesCleared} 个`);
    console.log(`- 分类: ${categoriesCleared} 个`);
    console.log(`- 用户收藏: ${favoritesCleared} 个`);
    console.log(`- 用户评分: ${ratingsCleared} 个`);
    
    // 显示清空后的状态
    console.log('5. 验证清空结果...');
    
    const finalRecipes = await db.collection('recipes').count();
    const finalCategories = await db.collection('categories').count();
    const finalFavorites = await db.collection('user_favorites').count();
    const finalRatings = await db.collection('user_ratings').count();
    
    console.log('清空后数据统计:');
    console.log(`- 菜谱: ${finalRecipes.total} 个`);
    console.log(`- 分类: ${finalCategories.total} 个`);
    console.log(`- 用户收藏: ${finalFavorites.total} 个`);
    console.log(`- 用户评分: ${finalRatings.total} 个`);
    
    if (finalRecipes.total === 0 && finalCategories.total === 0 && 
        finalFavorites.total === 0 && finalRatings.total === 0) {
      console.log('✅ 所有测试数据已完全清空！');
    } else {
      console.log('⚠️ 部分数据可能未完全清空，请检查');
    }
    
  } catch (error) {
    console.error('❌ 清空测试数据失败:', error);
  }
}

// 执行清空操作
clearAllTestData();



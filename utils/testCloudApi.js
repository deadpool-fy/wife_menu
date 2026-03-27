// 测试云API服务
// 在微信开发者工具的控制台中执行

console.log('开始测试云API服务...');

// 初始化云开发
wx.cloud.init({
  env: 'cloud1-5ga4h58zc0ea35dc',
  traceUser: true,
});

async function testCloudApi() {
  try {
    console.log('1. 测试云API服务方法...');
    
    // 检查方法是否存在
    const cloudApiService = require('./cloudApi.js');
    
    console.log('cloudApiService 对象:', cloudApiService);
    console.log('getRecommendRecipes 方法:', typeof cloudApiService.getRecommendRecipes);
    console.log('getRecipes 方法:', typeof cloudApiService.getRecipes);
    console.log('callCloudFunction 方法:', typeof cloudApiService.callCloudFunction);
    
    if (typeof cloudApiService.getRecommendRecipes === 'function') {
      console.log('✅ getRecommendRecipes 方法存在');
      
      console.log('2. 测试调用 getRecommendRecipes...');
      const result = await cloudApiService.getRecommendRecipes(5);
      console.log('调用结果:', result);
      
      if (result.success) {
        console.log('✅ getRecommendRecipes 调用成功');
        console.log(`获取到 ${result.data.length} 个菜谱`);
      } else {
        console.log('❌ getRecommendRecipes 调用失败:', result.message);
      }
    } else {
      console.log('❌ getRecommendRecipes 方法不存在');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 执行测试
testCloudApi();



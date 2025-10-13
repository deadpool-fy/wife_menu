// 云开发测试工具
// 在微信开发者工具控制台执行以下代码来测试云开发配置

console.log('开始测试云开发配置...');

// 1. 测试云开发初始化
console.log('1. 测试云开发初始化...');
try {
  wx.cloud.init({
    env: 'cloud1-5ga4h58zc0ea35dc',
    traceUser: true,
  });
  console.log('✅ 云开发初始化成功');
} catch (error) {
  console.error('❌ 云开发初始化失败:', error);
}

// 2. 测试云数据库连接
console.log('2. 测试云数据库连接...');
async function testDatabase() {
  try {
    const db = wx.cloud.database();
    const result = await db.collection('test').add({
      data: {
        test: 'Hello Cloud!',
        createdAt: new Date()
      }
    });
    console.log('✅ 云数据库连接成功:', result);
    
    // 删除测试数据
    await db.collection('test').doc(result._id).remove();
    console.log('✅ 测试数据已清理');
  } catch (error) {
    console.error('❌ 云数据库连接失败:', error);
  }
}

// 3. 测试云函数调用
console.log('3. 测试云函数调用...');
async function testCloudFunction() {
  try {
    const result = await wx.cloud.callFunction({
      name: 'crawler',
      data: {
        action: 'getStats'
      }
    });
    console.log('✅ 云函数调用成功:', result);
  } catch (error) {
    console.error('❌ 云函数调用失败:', error);
    console.log('请确保云函数已部署');
  }
}

// 4. 测试数据库集合
console.log('4. 测试数据库集合...');
async function testCollections() {
  try {
    const db = wx.cloud.database();
    
    // 测试recipes集合
    try {
      const recipes = await db.collection('recipes').count();
      console.log('✅ recipes集合存在，记录数:', recipes.total);
    } catch (error) {
      console.log('⚠️ recipes集合不存在，需要初始化');
    }
    
    // 测试categories集合
    try {
      const categories = await db.collection('categories').count();
      console.log('✅ categories集合存在，记录数:', categories.total);
    } catch (error) {
      console.log('⚠️ categories集合不存在，需要初始化');
    }
  } catch (error) {
    console.error('❌ 测试数据库集合失败:', error);
  }
}

// 5. 执行所有测试
async function runAllTests() {
  await testDatabase();
  await testCloudFunction();
  await testCollections();
  console.log('🎉 所有测试完成！');
}

// 执行测试
runAllTests();


// 微信云开发 - 数据库初始化云函数
const cloud = require('wx-server-sdk');

// 初始化云开发
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    console.log('开始初始化数据库...');
    
    // 只初始化基础分类数据，不添加测试菜谱
    await initCategories();
    
    console.log('数据库初始化完成');
    
    return {
      success: true,
      message: '数据库初始化成功，已添加基础分类数据'
    };
  } catch (error) {
    console.error('数据库初始化失败:', error);
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
};

// 初始化分类数据
async function initCategories() {
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
  
  const collection = db.collection('categories');
  
  for (const category of categories) {
    await collection.add({
      data: {
        ...category,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }
  console.log('分类数据初始化完成');
}
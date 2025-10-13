// 菜谱管理云函数
const cloud = require('wx-server-sdk');

// 初始化云开发
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, data } = event;
  
  try {
    switch (action) {
      case 'addRecipe':
        return await addRecipe(data);
      case 'updateRecipe':
        return await updateRecipe(data);
      case 'deleteRecipe':
        return await deleteRecipe(data);
      case 'getRecipes':
        return await getRecipes(data);
      case 'getRecipeById':
        return await getRecipeById(data);
      case 'getCategories':
        return await getCategories();
      case 'getStats':
        return await getStats();
      default:
        return {
          success: false,
          message: '未知操作'
        };
    }
  } catch (error) {
    console.error('云函数执行失败:', error);
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
};

// 添加菜谱
async function addRecipe(data) {
  try {
    console.log('开始添加菜谱:', data.title);
    
    // 验证必填字段
    if (!data.title || !data.description || !data.category) {
      throw new Error('标题、描述和分类为必填项');
    }
    
    // 检查是否已存在相同标题的菜谱
    const existing = await db.collection('recipes').where({
      title: data.title
    }).get();
    
    if (existing.data.length > 0) {
      throw new Error('菜谱标题已存在，请使用不同的标题');
    }
    
    // 生成菜谱数据
    const recipe = {
      title: data.title,
      description: data.description,
      image: data.image || getDefaultImage(),
      category: data.category,
      difficulty: data.difficulty || '简单',
      cookingTime: data.cookingTime || '30分钟',
      servings: data.servings || 2,
      calories: data.calories || 200,
      ingredients: data.ingredients || [],
      steps: data.steps || [],
      tips: data.tips || '',
      author: data.author || '管理员',
      tags: data.tags || [],
      rating: 0,
      viewCount: 0,
      likeCount: 0,
      isFeatured: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // 保存到数据库
    const result = await db.collection('recipes').add({
      data: recipe
    });
    
    console.log('菜谱添加成功:', result._id);
    
    return {
      success: true,
      message: '菜谱添加成功',
      data: {
        id: result._id,
        recipe: recipe
      }
    };
  } catch (error) {
    console.error('添加菜谱失败:', error);
    throw new Error(`添加菜谱失败: ${error.message}`);
  }
}

// 更新菜谱
async function updateRecipe(data) {
  try {
    console.log('开始更新菜谱:', data.id);
    
    if (!data.id) {
      throw new Error('菜谱ID不能为空');
    }
    
    // 检查菜谱是否存在
    const existing = await db.collection('recipes').doc(data.id).get();
    if (!existing.data) {
      throw new Error('菜谱不存在');
    }
    
    // 构建更新数据
    const updateData = {
      updatedAt: new Date()
    };
    
    // 只更新提供的字段
    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.image) updateData.image = data.image;
    if (data.category) updateData.category = data.category;
    if (data.difficulty) updateData.difficulty = data.difficulty;
    if (data.cookingTime) updateData.cookingTime = data.cookingTime;
    if (data.servings) updateData.servings = data.servings;
    if (data.calories) updateData.calories = data.calories;
    if (data.ingredients) updateData.ingredients = data.ingredients;
    if (data.steps) updateData.steps = data.steps;
    if (data.tips) updateData.tips = data.tips;
    if (data.author) updateData.author = data.author;
    if (data.tags) updateData.tags = data.tags;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    
    // 更新数据库
    await db.collection('recipes').doc(data.id).update({
      data: updateData
    });
    
    console.log('菜谱更新成功');
    
    return {
      success: true,
      message: '菜谱更新成功'
    };
  } catch (error) {
    console.error('更新菜谱失败:', error);
    throw new Error(`更新菜谱失败: ${error.message}`);
  }
}

// 删除菜谱
async function deleteRecipe(data) {
  try {
    console.log('开始删除菜谱:', data.id);
    
    if (!data.id) {
      throw new Error('菜谱ID不能为空');
    }
    
    // 检查菜谱是否存在
    const existing = await db.collection('recipes').doc(data.id).get();
    if (!existing.data) {
      throw new Error('菜谱不存在');
    }
    
    // 删除菜谱
    await db.collection('recipes').doc(data.id).remove();
    
    console.log('菜谱删除成功');
    
    return {
      success: true,
      message: '菜谱删除成功'
    };
  } catch (error) {
    console.error('删除菜谱失败:', error);
    throw new Error(`删除菜谱失败: ${error.message}`);
  }
}

// 获取菜谱列表
async function getRecipes(data) {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      difficulty, 
      search,
      isActive = true
    } = data;
    
    let query = db.collection('recipes');
    
    // 构建查询条件
    if (category) {
      query = query.where({ category });
    }
    
    if (difficulty) {
      query = query.where({ difficulty });
    }
    
    if (search) {
      query = query.where({
        title: db.RegExp({
          regexp: search,
          options: 'i'
        })
      });
    }
    
    if (isActive !== undefined) {
      query = query.where({ isActive });
    }
    
    // 分页查询
    const result = await query
      .orderBy('createdAt', 'desc')
      .skip((page - 1) * limit)
      .limit(limit)
      .get();
    
    // 获取总数
    const countResult = await query.count();
    
    return {
      success: true,
      data: {
        recipes: result.data,
        total: countResult.total,
        page: page,
        limit: limit
      }
    };
  } catch (error) {
    console.error('获取菜谱列表失败:', error);
    throw new Error(`获取菜谱列表失败: ${error.message}`);
  }
}

// 根据ID获取菜谱详情
async function getRecipeById(data) {
  try {
    const { id } = data;
    
    if (!id) {
      throw new Error('菜谱ID不能为空');
    }
    
    const result = await db.collection('recipes').doc(id).get();
    
    if (!result.data) {
      throw new Error('菜谱不存在');
    }
    
    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    console.error('获取菜谱详情失败:', error);
    throw new Error(`获取菜谱详情失败: ${error.message}`);
  }
}

// 获取分类列表
async function getCategories() {
  try {
    const result = await db.collection('categories').get();
    
    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    console.error('获取分类列表失败:', error);
    throw new Error(`获取分类列表失败: ${error.message}`);
  }
}

// 获取统计信息
async function getStats() {
  try {
    // 获取菜谱总数
    const recipesResult = await db.collection('recipes').count();
    
    // 获取分类统计
    const categoriesResult = await db.collection('categories').get();
    
    // 获取最近添加的菜谱
    const recentRecipes = await db.collection('recipes')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    return {
      success: true,
      data: {
        totalRecipes: recipesResult.total,
        totalCategories: categoriesResult.data.length,
        recentRecipes: recentRecipes.data
      }
    };
  } catch (error) {
    console.error('获取统计信息失败:', error);
    throw new Error(`获取统计信息失败: ${error.message}`);
  }
}

// 获取默认图片
function getDefaultImage() {
  const defaultImages = [
    'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1563379091339-03246963d0b0?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop'
  ];
  
  return defaultImages[Math.floor(Math.random() * defaultImages.length)];
}


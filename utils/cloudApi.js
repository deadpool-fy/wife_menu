// 云开发API服务
class CloudApiService {
  constructor() {
    this.env = 'cloud1-your-env-id';
  }

  // 调用云函数
  async callCloudFunction(name, action, data = {}) {
    try {
      const result = await wx.cloud.callFunction({
        name: name,
        data: {
          action: action,
          data: data
        }
      });
      return result.result;
    } catch (error) {
      console.error(`调用云函数 ${name} 失败:`, error);
      throw error;
    }
  }

  // 菜谱管理相关API
  async addRecipe(recipeData) {
    return await this.callCloudFunction('recipe-manager', 'addRecipe', recipeData);
  }

  async updateRecipe(recipeData) {
    return await this.callCloudFunction('recipe-manager', 'updateRecipe', recipeData);
  }

  async deleteRecipe(id) {
    return await this.callCloudFunction('recipe-manager', 'deleteRecipe', { id });
  }

  async getRecipes(params = {}) {
    return await this.callCloudFunction('recipe-manager', 'getRecipes', params);
  }

  async getRecipeById(id) {
    return await this.callCloudFunction('recipe-manager', 'getRecipeById', { id });
  }

  async getCategories() {
    return await this.callCloudFunction('recipe-manager', 'getCategories');
  }

  async getStats() {
    return await this.callCloudFunction('recipe-manager', 'getStats');
  }

  async createImportDraft(payload) {
    return await this.callCloudFunction('recipe-manager', 'createImportDraft', payload);
  }

  async autoImportByUrl(payload) {
    return await this.callCloudFunction('recipe-manager', 'autoImportByUrl', payload);
  }

  async getImportDrafts(params = {}) {
    return await this.callCloudFunction('recipe-manager', 'getImportDrafts', params);
  }

  async approveImportDraft(payload) {
    return await this.callCloudFunction('recipe-manager', 'approveImportDraft', payload);
  }

  async rejectImportDraft(payload) {
    return await this.callCloudFunction('recipe-manager', 'rejectImportDraft', payload);
  }

  // 获取推荐菜谱
  async getRecommendRecipes(limit = 6) {
    const result = await this.getRecipes({ 
      limit: limit, 
      isActive: true 
    });
    
    if (result.success) {
      return {
        success: true,
        data: result.data.recipes
      };
    }
    
    return result;
  }

  // 更新菜谱评分
  async updateRating(id, rating) {
    return await this.updateRecipe({ id, rating });
  }

  // 获取用户收藏
  async getUserFavorites(userId) {
    try {
      const result = await wx.cloud.database().collection('user_favorites')
        .where({ userId })
        .orderBy('createdAt', 'desc')
        .get();
      return result.data;
    } catch (error) {
      console.error('获取用户收藏失败:', error);
      throw error;
    }
  }

  // 添加用户收藏
  async addUserFavorite(userId, recipeId, recipeData) {
    try {
      const result = await wx.cloud.database().collection('user_favorites').add({
        data: {
          userId,
          recipeId,
          recipeData,
          createdAt: new Date()
        }
      });
      return result;
    } catch (error) {
      console.error('添加用户收藏失败:', error);
      throw error;
    }
  }

  // 删除用户收藏
  async removeUserFavorite(userId, recipeId) {
    try {
      const result = await wx.cloud.database().collection('user_favorites')
        .where({
          userId,
          recipeId
        })
        .remove();
      return result;
    } catch (error) {
      console.error('删除用户收藏失败:', error);
      throw error;
    }
  }

  // 获取用户评分
  async getUserRatings(userId) {
    try {
      const result = await wx.cloud.database().collection('user_ratings')
        .where({ userId })
        .orderBy('createdAt', 'desc')
        .get();
      return result.data;
    } catch (error) {
      console.error('获取用户评分失败:', error);
      throw error;
    }
  }

  // 添加用户评分
  async addUserRating(userId, recipeId, rating, comment = '') {
    try {
      const result = await wx.cloud.database().collection('user_ratings').add({
        data: {
          userId,
          recipeId,
          rating,
          comment,
          createdAt: new Date()
        }
      });
      return result;
    } catch (error) {
      console.error('添加用户评分失败:', error);
      throw error;
    }
  }

  // 更新用户评分
  async updateUserRating(userId, recipeId, rating, comment = '') {
    try {
      const result = await wx.cloud.database().collection('user_ratings')
        .where({
          userId,
          recipeId
        })
        .update({
          data: {
            rating,
            comment,
            updatedAt: new Date()
          }
        });
      return result;
    } catch (error) {
      console.error('更新用户评分失败:', error);
      throw error;
    }
  }

  // 搜索菜谱
  async searchRecipes(keyword, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      const result = await wx.cloud.database().collection('recipes')
        .where({
          title: wx.cloud.database().RegExp({
            regexp: keyword,
            options: 'i'
          })
        })
        .orderBy('createdAt', 'desc')
        .skip((page - 1) * limit)
        .limit(limit)
        .get();
      return result.data;
    } catch (error) {
      console.error('搜索菜谱失败:', error);
      throw error;
    }
  }
}

// 创建云API服务实例
const cloudApiService = new CloudApiService();

module.exports = cloudApiService;

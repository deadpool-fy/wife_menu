// 小程序缓存工具
const config = require('./config.js');

class CacheManager {
  constructor() {
    this.cache = new Map();
    this.maxSize = config.cache.maxSize;
    this.expireTime = config.cache.expireTime;
  }

  // 设置缓存
  set(key, value, expireTime = this.expireTime) {
    if (!config.cache.enabled) return;

    // 检查缓存大小
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    const cacheItem = {
      value,
      timestamp: Date.now(),
      expireTime: Date.now() + expireTime
    };

    this.cache.set(key, cacheItem);
  }

  // 获取缓存
  get(key) {
    if (!config.cache.enabled) return null;

    const cacheItem = this.cache.get(key);
    
    if (!cacheItem) return null;

    // 检查是否过期
    if (Date.now() > cacheItem.expireTime) {
      this.cache.delete(key);
      return null;
    }

    return cacheItem.value;
  }

  // 删除缓存
  delete(key) {
    return this.cache.delete(key);
  }

  // 清空缓存
  clear() {
    this.cache.clear();
  }

  // 检查缓存是否存在
  has(key) {
    if (!config.cache.enabled) return false;

    const cacheItem = this.cache.get(key);
    
    if (!cacheItem) return false;

    // 检查是否过期
    if (Date.now() > cacheItem.expireTime) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // 清理过期缓存
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];

    for (const [key, cacheItem] of this.cache) {
      if (now > cacheItem.expireTime) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
  }

  // 获取缓存大小
  size() {
    return this.cache.size;
  }

  // 获取缓存统计
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let validCount = 0;

    for (const [key, cacheItem] of this.cache) {
      if (now > cacheItem.expireTime) {
        expiredCount++;
      } else {
        validCount++;
      }
    }

    return {
      total: this.cache.size,
      valid: validCount,
      expired: expiredCount,
      maxSize: this.maxSize
    };
  }

  // 设置菜谱缓存
  setRecipe(recipeId, recipe) {
    const key = `recipe_${recipeId}`;
    this.set(key, recipe);
  }

  // 获取菜谱缓存
  getRecipe(recipeId) {
    const key = `recipe_${recipeId}`;
    return this.get(key);
  }

  // 设置菜谱列表缓存
  setRecipeList(params, recipes) {
    const key = `recipe_list_${JSON.stringify(params)}`;
    this.set(key, recipes);
  }

  // 获取菜谱列表缓存
  getRecipeList(params) {
    const key = `recipe_list_${JSON.stringify(params)}`;
    return this.get(key);
  }

  // 设置分类缓存
  setCategories(categories) {
    this.set('categories', categories, 24 * 60 * 60 * 1000); // 24小时
  }

  // 获取分类缓存
  getCategories() {
    return this.get('categories');
  }

  // 设置用户数据缓存
  setUserData(userId, data) {
    const key = `user_${userId}`;
    this.set(key, data);
  }

  // 获取用户数据缓存
  getUserData(userId) {
    const key = `user_${userId}`;
    return this.get(key);
  }

  // 设置搜索历史
  setSearchHistory(keyword) {
    const key = 'search_history';
    let history = this.get(key) || [];
    
    // 移除重复项
    history = history.filter(item => item !== keyword);
    
    // 添加到开头
    history.unshift(keyword);
    
    // 限制历史记录数量
    if (history.length > 20) {
      history = history.slice(0, 20);
    }
    
    this.set(key, history);
  }

  // 获取搜索历史
  getSearchHistory() {
    const key = 'search_history';
    return this.get(key) || [];
  }

  // 清除搜索历史
  clearSearchHistory() {
    const key = 'search_history';
    this.delete(key);
  }

  // 设置收藏列表
  setFavorites(favorites) {
    this.set('favorites', favorites);
  }

  // 获取收藏列表
  getFavorites() {
    return this.get('favorites') || [];
  }

  // 添加收藏
  addFavorite(recipe) {
    const favorites = this.getFavorites();
    const exists = favorites.some(item => item.id === recipe.id);
    
    if (!exists) {
      favorites.push(recipe);
      this.setFavorites(favorites);
    }
  }

  // 移除收藏
  removeFavorite(recipeId) {
    const favorites = this.getFavorites();
    const filtered = favorites.filter(item => item.id !== recipeId);
    this.setFavorites(filtered);
  }

  // 检查是否收藏
  isFavorite(recipeId) {
    const favorites = this.getFavorites();
    return favorites.some(item => item.id === recipeId);
  }
}

// 创建缓存管理器实例
const cacheManager = new CacheManager();

module.exports = cacheManager;

// utils/calorieCalculator.js
// 卡路里计算工具

// 常见食材的卡路里数据（每100g）
const INGREDIENT_CALORIES = {
  // 肉类
  '鸡肉': 165,
  '猪肉': 242,
  '牛肉': 250,
  '羊肉': 203,
  '鸭肉': 183,
  '鱼肉': 206,
  '虾': 99,
  '蟹': 103,
  '贝类': 85,
  
  // 蔬菜类
  '白菜': 17,
  '小白菜': 15,
  '菠菜': 23,
  '韭菜': 25,
  '芹菜': 16,
  '萝卜': 20,
  '胡萝卜': 41,
  '土豆': 77,
  '茄子': 21,
  '黄瓜': 16,
  '西红柿': 18,
  '青椒': 22,
  '豆角': 30,
  '豆芽': 16,
  '蘑菇': 20,
  '木耳': 21,
  '豆腐': 81,
  '豆干': 140,
  
  // 主食类
  '米饭': 130,
  '面条': 109,
  '馒头': 221,
  '包子': 227,
  '饺子': 250,
  '馄饨': 200,
  
  // 调料类
  '油': 899,
  '盐': 0,
  '糖': 387,
  '酱油': 63,
  '醋': 31,
  '料酒': 7,
  '花椒': 316,
  '八角': 281,
  '桂皮': 329,
  '生姜': 80,
  '大蒜': 149,
  '葱': 30,
  '香菜': 31,
  
  // 其他
  '鸡蛋': 143,
  '牛奶': 54,
  '花生': 567,
  '芝麻': 559,
  '核桃': 654
}

// 菜品类型对应的基础卡路里调整
const DISH_TYPE_MULTIPLIER = {
  '荤菜': 1.2,    // 荤菜通常油水较多
  '素菜': 0.8,    // 素菜相对清淡
  '汤类': 0.6,    // 汤类水分较多
  '凉菜': 0.7,    // 凉菜通常少油
  '主食': 1.0     // 主食保持原样
}

/**
 * 解析食材数量，将字符串转换为数字
 * @param {string} amount - 食材数量字符串，如"300g", "1根", "2勺"
 * @returns {number} 解析后的数量（克）
 */
function parseAmount(amount) {
  if (typeof amount === 'number') {
    return amount
  }
  
  if (typeof amount !== 'string') {
    return 100 // 默认100g
  }
  
  // 提取数字部分
  const match = amount.match(/(\d+(?:\.\d+)?)/)
  if (!match) {
    return 100 // 默认100g
  }
  
  const num = parseFloat(match[1])
  
  // 根据单位转换
  if (amount.includes('g') || amount.includes('克')) {
    return num
  } else if (amount.includes('kg') || amount.includes('千克')) {
    return num * 1000
  } else if (amount.includes('斤')) {
    return num * 500
  } else if (amount.includes('两')) {
    return num * 50
  } else if (amount.includes('勺') || amount.includes('匙')) {
    return num * 15 // 1勺约15g
  } else if (amount.includes('个') || amount.includes('根') || amount.includes('片') || amount.includes('瓣')) {
    // 根据食材类型估算重量
    return num * 50 // 默认每个50g
  } else {
    return num // 假设是克
  }
}

/**
 * 根据菜品名称和食材估算卡路里
 * @param {string} dishName - 菜品名称
 * @param {Array} ingredients - 食材列表（可选）
 * @returns {number} 估算的卡路里数
 */
function calculateCalories(dishName, ingredients = []) {
  let totalCalories = 0
  
  // 如果有食材列表，优先使用食材计算
  if (ingredients && ingredients.length > 0) {
    ingredients.forEach(ingredient => {
      const name = ingredient.name || ingredient
      const amountStr = ingredient.amount || '100g'
      const amount = parseAmount(amountStr) // 解析食材数量
      
      // 查找匹配的食材
      const matchedIngredient = findMatchingIngredient(name)
      if (matchedIngredient) {
        totalCalories += (matchedIngredient.calories * amount / 100)
      }
    })
  } else {
    // 根据菜品名称估算
    totalCalories = estimateCaloriesByName(dishName)
  }
  
  // 根据菜品类型调整
  const dishType = getDishType(dishName)
  const multiplier = DISH_TYPE_MULTIPLIER[dishType] || 1.0
  
  return Math.round(totalCalories * multiplier)
}

/**
 * 根据菜品名称估算卡路里
 * @param {string} dishName - 菜品名称
 * @returns {number} 估算的卡路里数
 */
function estimateCaloriesByName(dishName) {
  let calories = 0
  
  // 检查菜品名称中的关键词
  Object.keys(INGREDIENT_CALORIES).forEach(ingredient => {
    if (dishName.includes(ingredient)) {
      calories += INGREDIENT_CALORIES[ingredient]
    }
  })
  
  // 如果没有找到匹配的食材，使用默认值
  if (calories === 0) {
    calories = getDefaultCalories(dishName)
  }
  
  return calories
}

/**
 * 查找匹配的食材
 * @param {string} name - 食材名称
 * @returns {Object|null} 匹配的食材信息
 */
function findMatchingIngredient(name) {
  // 精确匹配
  if (INGREDIENT_CALORIES[name]) {
    return { name, calories: INGREDIENT_CALORIES[name] }
  }
  
  // 模糊匹配
  for (const ingredient in INGREDIENT_CALORIES) {
    if (name.includes(ingredient) || ingredient.includes(name)) {
      return { name: ingredient, calories: INGREDIENT_CALORIES[ingredient] }
    }
  }
  
  return null
}

/**
 * 获取菜品类型
 * @param {string} dishName - 菜品名称
 * @returns {string} 菜品类型
 */
function getDishType(dishName) {
  const meatKeywords = ['肉', '鸡', '鸭', '鱼', '虾', '蟹', '牛', '羊', '猪', '里脊', '排骨']
  const vegetableKeywords = ['菜', '豆', '瓜', '萝卜', '土豆', '茄子', '黄瓜', '西红柿']
  const soupKeywords = ['汤', '羹', '煲']
  const coldKeywords = ['凉', '拌', '腌']
  const stapleKeywords = ['饭', '面', '馒头', '包子', '饺子', '馄饨']
  
  if (meatKeywords.some(keyword => dishName.includes(keyword))) {
    return '荤菜'
  } else if (vegetableKeywords.some(keyword => dishName.includes(keyword))) {
    return '素菜'
  } else if (soupKeywords.some(keyword => dishName.includes(keyword))) {
    return '汤类'
  } else if (coldKeywords.some(keyword => dishName.includes(keyword))) {
    return '凉菜'
  } else if (stapleKeywords.some(keyword => dishName.includes(keyword))) {
    return '主食'
  }
  
  return '荤菜' // 默认
}

/**
 * 获取默认卡路里值
 * @param {string} dishName - 菜品名称
 * @returns {number} 默认卡路里数
 */
function getDefaultCalories(dishName) {
  const dishType = getDishType(dishName)
  
  const defaultCalories = {
    '荤菜': 280,
    '素菜': 120,
    '汤类': 80,
    '凉菜': 100,
    '主食': 200
  }
  
  return defaultCalories[dishType] || 200
}

/**
 * 格式化卡路里显示
 * @param {number} calories - 卡路里数
 * @returns {string} 格式化后的字符串
 */
function formatCalories(calories) {
  if (calories < 100) {
    return `${calories}卡`
  } else if (calories < 1000) {
    return `${calories}卡`
  } else {
    return `${(calories / 1000).toFixed(1)}千卡`
  }
}

module.exports = {
  calculateCalories,
  formatCalories,
  parseAmount,
  INGREDIENT_CALORIES,
  DISH_TYPE_MULTIPLIER
}

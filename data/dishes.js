// data/dishes.js
// 菜品数据文件
const calorieCalculator = require('../utils/calorieCalculator.js')

// 菜品详情数据
const DISH_DETAILS = {
  1: {
    id: 1,
    name: '宫保鸡丁',
    category: '荤菜',
    cookingTime: '30分钟',
    servings: 2,
    image: 'https://via.placeholder.com/400x300/ff6b6b/ffffff?text=宫保鸡丁',
    description: '宫保鸡丁是一道经典的川菜，以鸡肉为主料，配以花生米、黄瓜等，口感鲜嫩，味道香辣。',
    ingredients: [
      { name: '鸡胸肉', amount: '300g' },
      { name: '花生米', amount: '50g' },
      { name: '黄瓜', amount: '1根' },
      { name: '干辣椒', amount: '10个' },
      { name: '花椒', amount: '1小把' },
      { name: '大葱', amount: '2根' },
      { name: '生姜', amount: '1块' },
      { name: '大蒜', amount: '3瓣' },
      { name: '生抽', amount: '2勺' },
      { name: '老抽', amount: '1勺' },
      { name: '料酒', amount: '1勺' },
      { name: '白糖', amount: '1勺' },
      { name: '醋', amount: '1勺' },
      { name: '盐', amount: '适量' },
      { name: '淀粉', amount: '1勺' }
    ],
    steps: [
      {
        step: 1,
        description: '鸡胸肉切丁，用料酒、生抽、淀粉腌制15分钟',
        image: 'https://via.placeholder.com/300x200/ff6b6b/ffffff?text=腌制鸡肉'
      },
      {
        step: 2,
        description: '黄瓜切丁，大葱切段，生姜大蒜切末',
        image: 'https://via.placeholder.com/300x200/4ecdc4/ffffff?text=准备配菜'
      },
      {
        step: 3,
        description: '热锅下油，放入鸡丁炒至变色盛起',
        image: 'https://via.placeholder.com/300x200/45b7d1/ffffff?text=炒鸡肉'
      },
      {
        step: 4,
        description: '锅中留底油，下干辣椒、花椒爆香',
        image: 'https://via.placeholder.com/300x200/96ceb4/ffffff?text=爆香调料'
      },
      {
        step: 5,
        description: '加入鸡丁、黄瓜丁翻炒，调入糖醋汁炒匀',
        image: 'https://via.placeholder.com/300x200/feca57/ffffff?text=调味炒制'
      }
    ],
    tips: '鸡肉腌制时间不宜过长，否则口感会变老。炒制时火候要掌握好，保持鸡肉的嫩滑口感。'
  },
  2: {
    id: 2,
    name: '麻婆豆腐',
    category: '素菜',
    cookingTime: '20分钟',
    servings: 2,
    image: 'https://via.placeholder.com/400x300/4ecdc4/ffffff?text=麻婆豆腐',
    description: '麻婆豆腐是四川传统名菜，以豆腐为主料，配以肉末、豆瓣酱等，麻辣鲜香，口感嫩滑。',
    ingredients: [
      { name: '嫩豆腐', amount: '400g' },
      { name: '猪肉末', amount: '100g' },
      { name: '豆瓣酱', amount: '2勺' },
      { name: '花椒粉', amount: '1勺' },
      { name: '大葱', amount: '2根' },
      { name: '生姜', amount: '1块' },
      { name: '大蒜', amount: '3瓣' },
      { name: '生抽', amount: '1勺' },
      { name: '料酒', amount: '1勺' },
      { name: '盐', amount: '适量' },
      { name: '淀粉', amount: '1勺' },
      { name: '香油', amount: '几滴' }
    ],
    steps: [
      {
        step: 1,
        description: '豆腐切块，用盐水焯一下去除豆腥味',
        image: 'https://via.placeholder.com/300x200/4ecdc4/ffffff?text=处理豆腐'
      },
      {
        step: 2,
        description: '热锅下油，放入肉末炒至变色',
        image: 'https://via.placeholder.com/300x200/ff6b6b/ffffff?text=炒肉末'
      },
      {
        step: 3,
        description: '加入豆瓣酱炒出红油，下葱姜蒜爆香',
        image: 'https://via.placeholder.com/300x200/45b7d1/ffffff?text=炒制调料'
      },
      {
        step: 4,
        description: '放入豆腐块，轻轻翻炒，调入生抽、料酒',
        image: 'https://via.placeholder.com/300x200/96ceb4/ffffff?text=调味'
      },
      {
        step: 5,
        description: '勾芡收汁，撒花椒粉，淋香油即可',
        image: 'https://via.placeholder.com/300x200/feca57/ffffff?text=完成'
      }
    ],
    tips: '豆腐要选择嫩豆腐，炒制时要轻拿轻放，避免豆腐破碎。花椒粉最后撒入，保持麻辣香味。'
  },
  3: {
    id: 3,
    name: '红烧肉',
    category: '荤菜',
    cookingTime: '60分钟',
    servings: 3,
    image: 'https://via.placeholder.com/400x300/45b7d1/ffffff?text=红烧肉',
    description: '红烧肉是一道经典的家常菜，肥瘦相间，色泽红亮，口感软糯，肥而不腻。',
    ingredients: [
      { name: '五花肉', amount: '500g' },
      { name: '冰糖', amount: '30g' },
      { name: '生抽', amount: '3勺' },
      { name: '老抽', amount: '2勺' },
      { name: '料酒', amount: '2勺' },
      { name: '大葱', amount: '2根' },
      { name: '生姜', amount: '1块' },
      { name: '八角', amount: '2个' },
      { name: '桂皮', amount: '1块' },
      { name: '香叶', amount: '2片' },
      { name: '盐', amount: '适量' }
    ],
    steps: [
      {
        step: 1,
        description: '五花肉切块，冷水下锅焯水去腥',
        image: 'https://via.placeholder.com/300x200/ff6b6b/ffffff?text=焯水'
      },
      {
        step: 2,
        description: '热锅下冰糖炒糖色，至焦糖色',
        image: 'https://via.placeholder.com/300x200/4ecdc4/ffffff?text=炒糖色'
      },
      {
        step: 3,
        description: '下肉块翻炒上色，加入葱姜爆香',
        image: 'https://via.placeholder.com/300x200/45b7d1/ffffff?text=上色'
      },
      {
        step: 4,
        description: '调入生抽、老抽、料酒，加入香料',
        image: 'https://via.placeholder.com/300x200/96ceb4/ffffff?text=调味'
      },
      {
        step: 5,
        description: '加水没过肉块，小火炖煮1小时',
        image: 'https://via.placeholder.com/300x200/feca57/ffffff?text=炖煮'
      }
    ],
    tips: '炒糖色时火候要掌握好，避免炒糊。炖煮时间要足够，让肉质软烂入味。'
  },
  4: {
    id: 4,
    name: '清炒小白菜',
    category: '素菜',
    cookingTime: '10分钟',
    servings: 2,
    image: 'https://via.placeholder.com/400x300/96ceb4/ffffff?text=清炒小白菜',
    description: '清炒小白菜是一道简单清爽的素菜，保持了蔬菜的原汁原味，营养丰富。',
    ingredients: [
      { name: '小白菜', amount: '500g' },
      { name: '大蒜', amount: '3瓣' },
      { name: '生抽', amount: '1勺' },
      { name: '盐', amount: '适量' },
      { name: '鸡精', amount: '少许' },
      { name: '油', amount: '适量' }
    ],
    steps: [
      {
        step: 1,
        description: '小白菜洗净，切段备用',
        image: 'https://via.placeholder.com/300x200/96ceb4/ffffff?text=处理蔬菜'
      },
      {
        step: 2,
        description: '大蒜切片，热锅下油爆香',
        image: 'https://via.placeholder.com/300x200/4ecdc4/ffffff?text=爆香蒜片'
      },
      {
        step: 3,
        description: '下小白菜大火快炒',
        image: 'https://via.placeholder.com/300x200/45b7d1/ffffff?text=快炒'
      },
      {
        step: 4,
        description: '调入生抽、盐、鸡精炒匀',
        image: 'https://via.placeholder.com/300x200/feca57/ffffff?text=调味'
      }
    ],
    tips: '炒制时间要短，保持蔬菜的脆嫩口感。火候要大，快速炒制。'
  },
  5: {
    id: 5,
    name: '糖醋里脊',
    category: '荤菜',
    cookingTime: '25分钟',
    servings: 2,
    image: 'https://via.placeholder.com/400x300/feca57/ffffff?text=糖醋里脊',
    description: '糖醋里脊是一道酸甜可口的经典菜品，外酥内嫩，色泽金黄，老少皆宜。',
    ingredients: [
      { name: '里脊肉', amount: '300g' },
      { name: '鸡蛋', amount: '1个' },
      { name: '淀粉', amount: '3勺' },
      { name: '面粉', amount: '2勺' },
      { name: '番茄酱', amount: '3勺' },
      { name: '白糖', amount: '2勺' },
      { name: '白醋', amount: '2勺' },
      { name: '生抽', amount: '1勺' },
      { name: '料酒', amount: '1勺' },
      { name: '盐', amount: '适量' },
      { name: '白芝麻', amount: '少许' }
    ],
    steps: [
      {
        step: 1,
        description: '里脊肉切条，用料酒、盐腌制15分钟',
        image: 'https://via.placeholder.com/300x200/ff6b6b/ffffff?text=腌制肉条'
      },
      {
        step: 2,
        description: '调糊：鸡蛋、淀粉、面粉调成糊状',
        image: 'https://via.placeholder.com/300x200/4ecdc4/ffffff?text=调糊'
      },
      {
        step: 3,
        description: '肉条裹糊，下油锅炸至金黄',
        image: 'https://via.placeholder.com/300x200/45b7d1/ffffff?text=炸制'
      },
      {
        step: 4,
        description: '调糖醋汁：番茄酱、糖、醋、生抽',
        image: 'https://via.placeholder.com/300x200/96ceb4/ffffff?text=调汁'
      },
      {
        step: 5,
        description: '热锅下汁，放入肉条炒匀，撒芝麻',
        image: 'https://via.placeholder.com/300x200/feca57/ffffff?text=完成'
      }
    ],
    tips: '炸制时油温要适中，避免外焦内生。糖醋汁的比例要调好，酸甜适中。'
  }
}

// 获取菜品详情
function getDishDetail(dishId) {
  const detail = DISH_DETAILS[dishId]
  if (detail) {
    // 计算卡路里
    detail.calories = calorieCalculator.calculateCalories(detail.name, detail.ingredients)
    return detail
  }
  return null
}

// 获取推荐菜品列表
function getRecommendDishes() {
  return Object.values(DISH_DETAILS).map(dish => {
    // 计算卡路里
    const calories = calorieCalculator.calculateCalories(dish.name, dish.ingredients)
    
    return {
      id: dish.id,
      name: dish.name,
      category: dish.category,
      calories: calories,
      image: dish.image,
      selected: false
    }
  })
}

module.exports = {
  getDishDetail,
  getRecommendDishes,
  DISH_DETAILS
}

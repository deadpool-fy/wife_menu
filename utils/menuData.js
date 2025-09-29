// utils/menuData.js
// 菜单数据管理工具

// 示例菜品数据
const sampleDishes = [
  {
    id: 1,
    name: '宫保鸡丁',
    category: '荤菜',
    categoryType: 'meat',
    difficulty: '中等',
    cookingTime: '30分钟',
    servings: 2,
    calories: '320卡',
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
        description: '鸡胸肉切成1.5cm见方的小丁，用料酒、生抽、盐、淀粉腌制15分钟。',
        image: 'https://via.placeholder.com/300x200/ff6b6b/ffffff?text=步骤1'
      },
      {
        description: '黄瓜切丁，大葱切段，生姜、大蒜切片，干辣椒剪成段。',
        image: 'https://via.placeholder.com/300x200/4ecdc4/ffffff?text=步骤2'
      },
      {
        description: '热锅下油，放入花生米炸至金黄，捞出备用。',
        image: 'https://via.placeholder.com/300x200/45b7d1/ffffff?text=步骤3'
      },
      {
        description: '锅中留底油，下入鸡丁炒至变色，盛出备用。',
        image: 'https://via.placeholder.com/300x200/96ceb4/ffffff?text=步骤4'
      },
      {
        description: '锅中再下油，放入干辣椒、花椒爆香，下入葱姜蒜炒香。',
        image: 'https://via.placeholder.com/300x200/feca57/ffffff?text=步骤5'
      },
      {
        description: '倒入鸡丁和黄瓜丁翻炒，加入生抽、老抽、白糖、醋调味。',
        image: 'https://via.placeholder.com/300x200/ff9ff3/ffffff?text=步骤6'
      },
      {
        description: '最后加入花生米翻炒均匀，即可出锅装盘。',
        image: 'https://via.placeholder.com/300x200/54a0ff/ffffff?text=步骤7'
      }
    ],
    tips: '1. 鸡丁要切得大小均匀，这样炒出来的口感更好。\n2. 花生米要最后加入，保持酥脆口感。\n3. 炒制过程中火候要掌握好，避免炒糊。\n4. 可以根据个人口味调整辣椒和花椒的用量。'
  },
  {
    id: 2,
    name: '麻婆豆腐',
    category: '素菜',
    categoryType: 'vegetable',
    difficulty: '简单',
    cookingTime: '20分钟',
    servings: 2,
    calories: '180卡',
    image: 'https://via.placeholder.com/400x300/4ecdc4/ffffff?text=麻婆豆腐',
    description: '麻婆豆腐是四川传统名菜，以豆腐为主料，配以牛肉末，口感麻辣鲜香。',
    ingredients: [
      { name: '嫩豆腐', amount: '400g' },
      { name: '牛肉末', amount: '100g' },
      { name: '豆瓣酱', amount: '2勺' },
      { name: '花椒粉', amount: '1勺' },
      { name: '大葱', amount: '2根' },
      { name: '生姜', amount: '1块' },
      { name: '大蒜', amount: '3瓣' },
      { name: '生抽', amount: '1勺' },
      { name: '老抽', amount: '半勺' },
      { name: '料酒', amount: '1勺' },
      { name: '白糖', amount: '半勺' },
      { name: '盐', amount: '适量' },
      { name: '淀粉', amount: '1勺' },
      { name: '香油', amount: '几滴' }
    ],
    steps: [
      {
        description: '豆腐切成2cm见方的小块，用盐水浸泡10分钟去腥。',
        image: 'https://via.placeholder.com/300x200/4ecdc4/ffffff?text=步骤1'
      },
      {
        description: '大葱切葱花，生姜、大蒜切末备用。',
        image: 'https://via.placeholder.com/300x200/45b7d1/ffffff?text=步骤2'
      },
      {
        description: '热锅下油，放入牛肉末炒至变色，盛出备用。',
        image: 'https://via.placeholder.com/300x200/96ceb4/ffffff?text=步骤3'
      },
      {
        description: '锅中留底油，放入豆瓣酱炒出红油，下入姜蒜末炒香。',
        image: 'https://via.placeholder.com/300x200/feca57/ffffff?text=步骤4'
      },
      {
        description: '加入适量清水，放入豆腐块，小火煮5分钟。',
        image: 'https://via.placeholder.com/300x200/ff9ff3/ffffff?text=步骤5'
      },
      {
        description: '加入牛肉末，用生抽、老抽、白糖调味，勾芡。',
        image: 'https://via.placeholder.com/300x200/54a0ff/ffffff?text=步骤6'
      },
      {
        description: '撒上花椒粉和葱花，淋上香油即可。',
        image: 'https://via.placeholder.com/300x200/5f27cd/ffffff?text=步骤7'
      }
    ],
    tips: '1. 豆腐用盐水浸泡可以去除豆腥味。\n2. 炒制时要用小火，避免豆腐破碎。\n3. 勾芡要适量，不能太稠。\n4. 花椒粉要最后撒，保持麻味。'
  },
  {
    id: 3,
    name: '红烧肉',
    category: '荤菜',
    categoryType: 'meat',
    difficulty: '中等',
    cookingTime: '45分钟',
    servings: 3,
    calories: '450卡',
    image: 'https://via.placeholder.com/400x300/45b7d1/ffffff?text=红烧肉',
    description: '红烧肉是一道经典的家常菜，肥瘦相间，色泽红亮，口感软糯。',
    ingredients: [
      { name: '五花肉', amount: '500g' },
      { name: '冰糖', amount: '50g' },
      { name: '生抽', amount: '3勺' },
      { name: '老抽', amount: '2勺' },
      { name: '料酒', amount: '2勺' },
      { name: '大葱', amount: '1根' },
      { name: '生姜', amount: '1块' },
      { name: '八角', amount: '2个' },
      { name: '桂皮', amount: '1小块' },
      { name: '香叶', amount: '2片' },
      { name: '盐', amount: '适量' }
    ],
    steps: [
      {
        description: '五花肉切成3cm见方的块，用冷水下锅焯水去腥。',
        image: 'https://via.placeholder.com/300x200/45b7d1/ffffff?text=步骤1'
      },
      {
        description: '大葱切段，生姜切片，准备好香料。',
        image: 'https://via.placeholder.com/300x200/96ceb4/ffffff?text=步骤2'
      },
      {
        description: '热锅下油，放入冰糖炒至糖色，下入肉块翻炒上色。',
        image: 'https://via.placeholder.com/300x200/feca57/ffffff?text=步骤3'
      },
      {
        description: '加入葱姜和香料炒香，倒入料酒去腥。',
        image: 'https://via.placeholder.com/300x200/ff9ff3/ffffff?text=步骤4'
      },
      {
        description: '加入生抽、老抽调味，倒入热水没过肉块。',
        image: 'https://via.placeholder.com/300x200/54a0ff/ffffff?text=步骤5'
      },
      {
        description: '大火烧开后转小火炖煮40分钟，期间翻动几次。',
        image: 'https://via.placeholder.com/300x200/5f27cd/ffffff?text=步骤6'
      },
      {
        description: '最后大火收汁，装盘即可。',
        image: 'https://via.placeholder.com/300x200/00d2d3/ffffff?text=步骤7'
      }
    ],
    tips: '1. 五花肉要选择肥瘦相间的。\n2. 炒糖色时火候要掌握好，避免炒糊。\n3. 炖煮时要用小火，让肉质更加软糯。\n4. 收汁时要不断翻动，避免粘锅。'
  },
  {
    id: 4,
    name: '清炒小白菜',
    category: '素菜',
    categoryType: 'vegetable',
    difficulty: '简单',
    cookingTime: '10分钟',
    servings: 2,
    calories: '50卡',
    image: 'https://via.placeholder.com/400x300/96ceb4/ffffff?text=清炒小白菜',
    description: '清炒小白菜是一道简单易做的素菜，口感清爽，营养丰富。',
    ingredients: [
      { name: '小白菜', amount: '500g' },
      { name: '大蒜', amount: '3瓣' },
      { name: '生抽', amount: '1勺' },
      { name: '盐', amount: '适量' },
      { name: '鸡精', amount: '少许' },
      { name: '香油', amount: '几滴' }
    ],
    steps: [
      {
        description: '小白菜洗净，切成段，大蒜切片。',
        image: 'https://via.placeholder.com/300x200/96ceb4/ffffff?text=步骤1'
      },
      {
        description: '热锅下油，放入蒜片爆香。',
        image: 'https://via.placeholder.com/300x200/feca57/ffffff?text=步骤2'
      },
      {
        description: '下入小白菜，大火快速翻炒。',
        image: 'https://via.placeholder.com/300x200/ff9ff3/ffffff?text=步骤3'
      },
      {
        description: '加入生抽、盐、鸡精调味，炒至断生即可。',
        image: 'https://via.placeholder.com/300x200/54a0ff/ffffff?text=步骤4'
      },
      {
        description: '最后淋上香油，装盘即可。',
        image: 'https://via.placeholder.com/300x200/5f27cd/ffffff?text=步骤5'
      }
    ],
    tips: '1. 小白菜要选择嫩一些的。\n2. 炒制时要用大火，保持蔬菜的脆嫩。\n3. 不要炒太久，避免出水。\n4. 可以根据个人口味添加其他调料。'
  },
  {
    id: 5,
    name: '糖醋里脊',
    category: '荤菜',
    categoryType: 'meat',
    difficulty: '中等',
    cookingTime: '35分钟',
    servings: 2,
    calories: '380卡',
    image: 'https://via.placeholder.com/400x300/feca57/ffffff?text=糖醋里脊',
    description: '糖醋里脊是一道经典的家常菜，外酥内嫩，酸甜可口。',
    ingredients: [
      { name: '里脊肉', amount: '300g' },
      { name: '鸡蛋', amount: '1个' },
      { name: '淀粉', amount: '100g' },
      { name: '番茄酱', amount: '3勺' },
      { name: '白糖', amount: '2勺' },
      { name: '白醋', amount: '2勺' },
      { name: '生抽', amount: '1勺' },
      { name: '料酒', amount: '1勺' },
      { name: '盐', amount: '适量' },
      { name: '大葱', amount: '1根' },
      { name: '生姜', amount: '1块' }
    ],
    steps: [
      {
        description: '里脊肉切成条，用料酒、生抽、盐腌制15分钟。',
        image: 'https://via.placeholder.com/300x200/feca57/ffffff?text=步骤1'
      },
      {
        description: '鸡蛋打散，加入淀粉调成糊状。',
        image: 'https://via.placeholder.com/300x200/ff9ff3/ffffff?text=步骤2'
      },
      {
        description: '将里脊肉条裹上蛋糊，下入热油中炸至金黄。',
        image: 'https://via.placeholder.com/300x200/54a0ff/ffffff?text=步骤3'
      },
      {
        description: '大葱切段，生姜切片，调好糖醋汁。',
        image: 'https://via.placeholder.com/300x200/5f27cd/ffffff?text=步骤4'
      },
      {
        description: '热锅下油，放入葱姜爆香，倒入糖醋汁。',
        image: 'https://via.placeholder.com/300x200/00d2d3/ffffff?text=步骤5'
      },
      {
        description: '下入炸好的里脊肉，快速翻炒均匀。',
        image: 'https://via.placeholder.com/300x200/ff6348/ffffff?text=步骤6'
      },
      {
        description: '装盘即可，可以撒上白芝麻装饰。',
        image: 'https://via.placeholder.com/300x200/2ed573/ffffff?text=步骤7'
      }
    ],
    tips: '1. 里脊肉要切得均匀，这样炸出来的口感更好。\n2. 炸制时油温要适中，避免外焦内生。\n3. 糖醋汁的比例要掌握好，酸甜适中。\n4. 翻炒时要快速，避免肉条变软。'
  }
]

// 获取所有菜品
function getAllDishes() {
  return sampleDishes
}

// 根据ID获取菜品详情
function getDishById(id) {
  return sampleDishes.find(dish => dish.id === parseInt(id))
}

// 根据分类获取菜品
function getDishesByCategory(categoryType) {
  if (categoryType === 'all') {
    return sampleDishes
  }
  return sampleDishes.filter(dish => dish.categoryType === categoryType)
}

// 获取推荐菜品
function getRecommendDishes(limit = 5) {
  // 这里可以实现推荐算法，现在简单返回前几个
  return sampleDishes.slice(0, limit)
}

// 搜索菜品
function searchDishes(keyword) {
  return sampleDishes.filter(dish => 
    dish.name.includes(keyword) || 
    dish.description.includes(keyword) ||
    dish.ingredients.some(ingredient => ingredient.name.includes(keyword))
  )
}

// 检查菜单是否需要更新
function checkMenuUpdate() {
  const lastUpdate = wx.getStorageSync('menuLastUpdate')
  const now = new Date()
  const currentMonth = now.getFullYear() * 12 + now.getMonth()
  
  if (!lastUpdate) {
    return true
  }
  
  const lastUpdateMonth = lastUpdate.year * 12 + lastUpdate.month
  return currentMonth > lastUpdateMonth
}

// 更新菜单数据
function updateMenuData() {
  // 这里应该从服务器获取最新的菜单数据
  // 现在只是更新本地存储的时间戳
  const now = new Date()
  wx.setStorageSync('menuLastUpdate', {
    year: now.getFullYear(),
    month: now.getMonth(),
    day: now.getDate()
  })
  
  return true
}

module.exports = {
  getAllDishes,
  getDishById,
  getDishesByCategory,
  getRecommendDishes,
  searchDishes,
  checkMenuUpdate,
  updateMenuData
}

const CATEGORY_GROUPS = {
  荤菜: [
    '红烧肉', '宫保鸡丁', '可乐鸡翅', '糖醋排骨', '黑椒牛柳',
    '香煎三文鱼', '蒜香鸡腿', '孜然羊肉', '回锅肉', '梅菜扣肉',
    '红烧排骨', '啤酒鸭', '香辣虾', '干煎带鱼', '照烧鸡排',
    '葱爆牛肉', '小炒黄牛肉', '豆豉蒸排骨', '红烧鸡爪', '酱牛肉'
  ],
  素菜: [
    '清炒西兰花', '蒜蓉生菜', '蚝油生菜', '麻婆豆腐', '地三鲜',
    '干煸豆角', '手撕包菜', '西红柿炒鸡蛋', '青椒土豆丝', '香菇油菜',
    '蒜蓉娃娃菜', '凉拌豆腐', '木耳山药', '清炒南瓜', '清炒莴笋',
    '西芹百合', '醋溜白菜', '豆豉蒸茄子', '椒盐杏鲍菇', '蒜香秋葵'
  ],
  搭配: [
    '番茄牛腩', '土豆烧牛肉', '青椒肉丝', '鱼香肉丝', '西兰花炒虾仁',
    '芹菜香干肉丝', '黄瓜炒鸡丁', '豆角炒肉末', '杏鲍菇牛肉粒', '胡萝卜炒鸡胸',
    '香菇滑鸡', '莴笋炒腊肉', '花菜炒五花肉', '洋葱炒肥牛', '荷兰豆炒腊肉',
    '冬瓜汆肉丸', '茄子烧肉末', '山药木耳炒肉片', '西葫芦炒鸡蛋', '玉米胡萝卜炒肉丁'
  ],
  汤品: [
    '番茄蛋花汤', '紫菜虾皮汤', '玉米排骨汤', '冬瓜丸子汤', '菌菇鸡汤',
    '鲫鱼豆腐汤', '罗宋汤', '海带排骨汤', '西湖牛肉羹', '丝瓜蛋汤',
    '萝卜牛腩汤', '山药鸡汤', '莲藕排骨汤', '菠菜豆腐汤', '芙蓉鲜蔬汤',
    '金针菇豆腐汤', '虾仁豆苗汤', '娃娃菜粉丝汤', '玉米鸡骨汤', '胡椒猪肚汤'
  ],
  甜品: [
    '红豆小圆子', '银耳雪梨羹', '杨枝甘露', '芒果西米露', '双皮奶',
    '红糖糍粑', '酒酿圆子', '黑芝麻糊', '南瓜小米糊', '紫薯酸奶杯',
    '椰香红豆糕', '桂花酒酿羹', '牛奶炖蛋', '桃胶银耳羹', '红豆薏米露',
    '草莓酸奶碗', '香蕉燕麦杯', '南瓜牛奶羹', '芋泥奶冻', '蜂蜜柚子冻'
  ]
}

const BASE_INGREDIENTS = {
  荤菜: [
    ['主料', '300克'],
    ['葱', '1根'],
    ['姜', '4片'],
    ['蒜', '3瓣'],
    ['生抽', '1勺'],
    ['料酒', '1勺'],
    ['食用油', '1勺'],
    ['盐', '适量']
  ],
  素菜: [
    ['主料', '300克'],
    ['蒜', '3瓣'],
    ['食用油', '1勺'],
    ['盐', '适量']
  ],
  搭配: [
    ['主料', '220克'],
    ['配菜', '180克'],
    ['葱', '1根'],
    ['蒜', '3瓣'],
    ['生抽', '1勺'],
    ['食用油', '1勺'],
    ['盐', '适量']
  ],
  汤品: [
    ['主料', '250克'],
    ['配菜', '150克'],
    ['姜', '4片'],
    ['盐', '适量'],
    ['清水', '800毫升']
  ],
  甜品: [
    ['主料', '200克'],
    ['牛奶或清水', '500毫升'],
    ['冰糖', '20克']
  ]
}

function inferDifficulty(title, category) {
  if (/炖|焖|烧牛肉|排骨汤|鸡汤|猪肚汤/.test(title)) return '中等'
  if (/三文鱼|羊肉|罗宋汤|双皮奶|杨枝甘露/.test(title)) return '中等'
  if (category === '甜品') return '简单'
  return '简单'
}

function inferCookingTime(title, category) {
  if (/炖|焖|酱牛肉|排骨汤|牛腩汤|鸡汤|猪肚汤/.test(title)) return '60分钟'
  if (/羹|糊|露/.test(title)) return '35分钟'
  if (category === '汤品') return '40分钟'
  if (category === '甜品') return '25分钟'
  return '20分钟'
}

function inferCalories(title, category) {
  if (category === '甜品') return 220
  if (category === '汤品') return 180
  if (category === '素菜') return 190
  if (/排骨|红烧肉|扣肉|羊肉|牛腩|肥牛/.test(title)) return 480
  if (/鸡|虾|鱼|牛柳|牛肉/.test(title)) return 340
  return 280
}

function inferServings(category) {
  if (category === '甜品' || category === '汤品') return 3
  return 2
}

function inferTags(title, category) {
  const tags = [category, '预设菜谱']
  if (/汤|羹|露|糊/.test(title)) tags.push('暖胃')
  if (/炒|拌|蒸/.test(title)) tags.push('快手')
  if (/甜|奶|露|冻/.test(title)) tags.push('治愈')
  return Array.from(new Set(tags)).slice(0, 4)
}

function inferDescription(title, category) {
  const toneMap = {
    荤菜: '这道菜更偏向满足感和锅气，很适合下班后做一份稳妥又下饭的主菜。',
    素菜: '整体口味清爽，步骤不复杂，适合在晚餐里平衡油腻感和负担感。',
    搭配: '荤素同锅会让层次更完整，也更适合在一顿饭里兼顾口感和营养搭配。',
    汤品: '汤底温润，适合天气偏凉或想吃得更舒服的时候安排进晚餐。',
    甜品: '甜度更克制，做法家常，适合当作晚餐后的轻松收尾。'
  }
  return `${title}是一道${category}菜，${toneMap[category]}`
}

function pushIngredient(list, seen, name, amount) {
  if (!name || seen.has(name)) return
  seen.add(name)
  list.push({ name, amount })
}

function inferIngredients(title, category) {
  const list = []
  const seen = new Set()

  if (/鸡丁|鸡腿|鸡排|鸡爪|滑鸡|鸡汤/.test(title)) pushIngredient(list, seen, '鸡肉', '300克')
  if (/牛腩|牛肉|牛柳|肥牛|牛肉羹/.test(title)) pushIngredient(list, seen, '牛肉', '300克')
  if (/排骨/.test(title)) pushIngredient(list, seen, '排骨', '400克')
  if (/虾/.test(title)) pushIngredient(list, seen, '虾仁', '220克')
  if (/三文鱼/.test(title)) pushIngredient(list, seen, '三文鱼', '250克')
  if (/羊肉/.test(title)) pushIngredient(list, seen, '羊肉', '260克')
  if (/豆腐/.test(title)) pushIngredient(list, seen, '豆腐', '350克')
  if (/西兰花/.test(title)) pushIngredient(list, seen, '西兰花', '250克')
  if (/土豆/.test(title)) pushIngredient(list, seen, '土豆', '250克')
  if (/番茄|西红柿/.test(title)) pushIngredient(list, seen, '番茄', '2个')
  if (/黄瓜/.test(title)) pushIngredient(list, seen, '黄瓜', '1根')
  if (/木耳/.test(title)) pushIngredient(list, seen, '木耳', '80克')
  if (/山药/.test(title)) pushIngredient(list, seen, '山药', '200克')
  if (/茄子/.test(title)) pushIngredient(list, seen, '茄子', '2根')
  if (/南瓜/.test(title)) pushIngredient(list, seen, '南瓜', '250克')
  if (/玉米/.test(title)) pushIngredient(list, seen, '玉米', '1根')
  if (/莲藕/.test(title)) pushIngredient(list, seen, '莲藕', '250克')
  if (/冬瓜/.test(title)) pushIngredient(list, seen, '冬瓜', '300克')
  if (/海带/.test(title)) pushIngredient(list, seen, '海带', '120克')
  if (/菠菜/.test(title)) pushIngredient(list, seen, '菠菜', '200克')
  if (/莴笋/.test(title)) pushIngredient(list, seen, '莴笋', '220克')
  if (/花菜/.test(title)) pushIngredient(list, seen, '花菜', '250克')
  if (/荷兰豆/.test(title)) pushIngredient(list, seen, '荷兰豆', '180克')
  if (/杏鲍菇|菌菇|香菇|金针菇/.test(title)) pushIngredient(list, seen, '菌菇', '180克')
  if (/百合/.test(title)) pushIngredient(list, seen, '百合', '120克')
  if (/丝瓜/.test(title)) pushIngredient(list, seen, '丝瓜', '1根')
  if (/萝卜/.test(title)) pushIngredient(list, seen, '白萝卜', '250克')
  if (/银耳/.test(title)) pushIngredient(list, seen, '银耳', '80克')
  if (/雪梨/.test(title)) pushIngredient(list, seen, '雪梨', '1个')
  if (/芒果/.test(title)) pushIngredient(list, seen, '芒果', '1个')
  if (/紫薯/.test(title)) pushIngredient(list, seen, '紫薯', '200克')
  if (/红豆/.test(title)) pushIngredient(list, seen, '红豆', '120克')
  if (/南瓜小米/.test(title)) pushIngredient(list, seen, '小米', '100克')
  if (/牛奶|双皮奶|炖蛋|奶冻/.test(title)) pushIngredient(list, seen, '牛奶', '300毫升')
  if (/草莓/.test(title)) pushIngredient(list, seen, '草莓', '150克')
  if (/香蕉/.test(title)) pushIngredient(list, seen, '香蕉', '1根')
  if (/柚子/.test(title)) pushIngredient(list, seen, '柚子', '150克')

  BASE_INGREDIENTS[category].forEach(([name, amount]) => {
    if (list.length >= 8) return
    pushIngredient(list, seen, name, amount)
  })

  return list.slice(0, 8)
}

function inferSteps(title, category) {
  const templates = {
    荤菜: ['处理主料并简单腌味。', '热锅下油把主料煎炒到表面定型。', '加入调味料翻匀后转中小火入味。', '根据状态补少量清水或酱汁焖到更香。', '起锅前调整咸淡后装盘。'],
    素菜: ['把食材洗净切成顺手入口的大小。', '热锅少油，先把蒜末或葱段煸香。', '下主料快速翻炒，尽量保留脆嫩感。', '加入基础调味并继续翻匀。', '确认口感后立刻出锅。'],
    搭配: ['荤素食材分别处理好，提前分开放置。', '先把肉类炒到变色后盛出备用。', '利用锅中余油处理蔬菜或配菜。', '把所有食材回锅一起调味。', '翻匀收汁后装盘。'],
    汤品: ['主料和配菜分别洗净切好。', '肉类或骨类先焯水去浮沫。', '把食材加入锅中并注入足量清水。', '中小火慢煮至汤底出味。', '最后调味后盛出。'],
    甜品: ['主料提前清洗或浸泡。', '把主要食材放入锅中慢慢煮开。', '加入甜味和辅料继续小火熬煮。', '观察浓稠度和软糯度。', '稍微放温后即可享用。']
  }

  return templates[category].map((description, index) => ({
    step: index + 1,
    description: `${title}：${description}`
  }))
}

function buildPresetRecipe(category, title, index) {
  return {
    title,
    description: inferDescription(title, category),
    image: '',
    category,
    difficulty: inferDifficulty(title, category),
    cookingTime: inferCookingTime(title, category),
    servings: inferServings(category),
    calories: inferCalories(title, category),
    ingredients: inferIngredients(title, category),
    steps: inferSteps(title, category),
    tips: '这道预设菜谱已经按家常做法整理过，第一次做时建议先按原步骤完成，再根据家里口味微调咸淡和火候。',
    tags: inferTags(title, category),
    author: '系统预设',
    sourceUrl: '',
    importSource: 'preset-batch-2026-04',
    isFeatured: index < 12,
    isActive: true
  }
}

const PRESET_RECIPES = Object.entries(CATEGORY_GROUPS)
  .flatMap(([category, titles]) => titles.map((title) => ({ category, title })))
  .map(({ category, title }, index) => buildPresetRecipe(category, title, index))

module.exports = PRESET_RECIPES

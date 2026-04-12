const LEGACY_DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1563379091339-03246963d0b0?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop'
]

const PHOTO_LIBRARY = {
  braisedMeat: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=900&q=80',
  tofuDish: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=900&q=80',
  homeDish: 'https://images.unsplash.com/photo-1563379091339-03246963d0b0?auto=format&fit=crop&w=900&q=80',
  soupDish: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=80',
  dessertDish: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80'
}

const CATEGORY_TONES = {
  荤菜: 'meat',
  素菜: 'veg',
  搭配: 'mixed',
  汤品: 'soup',
  甜品: 'dessert',
  家常菜: 'mixed',
  主食: 'staple',
  凉菜: 'cold',
  饮品: 'drink'
}

function isLegacyDefaultImage(image) {
  return LEGACY_DEFAULT_IMAGES.includes(String(image || '').trim())
}

function shouldUseGeneratedPhoto(recipe = {}) {
  const image = String(recipe.image || '').trim()

  if (!image || image === '/images/default-dish.png') {
    return true
  }

  return isLegacyDefaultImage(image)
}

function getPosterTone(category) {
  return CATEGORY_TONES[String(category || '').trim()] || 'mixed'
}

function pickPhotoUrl(title, category) {
  const value = String(title || '').trim()
  const categoryValue = String(category || '').trim()

  if (/红烧|糖醋|回锅|扣肉|排骨|里脊|酱牛肉/.test(value)) {
    return PHOTO_LIBRARY.braisedMeat
  }

  if (/麻婆豆腐|豆腐/.test(value)) {
    return PHOTO_LIBRARY.tofuDish
  }

  if (/番茄|西红柿|鸡蛋|地三鲜|豆角|包菜|西兰花|莴笋|南瓜|茄子|秋葵|百合|白菜/.test(value)) {
    return PHOTO_LIBRARY.homeDish
  }

  if (/汤|羹|露|糊/.test(value) || categoryValue === '汤品') {
    return PHOTO_LIBRARY.soupDish
  }

  if (/甜|奶|冻|圆子|红豆|雪梨|银耳|酸奶|西米/.test(value) || categoryValue === '甜品') {
    return PHOTO_LIBRARY.dessertDish
  }

  if (/鸡|鸭|牛|羊|虾|鱼/.test(value) || categoryValue === '荤菜' || categoryValue === '搭配') {
    return PHOTO_LIBRARY.homeDish
  }

  if (categoryValue === '素菜') {
    return PHOTO_LIBRARY.homeDish
  }

  return PHOTO_LIBRARY.homeDish
}

function getRecipePhotoUrl(title, category) {
  return pickPhotoUrl(title, category)
}

function shortenTitle(title) {
  const value = String(title || '').trim()
  if (!value) {
    return '今日好味'
  }

  return value.length > 10 ? `${value.slice(0, 10)}…` : value
}

function decorateRecipeImage(recipe = {}) {
  const title = String(recipe.title || recipe.name || '').trim()
  const category = String(recipe.category || '').trim() || '家常菜'
  const useGeneratedPhoto = shouldUseGeneratedPhoto(recipe)
  const displayImage = useGeneratedPhoto ? getRecipePhotoUrl(title, category) : String(recipe.image || '').trim()

  return {
    ...recipe,
    displayImage,
    usePoster: false,
    useGeneratedPhoto,
    posterTone: getPosterTone(category),
    posterTitle: shortenTitle(title),
    posterCategory: category
  }
}

module.exports = {
  decorateRecipeImage,
  shouldUseGeneratedPhoto,
  getRecipePhotoUrl,
  isLegacyDefaultImage
}

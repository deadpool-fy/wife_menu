const cloudApiService = require('../../utils/cloudApi.js')
const app = getApp()

const CALORIE_RULES = [
  { keywords: ['米饭', '熟米饭'], kcalPer100g: 116 },
  { keywords: ['面条', '挂面', '意面'], kcalPer100g: 280 },
  { keywords: ['面粉', '高筋面粉', '低筋面粉'], kcalPer100g: 366 },
  { keywords: ['馒头', '包子'], kcalPer100g: 230 },
  { keywords: ['鸡胸', '鸡胸肉'], kcalPer100g: 133 },
  { keywords: ['鸡腿', '鸡肉'], kcalPer100g: 167 },
  { keywords: ['鸡翅'], kcalPer100g: 194 },
  { keywords: ['牛腩', '牛肉'], kcalPer100g: 125 },
  { keywords: ['猪肉', '五花肉', '里脊'], kcalPer100g: 395 },
  { keywords: ['排骨'], kcalPer100g: 278 },
  { keywords: ['虾仁', '虾'], kcalPer100g: 93 },
  { keywords: ['鱼肉', '鱼片', '鲈鱼', '鳕鱼'], kcalPer100g: 110 },
  { keywords: ['豆腐'], kcalPer100g: 81 },
  { keywords: ['豆干', '香干'], kcalPer100g: 140 },
  { keywords: ['鸡蛋'], kcalPer100g: 144 },
  { keywords: ['土豆'], kcalPer100g: 77 },
  { keywords: ['红薯', '地瓜'], kcalPer100g: 86 },
  { keywords: ['番茄', '西红柿'], kcalPer100g: 18 },
  { keywords: ['洋葱'], kcalPer100g: 40 },
  { keywords: ['胡萝卜'], kcalPer100g: 41 },
  { keywords: ['黄瓜'], kcalPer100g: 16 },
  { keywords: ['西兰花'], kcalPer100g: 34 },
  { keywords: ['青椒', '彩椒'], kcalPer100g: 22 },
  { keywords: ['蘑菇', '香菇', '金针菇', '菌菇'], kcalPer100g: 28 },
  { keywords: ['白菜', '生菜', '菠菜', '油麦菜', '青菜'], kcalPer100g: 20 },
  { keywords: ['茄子'], kcalPer100g: 25 },
  { keywords: ['豆角', '四季豆'], kcalPer100g: 31 },
  { keywords: ['莲藕'], kcalPer100g: 74 },
  { keywords: ['山药'], kcalPer100g: 57 },
  { keywords: ['芹菜'], kcalPer100g: 16 },
  { keywords: ['卷心菜', '包菜'], kcalPer100g: 24 },
  { keywords: ['南瓜'], kcalPer100g: 26 },
  { keywords: ['玉米'], kcalPer100g: 106 },
  { keywords: ['香肠', '腊肠'], kcalPer100g: 508 },
  { keywords: ['培根'], kcalPer100g: 405 },
  { keywords: ['牛奶'], kcalPer100g: 54 },
  { keywords: ['黄油'], kcalPer100g: 717 },
  { keywords: ['芝士', '奶酪'], kcalPer100g: 328 },
  { keywords: ['食用油', '玉米油', '花生油', '橄榄油'], kcalPer100g: 884 },
  { keywords: ['白糖', '冰糖'], kcalPer100g: 387 },
  { keywords: ['淀粉'], kcalPer100g: 351 }
]

const UNIT_GRAMS = {
  g: 1,
  克: 1,
  kg: 1000,
  千克: 1000,
  公斤: 1000,
  斤: 500,
  两: 50,
  ml: 1,
  毫升: 1,
  升: 1000,
  个: 50,
  枚: 50,
  只: 80,
  颗: 8,
  块: 35,
  片: 18,
  根: 80,
  条: 100,
  朵: 18,
  包: 100,
  袋: 100,
  盒: 200,
  勺: 15,
  汤匙: 15,
  大勺: 15,
  小勺: 5,
  茶匙: 5,
  碗: 250,
  杯: 240
}

const UNIT_OPTIONS = ['克', '千克', '斤', '两', '毫升', '升', '个', '只', '颗', '块', '片', '根', '条', '朵', '包', '袋', '盒', '勺', '小勺', '碗', '杯']
const DEFAULT_UNIT_SUGGESTIONS = ['克', '斤', '个', '勺']

function getSuggestedUnits(name, currentUnit = '克') {
  const text = String(name || '').trim()
  let suggestions = DEFAULT_UNIT_SUGGESTIONS.slice()

  if (/牛奶|汤|水|酱|醋|料酒|生抽|老抽|蜂蜜|饮料|豆浆/.test(text)) {
    suggestions = ['毫升', '升', '勺', '杯']
  } else if (/鸡蛋|鹌鹑蛋/.test(text)) {
    suggestions = ['个', '颗', '克', '只']
  } else if (/豆腐|豆干|香干|年糕|培根|午餐肉/.test(text)) {
    suggestions = ['块', '片', '克', '盒']
  } else if (/葱|蒜苗|黄瓜|玉米|胡萝卜|山药/.test(text)) {
    suggestions = ['根', '条', '克', '斤']
  } else if (/香菇|蘑菇|西兰花|菜花/.test(text)) {
    suggestions = ['朵', '克', '斤', '包']
  } else if (/鸡翅|虾|鲍鱼/.test(text)) {
    suggestions = ['只', '个', '克', '斤']
  }

  if (currentUnit && !suggestions.includes(currentUnit)) {
    suggestions = [currentUnit].concat(suggestions).slice(0, 4)
  }

  return suggestions
}

function createEmptyIngredient() {
  return {
    name: '',
    quantity: '',
    unit: '克',
    unitIndex: 0,
    amount: '',
    unitSuggestions: getSuggestedUnits('', '克')
  }
}

function createEmptyStep() {
  return { description: '' }
}

function matchCalorieRule(name) {
  const normalized = String(name || '').trim()
  if (!normalized) return null
  return CALORIE_RULES.find((rule) => rule.keywords.some((keyword) => normalized.includes(keyword))) || null
}

function parseIngredientWeight(amountText) {
  const text = String(amountText || '').trim()
  if (!text || /适量|少许|若干|一点|随意/.test(text)) {
    return null
  }

  const numberMatch = text.match(/(\d+(?:\.\d+)?)/)
  if (!numberMatch) {
    return null
  }

  const value = Number(numberMatch[1])
  if (!Number.isFinite(value)) {
    return null
  }

  const unit = Object.keys(UNIT_GRAMS).find((key) => text.includes(key))
  if (!unit) {
    return null
  }

  return value * UNIT_GRAMS[unit]
}

function composeIngredientAmount(item) {
  const quantity = String(item.quantity || '').trim()
  const unit = String(item.unit || '').trim()
  if (!quantity) {
    return ''
  }
  return quantity + unit
}

function parseLegacyIngredient(item = {}) {
  const ingredient = createEmptyIngredient()
  ingredient.name = String(item.name || '').trim()

  const rawAmount = String(item.amount || '').trim()
  if (!rawAmount) {
    return ingredient
  }

  const unit = UNIT_OPTIONS.find((candidate) => rawAmount.includes(candidate))
  const numberMatch = rawAmount.match(/(\d+(?:\.\d+)?)/)

  if (unit && numberMatch) {
    ingredient.quantity = numberMatch[1]
    ingredient.unit = unit
    ingredient.unitIndex = UNIT_OPTIONS.indexOf(unit)
    ingredient.amount = ingredient.quantity + ingredient.unit
    ingredient.unitSuggestions = getSuggestedUnits(ingredient.name, ingredient.unit)
    return ingredient
  }

  ingredient.quantity = numberMatch ? numberMatch[1] : ''
  ingredient.amount = rawAmount
  ingredient.unitSuggestions = getSuggestedUnits(ingredient.name, ingredient.unit)
  return ingredient
}

function syncIngredientPresentation(item = {}) {
  const ingredient = {
    ...createEmptyIngredient(),
    ...item
  }
  ingredient.unitIndex = Math.max(UNIT_OPTIONS.indexOf(ingredient.unit), 0)
  ingredient.amount = composeIngredientAmount(ingredient)
  ingredient.unitSuggestions = getSuggestedUnits(ingredient.name, ingredient.unit)
  return ingredient
}

function estimateCalories(ingredients = []) {
  let total = 0
  let matchedCount = 0
  let weightedCount = 0
  const breakdown = []

  ingredients.forEach((item) => {
    const name = String(item.name || '').trim()
    if (!name) return

    const rule = matchCalorieRule(name)
    if (!rule) return
    matchedCount += 1

    const amountText = composeIngredientAmount(item) || String(item.amount || '').trim()
    const grams = parseIngredientWeight(amountText)
    if (!Number.isFinite(grams) || grams <= 0) {
      breakdown.push({
        name,
        amount: amountText,
        status: 'partial',
        label: '已识别食材，份量还不够明确'
      })
      return
    }

    weightedCount += 1
    const calories = Math.round(rule.kcalPer100g * grams / 100)
    total += calories
    breakdown.push({
      name,
      amount: amountText,
      status: 'estimated',
      calories,
      grams,
      label: Math.round(grams) + 'g · 约 ' + calories + ' kcal'
    })
  })

  return {
    totalCalories: weightedCount > 0 ? Math.round(total) : null,
    matchedCount,
    weightedCount,
    breakdown
  }
}

Page({
  data: {
    isEdit: false,
    recipeId: '',
    loadingRecipe: false,
    imageUploading: false,
    calorieHint: '填写食材名称和份量后，系统会自动估算热量。',
    calorieEstimateLabel: '-- kcal',
    calorieStatusText: '等待识别',
    calorieBreakdown: [],
    formData: {
      title: '',
      description: '',
      image: '',
      category: '',
      categoryIndex: -1,
      difficulty: '简单',
      difficultyIndex: 0,
      cookingTime: '30分钟',
      cookingTimeIndex: 1,
      servings: 2,
      servingsIndex: 1,
      calories: '',
      ingredients: [createEmptyIngredient()],
      steps: [createEmptyStep()],
      tips: '',
      tags: []
    },
    categories: [
      { name: '荤菜', value: '荤菜' },
      { name: '素菜', value: '素菜' },
      { name: '汤品', value: '汤品' },
      { name: '甜品', value: '甜品' },
      { name: '主食', value: '主食' },
      { name: '荤素搭配', value: '荤素搭配' }
    ],
    unitOptions: UNIT_OPTIONS,
    difficulties: ['简单', '中等', '困难'],
    cookingTimes: ['10分钟', '30分钟', '1小时', '1.5小时', '2小时'],
    servingsOptions: ['1人', '2人', '3人', '4人', '5人以上'],
    newTag: '',
    isSubmitting: false
  },

  async onLoad(options = {}) {
    const allowed = await this.ensureAdminAccess()
    if (!allowed) {
      return
    }
    const recipeId = String(options.id || '').trim()
    this.setData({
      isEdit: !!recipeId,
      recipeId
    })

    if (recipeId) {
      wx.setNavigationBarTitle({ title: '编辑菜谱' })
    }

    await this.loadCategories()

    if (recipeId) {
      await this.loadRecipeDetail(recipeId)
      return
    }

    this.updateCalorieEstimate(this.data.formData.ingredients)
  },

  async ensureAdminAccess() {
    const result = await app.ensureAdminStatus(true)
    if (result.isAdmin) {
      return true
    }

    wx.showModal({
      title: '?????',
      content: '???????????????????????',
      showCancel: false,
      success: () => {
        wx.switchTab({
          url: '/pages/index/index'
        })
      }
    })
    return false
  },

  async loadCategories() {
    try {
      const result = await cloudApiService.getCategories()
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        const categories = result.data.map((item) => ({
          name: item.name || item.value,
          value: item.value || item.name
        }))

        this.setData({ categories })
        this.syncCategoryIndex(this.data.formData.category, categories)
      }
    } catch (error) {
      console.error('加载分类失败:', error)
    }
  },

  async loadRecipeDetail(id) {
    this.setData({ loadingRecipe: true })

    try {
      const result = await cloudApiService.getRecipeById(id)
      if (!(result.success && result.data)) {
        throw new Error(result.message || '菜谱不存在')
      }

      const recipe = result.data
      const ingredients = Array.isArray(recipe.ingredients) && recipe.ingredients.length
        ? recipe.ingredients.map((item) => syncIngredientPresentation(parseLegacyIngredient(item)))
        : [createEmptyIngredient()]
      const steps = Array.isArray(recipe.steps) && recipe.steps.length
        ? recipe.steps.map((item) => ({ description: item.description || '' }))
        : [createEmptyStep()]

      this.setData({
        formData: {
          title: recipe.title || '',
          description: recipe.description || '',
          image: recipe.image || '',
          category: recipe.category || '',
          categoryIndex: this.findCategoryIndex(recipe.category),
          difficulty: recipe.difficulty || '简单',
          difficultyIndex: this.findIndex(this.data.difficulties, recipe.difficulty, 0),
          cookingTime: recipe.cookingTime || '30分钟',
          cookingTimeIndex: this.findIndex(this.data.cookingTimes, recipe.cookingTime, 1),
          servings: Number(recipe.servings) || 2,
          servingsIndex: this.findServingsIndex(recipe.servings),
          calories: recipe.calories !== undefined && recipe.calories !== null ? String(recipe.calories) : '',
          ingredients,
          steps,
          tips: recipe.tips || '',
          tags: Array.isArray(recipe.tags) ? recipe.tags : []
        }
      })

      this.updateCalorieEstimate(ingredients)
    } catch (error) {
      console.error('加载菜谱详情失败:', error)
      wx.showToast({
        title: error.message || '加载菜谱失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loadingRecipe: false })
    }
  },

  findIndex(list, value, fallback = 0) {
    const index = list.findIndex((item) => item === value)
    return index >= 0 ? index : fallback
  },

  findCategoryIndex(category, categories = this.data.categories) {
    if (!category) return -1
    return categories.findIndex((item) => item.value === category || item.name === category)
  },

  findServingsIndex(servings) {
    const normalized = Number(servings) || 2
    const index = this.data.servingsOptions.findIndex((item) => parseInt(item, 10) === normalized)
    return index >= 0 ? index : 1
  },

  syncCategoryIndex(category, categories = this.data.categories) {
    this.setData({
      'formData.categoryIndex': this.findCategoryIndex(category, categories)
    })
  },

  updateCalorieEstimate(ingredients) {
    const estimate = estimateCalories(ingredients)
    let calorieEstimateLabel = '-- kcal'
    let calorieHint = '填写食材名称和份量后，系统会自动估算热量。'
    let calorieStatusText = '等待识别'

    if (estimate.totalCalories !== null) {
      calorieEstimateLabel = estimate.totalCalories + ' kcal'
      calorieHint = '已根据 ' + estimate.weightedCount + ' 项可识别食材自动估算，结果会随食材和份量实时更新。'
      calorieStatusText = '已识别 ' + estimate.weightedCount + ' 项'
    } else if (estimate.matchedCount > 0) {
      calorieHint = '已识别部分食材，但份量还不够明确，补充克数或个数后就能更准确估算。'
      calorieStatusText = '等待补充份量'
    } else {
      calorieHint = '暂未识别出可估算热量的食材，试试补充更具体的食材名称和份量。'
    }

    this.setData({
      calorieEstimateLabel,
      calorieStatusText,
      calorieHint,
      calorieBreakdown: estimate.breakdown,
      'formData.calories': estimate.totalCalories !== null ? String(estimate.totalCalories) : ''
    })
  },

  onTitleInput(e) {
    this.setData({ 'formData.title': e.detail.value })
  },

  onDescriptionInput(e) {
    this.setData({ 'formData.description': e.detail.value })
  },

  async chooseImage() {
    if (this.data.imageUploading) {
      return
    }

    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFilePaths && res.tempFilePaths[0]
        if (!tempFilePath) {
          return
        }

        try {
          this.setData({ imageUploading: true })
          wx.showLoading({ title: '上传图片中...' })
          const fileID = await this.uploadRecipeImage(tempFilePath)
          this.setData({ 'formData.image': fileID })
          wx.hideLoading()
          wx.showToast({ title: '封面已上传', icon: 'success' })
        } catch (error) {
          wx.hideLoading()
          wx.showToast({ title: error.message || '上传图片失败', icon: 'none' })
        } finally {
          this.setData({ imageUploading: false })
        }
      },
      fail: () => {
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        })
      }
    })
  },

  async uploadRecipeImage(filePath) {
    const extensionMatch = String(filePath).match(/\.(jpg|jpeg|png|webp|gif)$/i)
    const extension = extensionMatch ? extensionMatch[1].toLowerCase() : 'jpg'
    const cloudPath = 'recipes/' + Date.now() + '-' + Math.random().toString(36).slice(2, 10) + '.' + extension

    const result = await wx.cloud.uploadFile({
      cloudPath,
      filePath
    })

    if (!result || !result.fileID) {
      throw new Error('图片上传失败，请稍后重试')
    }

    return result.fileID
  },

  removeImage() {
    this.setData({ 'formData.image': '' })
  },

  onCategoryChange(e) {
    const index = Number(e.detail.value)
    const category = this.data.categories[index] || {}
    this.setData({
      'formData.categoryIndex': index,
      'formData.category': category.value || category.name || ''
    })
  },

  onDifficultyChange(e) {
    const index = Number(e.detail.value)
    this.setData({
      'formData.difficultyIndex': index,
      'formData.difficulty': this.data.difficulties[index]
    })
  },

  onCookingTimeChange(e) {
    const index = Number(e.detail.value)
    this.setData({
      'formData.cookingTimeIndex': index,
      'formData.cookingTime': this.data.cookingTimes[index]
    })
  },

  onServingsChange(e) {
    const index = Number(e.detail.value)
    this.setData({
      'formData.servingsIndex': index,
      'formData.servings': parseInt(this.data.servingsOptions[index], 10) || 5
    })
  },

  onIngredientNameInput(e) {
    const index = e.currentTarget.dataset.index
    const ingredients = [...this.data.formData.ingredients]
    ingredients[index].name = e.detail.value
    ingredients[index] = syncIngredientPresentation(ingredients[index])
    this.setData({ 'formData.ingredients': ingredients })
    this.updateCalorieEstimate(ingredients)
  },

  onIngredientQuantityInput(e) {
    const index = e.currentTarget.dataset.index
    const ingredients = [...this.data.formData.ingredients]
    ingredients[index].quantity = String(e.detail.value || '').trim()
    ingredients[index] = syncIngredientPresentation(ingredients[index])
    this.setData({ 'formData.ingredients': ingredients })
    this.updateCalorieEstimate(ingredients)
  },

  onIngredientUnitQuickSelect(e) {
    const index = e.currentTarget.dataset.index
    const unit = e.currentTarget.dataset.unit
    const ingredients = [...this.data.formData.ingredients]
    if (!ingredients[index]) {
      return
    }
    ingredients[index].unit = unit || '克'
    ingredients[index] = syncIngredientPresentation(ingredients[index])
    this.setData({ 'formData.ingredients': ingredients })
    this.updateCalorieEstimate(ingredients)
  },

  onIngredientUnitChange(e) {
    const index = e.currentTarget.dataset.index
    const unitIndex = Number(e.detail.value)
    const ingredients = [...this.data.formData.ingredients]
    if (!ingredients[index]) {
      return
    }
    ingredients[index].unitIndex = unitIndex
    ingredients[index].unit = this.data.unitOptions[unitIndex] || '克'
    ingredients[index] = syncIngredientPresentation(ingredients[index])
    this.setData({ 'formData.ingredients': ingredients })
    this.updateCalorieEstimate(ingredients)
  },

  addIngredient() {
    const ingredients = [...this.data.formData.ingredients, createEmptyIngredient()]
    this.setData({ 'formData.ingredients': ingredients })
    this.updateCalorieEstimate(ingredients)
  },

  removeIngredient(e) {
    const index = e.currentTarget.dataset.index
    const ingredients = [...this.data.formData.ingredients]
    ingredients.splice(index, 1)
    const nextIngredients = ingredients.length ? ingredients : [createEmptyIngredient()]
    this.setData({ 'formData.ingredients': nextIngredients })
    this.updateCalorieEstimate(nextIngredients)
  },

  onStepInput(e) {
    const index = e.currentTarget.dataset.index
    const steps = [...this.data.formData.steps]
    steps[index].description = e.detail.value
    this.setData({ 'formData.steps': steps })
  },

  addStep() {
    this.setData({
      'formData.steps': [...this.data.formData.steps, createEmptyStep()]
    })
  },

  removeStep(e) {
    const index = e.currentTarget.dataset.index
    const steps = [...this.data.formData.steps]
    steps.splice(index, 1)
    this.setData({
      'formData.steps': steps.length ? steps : [createEmptyStep()]
    })
  },

  onTipsInput(e) {
    this.setData({ 'formData.tips': e.detail.value })
  },

  onTagInput(e) {
    this.setData({ newTag: e.detail.value })
  },

  addTag() {
    const newTag = this.data.newTag.trim()
    if (!newTag) {
      wx.showToast({ title: '请先输入标签', icon: 'none' })
      return
    }

    if (this.data.formData.tags.includes(newTag)) {
      wx.showToast({ title: '这个标签已经存在', icon: 'none' })
      return
    }

    this.setData({
      'formData.tags': [...this.data.formData.tags, newTag],
      newTag: ''
    })
  },

  removeTag(e) {
    const index = e.currentTarget.dataset.index
    const tags = [...this.data.formData.tags]
    tags.splice(index, 1)
    this.setData({ 'formData.tags': tags })
  },

  buildRecipePayload() {
    const calories = Number(this.data.formData.calories)
    return {
      id: this.data.recipeId,
      title: this.data.formData.title.trim(),
      description: this.data.formData.description.trim(),
      image: this.data.formData.image,
      category: this.data.formData.category,
      difficulty: this.data.formData.difficulty,
      cookingTime: this.data.formData.cookingTime,
      servings: this.data.formData.servings,
      calories: Number.isFinite(calories) && calories > 0 ? calories : 200,
      ingredients: this.data.formData.ingredients
        .filter((item) => String(item.name || '').trim())
        .map((item) => ({
          name: String(item.name || '').trim(),
          amount: composeIngredientAmount(item)
        })),
      steps: this.data.formData.steps
        .filter((item) => String(item.description || '').trim())
        .map((item, index) => ({
          step: index + 1,
          description: String(item.description || '').trim()
        })),
      tips: this.data.formData.tips.trim(),
      tags: this.data.formData.tags,
      author: '管理员'
    }
  },

  async submitRecipe() {
    if (!this.validateForm()) {
      return
    }

    this.setData({ isSubmitting: true })

    try {
      const recipeData = this.buildRecipePayload()
      const result = this.data.isEdit
        ? await cloudApiService.updateRecipe(recipeData)
        : await cloudApiService.addRecipe(recipeData)

      if (!result.success) {
        throw new Error(result.message || (this.data.isEdit ? '更新失败' : '提交失败'))
      }

      wx.showToast({
        title: this.data.isEdit ? '菜谱已更新' : '菜谱创建成功',
        icon: 'success'
      })

      setTimeout(() => {
        wx.navigateBack()
      }, 1200)
    } catch (error) {
      console.error(this.data.isEdit ? '更新菜谱失败:' : '提交菜谱失败:', error)
      wx.showToast({
        title: error.message || (this.data.isEdit ? '更新失败' : '提交失败'),
        icon: 'none'
      })
    } finally {
      this.setData({ isSubmitting: false })
    }
  },

  validateForm() {
    const { title, description, category, ingredients, steps } = this.data.formData

    if (!title.trim()) {
      wx.showToast({ title: '请输入菜谱名称', icon: 'none' })
      return false
    }

    if (!description.trim()) {
      wx.showToast({ title: '请输入菜谱简介', icon: 'none' })
      return false
    }

    if (!category) {
      wx.showToast({ title: '请选择菜谱分类', icon: 'none' })
      return false
    }

    if (!ingredients.some((item) => String(item.name || '').trim())) {
      wx.showToast({ title: '请至少填写一种食材', icon: 'none' })
      return false
    }

    if (!steps.some((item) => String(item.description || '').trim())) {
      wx.showToast({ title: '请至少填写一个步骤', icon: 'none' })
      return false
    }

    return true
  }
})

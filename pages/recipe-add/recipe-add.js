const cloudApiService = require('../../utils/cloudApi.js')

Page({
  data: {
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
      ingredients: [{ name: '', amount: '' }],
      steps: [{ description: '' }],
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
    difficulties: ['简单', '中等', '困难'],
    cookingTimes: ['10分钟', '30分钟', '1小时', '1.5小时', '2小时'],
    servingsOptions: ['1人', '2人', '3人', '4人', '5人以上'],
    newTag: '',
    isSubmitting: false
  },

  onLoad() {
    this.loadCategories()
  },

  async loadCategories() {
    try {
      const result = await cloudApiService.getCategories()
      if (result.success && result.data.length > 0) {
        this.setData({
          categories: result.data
        })
      }
    } catch (error) {
      console.error('加载分类失败:', error)
    }
  },

  onTitleInput(e) {
    this.setData({ 'formData.title': e.detail.value })
  },

  onDescriptionInput(e) {
    this.setData({ 'formData.description': e.detail.value })
  },

  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          'formData.image': res.tempFilePaths[0]
        })
      },
      fail: () => {
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        })
      }
    })
  },

  removeImage() {
    this.setData({
      'formData.image': ''
    })
  },

  onCategoryChange(e) {
    const index = Number(e.detail.value)
    this.setData({
      'formData.categoryIndex': index,
      'formData.category': this.data.categories[index].value
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

  onCaloriesInput(e) {
    this.setData({
      'formData.calories': e.detail.value
    })
  },

  onIngredientNameInput(e) {
    const index = e.currentTarget.dataset.index
    const ingredients = [...this.data.formData.ingredients]
    ingredients[index].name = e.detail.value
    this.setData({
      'formData.ingredients': ingredients
    })
  },

  onIngredientAmountInput(e) {
    const index = e.currentTarget.dataset.index
    const ingredients = [...this.data.formData.ingredients]
    ingredients[index].amount = e.detail.value
    this.setData({
      'formData.ingredients': ingredients
    })
  },

  addIngredient() {
    this.setData({
      'formData.ingredients': [...this.data.formData.ingredients, { name: '', amount: '' }]
    })
  },

  removeIngredient(e) {
    const index = e.currentTarget.dataset.index
    const ingredients = [...this.data.formData.ingredients]
    ingredients.splice(index, 1)
    this.setData({
      'formData.ingredients': ingredients.length ? ingredients : [{ name: '', amount: '' }]
    })
  },

  onStepInput(e) {
    const index = e.currentTarget.dataset.index
    const steps = [...this.data.formData.steps]
    steps[index].description = e.detail.value
    this.setData({
      'formData.steps': steps
    })
  },

  addStep() {
    this.setData({
      'formData.steps': [...this.data.formData.steps, { description: '' }]
    })
  },

  removeStep(e) {
    const index = e.currentTarget.dataset.index
    const steps = [...this.data.formData.steps]
    steps.splice(index, 1)
    this.setData({
      'formData.steps': steps.length ? steps : [{ description: '' }]
    })
  },

  onTipsInput(e) {
    this.setData({
      'formData.tips': e.detail.value
    })
  },

  onTagInput(e) {
    this.setData({
      newTag: e.detail.value
    })
  },

  addTag() {
    const newTag = this.data.newTag.trim()
    if (!newTag || this.data.formData.tags.includes(newTag)) {
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
    this.setData({
      'formData.tags': tags
    })
  },

  async submitRecipe() {
    if (!this.validateForm()) {
      return
    }

    this.setData({ isSubmitting: true })

    try {
      const recipeData = {
        title: this.data.formData.title.trim(),
        description: this.data.formData.description.trim(),
        image: this.data.formData.image,
        category: this.data.formData.category,
        difficulty: this.data.formData.difficulty,
        cookingTime: this.data.formData.cookingTime,
        servings: this.data.formData.servings,
        calories: this.data.formData.calories ? parseInt(this.data.formData.calories, 10) : 200,
        ingredients: this.data.formData.ingredients.filter((item) => item.name.trim()),
        steps: this.data.formData.steps.filter((item) => item.description.trim()),
        tips: this.data.formData.tips.trim(),
        tags: this.data.formData.tags,
        author: '管理员'
      }

      const result = await cloudApiService.addRecipe(recipeData)

      if (!result.success) {
        throw new Error(result.message || '提交失败')
      }

      wx.showToast({
        title: '菜谱创建成功',
        icon: 'success'
      })

      setTimeout(() => {
        wx.navigateBack()
      }, 1200)
    } catch (error) {
      console.error('提交菜谱失败:', error)
      wx.showToast({
        title: error.message || '提交失败',
        icon: 'none'
      })
    } finally {
      this.setData({ isSubmitting: false })
    }
  },

  validateForm() {
    const { title, description, category, ingredients, steps } = this.data.formData

    if (!title.trim()) {
      wx.showToast({
        title: '请输入菜谱名称',
        icon: 'none'
      })
      return false
    }

    if (!description.trim()) {
      wx.showToast({
        title: '请输入菜谱简介',
        icon: 'none'
      })
      return false
    }

    if (!category) {
      wx.showToast({
        title: '请选择菜谱分类',
        icon: 'none'
      })
      return false
    }

    if (!ingredients.some((item) => item.name.trim())) {
      wx.showToast({
        title: '请至少填写一种食材',
        icon: 'none'
      })
      return false
    }

    if (!steps.some((item) => item.description.trim())) {
      wx.showToast({
        title: '请至少填写一个步骤',
        icon: 'none'
      })
      return false
    }

    return true
  }
})

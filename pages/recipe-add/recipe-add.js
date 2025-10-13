// 菜谱录入页面
const cloudApiService = require('../../utils/cloudApi.js');

Page({
  data: {
    // 表单数据
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
      ingredients: [],
      steps: [],
      tips: '',
      tags: []
    },
    
    // 选项数据
    categories: [
      { name: '荤菜', value: '荤菜' },
      { name: '素菜', value: '素菜' },
      { name: '汤类', value: '汤类' },
      { name: '甜品', value: '甜品' },
      { name: '主食', value: '主食' },
      { name: '荤素搭配', value: '荤素搭配' }
    ],
    difficulties: ['简单', '中等', '困难'],
    cookingTimes: ['10分钟', '30分钟', '1小时', '1.5小时', '2小时'],
    servings: ['1人', '2人', '3人', '4人', '5人以上'],
    
    // 其他数据
    newTag: '',
    isSubmitting: false
  },

  onLoad() {
    console.log('菜谱录入页面加载');
    this.loadCategories();
  },

  // 加载分类数据
  async loadCategories() {
    try {
      const result = await cloudApiService.getCategories();
      if (result.success && result.data.length > 0) {
        this.setData({
          categories: result.data
        });
      }
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  },

  // 标题输入
  onTitleInput(e) {
    this.setData({
      'formData.title': e.detail.value
    });
  },

  // 描述输入
  onDescriptionInput(e) {
    this.setData({
      'formData.description': e.detail.value
    });
  },

  // 选择图片
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.setData({
          'formData.image': tempFilePath
        });
      },
      fail: (error) => {
        console.error('选择图片失败:', error);
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  // 移除图片
  removeImage() {
    this.setData({
      'formData.image': ''
    });
  },

  // 分类选择
  onCategoryChange(e) {
    const index = e.detail.value;
    this.setData({
      'formData.categoryIndex': index,
      'formData.category': this.data.categories[index].value
    });
  },

  // 难度选择
  onDifficultyChange(e) {
    const index = e.detail.value;
    this.setData({
      'formData.difficultyIndex': index,
      'formData.difficulty': this.data.difficulties[index]
    });
  },

  // 制作时间选择
  onCookingTimeChange(e) {
    const index = e.detail.value;
    this.setData({
      'formData.cookingTimeIndex': index,
      'formData.cookingTime': this.data.cookingTimes[index]
    });
  },

  // 适合人数选择
  onServingsChange(e) {
    const index = e.detail.value;
    this.setData({
      'formData.servingsIndex': index,
      'formData.servings': parseInt(this.data.servings[index])
    });
  },

  // 卡路里输入
  onCaloriesInput(e) {
    this.setData({
      'formData.calories': e.detail.value
    });
  },

  // 食材名称输入
  onIngredientNameInput(e) {
    const index = e.currentTarget.dataset.index;
    const ingredients = this.data.formData.ingredients;
    ingredients[index].name = e.detail.value;
    this.setData({
      'formData.ingredients': ingredients
    });
  },

  // 食材用量输入
  onIngredientAmountInput(e) {
    const index = e.currentTarget.dataset.index;
    const ingredients = this.data.formData.ingredients;
    ingredients[index].amount = e.detail.value;
    this.setData({
      'formData.ingredients': ingredients
    });
  },

  // 添加食材
  addIngredient() {
    const ingredients = this.data.formData.ingredients;
    ingredients.push({ name: '', amount: '' });
    this.setData({
      'formData.ingredients': ingredients
    });
  },

  // 移除食材
  removeIngredient(e) {
    const index = e.currentTarget.dataset.index;
    const ingredients = this.data.formData.ingredients;
    ingredients.splice(index, 1);
    this.setData({
      'formData.ingredients': ingredients
    });
  },

  // 步骤输入
  onStepInput(e) {
    const index = e.currentTarget.dataset.index;
    const steps = this.data.formData.steps;
    steps[index].description = e.detail.value;
    this.setData({
      'formData.steps': steps
    });
  },

  // 添加步骤
  addStep() {
    const steps = this.data.formData.steps;
    steps.push({ description: '' });
    this.setData({
      'formData.steps': steps
    });
  },

  // 移除步骤
  removeStep(e) {
    const index = e.currentTarget.dataset.index;
    const steps = this.data.formData.steps;
    steps.splice(index, 1);
    this.setData({
      'formData.steps': steps
    });
  },

  // 小贴士输入
  onTipsInput(e) {
    this.setData({
      'formData.tips': e.detail.value
    });
  },

  // 标签输入
  onTagInput(e) {
    this.setData({
      newTag: e.detail.value
    });
  },

  // 添加标签
  addTag() {
    const newTag = this.data.newTag.trim();
    if (newTag && !this.data.formData.tags.includes(newTag)) {
      const tags = this.data.formData.tags;
      tags.push(newTag);
      this.setData({
        'formData.tags': tags,
        newTag: ''
      });
    }
  },

  // 移除标签
  removeTag(e) {
    const index = e.currentTarget.dataset.index;
    const tags = this.data.formData.tags;
    tags.splice(index, 1);
    this.setData({
      'formData.tags': tags
    });
  },

  // 提交菜谱
  async submitRecipe() {
    // 验证必填字段
    if (!this.validateForm()) {
      return;
    }

    this.setData({ isSubmitting: true });

    try {
      // 准备提交数据
      const recipeData = {
        title: this.data.formData.title,
        description: this.data.formData.description,
        image: this.data.formData.image,
        category: this.data.formData.category,
        difficulty: this.data.formData.difficulty,
        cookingTime: this.data.formData.cookingTime,
        servings: this.data.formData.servings,
        calories: this.data.formData.calories ? parseInt(this.data.formData.calories) : 200,
        ingredients: this.data.formData.ingredients.filter(item => item.name.trim()),
        steps: this.data.formData.steps.filter(item => item.description.trim()),
        tips: this.data.formData.tips,
        tags: this.data.formData.tags,
        author: '管理员'
      };

      // 调用云函数添加菜谱
      const result = await cloudApiService.addRecipe(recipeData);

      if (result.success) {
        wx.showToast({
          title: '菜谱添加成功',
          icon: 'success'
        });

        // 延迟返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        throw new Error(result.message || '添加失败');
      }
    } catch (error) {
      console.error('提交菜谱失败:', error);
      wx.showToast({
        title: error.message || '提交失败',
        icon: 'none'
      });
    } finally {
      this.setData({ isSubmitting: false });
    }
  },

  // 验证表单
  validateForm() {
    const { title, description, category } = this.data.formData;

    if (!title.trim()) {
      wx.showToast({
        title: '请输入菜谱名称',
        icon: 'none'
      });
      return false;
    }

    if (!description.trim()) {
      wx.showToast({
        title: '请输入菜谱描述',
        icon: 'none'
      });
      return false;
    }

    if (!category) {
      wx.showToast({
        title: '请选择菜谱分类',
        icon: 'none'
      });
      return false;
    }

    return true;
  }
});


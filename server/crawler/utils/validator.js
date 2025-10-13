const Joi = require('joi');

// 菜谱数据验证规则
const recipeSchema = Joi.object({
  title: Joi.string().min(2).max(255).required().messages({
    'string.min': '菜谱标题至少需要2个字符',
    'string.max': '菜谱标题不能超过255个字符',
    'any.required': '菜谱标题是必填项'
  }),
  
  description: Joi.string().max(1000).optional().messages({
    'string.max': '菜谱描述不能超过1000个字符'
  }),
  
  image_url: Joi.string().uri().optional().messages({
    'string.uri': '图片URL格式不正确'
  }),
  
  category: Joi.string().valid('荤菜', '素菜', '荤素搭配', '汤类', '甜品', '主食', '凉菜', '饮品').required().messages({
    'any.only': '分类必须是预定义的值',
    'any.required': '分类是必填项'
  }),
  
  difficulty: Joi.string().valid('简单', '中等', '困难').required().messages({
    'any.only': '难度必须是简单、中等或困难',
    'any.required': '难度是必填项'
  }),
  
  cooking_time: Joi.string().max(50).required().messages({
    'string.max': '制作时间不能超过50个字符',
    'any.required': '制作时间是必填项'
  }),
  
  servings: Joi.number().integer().min(1).max(20).required().messages({
    'number.base': '适合人数必须是数字',
    'number.integer': '适合人数必须是整数',
    'number.min': '适合人数至少为1人',
    'number.max': '适合人数最多为20人',
    'any.required': '适合人数是必填项'
  }),
  
  calories: Joi.number().integer().min(0).max(2000).optional().messages({
    'number.base': '卡路里必须是数字',
    'number.integer': '卡路里必须是整数',
    'number.min': '卡路里不能为负数',
    'number.max': '卡路里不能超过2000'
  }),
  
  ingredients: Joi.array().items(
    Joi.object({
      name: Joi.string().min(1).max(100).required(),
      amount: Joi.string().min(1).max(50).required()
    })
  ).min(1).max(20).required().messages({
    'array.min': '至少需要1种食材',
    'array.max': '食材种类不能超过20种',
    'any.required': '食材清单是必填项'
  }),
  
  steps: Joi.array().items(
    Joi.object({
      step: Joi.number().integer().min(1).required(),
      description: Joi.string().min(5).max(500).required(),
      image: Joi.string().uri().optional()
    })
  ).min(1).max(20).required().messages({
    'array.min': '至少需要1个制作步骤',
    'array.max': '制作步骤不能超过20个',
    'any.required': '制作步骤是必填项'
  }),
  
  tips: Joi.string().max(500).optional().messages({
    'string.max': '小贴士不能超过500个字符'
  }),
  
  author: Joi.string().max(100).optional().messages({
    'string.max': '作者名称不能超过100个字符'
  }),
  
  source_url: Joi.string().uri().optional().messages({
    'string.uri': '来源链接格式不正确'
  }),
  
  tags: Joi.array().items(Joi.string().max(50)).max(10).optional().messages({
    'array.max': '标签数量不能超过10个'
  }),
  
  rating: Joi.number().min(0).max(5).optional().messages({
    'number.min': '评分不能低于0分',
    'number.max': '评分不能高于5分'
  }),
  
  view_count: Joi.number().integer().min(0).optional().messages({
    'number.base': '浏览次数必须是数字',
    'number.integer': '浏览次数必须是整数',
    'number.min': '浏览次数不能为负数'
  }),
  
  like_count: Joi.number().integer().min(0).optional().messages({
    'number.base': '点赞数必须是数字',
    'number.integer': '点赞数必须是整数',
    'number.min': '点赞数不能为负数'
  }),
  
  is_featured: Joi.boolean().optional(),
  is_active: Joi.boolean().optional()
});

// 分页参数验证规则
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).max(1000).default(1).messages({
    'number.base': '页码必须是数字',
    'number.integer': '页码必须是整数',
    'number.min': '页码不能小于1',
    'number.max': '页码不能大于1000'
  }),
  
  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    'number.base': '每页数量必须是数字',
    'number.integer': '每页数量必须是整数',
    'number.min': '每页数量不能小于1',
    'number.max': '每页数量不能大于100'
  }),
  
  category: Joi.string().valid('荤菜', '素菜', '荤素搭配', '汤类', '甜品', '主食', '凉菜', '饮品').optional().messages({
    'any.only': '分类必须是预定义的值'
  }),
  
  difficulty: Joi.string().valid('简单', '中等', '困难').optional().messages({
    'any.only': '难度必须是简单、中等或困难'
  }),
  
  search: Joi.string().max(100).optional().messages({
    'string.max': '搜索关键词不能超过100个字符'
  }),
  
  sortBy: Joi.string().valid('created_at', 'rating', 'like_count', 'view_count', 'title').default('created_at').messages({
    'any.only': '排序字段必须是预定义的值'
  }),
  
  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC').messages({
    'any.only': '排序顺序必须是ASC或DESC'
  })
});

// 评分验证规则
const ratingSchema = Joi.object({
  rating: Joi.number().min(0).max(5).required().messages({
    'number.base': '评分必须是数字',
    'number.min': '评分不能低于0分',
    'number.max': '评分不能高于5分',
    'any.required': '评分是必填项'
  })
});

// 爬虫参数验证规则
const crawlSchema = Joi.object({
  keywords: Joi.array().items(Joi.string().min(1).max(50)).min(1).max(10).required().messages({
    'array.min': '至少需要1个关键词',
    'array.max': '关键词数量不能超过10个',
    'any.required': '关键词是必填项'
  })
});

// 验证菜谱数据
function validateRecipe(recipe) {
  const { error, value } = recipeSchema.validate(recipe, { 
    abortEarly: false,
    stripUnknown: true 
  });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return {
      isValid: false,
      errors: errors
    };
  }
  
  return {
    isValid: true,
    data: value
  };
}

// 验证分页参数
function validatePagination(params) {
  const { error, value } = paginationSchema.validate(params, { 
    abortEarly: false,
    stripUnknown: true 
  });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return {
      isValid: false,
      errors: errors
    };
  }
  
  return {
    isValid: true,
    data: value
  };
}

// 验证评分数据
function validateRating(rating) {
  const { error, value } = ratingSchema.validate(rating, { 
    abortEarly: false,
    stripUnknown: true 
  });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return {
      isValid: false,
      errors: errors
    };
  }
  
  return {
    isValid: true,
    data: value
  };
}

// 验证爬虫参数
function validateCrawlParams(params) {
  const { error, value } = crawlSchema.validate(params, { 
    abortEarly: false,
    stripUnknown: true 
  });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return {
      isValid: false,
      errors: errors
    };
  }
  
  return {
    isValid: true,
    data: value
  };
}

// 数据清洗函数
function sanitizeRecipe(recipe) {
  return {
    title: recipe.title?.trim(),
    description: recipe.description?.trim(),
    image_url: recipe.image_url?.trim(),
    category: recipe.category?.trim(),
    difficulty: recipe.difficulty?.trim(),
    cooking_time: recipe.cooking_time?.trim(),
    servings: parseInt(recipe.servings) || 1,
    calories: parseInt(recipe.calories) || 0,
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.map(ingredient => ({
      name: ingredient.name?.trim(),
      amount: ingredient.amount?.trim()
    })) : [],
    steps: Array.isArray(recipe.steps) ? recipe.steps.map(step => ({
      step: parseInt(step.step) || 1,
      description: step.description?.trim(),
      image: step.image?.trim()
    })) : [],
    tips: recipe.tips?.trim(),
    author: recipe.author?.trim(),
    source_url: recipe.source_url?.trim(),
    tags: Array.isArray(recipe.tags) ? recipe.tags.map(tag => tag?.trim()).filter(Boolean) : [],
    rating: parseFloat(recipe.rating) || 0,
    view_count: parseInt(recipe.view_count) || 0,
    like_count: parseInt(recipe.like_count) || 0,
    is_featured: Boolean(recipe.is_featured),
    is_active: Boolean(recipe.is_active !== false)
  };
}

// 数据质量检查
function checkDataQuality(recipe) {
  const issues = [];
  
  // 检查标题质量
  if (!recipe.title || recipe.title.length < 2) {
    issues.push('标题过短或为空');
  }
  
  // 检查描述质量
  if (!recipe.description || recipe.description.length < 10) {
    issues.push('描述过短或为空');
  }
  
  // 检查图片质量
  if (!recipe.image_url || !recipe.image_url.startsWith('http')) {
    issues.push('图片链接无效');
  }
  
  // 检查食材质量
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
    issues.push('食材清单为空');
  }
  
  // 检查步骤质量
  if (!Array.isArray(recipe.steps) || recipe.steps.length === 0) {
    issues.push('制作步骤为空');
  }
  
  // 检查步骤描述质量
  if (Array.isArray(recipe.steps)) {
    const shortSteps = recipe.steps.filter(step => !step.description || step.description.length < 5);
    if (shortSteps.length > 0) {
      issues.push('部分制作步骤描述过短');
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues: issues,
    qualityScore: Math.max(0, 100 - issues.length * 20)
  };
}

module.exports = {
  validateRecipe,
  validatePagination,
  validateRating,
  validateCrawlParams,
  sanitizeRecipe,
  checkDataQuality,
  recipeSchema,
  paginationSchema,
  ratingSchema,
  crawlSchema
};

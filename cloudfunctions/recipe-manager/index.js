const cloud = require('wx-server-sdk')
const https = require('https')
const http = require('http')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event) => {
  const { action, data = {} } = event

  try {
    switch (action) {
      case 'addRecipe':
        return await addRecipe(data)
      case 'updateRecipe':
        return await updateRecipe(data)
      case 'deleteRecipe':
        return await deleteRecipe(data)
      case 'getRecipes':
        return await getRecipes(data)
      case 'getRecipeById':
        return await getRecipeById(data)
      case 'getCategories':
        return await getCategories()
      case 'getStats':
        return await getStats()
      case 'createImportDraft':
        return await createImportDraft(data)
      case 'autoImportByUrl':
        return await autoImportByUrl(data)
      case 'getImportDrafts':
        return await getImportDrafts(data)
      case 'approveImportDraft':
        return await approveImportDraft(data)
      case 'rejectImportDraft':
        return await rejectImportDraft(data)
      default:
        return {
          success: false,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('recipe-manager failed:', error)
    return {
      success: false,
      message: error.message || '服务异常',
      error: error.message || String(error)
    }
  }
}

async function addRecipe(data) {
  validateRecipePayload(data)

  const duplicate = await db.collection('recipes').where({
    title: String(data.title).trim()
  }).get()

  if (duplicate.data.length > 0) {
    throw new Error('菜谱标题已存在，请更换后再试')
  }

  const recipe = buildRecipeRecord(data)
  const result = await db.collection('recipes').add({ data: recipe })

  return {
    success: true,
    message: '菜谱添加成功',
    data: {
      id: result._id,
      recipe
    }
  }
}

async function updateRecipe(data) {
  if (!data.id) {
    throw new Error('菜谱 ID 不能为空')
  }

  await ensureRecipeExists(data.id)

  const updateData = {
    updatedAt: new Date()
  }

  const editableFields = [
    'title',
    'description',
    'image',
    'category',
    'difficulty',
    'cookingTime',
    'servings',
    'calories',
    'ingredients',
    'steps',
    'tips',
    'author',
    'tags',
    'rating',
    'viewCount',
    'likeCount',
    'isFeatured',
    'isActive',
    'sourceUrl',
    'importSource'
  ]

  editableFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      if (field === 'ingredients') {
        updateData.ingredients = normalizeIngredients(data.ingredients)
        return
      }
      if (field === 'steps') {
        updateData.steps = normalizeSteps(data.steps)
        return
      }
      if (field === 'tags') {
        updateData.tags = normalizeTags(data.tags)
        return
      }
      updateData[field] = data[field]
    }
  })

  await db.collection('recipes').doc(data.id).update({ data: updateData })

  return {
    success: true,
    message: '菜谱更新成功'
  }
}

async function deleteRecipe(data) {
  if (!data.id) {
    throw new Error('菜谱 ID 不能为空')
  }

  await ensureRecipeExists(data.id)
  await db.collection('recipes').doc(data.id).remove()

  return {
    success: true,
    message: '菜谱删除成功'
  }
}

async function getRecipes(data) {
  const {
    page = 1,
    limit = 20,
    category,
    difficulty,
    search,
    isActive = true
  } = data

  const where = {}
  if (category) where.category = category
  if (difficulty) where.difficulty = difficulty
  if (typeof isActive === 'boolean') where.isActive = isActive
  if (search) {
    where.title = db.RegExp({
      regexp: escapeRegExp(search),
      options: 'i'
    })
  }

  const collection = db.collection('recipes')
  const query = Object.keys(where).length ? collection.where(where) : collection
  const result = await query
    .orderBy('createdAt', 'desc')
    .skip((Math.max(1, Number(page)) - 1) * Number(limit))
    .limit(Number(limit))
    .get()
  const countResult = await (Object.keys(where).length ? collection.where(where) : collection).count()

  return {
    success: true,
    data: {
      recipes: result.data,
      total: countResult.total,
      page: Number(page),
      limit: Number(limit)
    }
  }
}

async function getRecipeById(data) {
  if (!data.id) {
    throw new Error('菜谱 ID 不能为空')
  }

  const result = await db.collection('recipes').doc(data.id).get()
  if (!result.data) {
    throw new Error('菜谱不存在')
  }

  return {
    success: true,
    data: result.data
  }
}

async function getCategories() {
  const result = await db.collection('categories').orderBy('sortOrder', 'asc').get()
  return {
    success: true,
    data: result.data
  }
}

async function getStats() {
  const [recipesResult, categoriesResult, recentRecipesResult, pendingImports] = await Promise.all([
    safeCountCollection('recipes'),
    safeCountCollection('categories'),
    db.collection('recipes').orderBy('createdAt', 'desc').limit(5).get().catch(() => ({ data: [] })),
    db.collection('recipe_imports').where({ status: 'pending' }).count().catch(() => ({ total: 0 }))
  ])

  return {
    success: true,
    data: {
      totalRecipes: recipesResult.total,
      totalCategories: categoriesResult.total,
      recentRecipes: recentRecipesResult.data || [],
      featuredRecipes: (recentRecipesResult.data || []).length,
      pendingImports: pendingImports.total || 0
    }
  }
}

async function createImportDraft(data) {
  const sourcePlatform = (data.sourcePlatform || 'manual').trim() || 'manual'
  const sourceUrl = normalizeUrl(data.sourceUrl || '')
  const rawText = String(data.rawText || '').trim()
  const overrideTitle = String(data.title || '').trim()

  if (!sourceUrl && !overrideTitle && !rawText) {
    throw new Error('请至少填写链接、标题或原始内容')
  }

  const parsed = parseImportedRecipe(rawText)
  const title = overrideTitle || parsed.title || inferTitleFromUrl(sourceUrl)

  if (!title) {
    throw new Error('暂时无法识别标题，请补充标题后再试')
  }

  const draft = buildImportDraftRecord({
    sourcePlatform,
    sourceUrl,
    rawText,
    parsedRecipe: {
      ...parsed,
      title
    }
  })

  const result = await db.collection('recipe_imports').add({ data: draft })

  return {
    success: true,
    message: '导入草稿已创建，等待审核',
    data: {
      id: result._id,
      draft
    }
  }
}

async function autoImportByUrl(data) {
  const sourceUrl = normalizeUrl(data.sourceUrl || '')
  const sourcePlatform = (data.sourcePlatform || '').trim() || detectPlatformFromUrl(sourceUrl)

  if (!sourceUrl) {
    throw new Error('请先填写第三方链接')
  }

  const fetchedRecipe = await fetchThirdPartyRecipe(sourceUrl, sourcePlatform)
  const rawText = [fetchedRecipe.title, fetchedRecipe.description, fetchedRecipe.bodyText].filter(Boolean).join('\n')
  const parsedRecipe = mergeImportedRecipe(parseImportedRecipe(rawText), fetchedRecipe)
  const title = parsedRecipe.title || inferTitleFromUrl(sourceUrl)

  if (!title) {
    throw new Error('暂时无法从该链接识别标题，请稍后重试或手动补充')
  }

  const draft = buildImportDraftRecord({
    sourcePlatform,
    sourceUrl,
    rawText,
    parsedRecipe: {
      ...parsedRecipe,
      title
    }
  })

  const result = await db.collection('recipe_imports').add({ data: draft })

  return {
    success: true,
    message: '链接已自动解析并加入待审核队列',
    data: {
      id: result._id,
      draft
    }
  }
}

async function getImportDrafts(data) {
  const {
    page = 1,
    limit = 20,
    status = 'pending'
  } = data

  const where = {}
  if (status && status !== 'all') {
    where.status = status
  }

  const collection = db.collection('recipe_imports')
  const query = Object.keys(where).length ? collection.where(where) : collection
  const result = await query
    .orderBy('createdAt', 'desc')
    .skip((Math.max(1, Number(page)) - 1) * Number(limit))
    .limit(Number(limit))
    .get()
  const countResult = await (Object.keys(where).length ? collection.where(where) : collection).count()

  return {
    success: true,
    data: {
      drafts: result.data.map((draft) => ({
        ...draft,
        createdAt: formatDraftDate(draft.createdAt),
        sourcePlatform: sourcePlatformLabel(draft.sourcePlatform)
      })),
      total: countResult.total,
      page: Number(page),
      limit: Number(limit)
    }
  }
}

async function approveImportDraft(data) {
  const { id, reviewNote = '' } = data
  if (!id) {
    throw new Error('草稿 ID 不能为空')
  }

  const draftResult = await db.collection('recipe_imports').doc(id).get()
  const draft = draftResult.data
  if (!draft) {
    throw new Error('导入草稿不存在')
  }
  if (draft.status !== 'pending') {
    throw new Error('该草稿已处理，不能重复审核')
  }

  const recipePayload = {
    ...draft.parsedRecipe,
    author: draft.parsedRecipe.author || sourcePlatformLabel(draft.sourcePlatform),
    sourceUrl: draft.sourceUrl || draft.parsedRecipe.sourceUrl || '',
    importSource: {
      platform: draft.sourcePlatform,
      url: draft.sourceUrl || '',
      importDraftId: id
    }
  }

  validateRecipePayload(recipePayload)

  const recipe = buildRecipeRecord(recipePayload)
  const addResult = await db.collection('recipes').add({ data: recipe })

  await db.collection('recipe_imports').doc(id).update({
    data: {
      status: 'approved',
      reviewNote,
      recipeId: addResult._id,
      reviewedAt: new Date(),
      updatedAt: new Date()
    }
  })

  return {
    success: true,
    message: '草稿已通过审核并入库',
    data: {
      recipeId: addResult._id
    }
  }
}

async function rejectImportDraft(data) {
  const { id, reviewNote = '' } = data
  if (!id) {
    throw new Error('草稿 ID 不能为空')
  }

  await db.collection('recipe_imports').doc(id).update({
    data: {
      status: 'rejected',
      reviewNote,
      reviewedAt: new Date(),
      updatedAt: new Date()
    }
  })

  return {
    success: true,
    message: '草稿已驳回'
  }
}

function validateRecipePayload(data) {
  if (!String(data.title || '').trim()) {
    throw new Error('标题为必填项')
  }
  if (!String(data.description || '').trim()) {
    throw new Error('描述为必填项')
  }
  if (!String(data.category || '').trim()) {
    throw new Error('分类为必填项')
  }
  if (!Array.isArray(data.ingredients) || data.ingredients.length === 0) {
    throw new Error('至少需要一项食材')
  }
  if (!Array.isArray(data.steps) || data.steps.length === 0) {
    throw new Error('至少需要一个步骤')
  }
}

function buildRecipeRecord(data) {
  return {
    title: String(data.title).trim(),
    description: String(data.description).trim(),
    image: data.image || getDefaultImage(),
    category: data.category || '家常菜',
    difficulty: data.difficulty || '简单',
    cookingTime: data.cookingTime || '30分钟',
    servings: Number(data.servings) || 2,
    calories: Number(data.calories) || 200,
    ingredients: normalizeIngredients(data.ingredients),
    steps: normalizeSteps(data.steps),
    tips: String(data.tips || '').trim(),
    author: String(data.author || '导入助手').trim(),
    tags: normalizeTags(data.tags),
    rating: Number(data.rating) || 0,
    viewCount: Number(data.viewCount) || 0,
    likeCount: Number(data.likeCount) || 0,
    isFeatured: typeof data.isFeatured === 'boolean' ? data.isFeatured : false,
    isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
    sourceUrl: data.sourceUrl || '',
    importSource: data.importSource || null,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

function buildImportDraftRecord({ sourcePlatform, sourceUrl, rawText, parsedRecipe }) {
  return {
    status: 'pending',
    sourcePlatform,
    sourceUrl,
    originalText: rawText,
    parsedRecipe: {
      title: parsedRecipe.title,
      description: parsedRecipe.description || '待审核导入草稿，请补充更完整的简介。',
      image: parsedRecipe.image || parsedRecipe.imageUrl || '',
      category: parsedRecipe.category || '家常菜',
      difficulty: parsedRecipe.difficulty || '简单',
      cookingTime: parsedRecipe.cookingTime || '30分钟',
      servings: parsedRecipe.servings || 2,
      calories: parsedRecipe.calories || 200,
      ingredients: normalizeIngredients(parsedRecipe.ingredients),
      steps: normalizeSteps(parsedRecipe.steps),
      tips: parsedRecipe.tips || '',
      tags: normalizeTags(parsedRecipe.tags),
      author: parsedRecipe.author || sourcePlatformLabel(sourcePlatform),
      sourceUrl
    },
    reviewNote: '',
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

function normalizeIngredients(ingredients = []) {
  return (ingredients || [])
    .filter((item) => item && String(item.name || '').trim())
    .map((item) => ({
      name: String(item.name).trim(),
      amount: String(item.amount || '适量').trim()
    }))
}

function normalizeSteps(steps = []) {
  return (steps || [])
    .filter((item) => item && String(item.description || '').trim())
    .map((item, index) => ({
      step: index + 1,
      description: String(item.description).trim(),
      image: item.image || ''
    }))
}

function normalizeTags(tags = []) {
  return [...new Set((tags || []).map((item) => String(item).trim()).filter(Boolean))]
}

async function ensureRecipeExists(id) {
  const result = await db.collection('recipes').doc(id).get()
  if (!result.data) {
    throw new Error('菜谱不存在')
  }
  return result.data
}

async function safeCountCollection(name) {
  try {
    return await db.collection(name).count()
  } catch (error) {
    return { total: 0 }
  }
}

function parseImportedRecipe(rawText) {
  const text = String(rawText || '').replace(/\r/g, '').trim()
  if (!text) {
    return emptyParsedRecipe()
  }

  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)
  const parsed = emptyParsedRecipe()
  let currentSection = ''

  lines.forEach((line, index) => {
    if (!parsed.title && index === 0 && line.length <= 40 && !/^https?:\/\//i.test(line)) {
      parsed.title = cleanText(line)
      return
    }

    const section = detectSection(line)
    if (section) {
      currentSection = section.name
      if (section.value) {
        appendSectionValue(parsed, currentSection, section.value)
      }
      return
    }

    if (currentSection) {
      appendSectionValue(parsed, currentSection, line)
      return
    }

    if (!parsed.description && line.length > 10 && !/^https?:\/\//i.test(line)) {
      parsed.description = cleanText(line)
    }
  })

  if (!parsed.ingredients.length) {
    parsed.ingredients = extractLooseIngredients(lines)
  }
  if (!parsed.steps.length) {
    parsed.steps = extractLooseSteps(lines)
  }
  parsed.tags = normalizeTags(parsed.tags)

  return parsed
}

function emptyParsedRecipe() {
  return {
    title: '',
    description: '',
    image: '',
    category: '',
    difficulty: '',
    cookingTime: '',
    servings: 0,
    calories: 0,
    ingredients: [],
    steps: [],
    tips: '',
    tags: [],
    author: ''
  }
}

function detectSection(line) {
  const match = line.match(/^([^:：]{1,12})[:：]\s*(.*)$/)
  if (!match) return null

  const key = match[1].trim()
  const value = match[2].trim()
  const map = {
    ingredients: ['食材', '配料', '用料'],
    steps: ['步骤', '做法', '制作步骤'],
    tips: ['小贴士', '技巧', '备注'],
    tags: ['标签', '关键词'],
    description: ['简介', '描述'],
    title: ['标题', '菜名'],
    category: ['分类'],
    difficulty: ['难度'],
    cookingTime: ['时间', '烹饪时间', '制作时间'],
    servings: ['人数', '份量', '适合人数'],
    calories: ['热量', '卡路里'],
    author: ['作者', '来源'],
    image: ['图片', '封面']
  }

  for (const [name, aliases] of Object.entries(map)) {
    if (aliases.some((alias) => key.includes(alias))) {
      return { name, value }
    }
  }

  return null
}

function appendSectionValue(parsed, section, value) {
  if (!value) return
  switch (section) {
    case 'title':
      parsed.title = cleanText(value)
      break
    case 'category':
      parsed.category = cleanText(value)
      break
    case 'difficulty':
      parsed.difficulty = cleanText(value)
      break
    case 'cookingTime':
      parsed.cookingTime = cleanText(value)
      break
    case 'servings':
      parsed.servings = extractNumber(value) || parsed.servings
      break
    case 'calories':
      parsed.calories = extractNumber(value) || parsed.calories
      break
    case 'author':
      parsed.author = cleanText(value)
      break
    case 'image':
      parsed.image = cleanText(value)
      break
    case 'description':
      parsed.description = parsed.description ? `${parsed.description}\n${cleanText(value)}` : cleanText(value)
      break
    case 'ingredients':
      pushIngredient(parsed.ingredients, value)
      break
    case 'steps':
      pushStep(parsed.steps, value)
      break
    case 'tips':
      parsed.tips = parsed.tips ? `${parsed.tips}\n${cleanText(value)}` : cleanText(value)
      break
    case 'tags':
      parsed.tags = [...parsed.tags, ...splitTags(value)]
      break
    default:
      break
  }
}

function pushIngredient(list, line) {
  const cleaned = String(line || '').replace(/^[\-\*\d\.\s]+/, '').trim()
  if (!cleaned) return
  const match = cleaned.match(/^(.+?)[\s:：]+(.+)$/)
  if (match) {
    list.push({ name: match[1].trim(), amount: match[2].trim() })
    return
  }
  list.push({ name: cleaned, amount: '适量' })
}

function pushStep(list, line) {
  const cleaned = String(line || '').replace(/^(第\s*\d+\s*步|\d+[\.、:\-]?)/, '').trim()
  if (!cleaned) return
  list.push({
    step: list.length + 1,
    description: cleanText(cleaned)
  })
}

function extractLooseIngredients(lines) {
  return lines
    .filter((line) => /克|勺|个|片|根|ml|适量|少许|公斤|千克|茶匙|汤匙/.test(line))
    .slice(0, 12)
    .map((line) => {
      const match = line.match(/^(.+?)[\s:：]+(.+)$/)
      return match
        ? { name: match[1].trim(), amount: match[2].trim() }
        : { name: cleanText(line), amount: '适量' }
    })
}

function extractLooseSteps(lines) {
  return lines
    .filter((line) => /^(第\s*\d+\s*步|\d+[\.、])/.test(line))
    .map((line, index) => ({
      step: index + 1,
      description: cleanText(line.replace(/^(第\s*\d+\s*步|\d+[\.、:\-]?)/, '').trim())
    }))
}

async function fetchThirdPartyRecipe(sourceUrl, sourcePlatform) {
  const externalResult = await tryFetchFromExternalCrawler(sourceUrl, sourcePlatform)
  if (externalResult) {
    return externalResult
  }

  const html = await fetchPageHtml(sourceUrl)
  const metadata = extractRecipeMetadataFromHtml(html, sourceUrl)

  if (!metadata.title && !metadata.description && !metadata.bodyText) {
    throw new Error('当前链接暂时无法自动解析，建议稍后换链接重试')
  }

  return {
    ...metadata,
    sourceUrl,
    author: metadata.author || sourcePlatformLabel(sourcePlatform),
    category: metadata.category || inferCategoryFromText(metadata.title, metadata.description, metadata.bodyText),
    difficulty: metadata.difficulty || inferDifficultyFromText(metadata.title, metadata.description, metadata.bodyText),
    cookingTime: metadata.cookingTime || inferCookingTimeFromText(metadata.title, metadata.description, metadata.bodyText),
    servings: metadata.servings || inferServingsFromText(metadata.title, metadata.description, metadata.bodyText),
    calories: metadata.calories || 0,
    ingredients: metadata.ingredients || [],
    steps: metadata.steps || [],
    tips: metadata.tips || '',
    tags: metadata.tags || []
  }
}

async function tryFetchFromExternalCrawler(sourceUrl, sourcePlatform) {
  const baseUrl = process.env.IMPORT_CRAWLER_BASE_URL
  if (!baseUrl) {
    return null
  }

  try {
    const crawlerUrl = `${baseUrl.replace(/\/$/, '')}/extract?url=${encodeURIComponent(sourceUrl)}&platform=${encodeURIComponent(sourcePlatform)}`
    const responseText = await requestUrl(crawlerUrl)
    const response = JSON.parse(responseText)
    if (!response || !response.success || !response.data) {
      return null
    }
    return response.data
  } catch (error) {
    console.warn('external crawler unavailable:', error.message)
    return null
  }
}

async function fetchPageHtml(sourceUrl) {
  const html = await requestUrl(sourceUrl, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
    }
  })

  return String(html || '')
}

function requestUrl(targetUrl, options = {}, redirectCount = 0) {
  const client = targetUrl.startsWith('https') ? https : http

  return new Promise((resolve, reject) => {
    const req = client.request(targetUrl, {
      method: 'GET',
      timeout: 12000,
      ...options
    }, (res) => {
      const statusCode = res.statusCode || 0
      const location = res.headers.location

      if ([301, 302, 303, 307, 308].includes(statusCode) && location && redirectCount < 5) {
        const nextUrl = new URL(location, targetUrl).toString()
        res.resume()
        resolve(requestUrl(nextUrl, options, redirectCount + 1))
        return
      }

      if (statusCode >= 400) {
        res.resume()
        reject(new Error(`request failed with status ${statusCode}`))
        return
      }

      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => {
        const buffer = Buffer.concat(chunks)
        resolve(buffer.toString('utf8'))
      })
    })

    req.on('error', reject)
    req.on('timeout', () => req.destroy(new Error('request timeout')))
    req.end()
  })
}

function extractRecipeMetadataFromHtml(html, sourceUrl) {
  const normalizedHtml = String(html || '')
  const title = firstNonEmpty([
    extractMetaContent(normalizedHtml, 'property', 'og:title'),
    extractMetaContent(normalizedHtml, 'name', 'twitter:title'),
    extractJsonLdField(normalizedHtml, 'name'),
    extractTitleTag(normalizedHtml)
  ])
  const description = firstNonEmpty([
    extractMetaContent(normalizedHtml, 'property', 'og:description'),
    extractMetaContent(normalizedHtml, 'name', 'description'),
    extractMetaContent(normalizedHtml, 'name', 'twitter:description'),
    extractJsonLdField(normalizedHtml, 'description')
  ])
  const image = firstNonEmpty([
    extractMetaContent(normalizedHtml, 'property', 'og:image'),
    extractMetaContent(normalizedHtml, 'name', 'twitter:image'),
    extractJsonLdField(normalizedHtml, 'image')
  ])
  const author = firstNonEmpty([
    extractMetaContent(normalizedHtml, 'name', 'author'),
    extractJsonLdField(normalizedHtml, 'author')
  ])
  const bodyText = extractBodyText(normalizedHtml)
  const ingredients = extractRecipeListFromJsonLd(normalizedHtml, 'recipeIngredient').map((item) => ({
    name: cleanText(item),
    amount: '适量'
  }))
  const steps = extractRecipeListFromJsonLd(normalizedHtml, 'recipeInstructions').map((item, index) => ({
    step: index + 1,
    description: cleanText(typeof item === 'string' ? item : item.text || item.name || '')
  })).filter((item) => item.description)
  const tags = normalizeTags([
    ...splitTags(extractMetaContent(normalizedHtml, 'name', 'keywords')),
    ...extractHashtags(`${title} ${description} ${bodyText}`)
  ])

  return {
    title: cleanText(title),
    description: cleanText(description),
    image: normalizeAssetUrl(image, sourceUrl),
    bodyText: cleanBodyText(bodyText),
    author: cleanText(author),
    ingredients,
    steps,
    tags
  }
}

function extractMetaContent(html, attrName, attrValue) {
  const pattern = new RegExp(`<meta[^>]*${attrName}=["']${escapeRegExp(attrValue)}["'][^>]*content=["']([^"']+)["'][^>]*>|<meta[^>]*content=["']([^"']+)["'][^>]*${attrName}=["']${escapeRegExp(attrValue)}["'][^>]*>`, 'i')
  const match = html.match(pattern)
  return decodeHtmlEntities(match ? (match[1] || match[2] || '') : '')
}

function extractTitleTag(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return decodeHtmlEntities(match ? match[1] : '')
}

function extractJsonLdField(html, field) {
  const blocks = extractJsonLdBlocks(html)
  for (const block of blocks) {
    const value = findJsonLdField(block, field)
    if (Array.isArray(value)) {
      const first = value.find(Boolean)
      if (first) return typeof first === 'string' ? first : JSON.stringify(first)
    }
    if (value && typeof value === 'object') {
      return value.name || value.text || ''
    }
    if (value) {
      return String(value)
    }
  }
  return ''
}

function extractRecipeListFromJsonLd(html, field) {
  const blocks = extractJsonLdBlocks(html)
  for (const block of blocks) {
    const value = findJsonLdField(block, field)
    if (Array.isArray(value) && value.length) {
      return value
    }
  }
  return []
}

function extractJsonLdBlocks(html) {
  const matches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  return matches.map((match) => {
    try {
      return JSON.parse(decodeHtmlEntities(match[1].trim()))
    } catch (error) {
      return null
    }
  }).filter(Boolean)
}

function findJsonLdField(input, field) {
  if (!input) return null
  if (Array.isArray(input)) {
    for (const item of input) {
      const found = findJsonLdField(item, field)
      if (found) return found
    }
    return null
  }
  if (typeof input !== 'object') return null
  if (Object.prototype.hasOwnProperty.call(input, field)) return input[field]
  if (input['@graph']) {
    const found = findJsonLdField(input['@graph'], field)
    if (found) return found
  }
  for (const value of Object.values(input)) {
    const found = findJsonLdField(value, field)
    if (found) return found
  }
  return null
}

function extractBodyText(html) {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  )
}

function cleanBodyText(text) {
  const body = decodeHtmlEntities(String(text || ''))
    .replace(/\r/g, '')
    .replace(/[\t ]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim()

  return body
    .split('\n')
    .map((line) => cleanText(line))
    .filter((line) => line && line.length <= 140)
    .slice(0, 24)
    .join('\n')
}

function cleanText(text) {
  return decodeHtmlEntities(String(text || ''))
    .replace(/\s+/g, ' ')
    .replace(/[\u0000-\u001F]/g, '')
    .trim()
}

function decodeHtmlEntities(text) {
  return String(text || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function normalizeAssetUrl(url, sourceUrl) {
  const value = String(url || '').trim()
  if (!value) return ''
  try {
    return new URL(value, sourceUrl).toString()
  } catch (error) {
    return value
  }
}

function extractHashtags(text) {
  return String(text || '').match(/#[^#\s]{1,20}/g) || []
}

function inferCategoryFromText(...texts) {
  const merged = texts.join(' ')
  if (/汤|炖|羹/.test(merged)) return '汤类'
  if (/甜品|蛋糕|布丁|面包|饼/.test(merged)) return '甜品'
  if (/沙拉|素|蔬菜/.test(merged)) return '素菜'
  if (/鸡|鸭|鱼|虾|牛|猪|排骨/.test(merged)) return '荤菜'
  return '家常菜'
}

function inferDifficultyFromText(...texts) {
  const merged = texts.join(' ')
  if (/快手|新手|简单|零失败/.test(merged)) return '简单'
  if (/宴客|复杂|进阶/.test(merged)) return '困难'
  return '中等'
}

function inferCookingTimeFromText(...texts) {
  const merged = texts.join(' ')
  const minuteMatch = merged.match(/(\d{1,3})\s*分钟/)
  if (minuteMatch) return `${minuteMatch[1]}分钟`
  if (/快手|十分钟|15分钟/.test(merged)) return '15分钟'
  if (/炖|焖|烤/.test(merged)) return '45分钟'
  return '30分钟'
}

function inferServingsFromText(...texts) {
  const merged = texts.join(' ')
  const match = merged.match(/(\d)人份|适合(\d)人|供(\d)人/)
  const value = match && match.slice(1).find(Boolean)
  return value ? Number(value) : 2
}

function detectPlatformFromUrl(url) {
  if (/xiaohongshu\.com|xhslink\.com/i.test(url)) return 'xiaohongshu'
  if (/douyin\.com|iesdouyin\.com/i.test(url)) return 'douyin'
  if (/kuaishou\.com/i.test(url)) return 'kuaishou'
  return 'manual'
}

function normalizeUrl(value) {
  const input = String(value || '').trim()
  if (!input) return ''
  if (/^https?:\/\//i.test(input)) return input
  return `https://${input}`
}

function mergeImportedRecipe(parsedRecipe, fetchedRecipe) {
  return {
    ...parsedRecipe,
    title: fetchedRecipe.title || parsedRecipe.title,
    description: fetchedRecipe.description || parsedRecipe.description,
    image: fetchedRecipe.image || fetchedRecipe.imageUrl || parsedRecipe.image,
    category: fetchedRecipe.category || parsedRecipe.category,
    difficulty: fetchedRecipe.difficulty || parsedRecipe.difficulty,
    cookingTime: fetchedRecipe.cookingTime || parsedRecipe.cookingTime,
    servings: fetchedRecipe.servings || parsedRecipe.servings,
    calories: fetchedRecipe.calories || parsedRecipe.calories,
    ingredients: fetchedRecipe.ingredients && fetchedRecipe.ingredients.length ? fetchedRecipe.ingredients : parsedRecipe.ingredients,
    steps: fetchedRecipe.steps && fetchedRecipe.steps.length ? fetchedRecipe.steps : parsedRecipe.steps,
    tips: fetchedRecipe.tips || parsedRecipe.tips,
    tags: normalizeTags([...(parsedRecipe.tags || []), ...(fetchedRecipe.tags || [])]),
    author: fetchedRecipe.author || parsedRecipe.author
  }
}

function splitTags(value) {
  return String(value || '')
    .split(/[，,、\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function extractNumber(value) {
  const match = String(value || '').match(/\d+/)
  return match ? Number(match[0]) : 0
}

function inferTitleFromUrl(url) {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    const pathname = parsed.pathname.replace(/^\/+|\/+$/g, '')
    if (!pathname) return '第三方导入菜谱'
    return pathname.length > 36 ? '第三方导入菜谱' : pathname
  } catch (error) {
    return '第三方导入菜谱'
  }
}

function sourcePlatformLabel(platform) {
  const labels = {
    xiaohongshu: '小红书导入',
    douyin: '抖音导入',
    kuaishou: '快手导入',
    manual: '手动导入'
  }
  return labels[platform] || '导入助手'
}

function formatDraftDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${month}-${day} ${hours}:${minutes}`
}

function firstNonEmpty(values) {
  return values.find((value) => String(value || '').trim()) || ''
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getDefaultImage() {
  const defaultImages = [
    'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1563379091339-03246963d0b0?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop'
  ]

  return defaultImages[Math.floor(Math.random() * defaultImages.length)]
}

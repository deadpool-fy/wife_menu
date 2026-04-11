const cloudApiService = require('../../utils/cloudApi.js')
const secureConfig = require('../../config/secureConfig.js')

function cleanImportedTitle(title) {
  const normalized = String(title || '').replace(/\s+/g, ' ').trim()
  const compact = normalized.replace(/[\uFF5C\u4E28]/g, '|')
  const parts = compact.split(/\s*[-|]\s*/)
  const suffix = parts.length > 1 ? String(parts[parts.length - 1] || '').toLowerCase() : ''
  const platformKeywords = ['\u5c0f\u7ea2\u4e66', '\u6296\u97f3', '\u5feb\u624b', '\u5fae\u535a', '\u77e5\u4e4e', '\u54d4\u54e9\u54d4\u54e9', 'bilibili', '\u817e\u8baf\u89c6\u9891', '\u4f18\u9177', '\u5b98\u7f51', '\u7f51\u9875']

  if (suffix && platformKeywords.some((keyword) => suffix.includes(String(keyword).toLowerCase()))) {
    return parts.slice(0, -1).join(' - ').trim()
  }

  return normalized
}

function buildDraftViewModel(draft) {
  const parsedRecipe = draft.parsedRecipe || {}
  const sourceImages = Array.isArray(draft.sourceImages) ? draft.sourceImages : []
  const ingredients = Array.isArray(parsedRecipe.ingredients) ? parsedRecipe.ingredients : []
  const steps = Array.isArray(parsedRecipe.steps) ? parsedRecipe.steps : []
  const cookingTime = String(parsedRecipe.cookingTime || '').trim()
  const diagnostics = draft.ocrDiagnostics || null

  return {
    ...draft,
    parsedRecipe: {
      ...parsedRecipe,
      title: cleanImportedTitle(parsedRecipe.title) || '\u672a\u8bc6\u522b\u6807\u9898'
    },
    categoryLabel: parsedRecipe.category ? '\u5206\u7c7b ' + parsedRecipe.category : '\u5206\u7c7b\u5f85\u8bc6\u522b',
    difficultyLabel: parsedRecipe.difficulty ? '\u96be\u5ea6 ' + parsedRecipe.difficulty : '\u96be\u5ea6\u5f85\u8bc6\u522b',
    cookingTimeLabel: cookingTime ? '\u65f6\u957f ' + cookingTime : '\u65f6\u957f\u5f85\u8bc6\u522b',
    imageCountLabel: sourceImages.length ? '\u56fe\u7247 ' + sourceImages.length + ' \u5f20' : '\u672a\u6293\u5230\u56fe\u7247',
    ingredientCountLabel: ingredients.length ? '\u98df\u6750 ' + ingredients.length + ' \u9879' : '\u672a\u8bc6\u522b\u98df\u6750',
    stepCountLabel: steps.length ? '\u6b65\u9aa4 ' + steps.length + ' \u6b65' : '\u672a\u8bc6\u522b\u6b65\u9aa4',
    ocrPreview: draft.ocrText ? '\u56fe\u4e2d\u6587\u5b57\uff1a' + draft.ocrText : '',
    ocrDiagnosticsLabel: getOcrDiagnosticsLabel(diagnostics)
  }
}

async function callContainerOcr(images = []) {
  const config = {}
  if (secureConfig.cloudEnvId && secureConfig.cloudEnvId !== 'cloud1-your-env-id') {
    config.env = secureConfig.cloudEnvId
  }

  const response = await wx.cloud.callContainer({
    config,
    path: '/api/ocr/images',
    method: 'POST',
    header: {
      'X-WX-SERVICE': 'wife-menu-ocr',
      'Content-Type': 'application/json'
    },
    data: {
      images
    }
  })

  return response.data || response.result || response
}

function getOcrDiagnosticsLabel(diagnostics) {
  if (!diagnostics || !diagnostics.status) {
    return ''
  }

  if (diagnostics.status === 'ocr_service_not_configured') {
    return '\u672a\u914d\u7f6e OCR \u670d\u52a1\uff0c\u56fe\u7247\u6587\u5b57\u5c1a\u672a\u8bc6\u522b'
  }

  if (diagnostics.status === 'ocr_deferred') {
    return 'OCR \u5df2\u6539\u4e3a\u5ef6\u540e\u5904\u7406\uff0c\u8fd9\u6b21\u5148\u5b8c\u6210\u5feb\u901f\u5bfc\u5165'
  }

  if (diagnostics.status === 'ocr_service_unavailable') {
    return '\u65e0\u6cd5\u8fde\u63a5 OCR \u670d\u52a1\uff0c\u8bf7\u68c0\u67e5\u670d\u52a1\u5730\u5740\u6216\u542f\u52a8\u72b6\u6001'
  }

  if (diagnostics.status === 'ocr_service_returned_error') {
    return 'OCR \u670d\u52a1\u8fd4\u56de\u5f02\u5e38\uff0c\u9700\u8981\u68c0\u67e5\u670d\u52a1\u7aef\u65e5\u5fd7'
  }

  if (diagnostics.status === 'no_images') {
    return '\u672a\u6293\u5230\u53ef\u4f9b OCR \u7684\u56fe\u7247'
  }

  if (diagnostics.status === 'ok') {
    const recognizedCount = Number(diagnostics.recognizedCount || 0)
    const emptyCount = Number(diagnostics.emptyCount || 0)
    const failedCount = Number(diagnostics.failedCount || 0)
    return 'OCR \u8bca\u65ad\uff1a\u6210\u529f ' + recognizedCount + ' \u5f20\uff0c\u65e0\u6587\u5b57 ' + emptyCount + ' \u5f20\uff0c\u5931\u8d25 ' + failedCount + ' \u5f20'
  }

  return ''
}
Page({
  data: {
    sourcePlatforms: [
      { label: '自动识别', value: 'auto' },
      { label: '小红书', value: 'xiaohongshu' },
      { label: '抖音', value: 'douyin' },
      { label: '快手', value: 'kuaishou' },
      { label: '手动整理', value: 'manual' }
    ],
    sourcePlatformIndex: 0,
    sourceUrl: '',
    sourceTitle: '',
    rawText: '',
    drafts: [],
    loadingDrafts: false,
    submitting: false,
    autoImporting: false
  },

  onLoad() {
    this.loadDrafts()
  },

  onShow() {
    this.loadDrafts()
  },

  onPlatformChange(e) {
    this.setData({
      sourcePlatformIndex: Number(e.detail.value)
    })
  },

  onUrlInput(e) {
    this.setData({
      sourceUrl: e.detail.value
    })
  },

  onTitleInput(e) {
    this.setData({
      sourceTitle: e.detail.value
    })
  },

  onRawTextInput(e) {
    this.setData({
      rawText: e.detail.value
    })
  },

  getCurrentPlatformValue() {
    const currentPlatform = this.data.sourcePlatforms[this.data.sourcePlatformIndex]
    return currentPlatform.value === 'auto' ? '' : currentPlatform.value
  },

  async autoImport() {
    if (!this.data.sourceUrl.trim()) {
      wx.showToast({
        title: '请先粘贴第三方链接',
        icon: 'none'
      })
      return
    }

    this.setData({ autoImporting: true })

    try {
      const result = await cloudApiService.autoImportByUrl({
        sourcePlatform: this.getCurrentPlatformValue(),
        sourceUrl: this.data.sourceUrl.trim()
      })

      if (!result.success) {
        throw new Error(result.message || '自动解析失败')
      }

      wx.showToast({
        title: '已自动生成草稿',
        icon: 'success'
      })

      this.setData({
        sourceUrl: '',
        sourceTitle: '',
        rawText: ''
      })

      await this.loadDrafts()
    } catch (error) {
      wx.showToast({
        title: error.message || '自动解析失败',
        icon: 'none'
      })
    } finally {
      this.setData({ autoImporting: false })
    }
  },

  async submitImport() {
    if (!this.data.sourceUrl.trim() && !this.data.sourceTitle.trim() && !this.data.rawText.trim()) {
      wx.showToast({
        title: '请至少填写链接、标题或原始内容',
        icon: 'none'
      })
      return
    }

    this.setData({ submitting: true })

    try {
      const result = await cloudApiService.createImportDraft({
        sourcePlatform: this.getCurrentPlatformValue() || 'manual',
        sourceUrl: this.data.sourceUrl.trim(),
        title: this.data.sourceTitle.trim(),
        rawText: this.data.rawText.trim()
      })

      if (!result.success) {
        throw new Error(result.message || '导入失败')
      }

      wx.showToast({
        title: '已进入待审核',
        icon: 'success'
      })

      this.setData({
        sourceUrl: '',
        sourceTitle: '',
        rawText: ''
      })

      await this.loadDrafts()
    } catch (error) {
      wx.showToast({
        title: error.message || '导入失败',
        icon: 'none'
      })
    } finally {
      this.setData({ submitting: false })
    }
  },

  async loadDrafts() {
    this.setData({ loadingDrafts: true })

    try {
      const result = await cloudApiService.getImportDrafts({
        status: 'pending',
        limit: 20
      })

      if (!result.success) {
        throw new Error(result.message || '获取草稿失败')
      }

      this.setData({
        drafts: (result.data.drafts || []).map(buildDraftViewModel)
      })
    } catch (error) {
      wx.showToast({
        title: error.message || '草稿加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loadingDrafts: false })
    }
  },

  async approveDraft(e) {
    const { id } = e.currentTarget.dataset

    try {
      wx.showLoading({ title: '入库中...' })
      const result = await cloudApiService.approveImportDraft({
        id,
        reviewNote: '后台审核通过'
      })
      wx.hideLoading()

      if (!result.success) {
        throw new Error(result.message || '审核失败')
      }

      wx.showToast({
        title: '已入库',
        icon: 'success'
      })

      await this.loadDrafts()
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: error.message || '审核失败',
        icon: 'none'
      })
    }
  },

  async runDraftOcr(e) {
    const { id } = e.currentTarget.dataset

    try {
      const draft = (this.data.drafts || []).find((item) => item._id === id)
      const sourceImages = draft && Array.isArray(draft.sourceImages) ? draft.sourceImages.filter(Boolean) : []

      if (!sourceImages.length) {
        throw new Error('当前草稿没有可识别的图片')
      }

      wx.showLoading({ title: '识别中...' })

      let result = null
      let containerError = null

      try {
        const ocrResponse = typeof cloudApiService.runOcrInContainer === 'function'
          ? await cloudApiService.runOcrInContainer(sourceImages)
          : await callContainerOcr(sourceImages)

        if (!ocrResponse || !ocrResponse.success) {
          throw new Error((ocrResponse && ocrResponse.message) || 'OCR 服务暂时不可用')
        }

        result = await cloudApiService.runImportDraftOcr({
          id,
          ocrText: ocrResponse.text || (ocrResponse.data && ocrResponse.data.text) || '',
          ocrDiagnostics: {
            status: 'ok',
            requestedCount: sourceImages.length,
            recognizedCount: Number((ocrResponse.diagnostics && ocrResponse.diagnostics.recognizedCount) || 0),
            emptyCount: Number((ocrResponse.diagnostics && ocrResponse.diagnostics.emptyCount) || 0),
            failedCount: Number((ocrResponse.diagnostics && ocrResponse.diagnostics.failedCount) || 0),
            results: Array.isArray(ocrResponse.data && ocrResponse.data.results) ? ocrResponse.data.results : []
          }
        })
      } catch (error) {
        containerError = error
      }

      if (!result || !result.success) {
        result = await cloudApiService.runImportDraftOcr({ id })
      }

      wx.hideLoading()

      if (!result.success) {
        throw new Error(result.message || (containerError && containerError.message) || 'OCR 处理失败')
      }

      wx.showToast({
        title: result.message || 'OCR 已完成',
        icon: 'none'
      })

      await this.loadDrafts()
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: error.message || 'OCR 处理失败',
        icon: 'none'
      })
    }
  },

  rejectDraft(e) {
    const { id } = e.currentTarget.dataset

    wx.showModal({
      title: '驳回导入草稿',
      content: '确认驳回这条草稿吗？驳回后不会进入正式菜谱库。',
      confirmColor: '#bf5638',
      success: async (res) => {
        if (!res.confirm) {
          return
        }

        try {
          const result = await cloudApiService.rejectImportDraft({
            id,
            reviewNote: '后台审核驳回'
          })

          if (!result.success) {
            throw new Error(result.message || '驳回失败')
          }

          wx.showToast({
            title: '已驳回',
            icon: 'success'
          })

          await this.loadDrafts()
        } catch (error) {
          wx.showToast({
            title: error.message || '驳回失败',
            icon: 'none'
          })
        }
      }
    })
  },

  copyDraftText(e) {
    const { text } = e.currentTarget.dataset
    wx.setClipboardData({
      data: text || '',
      success: () => {
        wx.showToast({
          title: '内容已复制',
          icon: 'success'
        })
      }
    })
  }
})

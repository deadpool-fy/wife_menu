const axios = require('axios')
const { logger } = require('../utils/logger')

class OcrService {
  constructor() {
    this.maxImages = Number(process.env.OCR_MAX_IMAGES || 9)
    this.maxImageBytes = Number(process.env.OCR_MAX_IMAGE_BYTES || 5 * 1024 * 1024)
    this.language = process.env.OCR_LANGUAGE || 'chi_sim+eng'
  }

  async recognizeImages(imageUrls = []) {
    const urls = [...new Set((imageUrls || []).filter(Boolean))].slice(0, this.maxImages)
    if (!urls.length) {
      return {
        text: '',
        results: []
      }
    }

    const worker = await this.createWorker()
    const results = []

    try {
      for (const url of urls) {
        try {
          const imageBuffer = await this.downloadImage(url)
          const recognized = await worker.recognize(imageBuffer)
          const text = String(recognized?.data?.text || '').trim()

          results.push({
            url,
            text
          })
        } catch (error) {
          logger.warn(`OCR failed for image: ${url}`, error.message)
          results.push({
            url,
            text: '',
            error: error.message
          })
        }
      }
    } finally {
      await worker.terminate()
    }

    return {
      text: results.map((item) => item.text).filter(Boolean).join('\n'),
      results
    }
  }

  async createWorker() {
    let Tesseract
    try {
      Tesseract = require('tesseract.js')
    } catch (error) {
      throw new Error('OCR 依赖未安装，请先在 server/crawler 下安装 tesseract.js')
    }

    return Tesseract.createWorker(this.language)
  }

  async downloadImage(url) {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: Number(process.env.OCR_DOWNLOAD_TIMEOUT || 15000),
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      },
      maxContentLength: this.maxImageBytes,
      maxBodyLength: this.maxImageBytes
    })

    return Buffer.from(response.data)
  }
}

module.exports = OcrService

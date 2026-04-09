const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const axios = require('axios')
require('dotenv').config()

const app = express()
const port = Number(process.env.PORT || 3001)
const maxImages = Number(process.env.OCR_MAX_IMAGES || 9)
const maxImageBytes = Number(process.env.OCR_MAX_IMAGE_BYTES || 5 * 1024 * 1024)
const ocrLanguage = process.env.OCR_LANGUAGE || 'chi_sim+eng'
const downloadTimeout = Number(process.env.OCR_DOWNLOAD_TIMEOUT || 15000)

app.use(helmet())
app.use(cors({ origin: '*' }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(morgan('combined'))

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'wife-menu OCR service',
    status: 'running',
    timestamp: new Date().toISOString()
  })
})

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'OCR service is healthy',
    timestamp: new Date().toISOString()
  })
})

app.post('/api/ocr/images', async (req, res) => {
  try {
    const { images = [] } = req.body || {}
    if (!Array.isArray(images) || !images.length) {
      return res.status(400).json({
        success: false,
        message: 'images must be a non-empty array'
      })
    }

    const result = await recognizeImages(images)
    return res.json({
      success: true,
      text: result.text,
      diagnostics: {
        requestedCount: images.length,
        recognizedCount: result.results.filter((item) => item.status === 'recognized').length,
        emptyCount: result.results.filter((item) => item.status === 'empty_text').length,
        failedCount: result.results.filter((item) => item.status === 'download_or_ocr_failed').length
      },
      data: result
    })
  } catch (error) {
    console.error('OCR request failed:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'OCR request failed'
    })
  }
})

async function recognizeImages(imageUrls = []) {
  const urls = [...new Set((imageUrls || []).filter(Boolean))].slice(0, maxImages)
  if (!urls.length) {
    return {
      text: '',
      results: []
    }
  }

  const Tesseract = require('tesseract.js')
  const worker = await Tesseract.createWorker(ocrLanguage)
  const results = []

  try {
    for (const url of urls) {
      try {
        const imageBuffer = await downloadImage(url)
        const recognized = await worker.recognize(imageBuffer)
        const text = String(recognized?.data?.text || '').trim()

        results.push({
          url,
          text,
          status: text ? 'recognized' : 'empty_text'
        })
      } catch (error) {
        results.push({
          url,
          text: '',
          status: 'download_or_ocr_failed',
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

async function downloadImage(url) {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: downloadTimeout,
    headers: buildImageHeaders(url),
    maxContentLength: maxImageBytes,
    maxBodyLength: maxImageBytes
  })

  return Buffer.from(response.data)
}

function buildImageHeaders(url) {
  const headers = {
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
  }

  if (/xiaohongshu\.com|xhscdn\.com|xhsimg\.com|xhslink\.com/i.test(url)) {
    headers.referer = 'https://www.xiaohongshu.com/'
    headers.origin = 'https://www.xiaohongshu.com'
  } else if (/douyin\.com|iesdouyin\.com|byteimg\.com/i.test(url)) {
    headers.referer = 'https://www.douyin.com/'
    headers.origin = 'https://www.douyin.com'
  } else if (/kuaishou\.com/i.test(url)) {
    headers.referer = 'https://www.kuaishou.com/'
    headers.origin = 'https://www.kuaishou.com'
  }

  return headers
}

app.listen(port, () => {
  console.log(`OCR service listening on port ${port}`)
})

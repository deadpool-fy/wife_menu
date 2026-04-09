# CloudBase OCR Deployment

## 1. Deploy the OCR service to CloudBase Hosting

- Service directory: `server/ocr-service`
- Default port: `3001`
- Runtime: `Node.js 18`

Recommended settings:

- CPU: `1 Core`
- Memory: `1 GB`
- Min instances: `0`
- Max instances: `1-2`

## 2. Container start command

The service already exposes `npm start`, so the default CloudBase startup command is enough.

## 3. Required environment variables

- `OCR_LANGUAGE=chi_sim+eng`
- `OCR_MAX_IMAGES=9`
- `OCR_MAX_IMAGE_BYTES=5242880`
- `OCR_DOWNLOAD_TIMEOUT=15000`

## 4. Verify after deployment

- `GET /`
- `GET /api/health`
- `POST /api/ocr/images`

Example request body:

```json
{
  "images": ["https://example.com/demo.jpg"]
}
```

## 5. Configure the mini program backend

Set the `recipe-manager` cloud function environment variable:

- `IMPORT_OCR_BASE_URL=https://your-cloudbase-service-domain/api`

Then redeploy the `recipe-manager` cloud function.

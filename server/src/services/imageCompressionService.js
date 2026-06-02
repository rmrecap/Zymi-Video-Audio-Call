import path from 'path';
import fs from 'fs';

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
const JPEG_QUALITY = 80;
const PNG_QUALITY = 80;
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

let sharp = null;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.warn('[IMG_COMPRESS] sharp not installed — image compression disabled. Install with: npm install sharp');
}

const isAvailable = () => sharp !== null;

export const validateAndCompress = async (filePath, mimeType) => {
  if (!isAvailable()) return { error: 'sharp not available', skipped: true };
  if (!ALLOWED_TYPES.includes(mimeType)) {
    throw new Error(`Unsupported image type: ${mimeType}`);
  }

  const stats = fs.statSync(filePath);
  if (stats.size > MAX_SIZE_BYTES) {
    throw new Error(`File exceeds maximum size of ${MAX_SIZE_BYTES / 1024 / 1024}MB`);
  }

  const outputPath = filePath.replace(/(\.[^.]+)$/, '_compressed$1');

  let pipeline = sharp(filePath).rotate();

  const metadata = await sharp(filePath).metadata();

  if (metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT) {
    pipeline = pipeline.resize({
      width: Math.min(metadata.width, MAX_WIDTH),
      height: Math.min(metadata.height, MAX_HEIGHT),
      fit: 'inside',
      withoutEnlargement: true
    });
  }

  if (mimeType === 'image/jpeg') {
    pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
  } else if (mimeType === 'image/png') {
    pipeline = pipeline.png({ quality: PNG_QUALITY, palette: true });
  } else if (mimeType === 'image/webp') {
    pipeline = pipeline.webp({ quality: JPEG_QUALITY });
  } else if (mimeType === 'image/avif') {
    pipeline = pipeline.avif({ quality: JPEG_QUALITY });
  }

  await pipeline.toFile(outputPath);
  fs.unlinkSync(filePath);
  fs.renameSync(outputPath, filePath);

  const compressedStats = fs.statSync(filePath);
  const savings = stats.size > 0 ? Math.round((1 - compressedStats.size / stats.size) * 100) : 0;

  return {
    originalSize: stats.size,
    compressedSize: compressedStats.size,
    savingsPercent: savings,
    width: metadata.width,
    height: metadata.height
  };
};

export const compressBuffer = async (buffer, mimeType) => {
  if (!isAvailable()) return { buffer, originalSize: buffer.length, compressedSize: buffer.length, savingsPercent: 0, skipped: true };
  if (!ALLOWED_TYPES.includes(mimeType)) {
    throw new Error(`Unsupported image type: ${mimeType}`);
  }
  if (buffer.length > MAX_SIZE_BYTES) {
    throw new Error(`File exceeds maximum size of ${MAX_SIZE_BYTES / 1024 / 1024}MB`);
  }

  let pipeline = sharp(buffer).rotate();
  const metadata = await sharp(buffer).metadata();

  if (metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT) {
    pipeline = pipeline.resize({
      width: Math.min(metadata.width, MAX_WIDTH),
      height: Math.min(metadata.height, MAX_HEIGHT),
      fit: 'inside',
      withoutEnlargement: true
    });
  }

  if (mimeType === 'image/jpeg') {
    pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
  } else if (mimeType === 'image/png') {
    pipeline = pipeline.png({ quality: PNG_QUALITY, palette: true });
  } else if (mimeType === 'image/webp') {
    pipeline = pipeline.webp({ quality: JPEG_QUALITY });
  } else if (mimeType === 'image/avif') {
    pipeline = pipeline.avif({ quality: JPEG_QUALITY });
  }

  const result = await pipeline.toBuffer();
  return {
    buffer: result,
    originalSize: buffer.length,
    compressedSize: result.length,
    savingsPercent: Math.round((1 - result.length / buffer.length) * 100)
  };
};

export default { validateAndCompress, compressBuffer };

// Catalog images must ship with real, complete image containers. Header checks
// complement visual review: they catch missing files and broken downloads.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import seed from '../shared/catalog.js';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../site');
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function pngSize(data) {
  let offset = 8;
  let dimensions;
  let imageData = false;
  let ended = false;
  while (offset < data.length) {
    assert(offset + 12 <= data.length, 'truncated PNG chunk');
    const length = data.readUInt32BE(offset);
    const type = data.toString('ascii', offset + 4, offset + 8);
    const end = offset + 12 + length;
    assert(end <= data.length, `truncated PNG ${type} chunk`);
    if (!dimensions) {
      assert(type === 'IHDR' && length === 13, 'PNG must start with IHDR');
      dimensions = [data.readUInt32BE(offset + 8), data.readUInt32BE(offset + 12)];
    }
    if (type === 'IDAT' && length > 0) imageData = true;
    offset = end;
    if (type === 'IEND') {
      assert(length === 0 && offset === data.length, 'invalid PNG ending');
      ended = true;
      break;
    }
  }
  assert(ended && imageData, 'PNG is missing image data or IEND');
  return dimensions;
}

function jpegSize(data) {
  assert(data.length >= 4 && data.readUInt16BE(data.length - 2) === 0xffd9, 'JPEG is missing EOI');
  let offset = 2;
  let dimensions;
  let scan = false;
  const frames = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  while (offset < data.length - 2) {
    assert(data[offset++] === 0xff, 'invalid JPEG marker');
    while (data[offset] === 0xff) offset++;
    const marker = data[offset++];
    if (marker === 0xd9) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    assert(offset + 2 <= data.length, 'truncated JPEG segment');
    const length = data.readUInt16BE(offset);
    assert(length >= 2 && offset + length <= data.length, 'invalid JPEG segment length');
    if (frames.has(marker)) {
      assert(length >= 8, 'truncated JPEG frame');
      dimensions = [data.readUInt16BE(offset + 5), data.readUInt16BE(offset + 3)];
    }
    if (marker === 0xda) {
      scan = offset + length < data.length - 2;
      break;
    }
    offset += length;
  }
  assert(dimensions && scan, 'JPEG is missing a frame or image scan');
  return dimensions;
}

function webpSize(data) {
  assert(data.length >= 20 && data.readUInt32LE(4) + 8 === data.length, 'truncated WebP RIFF container');
  let offset = 12;
  let dimensions;
  let imageData = false;
  while (offset < data.length) {
    assert(offset + 8 <= data.length, 'truncated WebP chunk');
    const type = data.toString('ascii', offset, offset + 4);
    const length = data.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = start + length;
    assert(end <= data.length, `truncated WebP ${type} chunk`);
    if (type === 'VP8X') {
      assert(length === 10, 'invalid WebP VP8X header');
      dimensions = [data.readUIntLE(start + 4, 3) + 1, data.readUIntLE(start + 7, 3) + 1];
    } else if (type === 'VP8L') {
      assert(length >= 5 && data[start] === 0x2f, 'invalid WebP lossless header');
      const bits = data.readUInt32LE(start + 1);
      dimensions ||= [(bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1];
      imageData = true;
    } else if (type === 'VP8 ') {
      assert(length >= 10 && data.subarray(start + 3, start + 6).equals(Buffer.from([0x9d, 0x01, 0x2a])), 'invalid WebP VP8 frame');
      dimensions ||= [data.readUInt16LE(start + 6) & 0x3fff, data.readUInt16LE(start + 8) & 0x3fff];
      imageData = true;
    }
    offset = end + (length & 1);
    assert(offset <= data.length, 'missing WebP chunk padding');
  }
  assert(dimensions && imageData, 'WebP is missing a still-image frame');
  return dimensions;
}

function inspectImage(data) {
  assert(data.length >= 32, 'empty or incomplete image file');
  let format;
  let size;
  if (data.subarray(0, 8).equals(pngSignature)) {
    format = 'png'; size = pngSize(data);
  } else if (data[0] === 0xff && data[1] === 0xd8) {
    format = 'jpeg'; size = jpegSize(data);
  } else if (data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP') {
    format = 'webp'; size = webpSize(data);
  } else {
    assert.fail('file is not a PNG, JPEG or WebP image');
  }
  const [width, height] = size;
  assert(width >= 200 && height >= 200 && width <= 5000 && height <= 5000,
    `image dimensions ${width}×${height} must be between 200 and 5000 pixels`);
  return { format, width, height, bytes: data.length };
}

export function verifyCatalogImages() {
  const images = new Map();
  const errors = [];
  assert(seed.products.length > 0, 'catalog must contain products');
  for (const product of seed.products) {
    try {
      assert(typeof product.image === 'string' && product.image.trim(), 'missing catalog image');
      const imagePath = path.resolve(site, product.image);
      assert(imagePath.startsWith(`${site}${path.sep}`), 'image must be inside the shipped site');
      if (!images.has(product.image)) images.set(product.image, inspectImage(readFileSync(imagePath)));
    } catch (error) {
      errors.push(new Error(`${product.id}: ${error.message}`));
    }
  }
  const summary = {
    products: seed.products.length,
    assets: images.size,
    formats: [...images.values()].reduce((counts, image) => {
      counts[image.format] = (counts[image.format] || 0) + 1;
      return counts;
    }, {}),
  };
  if (errors.length) {
    const error = new AggregateError(errors, `Catalog image checks failed:\n${errors.map(item => item.message).join('\n')}`);
    error.summary = summary;
    throw error;
  }
  return summary;
}

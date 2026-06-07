import { randomUUID } from 'node:crypto';

import { put } from '@vercel/blob';

import { requireParkImageUploadAuthor } from '@/lib/auth/park-image-upload-auth';
import {
  isParkImageMimeType,
  PARK_IMAGE_ALLOWED_MIME_TYPES,
  PARK_IMAGE_MAX_UPLOAD_BYTES,
  type ParkImageVariant,
} from '@/lib/images/presets';
import {
  blobPutAuthOptions,
  blobStorageConfigHint,
  formatBlobUploadError,
  isBlobStorageConfigured,
} from '@/lib/images/blob-configured';
import { resizeParkImageBuffer } from '@/lib/images/resize-server';
import { detectParkImageMimeType } from '@/lib/images/verify-image-bytes';

function isParkImageVariant(value: string): value is ParkImageVariant {
  return value === 'logo' || value === 'pin';
}

export async function POST(request: Request) {
  const author = await requireParkImageUploadAuthor();
  if (!author.ok) {
    return author.response;
  }

  if (!isBlobStorageConfigured()) {
    return Response.json(
      { error: `Image uploads are not configured. ${blobStorageConfigHint()}` },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: 'Invalid multipart form data' }, { status: 400 });
  }

  const variantRaw = formData.get('variant');
  if (typeof variantRaw !== 'string' || !isParkImageVariant(variantRaw)) {
    return Response.json(
      { error: 'variant must be "logo" or "pin"' },
      { status: 400 },
    );
  }
  const variant = variantRaw;

  const fileField = formData.get('file');
  if (!(fileField instanceof File) || fileField.size === 0) {
    return Response.json({ error: 'file is required' }, { status: 400 });
  }

  if (fileField.size > PARK_IMAGE_MAX_UPLOAD_BYTES) {
    return Response.json(
      { error: `File must be at most ${PARK_IMAGE_MAX_UPLOAD_BYTES / (1024 * 1024)} MB` },
      { status: 400 },
    );
  }

  const mimeType = fileField.type;
  if (!isParkImageMimeType(mimeType)) {
    return Response.json(
      {
        error: `Unsupported image type. Allowed: ${PARK_IMAGE_ALLOWED_MIME_TYPES.join(', ')}`,
      },
      { status: 400 },
    );
  }

  const input = Buffer.from(await fileField.arrayBuffer());

  const detectedMime = detectParkImageMimeType(input);
  if (!detectedMime) {
    return Response.json(
      { error: 'File is not a supported image (JPEG, PNG, or WebP)' },
      { status: 400 },
    );
  }

  if (detectedMime !== mimeType) {
    return Response.json(
      { error: 'File content does not match its declared image type' },
      { status: 400 },
    );
  }

  let resized: Buffer;
  try {
    resized = await resizeParkImageBuffer(input, variant);
  } catch {
    return Response.json({ error: 'Could not process image' }, { status: 400 });
  }

  const pathname = `park-images/${variant}/${randomUUID()}.webp`;

  try {
    const blob = await put(pathname, resized, {
      access: 'public',
      contentType: 'image/webp',
      ...blobPutAuthOptions(),
    });

    return Response.json({ url: blob.url });
  } catch (error) {
    console.error('park-image upload failed:', error);
    return Response.json(
      { error: formatBlobUploadError(error) },
      { status: 500 },
    );
  }
}

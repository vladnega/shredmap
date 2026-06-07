import {
  PARK_IMAGE_PRESETS,
  type ParkImageVariant,
} from '@/lib/images/presets';

export async function resizeParkImageForUpload(
  file: File,
  variant: ParkImageVariant,
): Promise<File> {
  const preset = PARK_IMAGE_PRESETS[variant];
  const { default: imageCompression } = await import('browser-image-compression');

  const compressed = await imageCompression(file, {
    maxWidthOrHeight: preset.maxDimension,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: preset.quality,
    maxSizeMB: 2,
  });

  return compressed;
}

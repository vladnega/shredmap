import 'server-only';

import sharp from 'sharp';

import {
  PARK_IMAGE_PRESETS,
  type ParkImageVariant,
} from '@/lib/images/presets';

export async function resizeParkImageBuffer(
  input: Buffer,
  variant: ParkImageVariant,
): Promise<Buffer> {
  const preset = PARK_IMAGE_PRESETS[variant];
  const quality = Math.round(preset.quality * 100);

  return sharp(input)
    .rotate()
    .resize(preset.maxDimension, preset.maxDimension, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality })
    .toBuffer();
}

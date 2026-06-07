export type ParkImageVariant = 'logo' | 'pin';

export type ParkImagePreset = {
  maxDimension: number;
  /** 0–1 for client-side compression; multiply by 100 for sharp. */
  quality: number;
};

export const PARK_IMAGE_PRESETS: Record<ParkImageVariant, ParkImagePreset> = {
  logo: { maxDimension: 256, quality: 0.85 },
  pin: { maxDimension: 128, quality: 0.8 },
};

export const PARK_IMAGE_MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const PARK_IMAGE_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type ParkImageMimeType = (typeof PARK_IMAGE_ALLOWED_MIME_TYPES)[number];

export function isParkImageMimeType(value: string): value is ParkImageMimeType {
  return (PARK_IMAGE_ALLOWED_MIME_TYPES as readonly string[]).includes(value);
}

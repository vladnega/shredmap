'use client';

import { useCallback, useId, useRef, useState } from 'react';
import Image from 'next/image';
import { Loader2, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resizeParkImageForUpload } from '@/lib/images/resize-client';
import type { ParkImageVariant } from '@/lib/images/presets';
import { cn } from '@/lib/utils';

type InputMode = 'upload' | 'url';

export type ImageUrlOrUploadFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
  variant: ParkImageVariant;
  disabled?: boolean;
  className?: string;
  urlInputType?: 'text' | 'url';
  urlPlaceholder?: string;
  inputClassName?: string;
  labelClassName?: string;
  previewShape?: 'square' | 'circle';
  headerStart?: React.ReactNode;
  headerEnd?: React.ReactNode;
};

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function ImageUrlOrUploadField({
  id,
  label,
  value,
  onChange,
  variant,
  disabled = false,
  className,
  urlInputType = 'text',
  urlPlaceholder,
  inputClassName,
  labelClassName,
  previewShape = 'square',
  headerStart,
  headerEnd,
}: ImageUrlOrUploadFieldProps) {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<InputMode>('upload');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);

  const trimmedValue = value.trim();
  const showPreview = trimmedValue.length > 0 && isHttpUrl(trimmedValue) && !previewFailed;

  const handleModeChange = useCallback(
    (next: InputMode) => {
      setMode(next);
      setUploadError(null);
    },
    [],
  );

  const handleClear = useCallback(() => {
    onChange('');
    setUploadError(null);
    setPreviewFailed(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploadError(null);
      setPreviewFailed(false);
      setIsUploading(true);

      try {
        const resized = await resizeParkImageForUpload(file, variant);
        const body = new FormData();
        body.append('file', resized, resized.name || 'logo.webp');
        body.append('variant', variant);

        const response = await fetch('/api/uploads/park-image', {
          method: 'POST',
          body,
        });

        const payload: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          const message =
            payload &&
            typeof payload === 'object' &&
            'error' in payload &&
            typeof payload.error === 'string'
              ? payload.error
              : 'Upload failed';
          setUploadError(message);
          return;
        }

        if (
          !payload ||
          typeof payload !== 'object' ||
          !('url' in payload) ||
          typeof payload.url !== 'string'
        ) {
          setUploadError('Upload failed');
          return;
        }

        onChange(payload.url);
      } catch {
        setUploadError('Upload failed');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [onChange, variant],
  );

  const previewClassName =
    previewShape === 'circle'
      ? 'size-16 rounded-full object-cover'
      : 'size-20 rounded-lg object-contain';

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {headerStart}
          <Label htmlFor={mode === 'url' ? id : fileInputId} className={labelClassName}>
            {label}
          </Label>
        </div>
        {headerEnd}
      </div>

      <div className="inline-flex rounded-lg border border-zinc-700 bg-zinc-900/60 p-0.5">
        <Button
          type="button"
          size="sm"
          variant={mode === 'upload' ? 'secondary' : 'ghost'}
          disabled={disabled || isUploading}
          className="h-8 rounded-md px-3"
          onClick={() => handleModeChange('upload')}
        >
          Upload
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === 'url' ? 'secondary' : 'ghost'}
          disabled={disabled || isUploading}
          className="h-8 rounded-md px-3"
          onClick={() => handleModeChange('url')}
        >
          URL
        </Button>
      </div>

      {mode === 'upload' ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              id={fileInputId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={disabled || isUploading}
              className="sr-only"
              onChange={(event) => {
                void handleFileChange(event);
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={disabled || isUploading}
              className="border-zinc-700 bg-zinc-900 text-zinc-100"
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Upload />
              )}
              {isUploading ? 'Uploading…' : 'Choose image'}
            </Button>
            {trimmedValue ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || isUploading}
                className="text-zinc-400 hover:text-zinc-100"
                onClick={handleClear}
              >
                <X />
                Clear
              </Button>
            ) : null}
          </div>
          {uploadError ? (
            <p className="text-sm text-red-400" role="alert">
              {uploadError}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            id={id}
            type={urlInputType}
            value={value}
            onChange={(event) => {
              setPreviewFailed(false);
              onChange(event.target.value);
            }}
            placeholder={urlPlaceholder}
            disabled={disabled}
            className={inputClassName}
          />
          {trimmedValue ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              className="text-zinc-400 hover:text-zinc-100"
              onClick={handleClear}
            >
              <X />
              Clear
            </Button>
          ) : null}
        </div>
      )}

      {showPreview ? (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'relative overflow-hidden border border-zinc-800 bg-zinc-900',
              previewShape === 'circle' ? 'size-16 rounded-full' : 'size-20 rounded-lg',
            )}
          >
            <Image
              src={trimmedValue}
              alt=""
              width={previewShape === 'circle' ? 64 : 80}
              height={previewShape === 'circle' ? 64 : 80}
              unoptimized
              className={previewClassName}
              onError={() => setPreviewFailed(true)}
            />
          </div>
          <p className="min-w-0 flex-1 truncate text-xs text-zinc-500">{trimmedValue}</p>
        </div>
      ) : null}
      {trimmedValue && previewFailed ? (
        <p className="text-xs text-zinc-500">Preview unavailable for this URL.</p>
      ) : null}
    </div>
  );
}

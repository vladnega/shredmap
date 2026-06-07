import type { PutCommandOptions } from '@vercel/blob';

/**
 * Vercel Blob auth: OIDC (BLOB_STORE_ID + VERCEL_OIDC_TOKEN) or legacy BLOB_READ_WRITE_TOKEN.
 * @see https://vercel.com/docs/vercel-blob/using-blob-sdk#authentication
 */
export function isBlobStorageConfigured(): boolean {
  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    return true;
  }

  const storeId = process.env.BLOB_STORE_ID?.trim();
  const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();
  return Boolean(storeId && oidcToken);
}

export function blobStorageConfigHint(): string {
  return (
    'Connect a Vercel Blob store to this project (BLOB_STORE_ID), enable OIDC for the ' +
    'Development environment (or set BLOB_READ_WRITE_TOKEN), then run `vercel env pull`.'
  );
}

/**
 * Auth options for `put()`. Explicit `token` overrides OIDC — use a read/write token for
 * local `next dev` when OIDC is not enabled for the Development environment.
 */
export function blobPutAuthOptions(): Pick<PutCommandOptions, 'token'> {
  const readWriteToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (readWriteToken) {
    return { token: readWriteToken };
  }
  return {};
}

export function formatBlobUploadError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;
    if (message.includes('not for the "development" environment')) {
      return (
        'Vercel Blob OIDC is not enabled for the Development environment. In the Vercel ' +
        'dashboard, open your Blob store → Projects → this project and enable OIDC for ' +
        'Development, or add BLOB_READ_WRITE_TOKEN to your local .env and run `vercel env pull`.'
      );
    }
    return message;
  }
  return 'Failed to store image';
}

'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BackToDirectoryButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    router.prefetch('/admin/bike-parks');
  }, [router]);

  return (
    <Button
      type="button"
      variant="outline"
      className="border-zinc-600 text-zinc-200"
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          router.push('/admin/bike-parks');
        });
      }}
    >
      {isPending ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Returning...
        </span>
      ) : (
        'Back to directory'
      )}
    </Button>
  );
}

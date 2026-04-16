'use client';

import { useEffect, useRef } from 'react';

export function ReviewsLoadMoreTrigger({
  enabled,
  onLoadMore,
}: {
  enabled: boolean;
  onLoadMore: () => void;
}) {
  const triggerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = triggerRef.current;
    if (!node || !enabled) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        onLoadMore();
      },
      { rootMargin: '300px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, onLoadMore]);

  return (
    <div
      ref={triggerRef}
      className="py-4 text-center text-xs text-zinc-500"
      aria-hidden={!enabled}
    >
      {enabled ? 'Loading more reviews...' : 'All reviews loaded'}
    </div>
  );
}

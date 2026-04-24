'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { BikeParkFields, type BikeParkFieldsReviewConfig } from '@/components/bike-parks/fields/bike-park-fields';
import { Button } from '@/components/ui/button';
import { buildProposedPatchToPersistForParkRequest } from '@/lib/bike-parks/park-form-normalization';
import { applyProposedPatchToFormFields } from '@/lib/bike-parks/park-request-patch-form';
import type { BikeParkReviewSectionId } from '@/lib/bike-parks/park-review-section-meta';
import {
  bikeParkToFormFields,
  emptyBikeParkFormFields,
  type BikeParkFormFieldsState,
} from '@/lib/bike-parks/park-form-state';
import type { BikePark, BikeParkRequest } from '@/lib/db/schema';

type DetailPayload = {
  parkRequest: BikeParkRequest;
  targetPark: BikePark | null;
};

function fetcher(url: string): Promise<DetailPayload> {
  return fetch(url).then(async (res) => {
    if (!res.ok) throw new Error(String(res.status));
    return res.json() as Promise<DetailPayload>;
  });
}

export function ParkRequestReview({
  requestId,
  googleMapsApiKey,
}: {
  requestId: string;
  googleMapsApiKey: string;
}) {
  const { data, error, isLoading, mutate } = useSWR<DetailPayload>(
    `/api/admin/park-requests/${requestId}`,
    fetcher,
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formFields, setFormFields] = useState<BikeParkFormFieldsState | null>(null);
  const [showPreviousBySection, setShowPreviousBySection] = useState<
    Partial<Record<BikeParkReviewSectionId, boolean>>
  >({});

  const parkRequest = data?.parkRequest;
  const proposedPatch = useMemo(() => {
    if (!parkRequest) return null;
    return parkRequest.proposedPatch as Record<string, unknown>;
  }, [parkRequest]);

  const baselineFields = useMemo((): BikeParkFormFieldsState => {
    if (!parkRequest) return emptyBikeParkFormFields();
    if (parkRequest.requestType === 'amendment' && data?.targetPark) {
      return bikeParkToFormFields(data.targetPark);
    }
    return emptyBikeParkFormFields();
  }, [data?.targetPark, parkRequest]);

  const mergedFromRequest = useMemo(() => {
    if (!proposedPatch) return baselineFields;
    return applyProposedPatchToFormFields(baselineFields, proposedPatch);
  }, [baselineFields, proposedPatch]);

  useEffect(() => {
    setFormFields(mergedFromRequest);
  }, [mergedFromRequest]);

  const activeFields = formFields ?? mergedFromRequest;

  const reviewConfig: BikeParkFieldsReviewConfig | undefined =
    parkRequest && parkRequest.status === 'pending'
      ? {
          requestType:
            parkRequest.requestType === 'amendment' ? ('amendment' as const) : ('new_park' as const),
          baseline: baselineFields,
          showPreviousBySection,
          onToggleShowPrevious: (sectionId) =>
            setShowPreviousBySection((prev) => ({ ...prev, [sectionId]: !prev[sectionId] })),
        }
      : undefined;

  async function savePatchEdits(): Promise<boolean> {
    if (!parkRequest || parkRequest.status !== 'pending') return false;
    setBusy(true);
    setMessage(null);
    try {
      const normalizedPatch = buildProposedPatchToPersistForParkRequest(
        activeFields,
        baselineFields,
        parkRequest.requestType === 'amendment' ? 'amendment' : 'new_park',
        parkRequest.proposedPatch as Record<string, unknown>,
      );
      const res = await fetch(`/api/admin/park-requests/${parkRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposedPatch: normalizedPatch }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessage(
          typeof err === 'object' && err && 'error' in err
            ? String((err as { error: string }).error)
            : `Could not update proposal (${res.status})`,
        );
        return false;
      }
      setMessage('Proposal updated.');
      await mutate();
      return true;
    } catch {
      setMessage('Could not save proposed changes.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function resolve(action: 'approve' | 'reject') {
    if (!parkRequest || parkRequest.status !== 'pending') return;
    if (action === 'approve') {
      const saved = await savePatchEdits();
      if (!saved) return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/park-requests/${parkRequest.id}/${action}`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessage(
          typeof err === 'object' && err && 'error' in err
            ? String((err as { error: string }).error)
            : `Could not ${action} request (${res.status})`,
        );
        return;
      }
      setMessage(`Park Request ${action}d.`);
      await mutate();
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <p className="text-sm text-zinc-400">Loading request…</p>;
  if (error || !parkRequest) return <p className="text-sm text-red-300">Park Request not found.</p>;

  const requestTypeLabel =
    parkRequest.requestType === 'new_park' ? 'New park proposal' : 'Park amendment';

  return (
    <div className="space-y-6">
      <section className="flex items-start justify-between gap-3 px-1">
        <p className="text-sm text-zinc-400">{requestTypeLabel}</p>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
            parkRequest.status === 'pending'
              ? 'bg-amber-500/20 text-amber-200'
              : parkRequest.status === 'approved'
                ? 'bg-emerald-500/20 text-emerald-200'
                : 'bg-red-500/20 text-red-200'
          }`}
        >
          {parkRequest.status}
        </span>
      </section>

      {parkRequest.status === 'pending' ? (
        <BikeParkFields
          idPrefix={`prq-${parkRequest.id}`}
          value={activeFields}
          onChange={setFormFields}
          googleMapsApiKey={googleMapsApiKey}
          showLocationPicker
          showTrailDifficultyPills
          urlInputsAsUrl
          disabled={busy}
          review={reviewConfig}
        />
      ) : (
        <BikeParkFields
          idPrefix={`prq-${parkRequest.id}-resolved`}
          value={mergedFromRequest}
          onChange={() => {}}
          googleMapsApiKey={googleMapsApiKey}
          showLocationPicker
          showTrailDifficultyPills
          urlInputsAsUrl
          disabled={true}
        />
      )}

      {parkRequest.status === 'pending' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              disabled={busy}
              className="w-full bg-emerald-600 text-white hover:bg-emerald-500"
              onClick={() => void resolve('approve')}
            >
              Approve
            </Button>
            <Button
              type="button"
              disabled={busy}
              variant="destructive"
              className="w-full"
              onClick={() => void resolve('reject')}
            >
              Reject
            </Button>
          </div>
          {message ? <p className="text-xs text-zinc-300">{message}</p> : null}
        </div>
      ) : (
        <p className="text-sm text-zinc-400">This Park Request is already resolved.</p>
      )}
    </div>
  );
}
